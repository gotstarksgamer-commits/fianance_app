from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
import sqlite3
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import json
import math
import ollama
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# SQLite database setup
DATABASE_PATH = ROOT_DIR / 'finance_tracker.db'

def init_database():
    """Initialize SQLite database with required tables"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Users table (for future multi-user support)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Loans table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS loans (
            id TEXT PRIMARY KEY,
            user_id TEXT DEFAULT 'default_user',
            loan_type TEXT NOT NULL,
            principal_amount REAL NOT NULL,
            interest_rate REAL NOT NULL,
            tenure_months INTEGER NOT NULL,
            emi_amount REAL NOT NULL,
            total_interest REAL NOT NULL,
            total_amount REAL NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Expenses table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS expenses (
            id TEXT PRIMARY KEY,
            user_id TEXT DEFAULT 'default_user',
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            subcategory TEXT,
            description TEXT,
            date DATE NOT NULL,
            receipt_path TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Income table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS income (
            id TEXT PRIMARY KEY,
            user_id TEXT DEFAULT 'default_user',
            amount REAL NOT NULL,
            source TEXT NOT NULL,
            description TEXT,
            date DATE NOT NULL,
            is_recurring BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Budgets table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS budgets (
            id TEXT PRIMARY KEY,
            user_id TEXT DEFAULT 'default_user',
            category TEXT NOT NULL,
            monthly_limit REAL NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Savings goals table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS savings_goals (
            id TEXT PRIMARY KEY,
            user_id TEXT DEFAULT 'default_user',
            goal_name TEXT NOT NULL,
            target_amount REAL NOT NULL,
            current_amount REAL DEFAULT 0,
            target_date DATE,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Investments table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS investments (
            id TEXT PRIMARY KEY,
            user_id TEXT DEFAULT 'default_user',
            investment_type TEXT NOT NULL,
            name TEXT NOT NULL,
            amount REAL NOT NULL,
            date DATE NOT NULL,
            maturity_date DATE,
            interest_rate REAL,
            is_recurring BOOLEAN DEFAULT FALSE,
            frequency TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Recurring transactions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS recurring_transactions (
            id TEXT PRIMARY KEY,
            user_id TEXT DEFAULT 'default_user',
            transaction_type TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            frequency TEXT NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE,
            is_active BOOLEAN DEFAULT TRUE,
            last_executed DATE,
            next_due_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Receipts table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS receipts (
            id TEXT PRIMARY KEY,
            expense_id TEXT,
            file_name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_size INTEGER,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (expense_id) REFERENCES expenses (id)
        )
    ''')
    
    # Create default user if not exists
    cursor.execute('''
        INSERT OR IGNORE INTO users (id, name, email) 
        VALUES ('default_user', 'Default User', 'user@example.com')
    ''')
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_database()

# Create the main app without a prefix
app = FastAPI(
    title="Personal Finance Tracker",
    description="Privacy-first personal finance management with local AI",
    version="1.0.0"
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Pydantic Models
class LoanCalculationRequest(BaseModel):
    loan_type: str  # "home", "car", "personal"
    principal_amount: float
    interest_rate: float  # Annual percentage rate
    tenure_months: int

class LoanCalculationResponse(BaseModel):
    id: str
    loan_type: str
    principal_amount: float
    interest_rate: float
    tenure_months: int
    emi_amount: float
    total_interest: float
    total_amount: float
    amortization_schedule: Optional[List[dict]] = None

class ExpenseCreate(BaseModel):
    amount: float
    category: str
    subcategory: Optional[str] = None
    description: Optional[str] = None
    date: str  # Format: YYYY-MM-DD

class ExpenseResponse(BaseModel):
    id: str
    amount: float
    category: str
    subcategory: Optional[str] = None
    description: Optional[str] = None
    date: str
    receipt_path: Optional[str] = None
    created_at: str

class DashboardResponse(BaseModel):
    total_expenses: float
    total_income: float
    monthly_expenses: dict
    category_breakdown: dict
    recent_transactions: List[dict]

class AIAnalysisRequest(BaseModel):
    query: str
    context: Optional[str] = None
    analysis_type: str = "general"  # general, investment, budget, debt, savings

class AIAnalysisResponse(BaseModel):
    analysis: str
    recommendations: List[str]
    confidence: float = 0.85
    analysis_type: str

class IncomeCreate(BaseModel):
    amount: float
    source: str
    description: Optional[str] = None
    date: str  # Format: YYYY-MM-DD
    is_recurring: bool = False
    frequency: Optional[str] = None  # monthly, weekly, yearly

class IncomeResponse(BaseModel):
    id: str
    amount: float
    source: str
    description: Optional[str] = None
    date: str
    is_recurring: bool
    frequency: Optional[str] = None
    created_at: str

class SavingsGoalCreate(BaseModel):
    goal_name: str
    target_amount: float
    current_amount: float = 0
    target_date: Optional[str] = None
    description: Optional[str] = None

class SavingsGoalResponse(BaseModel):
    id: str
    goal_name: str
    target_amount: float
    current_amount: float
    target_date: Optional[str] = None
    description: Optional[str] = None
    progress_percentage: float
    created_at: str

class InvestmentCreate(BaseModel):
    investment_type: str  # SIP, FD, Mutual Fund, Stock, Gold, etc.
    name: str
    amount: float
    date: str
    maturity_date: Optional[str] = None
    interest_rate: Optional[float] = None
    is_recurring: bool = False
    frequency: Optional[str] = None

class InvestmentResponse(BaseModel):
    id: str
    investment_type: str
    name: str
    amount: float
    date: str
    maturity_date: Optional[str] = None
    interest_rate: Optional[float] = None
    is_recurring: bool
    frequency: Optional[str] = None
    created_at: str

class BudgetCreate(BaseModel):
    category: str
    monthly_limit: float
    alert_threshold: float = 80.0  # Alert when 80% of budget is used

class BudgetResponse(BaseModel):
    id: str
    category: str
    monthly_limit: float
    current_spent: float
    remaining: float
    alert_threshold: float
    percentage_used: float
    is_over_budget: bool
    created_at: str

class RecurringTransactionCreate(BaseModel):
    transaction_type: str  # expense, income, investment
    amount: float
    category: str
    description: str
    frequency: str  # monthly, weekly, yearly
    start_date: str
    end_date: Optional[str] = None
    is_active: bool = True

class RecurringTransactionResponse(BaseModel):
    id: str
    transaction_type: str
    amount: float
    category: str
    description: str
    frequency: str
    start_date: str
    end_date: Optional[str] = None
    is_active: bool
    next_due_date: str
    created_at: str

# Utility Functions
def calculate_emi(principal: float, rate: float, tenure: int) -> dict:
    """Calculate EMI and related values"""
    # Convert annual rate to monthly rate
    monthly_rate = rate / (12 * 100)
    
    if monthly_rate == 0:
        emi = principal / tenure
    else:
        # EMI calculation formula
        emi = principal * monthly_rate * (1 + monthly_rate)**tenure / ((1 + monthly_rate)**tenure - 1)
    
    total_amount = emi * tenure
    total_interest = total_amount - principal
    
    return {
        "emi_amount": round(emi, 2),
        "total_interest": round(total_interest, 2),
        "total_amount": round(total_amount, 2)
    }

def generate_amortization_schedule(principal: float, rate: float, tenure: int, emi: float) -> List[dict]:
    """Generate detailed amortization schedule"""
    schedule = []
    remaining_principal = principal
    monthly_rate = rate / (12 * 100)
    
    for month in range(1, tenure + 1):
        interest_payment = remaining_principal * monthly_rate
        principal_payment = emi - interest_payment
        remaining_principal -= principal_payment
        
        # Ensure remaining principal doesn't go negative due to rounding
        if remaining_principal < 0:
            principal_payment += remaining_principal
            remaining_principal = 0
            
        schedule.append({
            "month": month,
            "emi": round(emi, 2),
            "principal_payment": round(principal_payment, 2),
            "interest_payment": round(interest_payment, 2),
            "remaining_principal": round(max(0, remaining_principal), 2)
        })
        
        if remaining_principal <= 0:
            break
    
    return schedule

# Database helper functions
def get_db_connection():
    """Get SQLite database connection"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # This allows us to access columns by name
    return conn

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Personal Finance Tracker API", "version": "1.0.0"}

@api_router.post("/loans/calculate", response_model=LoanCalculationResponse)
async def calculate_loan(request: LoanCalculationRequest):
    """Calculate loan EMI and save to database"""
    try:
        # Calculate EMI
        calculation = calculate_emi(
            request.principal_amount, 
            request.interest_rate, 
            request.tenure_months
        )
        
        # Generate amortization schedule
        schedule = generate_amortization_schedule(
            request.principal_amount,
            request.interest_rate,
            request.tenure_months,
            calculation["emi_amount"]
        )
        
        # Save to database
        loan_id = str(uuid.uuid4())
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO loans (id, loan_type, principal_amount, interest_rate, 
                             tenure_months, emi_amount, total_interest, total_amount)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            loan_id, request.loan_type, request.principal_amount, request.interest_rate,
            request.tenure_months, calculation["emi_amount"], 
            calculation["total_interest"], calculation["total_amount"]
        ))
        
        conn.commit()
        conn.close()
        
        return LoanCalculationResponse(
            id=loan_id,
            loan_type=request.loan_type,
            principal_amount=request.principal_amount,
            interest_rate=request.interest_rate,
            tenure_months=request.tenure_months,
            emi_amount=calculation["emi_amount"],
            total_interest=calculation["total_interest"],
            total_amount=calculation["total_amount"],
            amortization_schedule=schedule
        )
        
    except Exception as e:
        logging.error(f"Error calculating loan: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Loan calculation failed: {str(e)}")

@api_router.get("/loans", response_model=List[LoanCalculationResponse])
async def get_loans():
    """Get all saved loans"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM loans ORDER BY created_at DESC')
        loans = cursor.fetchall()
        conn.close()
        
        result = []
        for loan in loans:
            result.append(LoanCalculationResponse(
                id=loan['id'],
                loan_type=loan['loan_type'],
                principal_amount=loan['principal_amount'],
                interest_rate=loan['interest_rate'],
                tenure_months=loan['tenure_months'],
                emi_amount=loan['emi_amount'],
                total_interest=loan['total_interest'],
                total_amount=loan['total_amount']
            ))
        
        return result
        
    except Exception as e:
        logging.error(f"Error fetching loans: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch loans")

@api_router.post("/expenses", response_model=ExpenseResponse)
async def create_expense(expense: ExpenseCreate):
    """Create a new expense record"""
    try:
        expense_id = str(uuid.uuid4())
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO expenses (id, amount, category, subcategory, description, date)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            expense_id, expense.amount, expense.category, 
            expense.subcategory, expense.description, expense.date
        ))
        
        conn.commit()
        conn.close()
        
        return ExpenseResponse(
            id=expense_id,
            amount=expense.amount,
            category=expense.category,
            subcategory=expense.subcategory,
            description=expense.description,
            date=expense.date,
            created_at=datetime.now(timezone.utc).isoformat()
        )
        
    except Exception as e:
        logging.error(f"Error creating expense: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create expense")

@api_router.get("/expenses", response_model=List[ExpenseResponse])
async def get_expenses():
    """Get all expenses"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM expenses ORDER BY date DESC, created_at DESC')
        expenses = cursor.fetchall()
        conn.close()
        
        result = []
        for expense in expenses:
            result.append(ExpenseResponse(
                id=expense['id'],
                amount=expense['amount'],
                category=expense['category'],
                subcategory=expense['subcategory'],
                description=expense['description'],
                date=expense['date'],
                receipt_path=expense['receipt_path'],
                created_at=expense['created_at']
            ))
        
        return result
        
    except Exception as e:
        logging.error(f"Error fetching expenses: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch expenses")

@api_router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard():
    """Get dashboard data with financial overview"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get total expenses
        cursor.execute('SELECT SUM(amount) as total FROM expenses')
        total_expenses_result = cursor.fetchone()
        total_expenses = total_expenses_result['total'] or 0
        
        # Get total income
        cursor.execute('SELECT SUM(amount) as total FROM income')
        total_income_result = cursor.fetchone()
        total_income = total_income_result['total'] or 0
        
        # Get monthly expenses (current year)
        cursor.execute('''
            SELECT strftime('%Y-%m', date) as month, SUM(amount) as total
            FROM expenses 
            WHERE date >= date('now', 'start of year')
            GROUP BY strftime('%Y-%m', date)
            ORDER BY month
        ''')
        monthly_data = cursor.fetchall()
        monthly_expenses = {row['month']: row['total'] for row in monthly_data}
        
        # Get category breakdown
        cursor.execute('''
            SELECT category, SUM(amount) as total
            FROM expenses
            GROUP BY category
            ORDER BY total DESC
        ''')
        category_data = cursor.fetchall()
        category_breakdown = {row['category']: row['total'] for row in category_data}
        
        # Get recent transactions
        cursor.execute('''
            SELECT category, amount, description, date
            FROM expenses
            ORDER BY created_at DESC
            LIMIT 10
        ''')
        recent_data = cursor.fetchall()
        recent_transactions = []
        for row in recent_data:
            recent_transactions.append({
                "type": "expense",
                "category": row['category'],
                "amount": row['amount'],
                "description": row['description'],
                "date": row['date']
            })
        
        conn.close()
        
        return DashboardResponse(
            total_expenses=total_expenses,
            total_income=total_income,
            monthly_expenses=monthly_expenses,
            category_breakdown=category_breakdown,
            recent_transactions=recent_transactions
        )
        
    except Exception as e:
        logging.error(f"Error fetching dashboard data: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch dashboard data")

@api_router.get("/categories")
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

# AI Integration Endpoints
@api_router.post("/ai/analyze", response_model=AIAnalysisResponse)
async def analyze_financial_data(request: AIAnalysisRequest):
    """Analyze financial data using local Ollama AI"""
    try:
        # Get user's financial data for context
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get summary data
        cursor.execute('SELECT SUM(amount) as total FROM expenses')
        total_expenses = cursor.fetchone()['total'] or 0
        
        cursor.execute('SELECT SUM(amount) as total FROM income')
        total_income = cursor.fetchone()['total'] or 0
        
        cursor.execute('''
            SELECT category, SUM(amount) as total
            FROM expenses
            GROUP BY category
            ORDER BY total DESC
            LIMIT 5
        ''')
        top_categories = cursor.fetchall()
        
        cursor.execute('''
            SELECT loan_type, emi_amount, total_interest
            FROM loans
            ORDER BY created_at DESC
            LIMIT 3
        ''')
        recent_loans = cursor.fetchall()
        
        conn.close()
        
        # Prepare financial context
        financial_context = f"""
        Current Financial Snapshot:
        - Total Expenses: ₹{total_expenses:,.2f}
        - Total Income: ₹{total_income:,.2f}
        - Net Balance: ₹{total_income - total_expenses:,.2f}
        
        Top Expense Categories:
        {chr(10).join([f"- {row['category']}: ₹{row['total']:,.2f}" for row in top_categories])}
        
        Recent Loans:
        {chr(10).join([f"- {row['loan_type'].title()} Loan: EMI ₹{row['emi_amount']:,.2f}, Total Interest ₹{row['total_interest']:,.2f}" for row in recent_loans])}
        """
        
        # Create analysis prompt based on type
        prompts = {
            "general": f"""
            You are a professional financial advisor specialized in personal finance for Indian individuals.
            Analyze the following financial query and provide detailed insights.
            
            Financial Context:
            {financial_context}
            
            User Query: {request.query}
            Additional Context: {request.context or 'None provided'}
            
            Please provide:
            1. Detailed analysis of the financial situation
            2. Specific actionable recommendations (at least 3)
            3. Risk assessment where applicable
            4. Indian context considerations (taxes, investment options, etc.)
            
            Keep your response practical, accurate, and focused on Indian financial products and regulations.
            """,
            
            "investment": f"""
            You are an investment advisor with expertise in Indian financial markets.
            
            Financial Context:
            {financial_context}
            
            Investment Query: {request.query}
            Context: {request.context or 'None provided'}
            
            Provide analysis covering:
            1. Investment viability and risk assessment
            2. Expected returns and timeframe considerations
            3. Diversification recommendations
            4. Indian investment options (Mutual Funds, SIPs, FDs, PPF, ELSS, etc.)
            5. Tax implications (Section 80C, LTCG, STCG)
            
            Focus on Indian investment products and current market conditions.
            """,
            
            "budget": f"""
            You are a budget planning expert for Indian households.
            
            Financial Context:
            {financial_context}
            
            Budget Query: {request.query}
            Context: {request.context or 'None provided'}
            
            Provide budget analysis including:
            1. Income and expense optimization
            2. Spending pattern analysis
            3. Savings opportunities (50-30-20 rule adaptation for India)
            4. Emergency fund recommendations (6-12 months expenses)
            5. Debt management strategies
            6. Indian-specific considerations (festivals, monsoon expenses, etc.)
            """,
            
            "debt": f"""
            You are a debt management specialist familiar with Indian lending practices.
            
            Financial Context:
            {financial_context}
            
            Debt Query: {request.query}
            Context: {request.context or 'None provided'}
            
            Provide debt analysis covering:
            1. Debt consolidation opportunities
            2. EMI optimization strategies
            3. Prepayment vs investment analysis
            4. Credit score improvement tips
            5. Indian banking products for debt management
            6. Priority order for debt repayment
            """,
            
            "savings": f"""
            You are a savings and goal planning expert for Indian families.
            
            Financial Context:
            {financial_context}
            
            Savings Query: {request.query}
            Context: {request.context or 'None provided'}
            
            Provide savings analysis including:
            1. Goal-based savings strategies
            2. Tax-saving instruments (Section 80C, 80D, etc.)
            3. Emergency fund building
            4. Retirement planning (EPF, PPF, NPS)
            5. Children's education and marriage planning
            6. Short-term vs long-term savings allocation
            """
        }
        
        prompt = prompts.get(request.analysis_type, prompts["general"])
        
        # Call Ollama for analysis
        try:
            response = await asyncio.to_thread(
                ollama.chat,
                model='llama3.1',  # Default model, can be configured
                messages=[{
                    'role': 'user',
                    'content': prompt
                }],
                options={
                    'temperature': 0.7,
                    'top_p': 0.9,
                    'max_tokens': 1000
                }
            )
            
            analysis_result = response['message']['content']
            
        except Exception as ollama_error:
            # Fallback if Ollama is not available
            logging.warning(f"Ollama not available: {str(ollama_error)}")
            analysis_result = f"""
            I apologize, but the AI analysis service is currently unavailable. 
            However, based on your query about '{request.query}', here are some general recommendations:
            
            For your financial situation with ₹{total_expenses:,.2f} in expenses and ₹{total_income:,.2f} in income:
            
            1. **Budget Analysis**: Your current net balance is ₹{total_income - total_expenses:,.2f}
            2. **Expense Management**: Consider reviewing your top spending categories
            3. **Emergency Fund**: Aim to save 6-12 months of expenses
            4. **Investment Planning**: Consider SIPs in mutual funds for long-term growth
            5. **Tax Planning**: Utilize Section 80C deductions
            
            Please ensure Ollama is installed and running for detailed AI-powered analysis.
            """
        
        # Extract recommendations from the analysis
        recommendations = extract_recommendations_from_analysis(analysis_result)
        
        return AIAnalysisResponse(
            analysis=analysis_result,
            recommendations=recommendations,
            confidence=0.85,
            analysis_type=request.analysis_type
        )
        
    except Exception as e:
        logging.error(f"Error in AI analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

@api_router.get("/ai/models")
async def get_available_models():
    """Get available Ollama models"""
    try:
        models = await asyncio.to_thread(ollama.list)
        return {
            "available_models": [model['name'] for model in models['models']],
            "total_models": len(models['models']),
            "status": "operational"
        }
    except Exception as e:
        return {
            "error": f"Failed to retrieve model status: {str(e)}",
            "status": "error",
            "available_models": [],
            "total_models": 0,
            "message": "Please ensure Ollama is installed and running"
        }

def extract_recommendations_from_analysis(analysis_text: str) -> List[str]:
    """Extract actionable recommendations from AI analysis"""
    recommendations = []
    lines = analysis_text.split('\n')
    
    # Look for numbered recommendations or bullet points
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Check for recommendations patterns
        recommendation_keywords = [
            'recommend', 'suggest', 'should', 'consider', 'try', 'start',
            'focus on', 'prioritize', 'invest in', 'save', 'reduce', 'increase'
        ]
        
        # Check if line contains recommendation keywords
        if any(keyword in line.lower() for keyword in recommendation_keywords):
            # Clean up the line
            if line.startswith(('1.', '2.', '3.', '4.', '5.', '-', '•', '*')):
                line = line[2:].strip()
            elif line.startswith(('**', '__')):
                # Extract text from markdown formatting
                import re
                line = re.sub(r'\*\*(.*?)\*\*', r'\1', line)
                line = re.sub(r'__(.*?)__', r'\1', line)
            
            if len(line) > 20 and len(recommendations) < 5:  # Reasonable length and max 5 recommendations
                recommendations.append(line)
    
    # If no recommendations found, try to extract from numbered lists
    if not recommendations:
        import re
        numbered_pattern = r'^\d+\.\s*(.*)'
        for line in lines:
            match = re.match(numbered_pattern, line.strip())
            if match and len(recommendations) < 5:
                recommendation = match.group(1).strip()
                if len(recommendation) > 20:
                    recommendations.append(recommendation)
    
    # Fallback: provide generic recommendations
    if not recommendations:
        recommendations = [
            "Review and optimize your monthly budget allocation",
            "Build an emergency fund covering 6-12 months of expenses",
            "Consider investing in diversified mutual funds through SIPs",
            "Maximize tax-saving investments under Section 80C",
            "Regularly monitor and adjust your financial goals"
        ]
    
    return recommendations[:5]  # Return max 5 recommendations

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)