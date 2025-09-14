from pydantic import BaseModel
from typing import Optional

class SavingsGoalCreate(BaseModel):
    goal_name: str
    goal_type: str
    target_amount: float
    current_amount: float = 0
    target_date: Optional[str] = None
    description: Optional[str] = None

class SavingsGoalResponse(BaseModel):
    id: str
    goal_name: str
    goal_type: str
    target_amount: float
    current_amount: float
    target_date: Optional[str] = None
    description: Optional[str] = None
    progress_percentage: float
    created_at: str

class UpdateSavingsGoal(BaseModel):
    name: Optional[str] = None
    goal_type: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    target_date: Optional[str] = None
    notes: Optional[str] = None