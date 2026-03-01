from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import EntryLog
from app.schemas import EntryLogCreate, EntryLogExit, EntryLogResponse

router = APIRouter(prefix="/entry-logs", tags=["Entry Logs"])


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@router.post(
    "",
    response_model=EntryLogResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Manually create an entry log",
)
def create_entry_log(payload: EntryLogCreate, db: Session = Depends(get_db)):
    log = EntryLog(**payload.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get(
    "",
    response_model=list[EntryLogResponse],
    summary="List entry logs with optional date filter",
)
def list_entry_logs(
    from_date: date | None = Query(None, description="Filter entries from this date (inclusive)"),
    to_date: date | None = Query(None, description="Filter entries up to this date (inclusive)"),
    person_type: str | None = Query(None, description="'employee' or 'visitor'"),
    gate_id: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    q = db.query(EntryLog)

    if from_date:
        q = q.filter(func.date(EntryLog.entry_time) >= from_date)
    if to_date:
        q = q.filter(func.date(EntryLog.entry_time) <= to_date)
    if person_type:
        q = q.filter(EntryLog.person_type == person_type)
    if gate_id:
        q = q.filter(EntryLog.gate_id == gate_id)

    return q.order_by(EntryLog.entry_time.desc()).offset(skip).limit(limit).all()


@router.get(
    "/{log_id}",
    response_model=EntryLogResponse,
    summary="Get a single entry log",
)
def get_entry_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(EntryLog).filter(EntryLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry log not found")
    return log


@router.patch(
    "/{log_id}/exit",
    response_model=EntryLogResponse,
    summary="Record exit time for a log entry",
)
def record_exit(
    log_id: int,
    payload: EntryLogExit | None = None,
    db: Session = Depends(get_db),
):
    log = db.query(EntryLog).filter(EntryLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry log not found")
    if log.exit_time:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Exit time already recorded."
        )
    log.exit_time = (
        payload.exit_time if (payload and payload.exit_time) else datetime.now(timezone.utc)
    )
    db.commit()
    db.refresh(log)
    return log
