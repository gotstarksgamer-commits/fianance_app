from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Depends, status
from fastapi.responses import FileResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
import sqlite3
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import json
import math
import ollama
import asyncio
import bcrypt
import jwt
from functools import wraps

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# SQLite database setup
DATABASE_PATH = ROOT_DIR / 'finance_tracker.db'

def init_database():
    """Initialize SQLite database with required tables"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Users table (updated for authentication)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            is_verified BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Refresh tokens table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS refresh_tokens (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            token_hash TEXT NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            is_revoked BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')
    
    # Loans table (remove default user_id)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS loans (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            loan_type TEXT NOT NULL,
            principal_amount REAL NOT NULL,
            interest_rate REAL NOT NULL,
            tenure_months INTEGER NOT NULL,
            emi_amount REAL NOT NULL,
            total_interest REAL NOT NULL,
            total_amount REAL NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')
    
    # Expenses table (remove default user_id)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS expenses (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            subcategory TEXT,
            description TEXT,
            date DATE NOT NULL,
            receipt_path TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')
    
    # Income table (remove default user_id)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS income (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            amount REAL NOT NULL,
            source TEXT NOT NULL,
            description TEXT,
            date DATE NOT NULL,
            is_recurring BOOLEAN DEFAULT FALSE,
            frequency TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')
    
    # Budgets table (remove default user_id)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS budgets (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            category TEXT NOT NULL,
            monthly_limit REAL NOT NULL,
            alert_threshold REAL DEFAULT 80.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            UNIQUE(user_id, category)
        )
    ''')
    
    # Savings goals table (remove default user_id)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS savings_goals (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            goal_name TEXT NOT NULL,
            target_amount REAL NOT NULL,
            current_amount REAL DEFAULT 0,
            target_date DATE,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')
    
    # Investments table (remove default user_id)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS investments (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            investment_type TEXT NOT NULL,
            name TEXT NOT NULL,
            amount REAL NOT NULL,
            date DATE NOT NULL,
            maturity_date DATE,
            interest_rate REAL,
            is_recurring BOOLEAN DEFAULT FALSE,
            frequency TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')
    
    # Recurring transactions table (remove default user_id)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS recurring_transactions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
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
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
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
            FOREIGN KEY (expense_id) REFERENCES expenses (id) ON DELETE CASCADE
        )
    ''')
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_database()

# Security setup
security = HTTPBearer()

# Password utilities
class PasswordUtils:
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password using bcrypt"""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

# JWT utilities
class JWTUtils:
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
        """Create access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire, "type": "access"})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None):
        """Create refresh token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        
        to_encode.update({"exp": expire, "type": "refresh"})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def decode_token(token: str):
        """Decode and validate token"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )

# User authentication dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user"""
    token = credentials.credentials
    payload = JWTUtils.decode_token(token)
    
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    # Verify user exists and is active
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ? AND is_active = 1", (user_id,))
    user = cursor.fetchone()
    conn.close()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "is_active": user["is_active"],
        "is_verified": user["is_verified"]
    }

# Create the main app
app = FastAPI(
    title="Personal Finance Tracker",
    description="Privacy-first personal finance management with local AI and user management",
    version="2.0.0"
)

# Create routers
auth_router = APIRouter(prefix="/api/auth", tags=["Authentication"])
api_router = APIRouter(prefix="/api", tags=["Finance API"])

# Pydantic Models for Authentication
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    is_active: bool
    is_verified: bool
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)

# Updated Pydantic Models (existing models remain the same)
class LoanCalculationRequest(BaseModel):
    loan_type: str
    principal_amount: float
    interest_rate: float
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
    date: str

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
    analysis_type: str = "general"

class AIAnalysisResponse(BaseModel):
    analysis: str
    recommendations: List[str]
    confidence: float = 0.85
    analysis_type: str

class IncomeCreate(BaseModel):
    amount: float
    source: str
    description: Optional[str] = None
    date: str
    is_recurring: bool = False
    frequency: Optional[str] = None

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
    investment_type: str
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
    alert_threshold: float = 80.0

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
# Pydantic Models for Update Operations
class UpdateIncome(BaseModel):
    source: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[str] = None
    notes: Optional[str] = None

class UpdateExpense(BaseModel):
    category: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[str] = None
    description: Optional[str] = None

class UpdateInvestment(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[str] = None
    notes: Optional[str] = None
    
class UpdateBudget(BaseModel):
    category: Optional[str] = None
    amount: Optional[float] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class UpdateSavingsGoal(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    target_date: Optional[str] = None
    notes: Optional[str] = None

# Database helper functions
def get_db_connection():
    """Get SQLite database connection"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Utility Functions (keep existing ones)
def calculate_emi(principal: float, rate: float, tenure: int) -> dict:
    """Calculate EMI and related values"""
    monthly_rate = rate / (12 * 100)
    
    if monthly_rate == 0:
        emi = principal / tenure
    else:
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

# Authentication Routes
@auth_router.post("/register", response_model=TokenResponse)
async def register_user(user_data: UserRegister):
    """Register a new user"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user already exists
        cursor.execute("SELECT id FROM users WHERE email = ?", (user_data.email,))
        if cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create new user
        user_id = str(uuid.uuid4())
        password_hash = PasswordUtils.hash_password(user_data.password)
        
        cursor.execute('''
            INSERT INTO users (id, name, email, password_hash)
            VALUES (?, ?, ?, ?)
        ''', (user_id, user_data.name, user_data.email, password_hash))
        
        conn.commit()
        
        # Get created user
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        conn.close()
        
        # Create tokens
        access_token = JWTUtils.create_access_token(data={"sub": user_id})
        refresh_token = JWTUtils.create_refresh_token(data={"sub": user_id})
        
        # Store refresh token
        conn = get_db_connection()
        cursor = conn.cursor()
        token_id = str(uuid.uuid4())
        token_hash = PasswordUtils.hash_password(refresh_token)
        expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        
        cursor.execute('''
            INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
            VALUES (?, ?, ?, ?)
        ''', (token_id, user_id, token_hash, expires_at))
        
        conn.commit()
        conn.close()
        
        user_response = UserResponse(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            is_active=user["is_active"],
            is_verified=user["is_verified"],
            created_at=user["created_at"]
        )
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=user_response
        )
        
    except Exception as e:
        logging.error(f"Error registering user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )

@auth_router.post("/login", response_model=TokenResponse)
async def login_user(user_credentials: UserLogin):
    """Login user"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get user by email
        cursor.execute("SELECT * FROM users WHERE email = ?", (user_credentials.email,))
        user = cursor.fetchone()
        
        if not user or not PasswordUtils.verify_password(user_credentials.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        if not user["is_active"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is deactivated"
            )
        
        # Create tokens
        access_token = JWTUtils.create_access_token(data={"sub": user["id"]})
        refresh_token = JWTUtils.create_refresh_token(data={"sub": user["id"]})
        
        # Store refresh token
        token_id = str(uuid.uuid4())
        token_hash = PasswordUtils.hash_password(refresh_token)
        expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        
        cursor.execute('''
            INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
            VALUES (?, ?, ?, ?)
        ''', (token_id, user["id"], token_hash, expires_at))
        
        conn.commit()
        conn.close()
        
        user_response = UserResponse(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            is_active=user["is_active"],
            is_verified=user["is_verified"],
            created_at=user["created_at"]
        )
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error logging in user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )

@auth_router.post("/refresh", response_model=TokenResponse)
async def refresh_token(token_request: RefreshTokenRequest):
    """Refresh access token"""
    try:
        # Decode refresh token
        payload = JWTUtils.decode_token(token_request.refresh_token)
        
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        # Verify refresh token in database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM refresh_tokens 
            WHERE user_id = ? AND is_revoked = 0 AND expires_at > datetime('now')
        ''', (user_id,))
        
        stored_tokens = cursor.fetchall()
        token_valid = False
        
        for stored_token in stored_tokens:
            if PasswordUtils.verify_password(token_request.refresh_token, stored_token["token_hash"]):
                token_valid = True
                break
        
        if not token_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )
        
        # Get user
        cursor.execute("SELECT * FROM users WHERE id = ? AND is_active = 1", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        # Create new tokens
        new_access_token = JWTUtils.create_access_token(data={"sub": user_id})
        new_refresh_token = JWTUtils.create_refresh_token(data={"sub": user_id})
        
        # Store new refresh token and revoke old one
        cursor.execute('''
            UPDATE refresh_tokens 
            SET is_revoked = 1 
            WHERE user_id = ? AND is_revoked = 0
        ''', (user_id,))
        
        token_id = str(uuid.uuid4())
        token_hash = PasswordUtils.hash_password(new_refresh_token)
        expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        
        cursor.execute('''
            INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
            VALUES (?, ?, ?, ?)
        ''', (token_id, user_id, token_hash, expires_at))
        
        conn.commit()
        conn.close()
        
        user_response = UserResponse(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            is_active=user["is_active"],
            is_verified=user["is_verified"],
            created_at=user["created_at"]
        )
        
        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error refreshing token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed"
        )

@auth_router.post("/logout")
async def logout_user(current_user: dict = Depends(get_current_user)):
    """Logout user by revoking refresh tokens"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE refresh_tokens 
            SET is_revoked = 1 
            WHERE user_id = ? AND is_revoked = 0
        ''', (current_user["id"],))
        
        conn.commit()
        conn.close()
        
        return {"message": "Successfully logged out"}
        
    except Exception as e:
        logging.error(f"Error logging out user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )

@auth_router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(
        id=current_user["id"],
        name=current_user["name"],
        email=current_user["email"],
        is_active=current_user["is_active"],
        is_verified=current_user["is_verified"],
        created_at=""  # You might want to fetch this from the database
    )

@auth_router.put("/change-password")
async def change_password(
    password_data: PasswordChangeRequest,
    current_user: dict = Depends(get_current_user)
):
    """Change user password"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get current user with password hash
        cursor.execute("SELECT password_hash FROM users WHERE id = ?", (current_user["id"],))
        user = cursor.fetchone()
        
        # Verify current password
        if not PasswordUtils.verify_password(password_data.current_password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # Update password
        new_password_hash = PasswordUtils.hash_password(password_data.new_password)
        cursor.execute('''
            UPDATE users 
            SET password_hash = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        ''', (new_password_hash, current_user["id"]))
        
        # Revoke all refresh tokens to force re-login
        cursor.execute('''
            UPDATE refresh_tokens 
            SET is_revoked = 1 
            WHERE user_id = ?
        ''', (current_user["id"],))
        
        conn.commit()
        conn.close()
        
        return {"message": "Password changed successfully. Please login again."}
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error changing password: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password change failed"
        )

# Protected API Routes (Updated with user authentication)
@api_router.get("/")
async def root():
    return {"message": "Personal Finance Tracker API", "version": "2.0.0"}

@api_router.post("/loans/calculate", response_model=LoanCalculationResponse)
async def calculate_loan(
    request: LoanCalculationRequest,
    current_user: dict = Depends(get_current_user)
):
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
        
        # Save to database with user_id
        loan_id = str(uuid.uuid4())
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO loans (id, user_id, loan_type, principal_amount, interest_rate, 
                             tenure_months, emi_amount, total_interest, total_amount)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            loan_id, current_user["id"], request.loan_type, request.principal_amount, 
            request.interest_rate, request.tenure_months, calculation["emi_amount"], 
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
async def get_loans(current_user: dict = Depends(get_current_user)):
    """Get all user's saved loans"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM loans WHERE user_id = ? ORDER BY created_at DESC', (current_user["id"],))
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
async def create_expense(
    expense: ExpenseCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new expense record"""
    try:
        expense_id = str(uuid.uuid4())
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO expenses (id, user_id, amount, category, subcategory, description, date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            expense_id, current_user["id"], expense.amount, expense.category, 
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
async def get_expenses(current_user: dict = Depends(get_current_user)):
    """Get all user's expenses"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC, created_at DESC', (current_user["id"],))
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

@api_router.put("/expense/{expense_id}")
def update_expense(expense_id: str, expense: UpdateExpense, current_user: dict = Depends(get_current_user)):
    """Update an existing expense record."""
    user_id = current_user["id"]
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT id FROM expenses WHERE id = ? AND user_id = ?", (expense_id, user_id))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Expense record not found or access denied")
        
        update_fields = []
        update_values = []
        if expense.category is not None:
            update_fields.append("category = ?")
            update_values.append(expense.category)
        if expense.amount is not None:
            update_fields.append("amount = ?")
            update_values.append(expense.amount)
        if expense.date is not None:
            update_fields.append("date = ?")
            update_values.append(expense.date)
        if expense.description is not None:
            update_fields.append("description = ?")
            update_values.append(expense.description)

        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields provided for update")
            
        query = f"UPDATE expenses SET {', '.join(update_fields)} WHERE id = ? AND user_id = ?"
        update_values.extend([expense_id, user_id])
        
        cursor.execute(query, tuple(update_values))
        conn.commit()
        return {"message": "Expense record updated successfully"}
        
    except Exception as e:
        conn.rollback()
        logging.error(f"Error updating expense record: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update expense record")
    finally:
        conn.close()

@api_router.delete("/expense/{expense_id}")
def delete_expense(expense_id: str, current_user: dict = Depends(get_current_user)):
    """Delete an expense record."""
    user_id = current_user["id"]
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT id FROM expenses WHERE id = ? AND user_id = ?", (expense_id, user_id))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Expense record not found or access denied")
            
        cursor.execute("DELETE FROM expenses WHERE id = ? AND user_id = ?", (expense_id, user_id))
        conn.commit()
        return {"message": "Expense record deleted successfully"}
        
    except Exception as e:
        conn.rollback()
        logging.error(f"Error deleting expense record: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete expense record")
    finally:
        conn.close()

@api_router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    """Get dashboard data with user's financial overview"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        user_id = current_user["id"]
        
        # Get total expenses for user
        cursor.execute('SELECT SUM(amount) as total FROM expenses WHERE user_id = ?', (user_id,))
        total_expenses_result = cursor.fetchone()
        total_expenses = total_expenses_result['total'] or 0
        
        # Get total income for user
        cursor.execute('SELECT SUM(amount) as total FROM income WHERE user_id = ?', (user_id,))
        total_income_result = cursor.fetchone()
        total_income = total_income_result['total'] or 0
        
        # Get monthly expenses for user (current year)
        cursor.execute('''
            SELECT strftime('%Y-%m', date) as month, SUM(amount) as total
            FROM expenses 
            WHERE user_id = ? AND date >= date('now', 'start of year')
            GROUP BY strftime('%Y-%m', date)
            ORDER BY month
        ''', (user_id,))
        monthly_data = cursor.fetchall()
        monthly_expenses = {row['month']: row['total'] for row in monthly_data}
        
        # Get category breakdown for user
        cursor.execute('''
            SELECT category, SUM(amount) as total
            FROM expenses
            WHERE user_id = ?
            GROUP BY category
            ORDER BY total DESC
        ''', (user_id,))
        category_data = cursor.fetchall()
        category_breakdown = {row['category']: row['total'] for row in category_data}
        
        # Get recent transactions for user
        cursor.execute('''
            SELECT category, amount, description, date
            FROM expenses
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 10
        ''', (user_id,))
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

# AI Integration Endpoints (Updated with user context)
@api_router.post("/ai/analyze", response_model=AIAnalysisResponse)
async def analyze_financial_data(
    request: AIAnalysisRequest,
    current_user: dict = Depends(get_current_user)
):
    """Analyze user's financial data using local Ollama AI"""
    try:
        # Get user's financial data for context
        conn = get_db_connection()
        cursor = conn.cursor()
        user_id = current_user["id"]
        
        # Get summary data for user
        cursor.execute('SELECT SUM(amount) as total FROM expenses WHERE user_id = ?', (user_id,))
        total_expenses = cursor.fetchone()['total'] or 0
        
        cursor.execute('SELECT SUM(amount) as total FROM income WHERE user_id = ?', (user_id,))
        total_income = cursor.fetchone()['total'] or 0
        
        cursor.execute('''
            SELECT category, SUM(amount) as total
            FROM expenses
            WHERE user_id = ?
            GROUP BY category
            ORDER BY total DESC
            LIMIT 5
        ''', (user_id,))
        top_categories = cursor.fetchall()
        
        cursor.execute('''
            SELECT loan_type, emi_amount, total_interest
            FROM loans
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 3
        ''', (user_id,))
        recent_loans = cursor.fetchall()
        
        conn.close()
        
        # Prepare financial context
        financial_context = f"""
        Current Financial Snapshot for {current_user["name"]}:
        - Total Expenses: ₹{total_expenses:,.2f}
        - Total Income: ₹{total_income:,.2f}
        - Net Balance: ₹{total_income - total_expenses:,.2f}
        
        Top Expense Categories:
        {chr(10).join([f"- {row['category']}: ₹{row['total']:,.2f}" for row in top_categories])}
        
        Recent Loans:
        {chr(10).join([f"- {row['loan_type'].title()} Loan: EMI ₹{row['emi_amount']:,.2f}, Total Interest ₹{row['total_interest']:,.2f}" for row in recent_loans])}
        """
        
        # Create analysis prompt based on type (keeping existing prompts)
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
                model='llama3.1',
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
            Hello {current_user["name"]}, I apologize, but the AI analysis service is currently unavailable. 
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
            
            if len(line) > 20 and len(recommendations) < 5:
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
    
    return recommendations[:5]

# Income Management Endpoints (Updated)
@api_router.post("/income", response_model=IncomeResponse)
async def create_income(
    income: IncomeCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new income record"""
    try:
        income_id = str(uuid.uuid4())
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO income (id, user_id, amount, source, description, date, is_recurring, frequency)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            income_id, current_user["id"], income.amount, income.source, income.description,
            income.date, income.is_recurring, income.frequency
        ))
        
        conn.commit()
        conn.close()
        
        return IncomeResponse(
            id=income_id,
            amount=income.amount,
            source=income.source,
            description=income.description,
            date=income.date,
            is_recurring=income.is_recurring,
            frequency=income.frequency,
            created_at=datetime.now(timezone.utc).isoformat()
        )
        
    except Exception as e:
        logging.error(f"Error creating income: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create income")

@api_router.get("/income", response_model=List[IncomeResponse])
async def get_income(current_user: dict = Depends(get_current_user)):
    """Get all user's income records"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM income WHERE user_id = ? ORDER BY date DESC, created_at DESC', (current_user["id"],))
        income_records = cursor.fetchall()
        conn.close()
        
        result = []
        for record in income_records:
            result.append(IncomeResponse(
                id=record['id'],
                amount=record['amount'],
                source=record['source'],
                description=record['description'],
                date=record['date'],
                is_recurring=record['is_recurring'],
                frequency=record['frequency'],
                created_at=record['created_at']
            ))
        
        return result
        
    except Exception as e:
        logging.error(f"Error fetching income: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch income")

@api_router.put("/income/{income_id}")
def update_income(income_id: str, income: UpdateIncome, current_user: dict = Depends(get_current_user)):
    """Update an existing income record."""
    user_id = current_user["id"]
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if the record exists and belongs to the user
        cursor.execute("SELECT id FROM incomes WHERE id = ? AND user_id = ?", (income_id, user_id))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Income record not found or access denied")
        
        update_fields = []
        update_values = []
        if income.source is not None:
            update_fields.append("source = ?")
            update_values.append(income.source)
        if income.amount is not None:
            update_fields.append("amount = ?")
            update_values.append(income.amount)
        if income.date is not None:
            update_fields.append("date = ?")
            update_values.append(income.date)
        if income.notes is not None:
            update_fields.append("notes = ?")
            update_values.append(income.notes)
            
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields provided for update")
            
        query = f"UPDATE incomes SET {', '.join(update_fields)} WHERE id = ? AND user_id = ?"
        update_values.extend([income_id, user_id])
        
        cursor.execute(query, tuple(update_values))
        conn.commit()
        return {"message": "Income record updated successfully"}
        
    except Exception as e:
        conn.rollback()
        logging.error(f"Error updating income record: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update income record")
    finally:
        conn.close()
        
@api_router.delete("/income/{income_id}")
def delete_income(income_id: str, current_user: dict = Depends(get_current_user)):
    """Delete an income record."""
    user_id = current_user["id"]
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if the record exists and belongs to the user
        cursor.execute("SELECT id FROM incomes WHERE id = ? AND user_id = ?", (income_id, user_id))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Income record not found or access denied")
            
        cursor.execute("DELETE FROM incomes WHERE id = ? AND user_id = ?", (income_id, user_id))
        conn.commit()
        return {"message": "Income record deleted successfully"}
        
    except Exception as e:
        conn.rollback()
        logging.error(f"Error deleting income record: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete income record")
    finally:
        conn.close()
# Savings Goals Endpoints (Updated)
@api_router.post("/savings-goals", response_model=SavingsGoalResponse)
async def create_savings_goal(
    goal: SavingsGoalCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new savings goal"""
    try:
        goal_id = str(uuid.uuid4())
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO savings_goals (id, user_id, goal_name, target_amount, current_amount, target_date, description)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            goal_id, current_user["id"], goal.goal_name, goal.target_amount, goal.current_amount,
            goal.target_date, goal.description
        ))
        
        conn.commit()
        conn.close()
        
        progress_percentage = (goal.current_amount / goal.target_amount) * 100 if goal.target_amount > 0 else 0
        
        return SavingsGoalResponse(
            id=goal_id,
            goal_name=goal.goal_name,
            target_amount=goal.target_amount,
            current_amount=goal.current_amount,
            target_date=goal.target_date,
            description=goal.description,
            progress_percentage=round(progress_percentage, 2),
            created_at=datetime.now(timezone.utc).isoformat()
        )
        
    except Exception as e:
        logging.error(f"Error creating savings goal: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create savings goal")

@api_router.get("/savings-goals", response_model=List[SavingsGoalResponse])
async def get_savings_goals(current_user: dict = Depends(get_current_user)):
    """Get all user's savings goals"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM savings_goals WHERE user_id = ? ORDER BY created_at DESC', (current_user["id"],))
        goals = cursor.fetchall()
        conn.close()
        
        result = []
        for goal in goals:
            progress_percentage = (goal['current_amount'] / goal['target_amount']) * 100 if goal['target_amount'] > 0 else 0
            result.append(SavingsGoalResponse(
                id=goal['id'],
                goal_name=goal['goal_name'],
                target_amount=goal['target_amount'],
                current_amount=goal['current_amount'],
                target_date=goal['target_date'],
                description=goal['description'],
                progress_percentage=round(progress_percentage, 2),
                created_at=goal['created_at']
            ))
        
        return result
        
    except Exception as e:
        logging.error(f"Error fetching savings goals: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch savings goals")

@api_router.put("/savings-goals/{goal_id}/progress")
async def update_savings_goal_progress(
    goal_id: str, 
    amount: float,
    current_user: dict = Depends(get_current_user)
):
    """Update progress on a user's savings goal"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE savings_goals 
            SET current_amount = current_amount + ?
            WHERE id = ? AND user_id = ?
        ''', (amount, goal_id, current_user["id"]))
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Savings goal not found")
            
        conn.commit()
        conn.close()
        
        return {"message": "Savings goal updated successfully"}
        
    except Exception as e:
        logging.error(f"Error updating savings goal: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update savings goal")

@api_router.put("/goal/{goal_id}")
def update_savings_goal(goal_id: str, goal: UpdateSavingsGoal, current_user: dict = Depends(get_current_user)):
    """Update an existing savings goal record."""
    user_id = current_user["id"]
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT id FROM savings_goals WHERE id = ? AND user_id = ?", (goal_id, user_id))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Savings goal record not found or access denied")
        
        update_fields = []
        update_values = []
        if goal.name is not None:
            update_fields.append("name = ?")
            update_values.append(goal.name)
        if goal.target_amount is not None:
            update_fields.append("target_amount = ?")
            update_values.append(goal.target_amount)
        if goal.current_amount is not None:
            update_fields.append("current_amount = ?")
            update_values.append(goal.current_amount)
        if goal.target_date is not None:
            update_fields.append("target_date = ?")
            update_values.append(goal.target_date)
        if goal.notes is not None:
            update_fields.append("notes = ?")
            update_values.append(goal.notes)
            
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields provided for update")
            
        query = f"UPDATE savings_goals SET {', '.join(update_fields)} WHERE id = ? AND user_id = ?"
        update_values.extend([goal_id, user_id])
        
        cursor.execute(query, tuple(update_values))
        conn.commit()
        return {"message": "Savings goal record updated successfully"}
        
    except Exception as e:
        conn.rollback()
        logging.error(f"Error updating savings goal record: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update savings goal record")
    finally:
        conn.close()

@api_router.delete("/goal/{goal_id}")
def delete_savings_goal(goal_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a savings goal record."""
    user_id = current_user["id"]
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT id FROM savings_goals WHERE id = ? AND user_id = ?", (goal_id, user_id))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Savings goal record not found or access denied")
            
        cursor.execute("DELETE FROM savings_goals WHERE id = ? AND user_id = ?", (goal_id, user_id))
        conn.commit()
        return {"message": "Savings goal record deleted successfully"}
        
    except Exception as e:
        conn.rollback()
        logging.error(f"Error deleting savings goal record: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete savings goal record")
    finally:
        conn.close()

# Investment Management Endpoints (Updated)
@api_router.post("/investments", response_model=InvestmentResponse)
async def create_investment(
    investment: InvestmentCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new investment record"""
    try:
        investment_id = str(uuid.uuid4())
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO investments (id, user_id, investment_type, name, amount, date, 
                                   maturity_date, interest_rate, is_recurring, frequency)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            investment_id, current_user["id"], investment.investment_type, investment.name, 
            investment.amount, investment.date, investment.maturity_date,
            investment.interest_rate, investment.is_recurring, investment.frequency
        ))
        
        conn.commit()
        conn.close()
        
        return InvestmentResponse(
            id=investment_id,
            investment_type=investment.investment_type,
            name=investment.name,
            amount=investment.amount,
            date=investment.date,
            maturity_date=investment.maturity_date,
            interest_rate=investment.interest_rate,
            is_recurring=investment.is_recurring,
            frequency=investment.frequency,
            created_at=datetime.now(timezone.utc).isoformat()
        )
        
    except Exception as e:
        logging.error(f"Error creating investment: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create investment")

@api_router.get("/investments", response_model=List[InvestmentResponse])
async def get_investments(current_user: dict = Depends(get_current_user)):
    """Get all user's investment records"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM investments WHERE user_id = ? ORDER BY date DESC, created_at DESC', (current_user["id"],))
        investments = cursor.fetchall()
        conn.close()
        
        result = []
        for investment in investments:
            result.append(InvestmentResponse(
                id=investment['id'],
                investment_type=investment['investment_type'],
                name=investment['name'],
                amount=investment['amount'],
                date=investment['date'],
                maturity_date=investment['maturity_date'],
                interest_rate=investment['interest_rate'],
                is_recurring=investment['is_recurring'],
                frequency=investment['frequency'],
                created_at=investment['created_at']
            ))
        
        return result
        
    except Exception as e:
        logging.error(f"Error fetching investments: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch investments")

@api_router.put("/investment/{investment_id}")
def update_investment(investment_id: str, investment: UpdateInvestment, current_user: dict = Depends(get_current_user)):
    """Update an existing investment record."""
    user_id = current_user["id"]
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT id FROM investments WHERE id = ? AND user_id = ?", (investment_id, user_id))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Investment record not found or access denied")
        
        update_fields = []
        update_values = []
        if investment.name is not None:
            update_fields.append("name = ?")
            update_values.append(investment.name)
        if investment.type is not None:
            update_fields.append("type = ?")
            update_values.append(investment.type)
        if investment.amount is not None:
            update_fields.append("amount = ?")
            update_values.append(investment.amount)
        if investment.date is not None:
            update_fields.append("date = ?")
            update_values.append(investment.date)
        if investment.notes is not None:
            update_fields.append("notes = ?")
            update_values.append(investment.notes)

        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields provided for update")
            
        query = f"UPDATE investments SET {', '.join(update_fields)} WHERE id = ? AND user_id = ?"
        update_values.extend([investment_id, user_id])
        
        cursor.execute(query, tuple(update_values))
        conn.commit()
        return {"message": "Investment record updated successfully"}
        
    except Exception as e:
        conn.rollback()
        logging.error(f"Error updating investment record: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update investment record")
    finally:
        conn.close()

@api_router.delete("/investment/{investment_id}")
def delete_investment(investment_id: str, current_user: dict = Depends(get_current_user)):
    """Delete an investment record."""
    user_id = current_user["id"]
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT id FROM investments WHERE id = ? AND user_id = ?", (investment_id, user_id))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Investment record not found or access denied")
            
        cursor.execute("DELETE FROM investments WHERE id = ? AND user_id = ?", (investment_id, user_id))
        conn.commit()
        return {"message": "Investment record deleted successfully"}
        
    except Exception as e:
        conn.rollback()
        logging.error(f"Error deleting investment record: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete investment record")
    finally:
        conn.close()

# Budget Management Endpoints (Updated)
@api_router.post("/budgets", response_model=BudgetResponse)
async def create_budget(
    budget: BudgetCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create or update a budget for a category"""
    try:
        budget_id = str(uuid.uuid4())
        conn = get_db_connection()
        cursor = conn.cursor()
        user_id = current_user["id"]
        
        # Check if budget already exists for this category and user
        cursor.execute('SELECT id FROM budgets WHERE category = ? AND user_id = ?', (budget.category, user_id))
        existing = cursor.fetchone()
        
        if existing:
            # Update existing budget
            cursor.execute('''
                UPDATE budgets 
                SET monthly_limit = ?, alert_threshold = ?
                WHERE category = ? AND user_id = ?
            ''', (budget.monthly_limit, budget.alert_threshold, budget.category, user_id))
            budget_id = existing['id']
        else:
            # Create new budget
            cursor.execute('''
                INSERT INTO budgets (id, user_id, category, monthly_limit, alert_threshold)
                VALUES (?, ?, ?, ?, ?)
            ''', (budget_id, user_id, budget.category, budget.monthly_limit, budget.alert_threshold))
        
        conn.commit()
        
        # Get current month's spending for this category and user
        cursor.execute('''
            SELECT SUM(amount) as spent
            FROM expenses 
            WHERE category = ? AND user_id = ? AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
        ''', (budget.category, user_id))
        
        spent_result = cursor.fetchone()
        current_spent = spent_result['spent'] or 0
        
        conn.close()
        
        remaining = budget.monthly_limit - current_spent
        percentage_used = (current_spent / budget.monthly_limit) * 100 if budget.monthly_limit > 0 else 0
        is_over_budget = current_spent > budget.monthly_limit
        
        return BudgetResponse(
            id=budget_id,
            category=budget.category,
            monthly_limit=budget.monthly_limit,
            current_spent=current_spent,
            remaining=remaining,
            alert_threshold=budget.alert_threshold,
            percentage_used=round(percentage_used, 2),
            is_over_budget=is_over_budget,
            created_at=datetime.now(timezone.utc).isoformat()
        )
        
    except Exception as e:
        logging.error(f"Error creating budget: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create budget")

@api_router.get("/budgets", response_model=List[BudgetResponse])
async def get_budgets(current_user: dict = Depends(get_current_user)):
    """Get all user's budgets with current spending"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        user_id = current_user["id"]
        
        cursor.execute('SELECT * FROM budgets WHERE user_id = ? ORDER BY category', (user_id,))
        budgets = cursor.fetchall()
        
        result = []
        for budget in budgets:
            # Get current month's spending for this category and user
            cursor.execute('''
                SELECT SUM(amount) as spent
                FROM expenses 
                WHERE category = ? AND user_id = ? AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
            ''', (budget['category'], user_id))
            
            spent_result = cursor.fetchone()
            current_spent = spent_result['spent'] or 0
            
            remaining = budget['monthly_limit'] - current_spent
            percentage_used = (current_spent / budget['monthly_limit']) * 100 if budget['monthly_limit'] > 0 else 0
            is_over_budget = current_spent > budget['monthly_limit']
            
            result.append(BudgetResponse(
                id=budget['id'],
                category=budget['category'],
                monthly_limit=budget['monthly_limit'],
                current_spent=current_spent,
                remaining=remaining,
                alert_threshold=budget['alert_threshold'],
                percentage_used=round(percentage_used, 2),
                is_over_budget=is_over_budget,
                created_at=budget['created_at']
            ))
        
        conn.close()
        return result
        
    except Exception as e:
        logging.error(f"Error fetching budgets: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch budgets")

@api_router.put("/budget/{budget_id}")
def update_budget(budget_id: str, budget: UpdateBudget, current_user: dict = Depends(get_current_user)):
    """Update an existing budget record."""
    user_id = current_user["id"]
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT id FROM budgets WHERE id = ? AND user_id = ?", (budget_id, user_id))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Budget record not found or access denied")
        
        update_fields = []
        update_values = []
        if budget.category is not None:
            update_fields.append("category = ?")
            update_values.append(budget.category)
        if budget.amount is not None:
            update_fields.append("amount = ?")
            update_values.append(budget.amount)
        if budget.start_date is not None:
            update_fields.append("start_date = ?")
            update_values.append(budget.start_date)
        if budget.end_date is not None:
            update_fields.append("end_date = ?")
            update_values.append(budget.end_date)
            
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields provided for update")
            
        query = f"UPDATE budgets SET {', '.join(update_fields)} WHERE id = ? AND user_id = ?"
        update_values.extend([budget_id, user_id])
        
        cursor.execute(query, tuple(update_values))
        conn.commit()
        return {"message": "Budget record updated successfully"}
        
    except Exception as e:
        conn.rollback()
        logging.error(f"Error updating budget record: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update budget record")
    finally:
        conn.close()

@api_router.delete("/budget/{budget_id}")
def delete_budget(budget_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a budget record."""
    user_id = current_user["id"]
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT id FROM budgets WHERE id = ? AND user_id = ?", (budget_id, user_id))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Budget record not found or access denied")
            
        cursor.execute("DELETE FROM budgets WHERE id = ? AND user_id = ?", (budget_id, user_id))
        conn.commit()
        return {"message": "Budget record deleted successfully"}
        
    except Exception as e:
        conn.rollback()
        logging.error(f"Error deleting budget record: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete budget record")
    finally:
        conn.close()
        
# File Upload Endpoint (Updated)
@api_router.post("/upload-receipt/{expense_id}")
async def upload_receipt(
    expense_id: str, 
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload receipt for a user's expense"""
    try:
        # Verify expense belongs to user
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT id FROM expenses WHERE id = ? AND user_id = ?', (expense_id, current_user["id"]))
        expense = cursor.fetchone()
        
        if not expense:
            raise HTTPException(status_code=404, detail="Expense not found")
        
        # Create uploads directory if it doesn't exist
        upload_dir = ROOT_DIR / "uploads" / "receipts"
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        unique_filename = f"{expense_id}_{uuid.uuid4().hex[:8]}.{file_extension}"
        file_path = upload_dir / unique_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Update expense record
        cursor.execute('''
            UPDATE expenses 
            SET receipt_path = ?
            WHERE id = ? AND user_id = ?
        ''', (str(file_path), expense_id, current_user["id"]))
        
        # Save receipt record
        receipt_id = str(uuid.uuid4())
        cursor.execute('''
            INSERT INTO receipts (id, expense_id, file_name, file_path, file_size)
            VALUES (?, ?, ?, ?, ?)
        ''', (receipt_id, expense_id, file.filename, str(file_path), len(content)))
        
        conn.commit()
        conn.close()
        
        return {
            "message": "Receipt uploaded successfully",
            "receipt_id": receipt_id,
            "filename": unique_filename
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error uploading receipt: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upload receipt")

# Enhanced Dashboard with all user data
@api_router.get("/dashboard/complete")
async def get_complete_dashboard(current_user: dict = Depends(get_current_user)):
    """Get comprehensive dashboard data for user"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        user_id = current_user["id"]
        
        # Basic financial data for user
        cursor.execute('SELECT SUM(amount) as total FROM expenses WHERE user_id = ?', (user_id,))
        total_expenses = cursor.fetchone()['total'] or 0
        
        cursor.execute('SELECT SUM(amount) as total FROM income WHERE user_id = ?', (user_id,))
        total_income = cursor.fetchone()['total'] or 0
        
        cursor.execute('SELECT SUM(amount) as total FROM investments WHERE user_id = ?', (user_id,))
        total_investments = cursor.fetchone()['total'] or 0
        
        # Savings goals progress for user
        cursor.execute('''
            SELECT COUNT(*) as count, SUM(current_amount) as saved, SUM(target_amount) as target 
            FROM savings_goals WHERE user_id = ?
        ''', (user_id,))
        goals_data = cursor.fetchone()
        
        # Budget alerts for user
        cursor.execute('''
            SELECT b.category, b.monthly_limit, b.alert_threshold,
                   COALESCE(SUM(e.amount), 0) as spent
            FROM budgets b
            LEFT JOIN expenses e ON b.category = e.category 
                AND b.user_id = e.user_id
                AND strftime('%Y-%m', e.date) = strftime('%Y-%m', 'now')
            WHERE b.user_id = ?
            GROUP BY b.category, b.monthly_limit, b.alert_threshold
        ''', (user_id,))
        budget_data = cursor.fetchall()
        
        budget_alerts = []
        for budget in budget_data:
            percentage = (budget['spent'] / budget['monthly_limit']) * 100 if budget['monthly_limit'] > 0 else 0
            if percentage >= budget['alert_threshold']:
                budget_alerts.append({
                    "category": budget['category'],
                    "spent": budget['spent'],
                    "limit": budget['monthly_limit'],
                    "percentage": round(percentage, 2)
                })
        
        # Investment breakdown for user
        cursor.execute('''
            SELECT investment_type, SUM(amount) as total
            FROM investments
            WHERE user_id = ?
            GROUP BY investment_type
            ORDER BY total DESC
        ''', (user_id,))
        investment_breakdown = {row['investment_type']: row['total'] for row in cursor.fetchall()}
        
        conn.close()
        
        return {
            "user_name": current_user["name"],
            "total_income": total_income,
            "total_expenses": total_expenses,
            "total_investments": total_investments,
            "net_worth": total_income - total_expenses + total_investments,
            "savings_goals": {
                "count": goals_data['count'] or 0,
                "saved": goals_data['saved'] or 0,
                "target": goals_data['target'] or 0,
                "progress": ((goals_data['saved'] or 0) / (goals_data['target'] or 1)) * 100
            },
            "budget_alerts": budget_alerts,
            "investment_breakdown": investment_breakdown
        }
        
    except Exception as e:
        logging.error(f"Error fetching complete dashboard: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch dashboard data")

# Data Export Endpoint (Updated)
@api_router.get("/export/{data_type}")
async def export_data(
    data_type: str, 
    format: str = "csv",
    current_user: dict = Depends(get_current_user)
):
    """Export user's data to CSV or JSON format"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        user_id = current_user["id"]
        
        if data_type == "expenses":
            cursor.execute('SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC', (user_id,))
        elif data_type == "income":
            cursor.execute('SELECT * FROM income WHERE user_id = ? ORDER BY date DESC', (user_id,))
        elif data_type == "investments":
            cursor.execute('SELECT * FROM investments WHERE user_id = ? ORDER BY date DESC', (user_id,))
        elif data_type == "loans":
            cursor.execute('SELECT * FROM loans WHERE user_id = ? ORDER BY created_at DESC', (user_id,))
        elif data_type == "budgets":
            cursor.execute('SELECT * FROM budgets WHERE user_id = ? ORDER BY category', (user_id,))
        elif data_type == "savings_goals":
            cursor.execute('SELECT * FROM savings_goals WHERE user_id = ? ORDER BY created_at DESC', (user_id,))
        else:
            raise HTTPException(status_code=400, detail="Invalid data type")
        
        data = cursor.fetchall()
        conn.close()
        
        if format == "json":
            return {"data": [dict(row) for row in data], "user": current_user["name"]}
        else:
            # For CSV, we'd normally use pandas but for simplicity, return JSON
            return {"data": [dict(row) for row in data], "format": "csv", "user": current_user["name"]}
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error exporting data: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to export data")

# User Profile Management
@api_router.put("/profile")
async def update_profile(
    name: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Update user profile"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        update_fields = []
        update_values = []
        
        if name:
            update_fields.append("name = ?")
            update_values.append(name)
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        update_fields.append("updated_at = CURRENT_TIMESTAMP")
        update_values.append(current_user["id"])
        
        query = f"UPDATE users SET {', '.join(update_fields)} WHERE id = ?"
        cursor.execute(query, update_values)
        
        conn.commit()
        conn.close()
        
        return {"message": "Profile updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error updating profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update profile")

# Delete User Account
@api_router.delete("/account")
async def delete_account(
    password: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete user account and all associated data"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify password
        cursor.execute("SELECT password_hash FROM users WHERE id = ?", (current_user["id"],))
        user = cursor.fetchone()
        
        if not PasswordUtils.verify_password(password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect password"
            )
        
        # Delete user (CASCADE will handle related data)
        cursor.execute("DELETE FROM users WHERE id = ?", (current_user["id"],))
        
        conn.commit()
        conn.close()
        
        return {"message": "Account deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error deleting account: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete account")

# User Statistics
@api_router.get("/stats")
async def get_user_stats(current_user: dict = Depends(get_current_user)):
    """Get user statistics"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        user_id = current_user["id"]
        
        # Basic counts
        cursor.execute("SELECT COUNT(*) as count FROM expenses WHERE user_id = ?", (user_id,))
        expense_count = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM income WHERE user_id = ?", (user_id,))
        income_count = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM investments WHERE user_id = ?", (user_id,))
        investment_count = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM loans WHERE user_id = ?", (user_id,))
        loan_count = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM budgets WHERE user_id = ?", (user_id,))
        budget_count = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM savings_goals WHERE user_id = ?", (user_id,))
        goals_count = cursor.fetchone()['count']
        
        # Account age
        cursor.execute("SELECT created_at FROM users WHERE id = ?", (user_id,))
        created_at = cursor.fetchone()['created_at']
        
        conn.close()
        
        return {
            "user_name": current_user["name"],
            "account_created": created_at,
            "total_expenses": expense_count,
            "total_income_records": income_count,
            "total_investments": investment_count,
            "total_loans": loan_count,
            "total_budgets": budget_count,
            "total_savings_goals": goals_count
        }
        
    except Exception as e:
        logging.error(f"Error fetching user stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch user statistics")

# Include routers in the main app
app.include_router(auth_router)
app.include_router(api_router)

# CORS Middleware
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