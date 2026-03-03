"""
RFID-Based Vehicle Gate Control System

Architecture:
- Supports virtual RFID (UUID-based) for development/testing
- Designed for real hardware integration (USB readers, ESP32, webhooks)
- Backend-driven validation ensures security
- Anti-passback logic prevents misuse
- Real-time tracking of vehicles inside/outside township

Hardware Integration Ready:
1. USB RFID Reader → Replace frontend trigger with serial port listener
2. ESP32 Module → Configure to POST to /api/v1/vehicles/rfid-scan endpoint
3. HTTP Webhook → External systems can POST directly to scan endpoint

All gate logic remains in backend - frontend only displays results.
"""
import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import GateType, Vehicle, VehicleEntryLog, VehicleStatus
from app.schemas import (
    MessageResponse,
    RFIDGateScanRequest,
    RFIDGateScanResponse,
    VehicleCreate,
    VehicleEntryLogResponse,
    VehicleResponse,
    VehicleStatsResponse,
    VehicleUpdate,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/vehicles", tags=["Vehicle RFID System"])


# ===========================================================================
# RFID Tag Generation (Virtual)
# ===========================================================================
def generate_rfid_tag() -> str:
    """
    Generate a unique UUID-based RFID tag for virtual simulation.
    
    Architecture: This simulates RFID card UID. When integrating real hardware:
    - For card writers: Use this UUID to program physical RFID cards
    - For card readers: Replace this with actual tag ID from hardware
    
    Returns:
        str: UUID4-based RFID tag (e.g., "RFID-550e8400-e29b-41d4-a716-446655440000")
    """
    return f"RFID-{uuid.uuid4()}"


# ===========================================================================
# Vehicle Management Routes
# ===========================================================================
@router.post(
    "/",
    response_model=VehicleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register New Vehicle",
    description="Register a new vehicle with auto-generated RFID tag for gate access",
)
async def register_vehicle(vehicle: VehicleCreate, db: Session = Depends(get_db)):
    """
    Register a new vehicle in the RFID gate system.
    
    - Auto-generates unique UUID-based RFID tag
    - Validates vehicle number uniqueness
    - Sets initial status as active and outside (inside=False)
    
    Architecture: RFID generation is backend-controlled to ensure
    uniqueness and support future physical RFID card programming.
    """
    # Check if vehicle number already exists
    existing = db.query(Vehicle).filter(Vehicle.vehicle_number == vehicle.vehicle_number).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Vehicle {vehicle.vehicle_number} is already registered",
        )
    
    # Generate unique RFID tag
    rfid_tag = generate_rfid_tag()
    
    # Ensure RFID uniqueness (very unlikely collision with UUID4, but safety check)
    while db.query(Vehicle).filter(Vehicle.rfid_tag == rfid_tag).first():
        rfid_tag = generate_rfid_tag()
        logger.warning("RFID collision detected, regenerated: %s", rfid_tag)
    
    # Create vehicle record
    db_vehicle = Vehicle(
        vehicle_number=vehicle.vehicle_number,
        owner_name=vehicle.owner_name,
        rfid_tag=rfid_tag,
        status=VehicleStatus.active,
        inside=False,
    )
    
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    
    logger.info("Vehicle registered: %s with RFID: %s", vehicle.vehicle_number, rfid_tag)
    return db_vehicle


@router.get(
    "/",
    response_model=List[VehicleResponse],
    summary="List All Vehicles",
    description="Get all registered vehicles with optional filters",
)
async def list_vehicles(
    status_filter: Optional[VehicleStatus] = Query(None, description="Filter by status"),
    inside: Optional[bool] = Query(None, description="Filter by inside/outside"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """List all vehicles with optional filtering."""
    query = db.query(Vehicle)
    
    if status_filter:
        query = query.filter(Vehicle.status == status_filter)
    
    if inside is not None:
        query = query.filter(Vehicle.inside == inside)
    
    vehicles = query.order_by(Vehicle.created_at.desc()).offset(skip).limit(limit).all()
    return vehicles


@router.get(
    "/{vehicle_id}",
    response_model=VehicleResponse,
    summary="Get Vehicle Details",
)
async def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    """Get detailed information about a specific vehicle."""
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with ID {vehicle_id} not found",
        )
    return vehicle


@router.get(
    "/by-rfid/{rfid_tag}",
    response_model=VehicleResponse,
    summary="Get Vehicle by RFID Tag",
    description="Find vehicle by RFID tag (used by hardware readers)",
)
async def get_vehicle_by_rfid(rfid_tag: str, db: Session = Depends(get_db)):
    """
    Find vehicle by RFID tag.
    
    Hardware Integration: This endpoint can be used by RFID readers
    to verify tag registration before attempting gate scan.
    """
    vehicle = db.query(Vehicle).filter(Vehicle.rfid_tag == rfid_tag).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No vehicle found with RFID tag: {rfid_tag}",
        )
    return vehicle


@router.patch(
    "/{vehicle_id}",
    response_model=VehicleResponse,
    summary="Update Vehicle",
)
async def update_vehicle(
    vehicle_id: int,
    vehicle_update: VehicleUpdate,
    db: Session = Depends(get_db),
):
    """Update vehicle details (excluding RFID tag - that's immutable)."""
    db_vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not db_vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with ID {vehicle_id} not found",
        )
    
    # Update fields if provided
    if vehicle_update.vehicle_number is not None:
        # Check uniqueness
        existing = db.query(Vehicle).filter(
            and_(
                Vehicle.vehicle_number == vehicle_update.vehicle_number,
                Vehicle.id != vehicle_id
            )
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Vehicle number {vehicle_update.vehicle_number} already exists",
            )
        db_vehicle.vehicle_number = vehicle_update.vehicle_number
    
    if vehicle_update.owner_name is not None:
        db_vehicle.owner_name = vehicle_update.owner_name
    
    if vehicle_update.status is not None:
        db_vehicle.status = vehicle_update.status
    
    db.commit()
    db.refresh(db_vehicle)
    
    logger.info("Vehicle updated: ID=%s", vehicle_id)
    return db_vehicle


@router.delete(
    "/{vehicle_id}",
    response_model=MessageResponse,
    summary="Delete Vehicle",
)
async def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    """Delete a vehicle registration (cascade deletes entry logs)."""
    db_vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not db_vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with ID {vehicle_id} not found",
        )
    
    db.delete(db_vehicle)
    db.commit()
    
    logger.info("Vehicle deleted: %s (ID=%s)", db_vehicle.vehicle_number, vehicle_id)
    return MessageResponse(message=f"Vehicle {db_vehicle.vehicle_number} deleted successfully")


# ===========================================================================
# RFID GATE SCAN (Core Logic)
# ===========================================================================
@router.post(
    "/rfid-scan",
    response_model=RFIDGateScanResponse,
    summary="🚗 RFID Gate Scan",
    description="Process RFID scan at entry/exit gate with anti-passback logic",
)
async def rfid_gate_scan(
    scan_request: RFIDGateScanRequest,
    db: Session = Depends(get_db),
):
    """
    🚗 RFID Gate Scan Endpoint - Core Access Control Logic
    
    Architecture:
    - Accepts RFID tag from virtual frontend OR real hardware
    - Validates vehicle registration and status
    - Implements anti-passback (prevents double entry/exit)
    - Logs all gate events for audit trail
    - Returns immediate grant/deny decision
    
    Hardware Integration:
    - USB RFID Reader → POST to this endpoint with tag ID
    - ESP32 Module → Configure webhook to this URL
    - Frontend Virtual → Sends UUID-based RFID
    
    Anti-Passback Rules:
    - ENTRY: Deny if already inside
    - EXIT: Deny if already outside
    
    Returns:
        RFIDGateScanResponse with grant/deny decision and message
    """
    logger.info("RFID scan: tag=%s, gate=%s", scan_request.rfid, scan_request.gate_type)
    
    # Find vehicle by RFID tag
    vehicle = db.query(Vehicle).filter(Vehicle.rfid_tag == scan_request.rfid).first()
    
    # DENY: RFID tag not registered
    if not vehicle:
        logger.warning("RFID denied: tag not found - %s", scan_request.rfid)
        return RFIDGateScanResponse(
            status="denied",
            message="⛔ RFID tag not registered in system",
        )
    
    # DENY: Vehicle inactive
    if vehicle.status != VehicleStatus.active:
        logger.warning("RFID denied: vehicle inactive - %s", vehicle.vehicle_number)
        return RFIDGateScanResponse(
            status="denied",
            vehicle_number=vehicle.vehicle_number,
            owner_name=vehicle.owner_name,
            message=f"⛔ Vehicle {vehicle.vehicle_number} is {vehicle.status.value}",
        )
    
    # =========================================================================
    # ENTRY GATE LOGIC
    # =========================================================================
    if scan_request.gate_type == GateType.ENTRY:
        # Anti-passback: Deny if already inside
        if vehicle.inside:
            logger.warning("RFID denied: anti-passback violation (already inside) - %s", vehicle.vehicle_number)
            return RFIDGateScanResponse(
                status="denied",
                vehicle_number=vehicle.vehicle_number,
                owner_name=vehicle.owner_name,
                message=f"⛔ {vehicle.vehicle_number} is already inside (anti-passback)",
                inside=True,
            )
        
        # GRANT ENTRY
        vehicle.inside = True
        
        # Create entry log
        entry_log = VehicleEntryLog(
            vehicle_id=vehicle.id,
            gate_type=GateType.ENTRY,
            entry_time=datetime.now(timezone.utc),
            gate_id=scan_request.gate_id,
        )
        db.add(entry_log)
        db.commit()
        db.refresh(entry_log)
        
        logger.info("✅ ENTRY GRANTED: %s (Owner: %s)", vehicle.vehicle_number, vehicle.owner_name)
        return RFIDGateScanResponse(
            status="granted",
            vehicle_number=vehicle.vehicle_number,
            owner_name=vehicle.owner_name,
            message=f"✅ Welcome! Entry granted for {vehicle.vehicle_number}",
            inside=True,
            log_id=entry_log.id,
        )
    
    # =========================================================================
    # EXIT GATE LOGIC
    # =========================================================================
    elif scan_request.gate_type == GateType.EXIT:
        # Anti-passback: Deny if already outside
        if not vehicle.inside:
            logger.warning("RFID denied: anti-passback violation (already outside) - %s", vehicle.vehicle_number)
            return RFIDGateScanResponse(
                status="denied",
                vehicle_number=vehicle.vehicle_number,
                owner_name=vehicle.owner_name,
                message=f"⛔ {vehicle.vehicle_number} is already outside (anti-passback)",
                inside=False,
            )
        
        # GRANT EXIT
        vehicle.inside = False
        
        # Find latest open entry log and close it
        latest_entry = (
            db.query(VehicleEntryLog)
            .filter(
                and_(
                    VehicleEntryLog.vehicle_id == vehicle.id,
                    VehicleEntryLog.gate_type == GateType.ENTRY,
                    VehicleEntryLog.exit_time == None,
                )
            )
            .order_by(VehicleEntryLog.entry_time.desc())
            .first()
        )
        
        if latest_entry:
            latest_entry.exit_time = datetime.now(timezone.utc)
        
        # Create exit log
        exit_log = VehicleEntryLog(
            vehicle_id=vehicle.id,
            gate_type=GateType.EXIT,
            exit_time=datetime.now(timezone.utc),
            gate_id=scan_request.gate_id,
        )
        db.add(exit_log)
        db.commit()
        db.refresh(exit_log)
        
        logger.info("✅ EXIT GRANTED: %s (Owner: %s)", vehicle.vehicle_number, vehicle.owner_name)
        return RFIDGateScanResponse(
            status="granted",
            vehicle_number=vehicle.vehicle_number,
            owner_name=vehicle.owner_name,
            message=f"✅ Goodbye! Exit granted for {vehicle.vehicle_number}",
            inside=False,
            log_id=exit_log.id,
        )
    
    # Should never reach here due to enum validation
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Invalid gate_type",
    )


# ===========================================================================
# Entry Logs & Statistics
# ===========================================================================
@router.get(
    "/entry-logs",
    response_model=List[VehicleEntryLogResponse],
    summary="Get Vehicle Entry Logs",
)
async def get_vehicle_entry_logs(
    vehicle_id: Optional[int] = Query(None, description="Filter by vehicle ID"),
    gate_type: Optional[GateType] = Query(None, description="Filter by gate type"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Get vehicle entry/exit logs with optional filters."""
    query = db.query(VehicleEntryLog)
    
    if vehicle_id:
        query = query.filter(VehicleEntryLog.vehicle_id == vehicle_id)
    
    if gate_type:
        query = query.filter(VehicleEntryLog.gate_type == gate_type)
    
    logs = query.order_by(VehicleEntryLog.created_at.desc()).offset(skip).limit(limit).all()
    return logs


@router.get(
    "/stats",
    response_model=VehicleStatsResponse,
    summary="📊 Dashboard Statistics",
    description="Real-time statistics for RFID gate system dashboard",
)
async def get_vehicle_stats(db: Session = Depends(get_db)):
    """
    Get real-time dashboard statistics for the RFID gate system.
    
    Returns counts for:
    - Total registered vehicles
    - Vehicles currently inside
    - Vehicles currently outside
    - Today's entries and exits
    """
    total_vehicles = db.query(func.count(Vehicle.id)).scalar()
    vehicles_inside = db.query(func.count(Vehicle.id)).filter(Vehicle.inside == True).scalar()
    vehicles_outside = total_vehicles - vehicles_inside
    
    # Today's entries and exits
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    today_entries = (
        db.query(func.count(VehicleEntryLog.id))
        .filter(
            and_(
                VehicleEntryLog.gate_type == GateType.ENTRY,
                VehicleEntryLog.created_at >= today_start,
            )
        )
        .scalar()
    )
    
    today_exits = (
        db.query(func.count(VehicleEntryLog.id))
        .filter(
            and_(
                VehicleEntryLog.gate_type == GateType.EXIT,
                VehicleEntryLog.created_at >= today_start,
            )
        )
        .scalar()
    )
    
    return VehicleStatsResponse(
        total_vehicles=total_vehicles or 0,
        vehicles_inside=vehicles_inside or 0,
        vehicles_outside=vehicles_outside or 0,
        today_entries=today_entries or 0,
        today_exits=today_exits or 0,
    )
