from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Alert, AlertStatus
from app.schemas import AlertCreate, AlertResponse, AlertUpdate, MessageResponse

router = APIRouter(prefix="/alerts", tags=["Alerts"])


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@router.post(
    "",
    response_model=AlertResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Raise a new alert (panic / fire / accident / intrusion / other)",
)
def create_alert(payload: AlertCreate, db: Session = Depends(get_db)):
    alert = Alert(**payload.model_dump())
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


@router.get(
    "",
    response_model=list[AlertResponse],
    summary="List alerts with optional status and type filters",
)
def list_alerts(
    alert_status: AlertStatus | None = Query(None, alias="status"),
    alert_type: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    q = db.query(Alert)
    if alert_status:
        q = q.filter(Alert.status == alert_status)
    if alert_type:
        q = q.filter(Alert.alert_type == alert_type)
    return q.order_by(Alert.created_at.desc()).offset(skip).limit(limit).all()


@router.get(
    "/{alert_id}",
    response_model=AlertResponse,
    summary="Get alert by ID",
)
def get_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    return alert


@router.patch(
    "/{alert_id}",
    response_model=AlertResponse,
    summary="Update alert status (acknowledge / resolve)",
)
def update_alert(alert_id: int, payload: AlertUpdate, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    updates = payload.model_dump(exclude_unset=True)

    # Auto-set resolved_at when status is changed to resolved
    if updates.get("status") == AlertStatus.resolved and not updates.get("resolved_at"):
        updates["resolved_at"] = datetime.now(timezone.utc)

    for field, value in updates.items():
        setattr(alert, field, value)

    db.commit()
    db.refresh(alert)
    return alert


@router.delete(
    "/{alert_id}",
    response_model=MessageResponse,
    summary="Delete an alert record",
)
def delete_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    db.delete(alert)
    db.commit()
    return MessageResponse(message=f"Alert #{alert_id} deleted.")
