from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from app.database import Base
import enum


# ---------------------------------------------------------------------------
# Enum definitions
# ---------------------------------------------------------------------------
class PersonType(str, enum.Enum):
    employee = "employee"
    visitor = "visitor"


class AlertType(str, enum.Enum):
    panic = "panic"
    fire = "fire"
    accident = "accident"
    intrusion = "intrusion"
    other = "other"


class AlertStatus(str, enum.Enum):
    open = "open"
    acknowledged = "acknowledged"
    resolved = "resolved"


class GateType(str, enum.Enum):
    """Gate types for RFID entry/exit system"""
    ENTRY = "ENTRY"
    EXIT = "EXIT"


class VisitorStatus(str, enum.Enum):
    """Visitor approval and entry status workflow"""
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    INSIDE = "INSIDE"
    EXITED = "EXITED"
    DENIED = "DENIED"
    EXPIRED = "EXPIRED"


# ---------------------------------------------------------------------------
# Employee
# ---------------------------------------------------------------------------
class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    house_number = Column(String(50), nullable=False)
    rfid_tag = Column(String(100), unique=True, nullable=False, index=True)
    vehicle_number = Column(String(50), nullable=True, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )


# ---------------------------------------------------------------------------
# FamilyMember  (belongs to an Employee)
# ---------------------------------------------------------------------------
class FamilyMember(Base):
    __tablename__ = "family_members"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)
    rfid_tag = Column(String(100), unique=True, nullable=False, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


# ---------------------------------------------------------------------------
# Visitor
# ---------------------------------------------------------------------------
class Visitor(Base):
    """Enhanced Visitor Management with Professional Approval Workflow"""
    __tablename__ = "visitors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    phone = Column(String(20), nullable=False, index=True)
    visiting_flat = Column(String(50), nullable=True, index=True)
    vehicle_number = Column(String(50), nullable=True, index=True)
    
    # RFID Integration
    rfid_tag = Column(String(100), unique=True, nullable=True, index=True)
    
    # Status Workflow
    status = Column(Enum(VisitorStatus), default=VisitorStatus.PENDING, nullable=True, index=True)
    
    # Security & Access Control
    is_blacklisted = Column(Boolean, default=False, nullable=False, index=True)
    inside = Column(Boolean, default=False, nullable=False, index=True)
    
    # Time-based Access Control
    valid_from = Column(DateTime(timezone=True), nullable=True, index=True)
    valid_till = Column(DateTime(timezone=True), nullable=True, index=True)
    
    # Metadata
    snapshot_path = Column(Text, nullable=True)
    purpose = Column(Text, nullable=True)
    remarks = Column(Text, nullable=True)
    
    # Legacy compatibility
    photo_path = Column(Text, nullable=True)
    visit_count = Column(Integer, default=1, nullable=False)
    is_blocked = Column(Boolean, default=False, nullable=False)
    house_number = Column(String(50), nullable=True)
    
    # Audit fields
    approved_by = Column(String(200), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )


# ---------------------------------------------------------------------------
# EntryLog
# ---------------------------------------------------------------------------
class EntryLog(Base):
    __tablename__ = "entry_logs"

    id = Column(Integer, primary_key=True, index=True)
    person_type = Column(Enum(PersonType), nullable=False, index=True)
    person_id = Column(Integer, nullable=False, index=True)
    vehicle_number = Column(String(50), nullable=True)
    entry_time = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True
    )
    exit_time = Column(DateTime(timezone=True), nullable=True)
    gate_id = Column(String(50), nullable=True)
    remarks = Column(Text, nullable=True)


# ---------------------------------------------------------------------------
# Alert
# ---------------------------------------------------------------------------
class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_type = Column(Enum(AlertType), nullable=False, index=True)
    location = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    raised_by = Column(String(200), nullable=True)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True
    )
    status = Column(
        Enum(AlertStatus), default=AlertStatus.open, nullable=False, index=True
    )
    resolved_at = Column(DateTime(timezone=True), nullable=True)
