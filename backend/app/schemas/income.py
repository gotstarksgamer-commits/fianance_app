from pydantic import BaseModel
from typing import Optional

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

class UpdateIncome(BaseModel):
    source: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[str] = None
    description: Optional[str] = None
    frequency: Optional[str] = None