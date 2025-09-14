from pydantic import BaseModel
from typing import Optional

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

class UpdateExpense(BaseModel):
    category: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[str] = None
    description: Optional[str] = None