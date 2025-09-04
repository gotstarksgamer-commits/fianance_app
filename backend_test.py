import requests
import sys
import json
from datetime import datetime

class PersonalFinanceAPITester:
    def __init__(self, base_url="https://privacent.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, validate_response=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}" if endpoint else self.base_url
        headers = {'Content-Type': 'application/json'}

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            else:
                self.log_test(name, False, f"Unsupported method: {method}")
                return False, {}

            print(f"   Status Code: {response.status_code}")
            
            # Check status code
            if response.status_code != expected_status:
                self.log_test(name, False, f"Expected status {expected_status}, got {response.status_code}")
                return False, {}

            # Try to parse JSON response
            try:
                response_data = response.json()
                print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
            except:
                response_data = {}
                if expected_status == 200:
                    self.log_test(name, False, "Invalid JSON response")
                    return False, {}

            # Custom validation if provided
            if validate_response and not validate_response(response_data):
                self.log_test(name, False, "Response validation failed")
                return False, response_data

            self.log_test(name, True)
            return True, response_data

        except requests.exceptions.RequestException as e:
            self.log_test(name, False, f"Request error: {str(e)}")
            return False, {}
        except Exception as e:
            self.log_test(name, False, f"Unexpected error: {str(e)}")
            return False, {}

    def test_api_health(self):
        """Test basic API health check"""
        def validate_health(data):
            return "message" in data and "version" in data
        
        return self.run_test(
            "API Health Check",
            "GET",
            "",
            200,
            validate_response=validate_health
        )

    def test_categories_endpoint(self):
        """Test categories endpoint"""
        def validate_categories(data):
            return "categories" in data and isinstance(data["categories"], dict)
        
        return self.run_test(
            "Get Categories",
            "GET", 
            "categories",
            200,
            validate_response=validate_categories
        )

    def test_loan_calculation_accuracy(self):
        """Test the specific EMI calculation mentioned in requirements"""
        # Test case: ₹20,00,000 home loan at 9% for 240 months should give EMI around ₹17,994
        loan_data = {
            "loan_type": "home",
            "principal_amount": 2000000,  # 20 lakh
            "interest_rate": 9.0,         # 9%
            "tenure_months": 240          # 20 years
        }
        
        def validate_emi_calculation(data):
            expected_emi = 17994  # Expected EMI around ₹17,994
            actual_emi = data.get("emi_amount", 0)
            
            # Allow 1% tolerance for rounding differences
            tolerance = expected_emi * 0.01
            is_accurate = abs(actual_emi - expected_emi) <= tolerance
            
            print(f"   Expected EMI: ₹{expected_emi}")
            print(f"   Calculated EMI: ₹{actual_emi}")
            print(f"   Difference: ₹{abs(actual_emi - expected_emi)}")
            print(f"   Within tolerance: {is_accurate}")
            
            # Also validate other required fields
            required_fields = ["id", "loan_type", "principal_amount", "interest_rate", 
                             "tenure_months", "emi_amount", "total_interest", "total_amount"]
            
            return is_accurate and all(field in data for field in required_fields)
        
        return self.run_test(
            "Loan EMI Calculation Accuracy",
            "POST",
            "loans/calculate", 
            200,
            data=loan_data,
            validate_response=validate_emi_calculation
        )

    def test_loan_calculation_edge_cases(self):
        """Test loan calculation with edge cases"""
        edge_cases = [
            {
                "name": "Zero Interest Rate",
                "data": {
                    "loan_type": "personal",
                    "principal_amount": 100000,
                    "interest_rate": 0.0,
                    "tenure_months": 12
                }
            },
            {
                "name": "Very High Interest Rate", 
                "data": {
                    "loan_type": "personal",
                    "principal_amount": 50000,
                    "interest_rate": 36.0,
                    "tenure_months": 24
                }
            },
            {
                "name": "Large Loan Amount",
                "data": {
                    "loan_type": "home",
                    "principal_amount": 50000000,  # 5 crore
                    "interest_rate": 8.5,
                    "tenure_months": 360
                }
            }
        ]
        
        results = []
        for case in edge_cases:
            def validate_edge_case(data):
                return (data.get("emi_amount", 0) > 0 and 
                       data.get("total_amount", 0) > 0 and
                       data.get("total_interest", 0) >= 0)
            
            success, _ = self.run_test(
                f"Edge Case: {case['name']}",
                "POST",
                "loans/calculate",
                200,
                data=case["data"],
                validate_response=validate_edge_case
            )
            results.append(success)
        
        return all(results)

    def test_get_loans(self):
        """Test getting saved loans"""
        def validate_loans_list(data):
            return isinstance(data, list)
        
        return self.run_test(
            "Get Saved Loans",
            "GET",
            "loans",
            200,
            validate_response=validate_loans_list
        )

    def test_expense_creation(self):
        """Test expense creation"""
        expense_data = {
            "amount": 500.0,
            "category": "Food",
            "subcategory": "Groceries", 
            "description": "Weekly grocery shopping",
            "date": "2024-01-15"
        }
        
        def validate_expense_creation(data):
            required_fields = ["id", "amount", "category", "date", "created_at"]
            return all(field in data for field in required_fields)
        
        return self.run_test(
            "Create Expense",
            "POST",
            "expenses",
            200,
            data=expense_data,
            validate_response=validate_expense_creation
        )

    def test_get_expenses(self):
        """Test getting expenses"""
        def validate_expenses_list(data):
            return isinstance(data, list)
        
        return self.run_test(
            "Get Expenses",
            "GET", 
            "expenses",
            200,
            validate_response=validate_expenses_list
        )

    def test_dashboard_data(self):
        """Test dashboard endpoint"""
        def validate_dashboard(data):
            required_fields = ["total_expenses", "total_income", "monthly_expenses", 
                             "category_breakdown", "recent_transactions"]
            return all(field in data for field in required_fields)
        
        return self.run_test(
            "Get Dashboard Data",
            "GET",
            "dashboard", 
            200,
            validate_response=validate_dashboard
        )

    def test_invalid_requests(self):
        """Test error handling for invalid requests"""
        # Test invalid loan calculation
        invalid_loan_data = {
            "loan_type": "invalid_type",
            "principal_amount": -1000,  # Negative amount
            "interest_rate": -5,        # Negative rate
            "tenure_months": 0          # Zero tenure
        }
        
        success, _ = self.run_test(
            "Invalid Loan Data Handling",
            "POST",
            "loans/calculate",
            500,  # Expecting error
            data=invalid_loan_data
        )
        
        # Test invalid expense data
        invalid_expense_data = {
            "amount": "invalid_amount",  # String instead of number
            "category": "",              # Empty category
            "date": "invalid_date"       # Invalid date format
        }
        
        success2, _ = self.run_test(
            "Invalid Expense Data Handling", 
            "POST",
            "expenses",
            422,  # Expecting validation error
            data=invalid_expense_data
        )
        
        return success and success2

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Personal Finance Tracker Backend API Tests")
        print("=" * 60)
        
        # Basic connectivity tests
        self.test_api_health()
        self.test_categories_endpoint()
        
        # Loan calculation tests
        self.test_loan_calculation_accuracy()
        self.test_loan_calculation_edge_cases()
        self.test_get_loans()
        
        # Expense tests
        self.test_expense_creation()
        self.test_get_expenses()
        
        # Dashboard tests
        self.test_dashboard_data()
        
        # Error handling tests
        self.test_invalid_requests()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Print failed tests
        failed_tests = [test for test in self.test_results if not test["success"]]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   • {test['name']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = PersonalFinanceAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())