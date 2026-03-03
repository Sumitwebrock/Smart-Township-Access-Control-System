"""
Enhanced Visitors Management Module with Full Feature Set
"""
import os
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional, List

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import Visitor, VisitorStatus, GateType, EntryLog, PersonType
from app.schemas import (
    VisitorResponse, VisitorUpdate, MessageResponse
)
from pydantic import BaseModel

router = APIRouter(prefix="/visitors", tags=["Visitors Management"])

UPLOAD_DIR = Path(settings.UPLOAD_DIR) / "visitor_snapshots"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

_ALLOWED_PHOTO_TYPES = {"image/jpeg", "image/png", "image/webp"}
_MAX_BYTES = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024


# Response Models
class VisitorStatsResponse(BaseModel):
    total_visitors_today: int
    currently_inside: int
    pending_approvals: int
    denied_today: int
    blacklisted_count: int
    total_visitors_all_time: int


def generate_visitor_rfid() -> str:
    return f"VSTR-{uuid.uuid4()}"


def _get_visitor_or_404(visitor_id: int, db: Session) -> Visitor:
    visitor = db.query(Visitor).filter(Visitor.id == visitor_id).first()
    if not visitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Visitor with ID {visitor_id} not found"
        )
    return visitor


def _check_expiry(visitor: Visitor) -> bool:
    now = datetime.now(timezone.utc)
    valid_till = visitor.valid_till
    if valid_till.tzinfo is None:
        valid_till = valid_till.replace(tzinfo=timezone.utc)
    
    if now > valid_till and visitor.status != VisitorStatus.EXPIRED:
        return True
    return False


def _save_snapshot(file: UploadFile) -> str:
    if file.content_type not in _ALLOWED_PHOTO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type"
        )
    
    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    dest = UPLOAD_DIR / filename
    
    with dest.open("wb") as buffer:
        file.file.seek(0)
        data = file.file.read()
        if len(data) > _MAX_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds {settings.MAX_UPLOAD_SIZE_MB} MB limit"
            )
        buffer.write(data)
    
    return f"visitor_snapshots/{filename}"


# === STATS ENDPOINT (MUST COME BEFORE /{visitor_id}) ===
@router.get(
    "/stats",
    response_model=VisitorStatsResponse,
    summary="Get Real-Time Visitor Statistics"
)
async def get_visitor_stats(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    total_today = db.query(Visitor).filter(Visitor.created_at >= today_start).count()
    currently_inside = db.query(Visitor).filter(
        Visitor.inside == True,
        Visitor.is_blacklisted == False
    ).count()
    pending = db.query(Visitor).filter(Visitor.status == VisitorStatus.PENDING).count()
    denied_today = db.query(Visitor).filter(
        Visitor.status == VisitorStatus.DENIED,
        Visitor.updated_at >= today_start
    ).count()
    blacklisted = db.query(Visitor).filter(Visitor.is_blacklisted == True).count()
    total_all_time = db.query(Visitor).count()
    
    return VisitorStatsResponse(
        total_visitors_today=total_today,
        currently_inside=currently_inside,
        pending_approvals=pending,
        denied_today=denied_today,
        blacklisted_count=blacklisted,
        total_visitors_all_time=total_all_time
    )


@router.post(
    "",
    response_model=VisitorResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register New Visitor"
)
async def create_visitor(
    name: str = Form(..., min_length=2, max_length=200),
    phone: str = Form(..., min_length=7, max_length=20),
    visiting_flat: str = Form(..., min_length=1, max_length=50),
    vehicle_number: Optional[str] = Form(None),
    purpose: Optional[str] = Form(None),
    valid_from: Optional[str] = Form(None),
    valid_till: Optional[str] = Form(None),
    snapshot: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    try:
        if valid_from:
            valid_from_dt = datetime.fromisoformat(valid_from.replace('Z', '+00:00'))
        else:
            valid_from_dt = datetime.now(timezone.utc)
        
        if valid_till:
            valid_till_dt = datetime.fromisoformat(valid_till.replace('Z', '+00:00'))
        else:
            valid_till_dt = valid_from_dt + timedelta(days=1)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid datetime format: {str(e)}"
        )
    
    snapshot_path = None
    if snapshot and snapshot.filename:
        snapshot_path = _save_snapshot(snapshot)
    
    rfid_tag = generate_visitor_rfid()
    
    visitor = Visitor(
        name=name,
        phone=phone,
        visiting_flat=visiting_flat,
        vehicle_number=vehicle_number,
        purpose=purpose,
        rfid_tag=rfid_tag,
        status=VisitorStatus.PENDING,
        valid_from=valid_from_dt,
        valid_till=valid_till_dt,
        snapshot_path=snapshot_path,
        photo_path=snapshot_path,
        house_number=visiting_flat
    )
    
    db.add(visitor)
    db.commit()
    db.refresh(visitor)
    
    return visitor


@router.get(
    "",
    response_model=List[VisitorResponse],
    summary="List All Visitors"
)
async def list_visitors(
    status_filter: Optional[VisitorStatus] = Query(None, alias="status"),
    blacklisted_only: bool = Query(False),
    inside_only: bool = Query(False),
    visiting_flat: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(Visitor)
    
    if status_filter:
        query = query.filter(Visitor.status == status_filter)
    
    if blacklisted_only:
        query = query.filter(Visitor.is_blacklisted == True)
    
    if inside_only:
        query = query.filter(Visitor.inside == True)
    
    if visiting_flat:
        query = query.filter(Visitor.visiting_flat == visiting_flat)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Visitor.name.ilike(search_pattern)) |
            (Visitor.phone.ilike(search_pattern))
        )
    
    visitors = query.order_by(Visitor.created_at.desc()).offset(skip).limit(limit).all()
    
    for visitor in visitors:
        if _check_expiry(visitor):
            visitor.status = VisitorStatus.EXPIRED
            db.commit()
    
    return visitors


@router.get(
    "/{visitor_id}",
    response_model=VisitorResponse,
    summary="Get Visitor Details"
)
async def get_visitor(visitor_id: int, db: Session = Depends(get_db)):
    visitor = _get_visitor_or_404(visitor_id, db)
    
    if _check_expiry(visitor):
        visitor.status = VisitorStatus.EXPIRED
        db.commit()
    
    return visitor


@router.patch(
    "/{visitor_id}",
    response_model=VisitorResponse,
    summary="Update Visitor Details"
)
async def update_visitor(
    visitor_id: int, 
    payload: VisitorUpdate, 
    db: Session = Depends(get_db)
):
    visitor = _get_visitor_or_404(visitor_id, db)
    
    for field, value in payload.model_dump(exclude_unset=True).items():
        if field == "is_blocked":
            setattr(visitor, "is_blacklisted", value)
        setattr(visitor, field, value)
    
    db.commit()
    db.refresh(visitor)
    return visitor


@router.delete(
    "/{visitor_id}",
    response_model=MessageResponse,
    summary="Delete Visitor"
)
async def delete_visitor(visitor_id: int, db: Session = Depends(get_db)):
    visitor = _get_visitor_or_404(visitor_id, db)
    db.delete(visitor)
    db.commit()
    return MessageResponse(message=f"Visitor '{visitor.name}' deleted successfully")


@router.post(
    "/{visitor_id}/approve",
    response_model=VisitorResponse,
    summary="Approve Visitor"
)
async def approve_visitor(
    visitor_id: int,
    approved_by: str = Form(...),
    remarks: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    visitor = _get_visitor_or_404(visitor_id, db)
    
    if visitor.status != VisitorStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending visitors can be approved"
        )
    
    visitor.status = VisitorStatus.APPROVED
    visitor.approved_by = approved_by
    visitor.approved_at = datetime.now(timezone.utc)
    if remarks:
        visitor.remarks = remarks
    
    db.commit()
    db.refresh(visitor)
    return visitor


@router.post(
    "/{visitor_id}/deny",
    response_model=VisitorResponse,
    summary="Deny Visitor"
)
async def deny_visitor(
    visitor_id: int,
    approved_by: str = Form(...),
    remarks: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    visitor = _get_visitor_or_404(visitor_id, db)
    
    visitor.status = VisitorStatus.DENIED
    visitor.approved_by = approved_by
    visitor.approved_at = datetime.now(timezone.utc)
    if remarks:
        visitor.remarks = remarks
    
    db.commit()
    db.refresh(visitor)
    return visitor


@router.post(
    "/{visitor_id}/blacklist",
    response_model=VisitorResponse,
    summary="Blacklist Visitor"
)
async def blacklist_visitor(
    visitor_id: int,
    remarks: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    visitor = _get_visitor_or_404(visitor_id, db)
    visitor.is_blacklisted = True
    visitor.is_blocked = True
    if remarks:
        visitor.remarks = remarks
    
    db.commit()
    db.refresh(visitor)
    return visitor


@router.post(
    "/{visitor_id}/unblacklist",
    response_model=VisitorResponse,
    summary="Remove from Blacklist"
)
async def unblacklist_visitor(visitor_id: int, db: Session = Depends(get_db)):
    visitor = _get_visitor_or_404(visitor_id, db)
    visitor.is_blacklisted = False
    visitor.is_blocked = False
    
    db.commit()
    db.refresh(visitor)
    return visitor
