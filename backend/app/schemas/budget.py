from pydantic import BaseModel
from typing import Optional

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

class UpdateBudget(BaseModel):
    category: Optional[str] = None
    amount: Optional[float] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None