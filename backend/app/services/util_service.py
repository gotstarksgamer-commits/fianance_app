

class UtilService:
    @staticmethod
    async def get_categories():
        """Get predefined expense categories"""
        categories = {
            "Food": ["Groceries", "Restaurants", "Takeout", "Coffee", "Dining Out"],
            "Transport": ["Fuel", "Public Transit", "Taxi/Uber", "Parking", "Vehicle Maintenance"],
            "Bills": ["Electricity", "Water", "Internet", "Mobile", "Gas"],
            "Entertainment": ["Movies", "Sports", "Concerts", "Gaming", "Books"],
            "Healthcare": ["Doctor Visits", "Medicines", "Insurance", "Dental", "Fitness"],
            "Education": ["Courses", "Books", "Certification", "Workshops", "Training"],
            "Shopping": ["Clothes", "Electronics", "Home Items", "Gifts", "Personal Care"],
            "Utilities": ["Rent", "Maintenance", "Repairs", "Cleaning", "Security"],
            "Insurance": ["Life Insurance", "Health Insurance", "Vehicle Insurance", "Home Insurance"],
            "Investments": ["Mutual Funds", "Stocks", "Fixed Deposits", "SIP", "Gold"],
            "Debt Payments": ["EMI", "Credit Card", "Personal Loan", "Other Loans"],
            "Personal Care": ["Salon", "Spa", "Grooming", "Cosmetics", "Health Supplements"],
            "Home Maintenance": ["Repairs", "Cleaning Supplies", "Garden", "Furniture", "Appliances"],
            "Travel": ["Flights", "Hotels", "Local Transport", "Food", "Sightseeing"],
            "Gifts": ["Birthday", "Anniversary", "Festival", "Wedding", "Charity"],
            "Miscellaneous": ["ATM Charges", "Bank Fees", "Others", "Emergency", "Unexpected"]
        }
    
        return {"categories": categories}