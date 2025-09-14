from pydantic import BaseModel
from typing import Optional

class InvestmentCreate(BaseModel):
    investment_type: str
    name: str
    amount: float
    current_value: float
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
    current_value: float
    date: str
    maturity_date: Optional[str] = None
    interest_rate: Optional[float] = None
    is_recurring: bool
    frequency: Optional[str] = None
    created_at: str

class UpdateInvestment(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    amount: Optional[float] = None
    current_value: Optional[float] = None
    date: Optional[str] = None
    notes: Optional[str] = None