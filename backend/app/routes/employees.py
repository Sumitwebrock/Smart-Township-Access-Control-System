from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Employee
from app.schemas import (
    EmployeeCreate,
    EmployeeResponse,
    EmployeeUpdate,
    MessageResponse,
)

router = APIRouter(prefix="/employees", tags=["Employees"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _get_or_404(employee_id: int, db: Session) -> Employee:
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return emp


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@router.post(
    "",
    response_model=EmployeeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new employee",
)
def create_employee(payload: EmployeeCreate, db: Session = Depends(get_db)):
    # Check RFID uniqueness
    if db.query(Employee).filter(Employee.rfid_tag == payload.rfid_tag).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"RFID tag '{payload.rfid_tag}' is already assigned.",
        )
    emp = Employee(**payload.model_dump())
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return emp


@router.get(
    "",
    response_model=list[EmployeeResponse],
    summary="List all employees",
)
def list_employees(
    active_only: bool = Query(False, description="Return only active employees"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    q = db.query(Employee)
    if active_only:
        q = q.filter(Employee.is_active == True)  # noqa: E712
    return q.order_by(Employee.name).offset(skip).limit(limit).all()


@router.get(
    "/{employee_id}",
    response_model=EmployeeResponse,
    summary="Get a single employee by ID",
)
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    return _get_or_404(employee_id, db)


@router.patch(
    "/{employee_id}",
    response_model=EmployeeResponse,
    summary="Partially update an employee",
)
def update_employee(
    employee_id: int, payload: EmployeeUpdate, db: Session = Depends(get_db)
):
    emp = _get_or_404(employee_id, db)
    updates = payload.model_dump(exclude_unset=True)

    if "rfid_tag" in updates and updates["rfid_tag"] != emp.rfid_tag:
        if db.query(Employee).filter(Employee.rfid_tag == updates["rfid_tag"]).first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"RFID tag '{updates['rfid_tag']}' is already assigned.",
            )

    for field, value in updates.items():
        setattr(emp, field, value)

    db.commit()
    db.refresh(emp)
    return emp


@router.delete(
    "/{employee_id}",
    response_model=MessageResponse,
    summary="Deactivate (soft-delete) an employee",
)
def deactivate_employee(employee_id: int, db: Session = Depends(get_db)):
    emp = _get_or_404(employee_id, db)
    emp.is_active = False
    db.commit()
    return MessageResponse(message=f"Employee {emp.name} deactivated successfully.")
