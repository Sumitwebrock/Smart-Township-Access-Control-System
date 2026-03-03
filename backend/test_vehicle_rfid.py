"""
Test Script for Virtual RFID Vehicle Gate System

This script tests all core functionalities:
1. Vehicle registration with auto RFID generation
2. RFID gate scanning (ENTRY/EXIT)
3. Anti-passback logic
4. Statistics retrieval
5. Entry logs

Run with: python backend/test_vehicle_rfid.py
"""
import requests
import time
from typing import Dict, Any

BASE_URL = "http://localhost:8000/api/v1/vehicles"

def print_section(title: str):
    """Print a formatted section header"""
    print("\n" + "="*70)
    print(f"  {title}")
    print("="*70)

def print_result(test_name: str, success: bool, details: str = ""):
    """Print test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} | {test_name}")
    if details:
        print(f"       {details}")

def test_vehicle_registration():
    """Test 1: Register a new vehicle"""
    print_section("TEST 1: Vehicle Registration with Auto RFID Generation")
    
    vehicle_data = {
        "vehicle_number": "KA 01 TEST 2026",
        "owner_name": "Test User"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/", json=vehicle_data)
        
        if response.status_code == 201:
            vehicle = response.json()
            print_result("Vehicle Registration", True, 
                        f"Vehicle: {vehicle['vehicle_number']}, RFID: {vehicle['rfid_tag'][:30]}...")
            print(f"       Status: {vehicle['status']}, Inside: {vehicle['inside']}")
            return vehicle
        else:
            print_result("Vehicle Registration", False, 
                        f"Status {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print_result("Vehicle Registration", False, str(e))
        return None

def test_rfid_scan_entry(rfid_tag: str):
    """Test 2: RFID ENTRY scan"""
    print_section("TEST 2: RFID ENTRY Gate Scan")
    
    scan_data = {
        "rfid": rfid_tag,
        "gate_type": "ENTRY",
        "gate_id": "GATE_1"
    }
    
    try:
        # Simulate RFID reader delay
        print("⏳ Simulating RFID reader delay (0.5s)...")
        time.sleep(0.5)
        
        response = requests.post(f"{BASE_URL}/rfid-scan", json=scan_data)
        result = response.json()
        
        success = result.get("status") == "granted"
        print_result("ENTRY Scan", success, 
                    f"{result.get('message')} | Vehicle: {result.get('vehicle_number')}")
        return success
    except Exception as e:
        print_result("ENTRY Scan", False, str(e))
        return False

def test_anti_passback_entry(rfid_tag: str):
    """Test 3: Anti-passback for double ENTRY"""
    print_section("TEST 3: Anti-Passback Protection (Double ENTRY)")
    
    scan_data = {
        "rfid": rfid_tag,
        "gate_type": "ENTRY",
        "gate_id": "GATE_1"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/rfid-scan", json=scan_data)
        result = response.json()
        
        # Should be DENIED because vehicle is already inside
        success = result.get("status") == "denied"
        print_result("Anti-Passback ENTRY", success, 
                    f"{result.get('message')}")
        return success
    except Exception as e:
        print_result("Anti-Passback ENTRY", False, str(e))
        return False

def test_rfid_scan_exit(rfid_tag: str):
    """Test 4: RFID EXIT scan"""
    print_section("TEST 4: RFID EXIT Gate Scan")
    
    scan_data = {
        "rfid": rfid_tag,
        "gate_type": "EXIT",
        "gate_id": "GATE_1"
    }
    
    try:
        time.sleep(0.5)
        
        response = requests.post(f"{BASE_URL}/rfid-scan", json=scan_data)
        result = response.json()
        
        success = result.get("status") == "granted"
        print_result("EXIT Scan", success, 
                    f"{result.get('message')} | Vehicle: {result.get('vehicle_number')}")
        return success
    except Exception as e:
        print_result("EXIT Scan", False, str(e))
        return False

def test_anti_passback_exit(rfid_tag: str):
    """Test 5: Anti-passback for double EXIT"""
    print_section("TEST 5: Anti-Passback Protection (Double EXIT)")
    
    scan_data = {
        "rfid": rfid_tag,
        "gate_type": "EXIT",
        "gate_id": "GATE_1"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/rfid-scan", json=scan_data)
        result = response.json()
        
        # Should be DENIED because vehicle is already outside
        success = result.get("status") == "denied"
        print_result("Anti-Passback EXIT", success, 
                    f"{result.get('message')}")
        return success
    except Exception as e:
        print_result("Anti-Passback EXIT", False, str(e))
        return False

def test_invalid_rfid():
    """Test 6: Invalid RFID scan"""
    print_section("TEST 6: Invalid RFID Tag")
    
    scan_data = {
        "rfid": "INVALID-RFID-TAG-123456",
        "gate_type": "ENTRY",
        "gate_id": "GATE_1"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/rfid-scan", json=scan_data)
        result = response.json()
        
        # Should be DENIED
        success = result.get("status") == "denied"
        print_result("Invalid RFID", success, 
                    f"{result.get('message')}")
        return success
    except Exception as e:
        print_result("Invalid RFID", False, str(e))
        return False

def test_statistics():
    """Test 7: Dashboard statistics"""
    print_section("TEST 7: Dashboard Statistics Retrieval")
    
    try:
        response = requests.get(f"{BASE_URL}/stats")
        
        if response.status_code == 200:
            stats = response.json()
            print_result("Statistics API", True)
            print(f"       Total Vehicles: {stats['total_vehicles']}")
            print(f"       Inside: {stats['vehicles_inside']}")
            print(f"       Outside: {stats['vehicles_outside']}")
            print(f"       Today's Entries: {stats['today_entries']}")
            print(f"       Today's Exits: {stats['today_exits']}")
            return True
        else:
            print_result("Statistics API", False, f"Status {response.status_code}")
            return False
    except Exception as e:
        print_result("Statistics API", False, str(e))
        return False

def test_entry_logs():
    """Test 8: Entry logs retrieval"""
    print_section("TEST 8: Entry Logs Retrieval")
    
    try:
        response = requests.get(f"{BASE_URL}/entry-logs?limit=5")
        
        if response.status_code == 200:
            logs = response.json()
            print_result("Entry Logs API", True, f"Retrieved {len(logs)} logs")
            for i, log in enumerate(logs[:3], 1):
                print(f"       Log {i}: {log['gate_type']} at {log['created_at'][:19]}")
            return True
        else:
            print_result("Entry Logs API", False, f"Status {response.status_code}")
            return False
    except Exception as e:
        print_result("Entry Logs API", False, str(e))
        return False

def test_list_vehicles():
    """Test 9: List all vehicles"""
    print_section("TEST 9: List All Vehicles")
    
    try:
        response = requests.get(f"{BASE_URL}/")
        
        if response.status_code == 200:
            vehicles = response.json()
            print_result("List Vehicles API", True, f"Found {len(vehicles)} vehicles")
            for vehicle in vehicles[:3]:
                print(f"       {vehicle['vehicle_number']} - {vehicle['owner_name']} | Inside: {vehicle['inside']}")
            return True
        else:
            print_result("List Vehicles API", False, f"Status {response.status_code}")
            return False
    except Exception as e:
        print_result("List Vehicles API", False, str(e))
        return False

def run_all_tests():
    """Run complete test suite"""
    print("\n")
    print("🚗" * 35)
    print("     VIRTUAL RFID VEHICLE GATE SYSTEM - TEST SUITE")
    print("🚗" * 35)
    print("\n⚠️  Make sure the backend is running: python -m backend.app.main")
    print("    or: uvicorn backend.app.main:app --reload")
    input("\nPress Enter to start tests...")
    
    results = []
    
    # Test 1: Register vehicle
    vehicle = test_vehicle_registration()
    results.append(vehicle is not None)
    
    if not vehicle:
        print("\n❌ Cannot proceed without a registered vehicle. Exiting.")
        return
    
    rfid_tag = vehicle["rfid_tag"]
    time.sleep(1)
    
    # Test 2: ENTRY scan
    results.append(test_rfid_scan_entry(rfid_tag))
    time.sleep(1)
    
    # Test 3: Anti-passback ENTRY
    results.append(test_anti_passback_entry(rfid_tag))
    time.sleep(1)
    
    # Test 4: EXIT scan
    results.append(test_rfid_scan_exit(rfid_tag))
    time.sleep(1)
    
    # Test 5: Anti-passback EXIT
    results.append(test_anti_passback_exit(rfid_tag))
    time.sleep(1)
    
    # Test 6: Invalid RFID
    results.append(test_invalid_rfid())
    time.sleep(1)
    
    # Test 7: Statistics
    results.append(test_statistics())
    time.sleep(1)
    
    # Test 8: Entry logs
    results.append(test_entry_logs())
    time.sleep(1)
    
    # Test 9: List vehicles
    results.append(test_list_vehicles())
    
    # Summary
    print_section("TEST SUMMARY")
    passed = sum(results)
    total = len(results)
    print(f"✅ Passed: {passed}/{total}")
    print(f"❌ Failed: {total - passed}/{total}")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! System is fully operational.")
    else:
        print(f"\n⚠️  Some tests failed. Please review the results above.")
    
    print("\n" + "="*70)

if __name__ == "__main__":
    run_all_tests()
