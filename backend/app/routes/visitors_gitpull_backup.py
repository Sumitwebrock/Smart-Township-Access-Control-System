import os
import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import EntryLog, PersonType, Visitor
from app.schemas import MessageResponse, VisitorResponse, VisitorUpdate

router = APIRouter(prefix="/visitors", tags=["Visitors"])

UPLOAD_DIR = Path(settings.UPLOAD_DIR)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

_ALLOWED_PHOTO_TYPES = {"image/jpeg", "image/png", "image/webp"}
_MAX_BYTES = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _get_or_404(visitor_id: int, db: Session) -> Visitor:
    v = db.query(Visitor).filter(Visitor.id == visitor_id).first()
    if not v:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visitor not found")
    return v


def _save_photo(file: UploadFile) -> str:
    """Persist uploaded photo and return the relative path."""
    if file.content_type not in _ALLOWED_PHOTO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type '{file.content_type}'. Allowed: jpeg, png, webp.",
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
                detail=f"File exceeds the maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB} MB.",
            )
        buffer.write(data)
    return str(dest)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@router.post(
    "/register",
    response_model=VisitorResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a visitor (auto photo capture + number plate)",
)
def register_visitor(
    # Form fields
    name: str = Form(..., min_length=2, max_length=200),
    phone: str = Form(..., min_length=7, max_length=20),
    house_number: str = Form(..., min_length=1, max_length=50),
    vehicle_number: str | None = Form(None),
    gate_id: str | None = Form(None),
    # Optional photo
    photo: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    photo_path: str | None = None
    if photo and photo.filename:
        photo_path = _save_photo(photo)

    # Check if visitor with same vehicle already exists → increment visit_count
    existing: Visitor | None = None
    if vehicle_number:
        existing = (
            db.query(Visitor)
            .filter(Visitor.vehicle_number == vehicle_number)
            .first()
        )

    if existing:
        if existing.is_blocked:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Visitor is blocked. Access denied.",
            )
        existing.visit_count += 1
        if photo_path:
            existing.photo_path = photo_path
        db.commit()
        visitor = existing
    else:
        visitor = Visitor(
            name=name,
            phone=phone,
            house_number=house_number,
            vehicle_number=vehicle_number,
            photo_path=photo_path,
            visit_count=1,
        )
        db.add(visitor)
        db.commit()
        db.refresh(visitor)

    # Create entry log
    log = EntryLog(
        person_type=PersonType.visitor,
        person_id=visitor.id,
        vehicle_number=vehicle_number,
        gate_id=gate_id,
    )
    db.add(log)
    db.commit()

    db.refresh(visitor)
    return visitor


@router.get(
    "",
    response_model=list[VisitorResponse],
    summary="List all visitors",
)
def list_visitors(
    blocked_only: bool = Query(False),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    q = db.query(Visitor)
    if blocked_only:
        q = q.filter(Visitor.is_blocked == True)  # noqa: E712
    return q.order_by(Visitor.created_at.desc()).offset(skip).limit(limit).all()


@router.get(
    "/{visitor_id}",
    response_model=VisitorResponse,
    summary="Get visitor by ID",
)
def get_visitor(visitor_id: int, db: Session = Depends(get_db)):
    return _get_or_404(visitor_id, db)


@router.patch(
    "/{visitor_id}",
    response_model=VisitorResponse,
    summary="Update visitor details or block status",
)
def update_visitor(
    visitor_id: int, payload: VisitorUpdate, db: Session = Depends(get_db)
):
    visitor = _get_or_404(visitor_id, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(visitor, field, value)
    db.commit()
    db.refresh(visitor)
    return visitor


@router.delete(
    "/{visitor_id}",
    response_model=MessageResponse,
    summary="Block a visitor",
)
def block_visitor(visitor_id: int, db: Session = Depends(get_db)):
    visitor = _get_or_404(visitor_id, db)
    visitor.is_blocked = True
    db.commit()
    return MessageResponse(message=f"Visitor '{visitor.name}' has been blocked.")
