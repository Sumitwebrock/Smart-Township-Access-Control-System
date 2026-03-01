"""
Run this once to populate the SQLite database with sample data.
Usage:  cd backend && python seed.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, Base, engine
from app.models import Employee, Visitor, Alert, AlertType, AlertStatus, EntryLog, PersonType
from datetime import datetime, timezone, timedelta

# Create tables if not present
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# ── Clear existing data (safe for dev) ──────────────────────────────────────
for model in [EntryLog, Alert, Visitor, Employee]:
    db.query(model).delete()
db.commit()

# ── Employees ────────────────────────────────────────────────────────────────
employees = [
    Employee(name="Rajesh Kumar",   house_number="A-204", rfid_tag="RFID001", vehicle_number="MH 12 AB 1234", is_active=True),
    Employee(name="Priya Sharma",   house_number="B-108", rfid_tag="RFID002", vehicle_number="MH 12 CD 5678", is_active=True),
    Employee(name="Amit Patel",     house_number="C-312", rfid_tag="RFID003", vehicle_number="GJ 01 EF 9012", is_active=True),
    Employee(name="Sita Mehta",     house_number="A-105", rfid_tag="RFID004", vehicle_number="DL 03 IJ 7890", is_active=False),
    Employee(name="Ravi Kumar",     house_number="D-401", rfid_tag="RFID005", vehicle_number="MH 12 MN 6789", is_active=True),
    Employee(name="Neha Gupta",     house_number="B-302", rfid_tag="RFID006", vehicle_number="MH 04 KL 2345", is_active=True),
    Employee(name="Vikram Singh",   house_number="D-201", rfid_tag="RFID007", vehicle_number=None,            is_active=True),
    Employee(name="Sunita Rao",     house_number="C-110", rfid_tag="RFID008", vehicle_number="RJ 14 OP 3456", is_active=True),
]
db.add_all(employees)
db.commit()
for e in employees:
    db.refresh(e)

# ── Visitors ─────────────────────────────────────────────────────────────────
visitors = [
    Visitor(name="Amit Kumar",        phone="+91 98765 43210", house_number="A-204", vehicle_number="MH 12 AB 1234", visit_count=15, is_blocked=False),
    Visitor(name="Delivery Person",   phone="+91 98765 43211", house_number="B-108", vehicle_number="MH 12 CD 5678", visit_count=8,  is_blocked=False),
    Visitor(name="Ravi Patel",        phone="+91 98765 43212", house_number="C-312", vehicle_number="GJ 01 EF 9012", visit_count=22, is_blocked=False),
    Visitor(name="Suspicious Person", phone="+91 98765 43213", house_number="D-401", vehicle_number="UP 80 GH 3456", visit_count=1,  is_blocked=True),
]
db.add_all(visitors)
db.commit()
for v in visitors:
    db.refresh(v)

# ── EntryLogs ────────────────────────────────────────────────────────────────
now = datetime.now(timezone.utc)
logs = [
    EntryLog(person_type=PersonType.employee, person_id=employees[0].id, vehicle_number="MH 12 AB 1234", gate_id="Gate 1", entry_time=now - timedelta(minutes=37)),
    EntryLog(person_type=PersonType.visitor,  person_id=visitors[0].id,  vehicle_number="MH 12 AB 1234", gate_id="Gate 2", entry_time=now - timedelta(minutes=42)),
    EntryLog(person_type=PersonType.employee, person_id=employees[1].id, vehicle_number="MH 12 CD 5678", gate_id="Gate 1", entry_time=now - timedelta(minutes=50), exit_time=now - timedelta(minutes=10)),
    EntryLog(person_type=PersonType.employee, person_id=employees[2].id, vehicle_number="GJ 01 EF 9012", gate_id="Gate 1", entry_time=now - timedelta(minutes=60)),
    EntryLog(person_type=PersonType.visitor,  person_id=visitors[1].id,  vehicle_number="MH 12 CD 5678", gate_id="Gate 3", entry_time=now - timedelta(minutes=75), exit_time=now - timedelta(minutes=5)),
    EntryLog(person_type=PersonType.employee, person_id=employees[4].id, vehicle_number="MH 12 MN 6789", gate_id="Gate 1", entry_time=now - timedelta(minutes=90)),
    EntryLog(person_type=PersonType.employee, person_id=employees[5].id, gate_id="Gate 2",               entry_time=now - timedelta(minutes=110)),
    EntryLog(person_type=PersonType.employee, person_id=employees[6].id, gate_id="Gate 2",               entry_time=now - timedelta(hours=3)),
]
db.add_all(logs)
db.commit()

# ── Alerts ───────────────────────────────────────────────────────────────────
alerts = [
    Alert(alert_type=AlertType.panic,     location="Block A - House 204",      status=AlertStatus.open,         raised_by="Security Guard 1", description="Resident pressed panic button"),
    Alert(alert_type=AlertType.fire,      location="Block C - Parking Area",   status=AlertStatus.acknowledged, raised_by="Sensor Auto",       description="Smoke detected near Gate 3 parking"),
    Alert(alert_type=AlertType.intrusion, location="Gate 3 - Service Entrance",status=AlertStatus.resolved,     raised_by="CCTV System",       description="Unknown person attempted entry"),
    Alert(alert_type=AlertType.accident,  location="Main Road - Near Gate 1",  status=AlertStatus.resolved,     raised_by="Gate Operator",     description="Minor vehicle collision"),
]
db.add_all(alerts)
db.commit()

db.close()
print("✅ Database seeded successfully!")
print(f"   {len(employees)} employees")
print(f"   {len(visitors)} visitors")
print(f"   {len(logs)} entry logs")
print(f"   {len(alerts)} alerts")
print()
print("RFID tags for Gate Control testing:")
for e in employees:
    if e.is_active:
        print(f"   {e.rfid_tag}  →  {e.name} ({e.house_number})")
