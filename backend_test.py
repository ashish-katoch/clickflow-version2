import requests
import sys
import json
from datetime import datetime, timezone

class ClickFlowAPITester:
    def __init__(self, base_url="https://workflow-hub-425.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.project_id = None
        self.task_id = None
        self.goal_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers, params=params)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_auth_flow(self):
        """Test complete authentication flow"""
        print("\n=== AUTHENTICATION TESTS ===")
        
        # Test login with admin credentials
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@clickflow.com", "password": "admin123"}
        )
        if success and response.get('id'):
            self.user_id = response['id']
            print(f"   Admin user ID: {self.user_id}")
        
        # Test get current user
        self.run_test("Get Current User", "GET", "auth/me", 200)
        
        # Test register new user
        test_email = f"test_{datetime.now().strftime('%H%M%S')}@test.com"
        success, response = self.run_test(
            "Register New User",
            "POST",
            "auth/register",
            200,
            data={"email": test_email, "password": "testpass123", "name": "Test User"}
        )
        
        # Test logout
        self.run_test("Logout", "POST", "auth/logout", 200)
        
        # Login back as admin for other tests
        success, response = self.run_test(
            "Re-login as Admin",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@clickflow.com", "password": "admin123"}
        )

    def test_projects(self):
        """Test project CRUD operations"""
        print("\n=== PROJECT TESTS ===")
        
        # Get projects
        self.run_test("Get Projects", "GET", "projects", 200)
        
        # Create project
        success, response = self.run_test(
            "Create Project",
            "POST",
            "projects",
            200,
            data={"name": "Test Project", "description": "Test project description", "color": "#ff6b6b"}
        )
        if success and response.get('id'):
            self.project_id = response['id']
            print(f"   Created project ID: {self.project_id}")
        
        # Update project
        if self.project_id:
            self.run_test(
                "Update Project",
                "PUT",
                f"projects/{self.project_id}",
                200,
                data={"name": "Updated Test Project", "description": "Updated description", "color": "#4ecdc4"}
            )

    def test_tasks(self):
        """Test task CRUD operations"""
        print("\n=== TASK TESTS ===")
        
        if not self.project_id:
            print("❌ Skipping task tests - no project ID available")
            return
        
        # Get tasks
        self.run_test("Get Tasks", "GET", "tasks", 200, params={"project_id": self.project_id})
        
        # Create task
        success, response = self.run_test(
            "Create Task",
            "POST",
            "tasks",
            200,
            data={
                "title": "Test Task",
                "description": "Test task description",
                "status": "todo",
                "priority": "high",
                "due_date": "2024-12-31T23:59:59Z",
                "tags": ["test", "api"]
            },
            params={"project_id": self.project_id}
        )
        if success and response.get('id'):
            self.task_id = response['id']
            print(f"   Created task ID: {self.task_id}")
        
        # Update task
        if self.task_id:
            self.run_test(
                "Update Task",
                "PUT",
                f"tasks/{self.task_id}",
                200,
                data={"status": "in_progress", "priority": "medium"}
            )
        
        # Create subtask
        if self.task_id:
            self.run_test(
                "Create Subtask",
                "POST",
                "tasks",
                200,
                data={
                    "title": "Test Subtask",
                    "description": "Test subtask description",
                    "parent_task_id": self.task_id
                },
                params={"project_id": self.project_id}
            )

    def test_time_tracking(self):
        """Test time tracking functionality"""
        print("\n=== TIME TRACKING TESTS ===")
        
        if not self.task_id:
            print("❌ Skipping time tracking tests - no task ID available")
            return
        
        # Get time entries
        self.run_test("Get Time Entries", "GET", "time-entries", 200)
        
        # Start timer
        success, response = self.run_test(
            "Start Timer",
            "POST",
            "time-entries/start",
            200,
            data={"task_id": self.task_id, "description": "Working on test task"}
        )
        
        # Get active timer
        self.run_test("Get Active Timer", "GET", "time-entries/active", 200)
        
        # Stop timer
        self.run_test("Stop Timer", "POST", "time-entries/stop", 200)

    def test_goals(self):
        """Test goals CRUD operations"""
        print("\n=== GOALS TESTS ===")
        
        # Get goals
        self.run_test("Get Goals", "GET", "goals", 200)
        
        # Create goal
        success, response = self.run_test(
            "Create Goal",
            "POST",
            "goals",
            200,
            data={
                "title": "Test Goal",
                "description": "Test goal description",
                "target_value": 100,
                "current_value": 25,
                "unit": "percent",
                "due_date": "2024-12-31T23:59:59Z"
            }
        )
        if success and response.get('id'):
            self.goal_id = response['id']
            print(f"   Created goal ID: {self.goal_id}")
        
        # Update goal
        if self.goal_id:
            self.run_test(
                "Update Goal",
                "PUT",
                f"goals/{self.goal_id}",
                200,
                data={
                    "title": "Updated Test Goal",
                    "description": "Updated description",
                    "target_value": 100,
                    "current_value": 50,
                    "unit": "percent"
                }
            )

    def test_dashboard(self):
        """Test dashboard stats"""
        print("\n=== DASHBOARD TESTS ===")
        
        success, response = self.run_test("Get Dashboard Stats", "GET", "dashboard/stats", 200)
        if success:
            required_fields = ['total_tasks', 'total_projects', 'total_goals', 'total_time_today']
            for field in required_fields:
                if field in response:
                    print(f"   ✅ {field}: {response[field]}")
                else:
                    print(f"   ❌ Missing field: {field}")

    def test_members(self):
        """Test members functionality"""
        print("\n=== MEMBERS TESTS ===")
        
        # Get members
        success, response = self.run_test("Get Members", "GET", "members", 200)
        if success and response:
            print(f"   Found {len(response)} members")
            admin_found = any(m.get('role') == 'admin' for m in response)
            if admin_found:
                print("   ✅ Admin user found in members list")
            else:
                print("   ❌ Admin user not found in members list")

    def cleanup(self):
        """Clean up test data"""
        print("\n=== CLEANUP ===")
        
        # Delete test goal
        if self.goal_id:
            self.run_test("Delete Goal", "DELETE", f"goals/{self.goal_id}", 200)
        
        # Delete test task (this will also delete subtasks)
        if self.task_id:
            self.run_test("Delete Task", "DELETE", f"tasks/{self.task_id}", 200)
        
        # Delete test project
        if self.project_id:
            self.run_test("Delete Project", "DELETE", f"projects/{self.project_id}", 200)

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting ClickFlow API Tests")
        print(f"Base URL: {self.base_url}")
        
        try:
            self.test_auth_flow()
            self.test_projects()
            self.test_tasks()
            self.test_time_tracking()
            self.test_goals()
            self.test_dashboard()
            self.test_members()
            self.cleanup()
        except Exception as e:
            print(f"\n❌ Test suite failed with error: {str(e)}")
        
        # Print results
        print(f"\n📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = ClickFlowAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())