#!/usr/bin/env python3
"""
Comprehensive backend API testing for Tabi trip companion app.
Tests all endpoints for functionality and data integrity.
"""

import requests
import sys
import json
from datetime import datetime
import os
from pathlib import Path

# Load frontend env to get the backend URL
def load_backend_url():
    frontend_env = Path("/app/frontend/.env")
    if frontend_env.exists():
        with open(frontend_env, 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    return "http://localhost:8001"

class TabiAPITester:
    def __init__(self, base_url=None):
        self.base_url = base_url or load_backend_url()
        if not self.base_url.endswith('/'):
            self.base_url += '/'
        self.api_url = f"{self.base_url}api"
        self.tests_run = 0
        self.tests_passed = 0
        self.errors = []

    def log_test(self, name, success, details="", error=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}: PASS {details}")
        else:
            print(f"❌ {name}: FAIL {error}")
            self.errors.append({"test": name, "error": error})
        print()

    def test_endpoint(self, method, endpoint, expected_status, data=None, description=""):
        """Generic endpoint tester"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
                
            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json()
                    return True, response_data
                except:
                    return True, {}
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json()
                    error_msg += f" - {error_detail}"
                except:
                    error_msg += f" - {response.text[:200]}"
                return False, {"error": error_msg}
                
        except Exception as e:
            return False, {"error": f"Request failed: {str(e)}"}

    def test_settings_api(self):
        """Test settings endpoints"""
        print("🔧 Testing Settings API...")
        
        # Test GET settings
        success, data = self.test_endpoint('GET', 'settings', 200)
        if success and isinstance(data, dict):
            required_fields = ['exchange_rate', 'theme', 'reminder_minutes']
            missing_fields = [f for f in required_fields if f not in data]
            if missing_fields:
                self.log_test("GET /api/settings", False, 
                            error=f"Missing required fields: {missing_fields}")
            else:
                self.log_test("GET /api/settings", True, 
                            f"Default settings found: rate={data.get('exchange_rate')}, theme={data.get('theme')}")
                
                # Test PUT settings
                update_data = {
                    "exchange_rate": 0.58,
                    "theme": "light", 
                    "reminder_minutes": 45
                }
                success2, result = self.test_endpoint('PUT', 'settings', 200, update_data)
                self.log_test("PUT /api/settings", success2,
                            "Settings update" if success2 else "", 
                            result.get('error', '') if not success2 else '')
        else:
            self.log_test("GET /api/settings", False, 
                        error=f"Invalid response format: {data}")

    def test_activities_api(self):
        """Test activities endpoints with comprehensive checks"""
        print("📅 Testing Activities API...")
        
        # First seed data if not already present
        seed_success, seed_data = self.test_endpoint('POST', 'seed', 200)
        if seed_success and 'count' not in seed_data:
            print("   Seeding initial data...")
        
        # Test GET all activities
        success, activities = self.test_endpoint('GET', 'activities', 200)
        if success and isinstance(activities, list):
            total_count = len(activities)
            self.log_test("GET /api/activities", True, 
                        f"Retrieved {total_count} activities (expected: 60)")
            
            if total_count < 50:
                self.log_test("Activities count validation", False,
                            error=f"Expected ~60 pre-loaded activities, got {total_count}")
            
            # Test GET activities for specific date (Osaka)
            success2, osaka_activities = self.test_endpoint('GET', 'activities?date=2026-02-28', 200)
            if success2 and isinstance(osaka_activities, list):
                osaka_count = len(osaka_activities)
                osaka_cities = [a.get('city') for a in osaka_activities if a.get('city')]
                self.log_test("GET /api/activities?date=2026-02-28", True,
                            f"Found {osaka_count} activities for Osaka (cities: {set(osaka_cities)})")
                
                if osaka_count < 3:
                    self.log_test("Osaka activities validation", False,
                                error=f"Expected 5 activities for Osaka on 2026-02-28, got {osaka_count}")
            else:
                self.log_test("GET /api/activities?date=2026-02-28", False,
                            error=f"Failed to get Osaka activities: {osaka_activities}")

            # Test activity CRUD operations if we have data
            if activities:
                self.test_activity_crud()
        else:
            self.log_test("GET /api/activities", False, 
                        error=f"Invalid response: {activities}")

    def test_activity_crud(self):
        """Test CRUD operations for activities"""
        print("   Testing Activity CRUD operations...")
        
        # Test CREATE
        new_activity = {
            "date": "2026-03-01",
            "time": "14:30", 
            "name": "Test Activity",
            "location": "Test Location",
            "city": "Osaka",
            "category": "sightseeing",
            "status": "pending",
            "notes": "Test note",
            "order": 100
        }
        
        success, created = self.test_endpoint('POST', 'activities', 200, new_activity)
        if success and 'id' in created:
            activity_id = created['id']
            self.log_test("POST /api/activities", True, f"Created activity ID: {activity_id}")
            
            # Test UPDATE
            update_data = {"name": "Updated Test Activity", "status": "completed"}
            success2, updated = self.test_endpoint('PUT', f'activities/{activity_id}', 200, update_data)
            if success2 and updated.get('name') == "Updated Test Activity":
                self.log_test("PUT /api/activities/{id}", True, "Activity updated successfully")
            else:
                self.log_test("PUT /api/activities/{id}", False, 
                            error=f"Update failed: {updated}")
            
            # Test DELETE
            success3, deleted = self.test_endpoint('DELETE', f'activities/{activity_id}', 200)
            self.log_test("DELETE /api/activities/{id}", success3,
                        "Activity deleted" if success3 else "",
                        deleted.get('error', '') if not success3 else '')
        else:
            self.log_test("POST /api/activities", False, 
                        error=f"Failed to create activity: {created}")

    def test_expenses_api(self):
        """Test expenses CRUD operations"""
        print("💰 Testing Expenses API...")
        
        # Test GET expenses
        success, expenses = self.test_endpoint('GET', 'expenses', 200)
        if success and isinstance(expenses, list):
            self.log_test("GET /api/expenses", True, f"Retrieved {len(expenses)} expenses")
            
            # Test CREATE expense
            new_expense = {
                "amount_jpy": 1500.0,
                "category": "food",
                "note": "Test sushi dinner",
                "date": "2026-02-28"
            }
            
            success2, created = self.test_endpoint('POST', 'expenses', 200, new_expense)
            if success2 and 'id' in created:
                expense_id = created['id']
                self.log_test("POST /api/expenses", True, f"Created expense ID: {expense_id}")
                
                # Test DELETE expense
                success3, deleted = self.test_endpoint('DELETE', f'expenses/{expense_id}', 200)
                self.log_test("DELETE /api/expenses/{id}", success3,
                            "Expense deleted" if success3 else "",
                            deleted.get('error', '') if not success3 else '')
            else:
                self.log_test("POST /api/expenses", False, 
                            error=f"Failed to create expense: {created}")
        else:
            self.log_test("GET /api/expenses", False, 
                        error=f"Invalid response: {expenses}")

    def test_packing_items_api(self):
        """Test packing items CRUD operations"""
        print("🎒 Testing Packing Items API...")
        
        # Test GET packing items (should have pre-seeded data)
        success, items = self.test_endpoint('GET', 'packing-items', 200)
        if success and isinstance(items, list):
            self.log_test("GET /api/packing-items", True, 
                        f"Retrieved {len(items)} packing items (expected: 22)")
            
            if len(items) < 20:
                self.log_test("Packing items count validation", False,
                            error=f"Expected ~22 pre-loaded items, got {len(items)}")
            
            # Test CREATE packing item
            new_item = {"name": "Test Item", "checked": False}
            success2, created = self.test_endpoint('POST', 'packing-items', 200, new_item)
            if success2 and 'id' in created:
                item_id = created['id']
                self.log_test("POST /api/packing-items", True, f"Created item ID: {item_id}")
                
                # Test UPDATE packing item (toggle checked)
                update_data = {"checked": True}
                success3, updated = self.test_endpoint('PUT', f'packing-items/{item_id}', 200, update_data)
                if success3 and updated.get('checked') == True:
                    self.log_test("PUT /api/packing-items/{id}", True, "Item toggled successfully")
                else:
                    self.log_test("PUT /api/packing-items/{id}", False, 
                                error=f"Toggle failed: {updated}")
                
                # Test DELETE packing item
                success4, deleted = self.test_endpoint('DELETE', f'packing-items/{item_id}', 200)
                self.log_test("DELETE /api/packing-items/{id}", success4,
                            "Item deleted" if success4 else "",
                            deleted.get('error', '') if not success4 else '')
            else:
                self.log_test("POST /api/packing-items", False, 
                            error=f"Failed to create item: {created}")
        else:
            self.log_test("GET /api/packing-items", False, 
                        error=f"Invalid response: {items}")

    def test_notes_api(self):
        """Test notes CRUD operations"""
        print("📝 Testing Notes API...")
        
        # Test GET notes
        success, notes = self.test_endpoint('GET', 'notes', 200)
        if success and isinstance(notes, list):
            self.log_test("GET /api/notes", True, f"Retrieved {len(notes)} notes")
            
            # Test CREATE note
            new_note = {
                "title": "Test Note",
                "content": "This is a test note for the trip"
            }
            
            success2, created = self.test_endpoint('POST', 'notes', 200, new_note)
            if success2 and 'id' in created:
                note_id = created['id']
                self.log_test("POST /api/notes", True, f"Created note ID: {note_id}")
                
                # Test UPDATE note
                update_data = {"title": "Updated Test Note", "content": "Updated content"}
                success3, updated = self.test_endpoint('PUT', f'notes/{note_id}', 200, update_data)
                if success3 and updated.get('title') == "Updated Test Note":
                    self.log_test("PUT /api/notes/{id}", True, "Note updated successfully")
                else:
                    self.log_test("PUT /api/notes/{id}", False, 
                                error=f"Update failed: {updated}")
                
                # Test DELETE note
                success4, deleted = self.test_endpoint('DELETE', f'notes/{note_id}', 200)
                self.log_test("DELETE /api/notes/{id}", success4,
                            "Note deleted" if success4 else "",
                            deleted.get('error', '') if not success4 else '')
            else:
                self.log_test("POST /api/notes", False, 
                            error=f"Failed to create note: {created}")
        else:
            self.log_test("GET /api/notes", False, 
                        error=f"Invalid response: {notes}")

    def test_weather_api(self):
        """Test weather API endpoints"""
        print("🌤️ Testing Weather API...")
        
        # Test weather for Osaka
        success, weather = self.test_endpoint('GET', 'weather/Osaka', 200)
        if success:
            if 'error' in weather:
                self.log_test("GET /api/weather/Osaka", False,
                            error=f"Weather service error: {weather['error']}")
            elif 'current_weather' in weather:
                temp = weather.get('current_weather', {}).get('temperature', 'N/A')
                self.log_test("GET /api/weather/Osaka", True, 
                            f"Weather data retrieved, current temp: {temp}°C")
            else:
                self.log_test("GET /api/weather/Osaka", False,
                            error=f"Unexpected weather response format: {weather}")
        else:
            self.log_test("GET /api/weather/Osaka", False, 
                        error=f"Failed to get weather: {weather}")
        
        # Test invalid city
        success2, weather2 = self.test_endpoint('GET', 'weather/InvalidCity', 404)
        self.log_test("GET /api/weather/InvalidCity", success2,
                    "Correctly returned 404 for invalid city" if success2 else "",
                    weather2.get('error', '') if not success2 else '')

    def test_conversions_api(self):
        """Test currency conversion endpoints"""
        print("💱 Testing Currency Conversions API...")
        
        # Test GET conversions
        success, conversions = self.test_endpoint('GET', 'conversions', 200)
        if success and isinstance(conversions, list):
            self.log_test("GET /api/conversions", True, 
                        f"Retrieved {len(conversions)} conversions")
            
            # Test CREATE conversion
            new_conversion = {
                "from_amount": 1000.0,
                "to_amount": 560.0,
                "rate": 0.56
            }
            
            success2, created = self.test_endpoint('POST', 'conversions', 200, new_conversion)
            if success2 and 'id' in created:
                self.log_test("POST /api/conversions", True, 
                            f"Created conversion ID: {created['id']}")
            else:
                self.log_test("POST /api/conversions", False,
                            error=f"Failed to create conversion: {created}")
        else:
            self.log_test("GET /api/conversions", False, 
                        error=f"Invalid response: {conversions}")

    def test_export_import_api(self):
        """Test data export/import functionality"""
        print("📦 Testing Export/Import API...")
        
        # Test export
        success, export_data = self.test_endpoint('GET', 'export', 200)
        if success and isinstance(export_data, dict):
            expected_keys = ['activities', 'expenses', 'packing_items', 'notes', 'settings', 'conversions']
            missing_keys = [k for k in expected_keys if k not in export_data]
            if missing_keys:
                self.log_test("GET /api/export", False,
                            error=f"Missing export keys: {missing_keys}")
            else:
                self.log_test("GET /api/export", True, 
                            f"Export successful with keys: {list(export_data.keys())}")
                
                # Test import with the exported data
                success2, import_result = self.test_endpoint('POST', 'import', 200, export_data)
                self.log_test("POST /api/import", success2,
                            "Data import successful" if success2 else "",
                            import_result.get('error', '') if not success2 else '')
        else:
            self.log_test("GET /api/export", False, 
                        error=f"Invalid export response: {export_data}")

    def test_ics_calendar_api(self):
        """Test ICS calendar generation"""
        print("📅 Testing ICS Calendar API...")
        
        # Test ICS generation
        url = f"{self.api_url}/ics"
        try:
            response = requests.get(url, timeout=10)
            success = response.status_code == 200
            if success:
                content_type = response.headers.get('content-type', '')
                if 'calendar' in content_type.lower() or response.text.startswith('BEGIN:VCALENDAR'):
                    self.log_test("GET /api/ics", True, 
                                f"ICS calendar generated, size: {len(response.text)} chars")
                else:
                    self.log_test("GET /api/ics", False,
                                error=f"Invalid content type: {content_type}")
            else:
                self.log_test("GET /api/ics", False,
                            error=f"Expected 200, got {response.status_code}")
        except Exception as e:
            self.log_test("GET /api/ics", False, error=f"Request failed: {str(e)}")

    def run_all_tests(self):
        """Run comprehensive backend API tests"""
        print(f"🚀 Starting Tabi Backend API Tests")
        print(f"📡 Backend URL: {self.base_url}")
        print(f"🔗 API Endpoint: {self.api_url}")
        print("="*60)
        
        # Run all test suites
        self.test_settings_api()
        self.test_activities_api() 
        self.test_expenses_api()
        self.test_packing_items_api()
        self.test_notes_api()
        self.test_weather_api()
        self.test_conversions_api()
        self.test_export_import_api()
        self.test_ics_calendar_api()
        
        # Print final results
        print("="*60)
        print(f"🏁 BACKEND API TEST SUMMARY")
        print(f"✅ Tests Passed: {self.tests_passed}/{self.tests_run}")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📊 Success Rate: {success_rate:.1f}%")
        
        if self.errors:
            print(f"\n❌ FAILED TESTS:")
            for error in self.errors:
                print(f"   - {error['test']}: {error['error']}")
        
        return self.tests_passed == self.tests_run

if __name__ == "__main__":
    tester = TabiAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)