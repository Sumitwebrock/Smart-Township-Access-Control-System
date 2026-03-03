"""
Database Migration Script for Visitors Table
Adds missing columns to support the enhanced visitor management system
"""
import sqlite3
from datetime import datetime, timezone

def migrate_visitors_table():
    """Add missing columns to visitors table"""
    conn = sqlite3.connect('township_gate.db')
    cursor = conn.cursor()
    
    # Get existing columns
    cursor.execute("PRAGMA table_info(visitors)")
    existing_columns = [col[1] for col in cursor.fetchall()]
    print(f"Existing columns: {existing_columns}")
    
    migrations = []
    
    # Add visiting_flat (renamed from house_number)
    if 'visiting_flat' not in existing_columns:
        migrations.append("""
            ALTER TABLE visitors ADD COLUMN visiting_flat VARCHAR(50)
        """)
        print("✓ Will add visiting_flat column")
    
    # Add rfid_tag (CRITICAL - required field)
    if 'rfid_tag' not in existing_columns:
        migrations.append("""
            ALTER TABLE visitors ADD COLUMN rfid_tag VARCHAR(100)
        """)
        print("✓ Will add rfid_tag column")
    
    # Add status (CRITICAL - required field)
    if 'status' not in existing_columns:
        migrations.append("""
            ALTER TABLE visitors ADD COLUMN status VARCHAR(20) DEFAULT 'PENDING'
        """)
        print("✓ Will add status column")
    
    # Add is_blacklisted
    if 'is_blacklisted' not in existing_columns:
        migrations.append("""
            ALTER TABLE visitors ADD COLUMN is_blacklisted BOOLEAN DEFAULT 0
        """)
        print("✓ Will add is_blacklisted column")
    
    # Add inside flag
    if 'inside' not in existing_columns:
        migrations.append("""
            ALTER TABLE visitors ADD COLUMN inside BOOLEAN DEFAULT 0
        """)
        print("✓ Will add inside column")
    
    # Add valid_from
    if 'valid_from' not in existing_columns:
        migrations.append("""
            ALTER TABLE visitors ADD COLUMN valid_from TIMESTAMP
        """)
        print("✓ Will add valid_from column")
    
    # Add valid_till
    if 'valid_till' not in existing_columns:
        migrations.append("""
            ALTER TABLE visitors ADD COLUMN valid_till TIMESTAMP
        """)
        print("✓ Will add valid_till column")
    
    # Add snapshot_path
    if 'snapshot_path' not in existing_columns:
        migrations.append("""
            ALTER TABLE visitors ADD COLUMN snapshot_path TEXT
        """)
        print("✓ Will add snapshot_path column")
    
    # Add purpose
    if 'purpose' not in existing_columns:
        migrations.append("""
            ALTER TABLE visitors ADD COLUMN purpose TEXT
        """)
        print("✓ Will add purpose column")
    
    # Add remarks
    if 'remarks' not in existing_columns:
        migrations.append("""
            ALTER TABLE visitors ADD COLUMN remarks TEXT
        """)
        print("✓ Will add remarks column")
    
    # Add approved_by
    if 'approved_by' not in existing_columns:
        migrations.append("""
            ALTER TABLE visitors ADD COLUMN approved_by VARCHAR(200)
        """)
        print("✓ Will add approved_by column")
    
    # Add approved_at
    if 'approved_at' not in existing_columns:
        migrations.append("""
            ALTER TABLE visitors ADD COLUMN approved_at TIMESTAMP
        """)
        print("✓ Will add approved_at column")
    
    # Execute all migrations
    try:
        for migration in migrations:
            cursor.execute(migration)
        
        # Copy house_number to visiting_flat if needed
        if 'visiting_flat' not in existing_columns and 'house_number' in existing_columns:
            cursor.execute("""
                UPDATE visitors SET visiting_flat = house_number WHERE visiting_flat IS NULL
            """)
            print("✓ Copied house_number to visiting_flat")
        
        # Copy is_blocked to is_blacklisted if needed
        if 'is_blacklisted' not in existing_columns and 'is_blocked' in existing_columns:
            cursor.execute("""
                UPDATE visitors SET is_blacklisted = is_blocked WHERE is_blacklisted IS NULL
            """)
            print("✓ Copied is_blocked to is_blacklisted")
        
        # Copy photo_path to snapshot_path if needed
        if 'snapshot_path' not in existing_columns and 'photo_path' in existing_columns:
            cursor.execute("""
                UPDATE visitors SET snapshot_path = photo_path WHERE snapshot_path IS NULL
            """)
            print("✓ Copied photo_path to snapshot_path")
        
        # Generate RFID tags for existing visitors
        cursor.execute("SELECT id FROM visitors WHERE rfid_tag IS NULL")
        visitors_without_rfid = cursor.fetchall()
        if visitors_without_rfid:
            import uuid
            for (visitor_id,) in visitors_without_rfid:
                rfid_tag = f"VSTR-{uuid.uuid4()}"
                cursor.execute("UPDATE visitors SET rfid_tag = ? WHERE id = ?", (rfid_tag, visitor_id))
            print(f"✓ Generated RFID tags for {len(visitors_without_rfid)} existing visitors")
        
        # Create unique index on rfid_tag
        try:
            cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_visitors_rfid_tag ON visitors(rfid_tag)")
            print("✓ Created unique index on rfid_tag")
        except:
            pass  # Index may already exist
        
        # Set default dates for existing visitors
        cursor.execute("SELECT id FROM visitors WHERE valid_from IS NULL")
        visitors_without_dates = cursor.fetchall()
        if visitors_without_dates:
            now = datetime.now(timezone.utc).isoformat()
            for (visitor_id,) in visitors_without_dates:
                cursor.execute("""
                    UPDATE visitors 
                    SET valid_from = ?, valid_till = datetime(?, '+1 day')
                    WHERE id = ?
                """, (now, now, visitor_id))
            print(f"✓ Set default validity dates for {len(visitors_without_dates)} existing visitors")
        
        conn.commit()
        print("\n✅ Migration completed successfully!")
        
        # Show final schema
        cursor.execute("PRAGMA table_info(visitors)")
        final_columns = [col[1] for col in cursor.fetchall()]
        print(f"\nFinal columns ({len(final_columns)}): {final_columns}")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Migration failed: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    print("🔄 Starting visitors table migration...\n")
    migrate_visitors_table()
