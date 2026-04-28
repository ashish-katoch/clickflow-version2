import requests
import sys
import json
from datetime import datetime, timezone

class ClickFlowV3APITester:
    def __init__(self, base_url="https://workflow-hub-425.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.project_id = None
        self.task_id = None
        self.bug_id = None
        self.comment_id = None

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

    def test_health(self):
        """Test health endpoint - should return v3.0"""
        print("\n=== HEALTH CHECK ===")
        
        success, response = self.run_test("Health Check", "GET", "health", 200)
        if success:
            if response.get('version') == '3.0':
                print("   ✅ Version 3.0 confirmed")
            else:
                print(f"   ❌ Expected version 3.0, got {response.get('version')}")
            if response.get('status') == 'ok':
                print("   ✅ Status OK")
            else:
                print(f"   ❌ Expected status 'ok', got {response.get('status')}")

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
            data={"name": "Test Project", "key": "TST", "description": "Test project description", "color": "#6366f1"}
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
                data={"name": "Updated Test Project", "description": "Updated description"}
            )

    def test_tasks(self):
        """Test task CRUD operations"""
        print("\n=== TASK TESTS ===")
        
        if not self.project_id:
            print("❌ Skipping task tests - no project ID available")
            return
        
        # Get tasks for project
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
                "status": "backlog",
                "priority": "high",
                "assignee_id": self.user_id,
                "due_date": "2024-12-31"
            },
            params={"project_id": self.project_id}
        )
        if success and response.get('id'):
            self.task_id = response['id']
            print(f"   Created task ID: {self.task_id}")
            print(f"   Task key: {response.get('key')}")
        
        # Update task
        if self.task_id:
            self.run_test(
                "Update Task",
                "PUT",
                f"tasks/{self.task_id}",
                200,
                data={"status": "in_progress", "priority": "medium"}
            )
        
        # Test My Tasks endpoint
        self.run_test("Get My Tasks", "GET", "tasks/my", 200)

    def test_bugs(self):
        """Test bug CRUD operations"""
        print("\n=== BUG TESTS ===")
        
        if not self.project_id:
            print("❌ Skipping bug tests - no project ID available")
            return
        
        # Get bugs for project
        self.run_test("Get Bugs", "GET", "bugs", 200, params={"project_id": self.project_id})
        
        # Create bug
        success, response = self.run_test(
            "Create Bug",
            "POST",
            "bugs",
            200,
            data={
                "title": "Test Bug",
                "description": "Test bug description",
                "status": "open",
                "priority": "high",
                "assignee_id": self.user_id
            },
            params={"project_id": self.project_id}
        )
        if success and response.get('id'):
            self.bug_id = response['id']
            print(f"   Created bug ID: {self.bug_id}")
            print(f"   Bug key: {response.get('key')}")
        
        # Update bug status through lifecycle
        if self.bug_id:
            statuses = ["in_progress", "ready_for_qa", "verified", "closed"]
            for status in statuses:
                self.run_test(
                    f"Update Bug Status to {status}",
                    "PUT",
                    f"bugs/{self.bug_id}",
                    200,
                    data={"status": status}
                )
        
        # Test All Bugs endpoint
        self.run_test("Get All Bugs", "GET", "bugs/all", 200)

    def test_comments(self):
        """Test comments functionality with entity_id and entity_type"""
        print("\n=== COMMENTS TESTS ===")
        
        if not self.task_id:
            print("❌ Skipping comments tests - no task ID available")
            return
        
        # Get comments for task
        self.run_test("Get Task Comments", "GET", "comments", 200, params={"entity_id": self.task_id, "entity_type": "task"})
        
        # Create comment on task
        success, response = self.run_test(
            "Create Task Comment",
            "POST",
            "comments",
            200,
            data={
                "entity_id": self.task_id,
                "entity_type": "task",
                "content": "This is a test comment on a task"
            }
        )
        if success and response.get('id'):
            self.comment_id = response['id']
            print(f"   Created comment ID: {self.comment_id}")
        
        # Test comments on bug if available
        if self.bug_id:
            self.run_test("Get Bug Comments", "GET", "comments", 200, params={"entity_id": self.bug_id, "entity_type": "bug"})
            
            self.run_test(
                "Create Bug Comment",
                "POST",
                "comments",
                200,
                data={
                    "entity_id": self.bug_id,
                    "entity_type": "bug",
                    "content": "This is a test comment on a bug"
                }
            )

    def test_notifications(self):
        """Test notifications functionality"""
        print("\n=== NOTIFICATIONS TESTS ===")
        
        # Get notifications
        self.run_test("Get Notifications", "GET", "notifications", 200)
        
        # Get unread count
        success, response = self.run_test("Get Unread Count", "GET", "notifications/unread-count", 200)
        if success:
            print(f"   Unread notifications: {response.get('count', 0)}")
        
        # Mark all as read
        self.run_test("Mark All Read", "POST", "notifications/mark-read", 200)

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
        
        # Delete test comment
        if self.comment_id:
            self.run_test("Delete Comment", "DELETE", f"comments/{self.comment_id}", 200)
        
        # Delete test bug
        if self.bug_id:
            self.run_test("Delete Bug", "DELETE", f"bugs/{self.bug_id}", 200)
        
        # Delete test task
        if self.task_id:
            self.run_test("Delete Task", "DELETE", f"tasks/{self.task_id}", 200)
        
        # Delete test project
        if self.project_id:
            self.run_test("Delete Project", "DELETE", f"projects/{self.project_id}", 200)

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting ClickFlow v3.0 API Tests")
        print(f"Base URL: {self.base_url}")
        
        try:
            self.test_health()
            self.test_auth_flow()
            self.test_projects()
            self.test_tasks()
            self.test_bugs()
            self.test_comments()
            self.test_notifications()
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
    tester = ClickFlowV3APITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())