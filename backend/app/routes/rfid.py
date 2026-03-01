"""
RFID entry scanning endpoint.

Flow:
  1. Look up rfid_tag in Employee table.
  2. If not found, look in FamilyMember table.
  3. If still not found → 403 Access Denied.
  4. If found but inactive → 403 Access Denied.
  5. Otherwise create an EntryLog and return 200 Access Granted.
"""
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Employee, EntryLog, FamilyMember, PersonType
from app.schemas import RFIDScanRequest, RFIDScanResponse

router = APIRouter(prefix="/rfid", tags=["RFID"])


@router.post(
    "/scan",
    response_model=RFIDScanResponse,
    summary="Scan an RFID tag and grant / deny entry",
)
def rfid_scan(payload: RFIDScanRequest, db: Session = Depends(get_db)):
    rfid = payload.rfid_tag.strip()

    # -----------------------------------------------------------------------
    # 1. Check Employee table
    # -----------------------------------------------------------------------
    employee: Employee | None = (
        db.query(Employee).filter(Employee.rfid_tag == rfid).first()
    )

    if employee:
        if not employee.is_active:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "access_granted": False,
                    "message": "Employee account is deactivated. Access denied.",
                },
            )
        log = EntryLog(
            person_type=PersonType.employee,
            person_id=employee.id,
            vehicle_number=employee.vehicle_number,
            gate_id=payload.gate_id,
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return RFIDScanResponse(
            access_granted=True,
            message=f"Welcome, {employee.name}! Access granted.",
            employee=employee,
            entry_log_id=log.id,
        )

    # -----------------------------------------------------------------------
    # 2. Check FamilyMember table
    # -----------------------------------------------------------------------
    family_member: FamilyMember | None = (
        db.query(FamilyMember).filter(FamilyMember.rfid_tag == rfid).first()
    )

    if family_member:
        if not family_member.is_active:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "access_granted": False,
                    "message": "Family member account is deactivated. Access denied.",
                },
            )
        # Employee the family member belongs to
        parent_employee: Employee | None = (
            db.query(Employee).filter(Employee.id == family_member.employee_id).first()
        )
        if parent_employee and not parent_employee.is_active:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "access_granted": False,
                    "message": "Associated employee account is deactivated. Access denied.",
                },
            )

        log = EntryLog(
            person_type=PersonType.employee,  # treated as employee family
            person_id=family_member.id,
            gate_id=payload.gate_id,
            remarks=f"Family member of employee ID {family_member.employee_id}",
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return RFIDScanResponse(
            access_granted=True,
            message=f"Welcome, {family_member.name}! Access granted.",
            family_member=family_member,
            entry_log_id=log.id,
        )

    # -----------------------------------------------------------------------
    # 3. Unknown RFID
    # -----------------------------------------------------------------------
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={
            "access_granted": False,
            "message": f"RFID tag '{rfid}' not recognised. Access denied.",
        },
    )
