"""
🧪 VISITOR MANAGEMENT MODULE - TEST SCRIPT
═══════════════════════════════════════════════════════════════════════════════

Quick test script to verify the Visitors Management Module is working correctly.

Run this script with the backend running:
    python backend/test_visitor_management.py

This will:
1. Create a test visitor
2. Approve the visitor
3. Simulate RFID entry
4. Simulate RFID exit
5. Get statistics
6. Test blacklist functionality
"""

import requests
import json
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:8000/api/v1/visitors"
ADMIN_NAME = "Test Admin"

def print_section(title):
    print(f"\n{'='*70}")
    print(f"  {title}")
    print('='*70)

def print_success(message):
    print(f"✅ {message}")

def print_error(message):
    print(f"❌ {message}")

def print_info(message):
    print(f"ℹ️  {message}")


def test_visitor_registration():
    """Test 1: Register a new visitor"""
    print_section("TEST 1: Register New Visitor")
    
    now = datetime.utcnow()
    tomorrow = now + timedelta(days=1)
    
    data = {
        "name": "John Test Visitor",
        "phone": "+1-555-TEST-001",
        "visiting_flat": "A-101",
        "vehicle_number": "TEST-XYZ",
        "purpose": "Automated test visitor",
        "valid_from": now.isoformat() + "Z",
        "valid_till": tomorrow.isoformat() + "Z"
    }
    
    try:
        response = requests.post(BASE_URL, data=data)
        response.raise_for_status()
        visitor = response.json()
        
        print_success(f"Visitor registered successfully!")
        print_info(f"Name: {visitor['name']}")
        print_info(f"RFID Tag: {visitor['rfid_tag']}")
        print_info(f"Status: {visitor['status']}")
        print_info(f"Visitor ID: {visitor['id']}")
        
        return visitor
    except Exception as e:
        print_error(f"Registration failed: {e}")
        return None


def test_visitor_approval(visitor):
    """Test 2: Approve the visitor"""
    print_section("TEST 2: Approve Visitor")
    
    if not visitor:
        print_error("Skipping - no visitor to approve")
        return None
    
    try:
        response = requests.post(
            f"{BASE_URL}/{visitor['id']}/approve",
            json={
                "action": "approve",
                "approved_by": ADMIN_NAME,
                "remarks": "Test approval"
            }
        )
        response.raise_for_status()
        approved_visitor = response.json()
        
        print_success(f"Visitor approved successfully!")
        print_info(f"Status: {approved_visitor['status']}")
        print_info(f"Approved by: {approved_visitor['approved_by']}")
        
        return approved_visitor
    except Exception as e:
        print_error(f"Approval failed: {e}")
        return visitor


def test_rfid_entry(visitor):
    """Test 3: Simulate RFID entry scan"""
    print_section("TEST 3: RFID Entry Scan")
    
    if not visitor:
        print_error("Skipping - no visitor for entry scan")
        return None
    
    try:
        response = requests.post(
            f"{BASE_URL}/rfid-scan",
            json={
                "rfid_tag": visitor['rfid_tag'],
                "gate_type": "ENTRY",
                "gate_id": "TEST_GATE_1"
            }
        )
        response.raise_for_status()
        scan_result = response.json()
        
        if scan_result['access_granted']:
            print_success("Entry access granted!")
            print_info(f"Message: {scan_result['message']}")
            print_info(f"Log ID: {scan_result['log_id']}")
            return scan_result
        else:
            print_error(f"Entry denied: {scan_result['message']}")
            return None
    except Exception as e:
        print_error(f"RFID entry scan failed: {e}")
        return None


def test_rfid_exit(visitor):
    """Test 4: Simulate RFID exit scan"""
    print_section("TEST 4: RFID Exit Scan")
    
    if not visitor:
        print_error("Skipping - no visitor for exit scan")
        return None
    
    try:
        response = requests.post(
            f"{BASE_URL}/rfid-scan",
            json={
                "rfid_tag": visitor['rfid_tag'],
                "gate_type": "EXIT",
                "gate_id": "TEST_GATE_1"
            }
        )
        response.raise_for_status()
        scan_result = response.json()
        
        if scan_result['access_granted']:
            print_success("Exit access granted!")
            print_info(f"Message: {scan_result['message']}")
            return scan_result
        else:
            print_error(f"Exit denied: {scan_result['message']}")
            return None
    except Exception as e:
        print_error(f"RFID exit scan failed: {e}")
        return None


def test_get_statistics():
    """Test 5: Get visitor statistics"""
    print_section("TEST 5: Get Visitor Statistics")
    
    try:
        response = requests.get(f"{BASE_URL}/stats")
        response.raise_for_status()
        stats = response.json()
        
        print_success("Statistics retrieved successfully!")
        print_info(f"Total visitors today: {stats['total_visitors_today']}")
        print_info(f"Currently inside: {stats['currently_inside']}")
        print_info(f"Pending approvals: {stats['pending_approvals']}")
        print_info(f"Denied today: {stats['denied_today']}")
        print_info(f"Blacklisted: {stats['blacklisted_count']}")
        print_info(f"Total all-time: {stats['total_visitors_all_time']}")
        
        return stats
    except Exception as e:
        print_error(f"Failed to get statistics: {e}")
        return None


def test_blacklist(visitor):
    """Test 6: Blacklist visitor and test access"""
    print_section("TEST 6: Blacklist Functionality")
    
    if not visitor:
        print_error("Skipping - no visitor to blacklist")
        return
    
    try:
        # Blacklist the visitor
        response = requests.post(
            f"{BASE_URL}/{visitor['id']}/blacklist",
            params={"remarks": "Test blacklist"}
        )
        response.raise_for_status()
        blacklisted_visitor = response.json()
        
        print_success("Visitor blacklisted successfully!")
        print_info(f"Is blacklisted: {blacklisted_visitor['is_blacklisted']}")
        print_info(f"Status: {blacklisted_visitor['status']}")
        
        # Try to scan RFID (should be denied)
        print_info("\nTesting RFID scan for blacklisted visitor...")
        response = requests.post(
            f"{BASE_URL}/rfid-scan",
            json={
                "rfid_tag": visitor['rfid_tag'],
                "gate_type": "ENTRY",
                "gate_id": "TEST_GATE_1"
            }
        )
        response.raise_for_status()
        scan_result = response.json()
        
        if not scan_result['access_granted']:
            print_success("Blacklist working! Access correctly denied.")
            print_info(f"Denial message: {scan_result['message']}")
        else:
            print_error("Blacklist failed! Access was granted (should be denied)")
        
        # Remove from blacklist
        print_info("\nRemoving from blacklist...")
        response = requests.delete(f"{BASE_URL}/{visitor['id']}/blacklist")
        response.raise_for_status()
        
        print_success("Visitor removed from blacklist!")
        
    except Exception as e:
        print_error(f"Blacklist test failed: {e}")


def test_list_visitors():
    """Test 7: List visitors with filters"""
    print_section("TEST 7: List Visitors")
    
    try:
        # List all visitors
        response = requests.get(BASE_URL)
        response.raise_for_status()
        visitors = response.json()
        
        print_success(f"Retrieved {len(visitors)} visitors")
        
        # List only inside visitors
        response = requests.get(f"{BASE_URL}?inside_only=true")
        response.raise_for_status()
        inside_visitors = response.json()
        
        print_info(f"Visitors currently inside: {len(inside_visitors)}")
        
        # List pending approvals
        response = requests.get(f"{BASE_URL}?status=PENDING")
        response.raise_for_status()
        pending = response.json()
        
        print_info(f"Pending approvals: {len(pending)}")
        
    except Exception as e:
        print_error(f"List visitors failed: {e}")


def test_search():
    """Test 8: Search functionality"""
    print_section("TEST 8: Search Visitors")
    
    try:
        # Search by phone
        response = requests.get(f"{BASE_URL}/search/phone/+1-555-TEST-001")
        response.raise_for_status()
        results = response.json()
        
        print_success(f"Phone search found {len(results)} result(s)")
        
        # Search by flat
        response = requests.get(f"{BASE_URL}/search/flat/A-101")
        response.raise_for_status()
        results = response.json()
        
        print_success(f"Flat search found {len(results)} result(s)")
        
    except Exception as e:
        print_error(f"Search test failed: {e}")


def cleanup_test_visitor(visitor):
    """Cleanup: Delete test visitor"""
    print_section("CLEANUP: Delete Test Visitor")
    
    if not visitor:
        print_info("No visitor to cleanup")
        return
    
    try:
        response = requests.delete(f"{BASE_URL}/{visitor['id']}")
        response.raise_for_status()
        
        print_success("Test visitor deleted successfully!")
    except Exception as e:
        print_error(f"Cleanup failed: {e}")
        print_info(f"You may need to manually delete visitor ID {visitor['id']}")


def run_all_tests():
    """Run all tests in sequence"""
    print("\n" + "="*70)
    print("  🧪 VISITOR MANAGEMENT MODULE - AUTOMATED TESTS")
    print("="*70)
    print("\nTesting backend API endpoints...")
    print(f"Base URL: {BASE_URL}")
    print()
    
    try:
        # Run tests
        visitor = test_visitor_registration()
        visitor = test_visitor_approval(visitor)
        test_rfid_entry(visitor)
        test_rfid_exit(visitor)
        test_get_statistics()
        test_list_visitors()
        test_search()
        test_blacklist(visitor)
        
        # Cleanup
        cleanup_test_visitor(visitor)
        
        print_section("TEST SUMMARY")
        print_success("All tests completed!")
        print_info("Check the results above for any errors.")
        print_info("\nNext steps:")
        print_info("1. Open http://localhost:5173/admin/visitors")
        print_info("2. Test the UI by registering a visitor manually")
        print_info("3. Try the camera capture feature")
        print_info("4. Test approval/denial workflow")
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
    except Exception as e:
        print_error(f"Test suite failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    print("\n⚠️  Make sure the backend is running on http://localhost:8000")
    input("Press Enter to start tests...")
    run_all_tests()
    print("\n✅ Testing complete!\n")
