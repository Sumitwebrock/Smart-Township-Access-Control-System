from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator
from app.models import AlertStatus, AlertType, PersonType


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------
class OrmBase(BaseModel):
    model_config = {"from_attributes": True}


# ===========================================================================
# Employee schemas
# ===========================================================================
class EmployeeBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    house_number: str = Field(..., min_length=1, max_length=50)
    rfid_tag: str = Field(..., min_length=4, max_length=100)
    vehicle_number: Optional[str] = Field(None, max_length=50)
    is_active: bool = True


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    house_number: Optional[str] = Field(None, max_length=50)
    rfid_tag: Optional[str] = Field(None, min_length=4, max_length=100)
    vehicle_number: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None


class EmployeeResponse(OrmBase, EmployeeBase):
    id: int
    created_at: datetime
    updated_at: datetime


# ===========================================================================
# FamilyMember schemas
# ===========================================================================
class FamilyMemberBase(BaseModel):
    employee_id: int
    name: str = Field(..., min_length=2, max_length=200)
    rfid_tag: str = Field(..., min_length=4, max_length=100)
    is_active: bool = True


class FamilyMemberCreate(FamilyMemberBase):
    pass


class FamilyMemberResponse(OrmBase, FamilyMemberBase):
    id: int
    created_at: datetime


# ===========================================================================
# Visitor schemas
# ===========================================================================
class VisitorBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    phone: str = Field(..., min_length=7, max_length=20)
    house_number: str = Field(..., min_length=1, max_length=50)
    vehicle_number: Optional[str] = Field(None, max_length=50)


class VisitorRegister(VisitorBase):
    """Used by the registration endpoint (photo comes as UploadFile separately)."""
    pass


class VisitorUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    phone: Optional[str] = Field(None, max_length=20)
    house_number: Optional[str] = Field(None, max_length=50)
    vehicle_number: Optional[str] = Field(None, max_length=50)
    is_blocked: Optional[bool] = None


class VisitorResponse(OrmBase, VisitorBase):
    id: int
    photo_path: Optional[str] = None
    visit_count: int
    is_blocked: bool
    created_at: datetime
    updated_at: datetime


# ===========================================================================
# EntryLog schemas
# ===========================================================================
class EntryLogCreate(BaseModel):
    person_type: PersonType
    person_id: int
    vehicle_number: Optional[str] = None
    gate_id: Optional[str] = None
    remarks: Optional[str] = None


class EntryLogExit(BaseModel):
    exit_time: Optional[datetime] = None  # defaults to now() in route


class EntryLogResponse(OrmBase):
    id: int
    person_type: PersonType
    person_id: int
    vehicle_number: Optional[str] = None
    entry_time: datetime
    exit_time: Optional[datetime] = None
    gate_id: Optional[str] = None
    remarks: Optional[str] = None


# ===========================================================================
# Alert schemas
# ===========================================================================
class AlertCreate(BaseModel):
    alert_type: AlertType
    location: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    raised_by: Optional[str] = None


class AlertUpdate(BaseModel):
    status: Optional[AlertStatus] = None
    description: Optional[str] = None
    resolved_at: Optional[datetime] = None


class AlertResponse(OrmBase):
    id: int
    alert_type: AlertType
    location: str
    description: Optional[str] = None
    raised_by: Optional[str] = None
    created_at: datetime
    status: AlertStatus
    resolved_at: Optional[datetime] = None


# ===========================================================================
# RFID scan schemas
# ===========================================================================
class RFIDScanRequest(BaseModel):
    rfid_tag: str = Field(..., min_length=4, max_length=100)
    gate_id: Optional[str] = None


class RFIDScanResponse(BaseModel):
    access_granted: bool
    message: str
    employee: Optional[EmployeeResponse] = None
    family_member: Optional[FamilyMemberResponse] = None
    entry_log_id: Optional[int] = None


# ===========================================================================
# Auth schemas
# ===========================================================================
class TokenRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ===========================================================================
# Generic response wrappers
# ===========================================================================
class MessageResponse(BaseModel):
    message: str


class PaginatedResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list
