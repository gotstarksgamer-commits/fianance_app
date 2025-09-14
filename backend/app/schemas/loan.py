# Updated Pydantic Models (existing models remain the same)
from pydantic import BaseModel
from typing import List, Optional

class LoanCalculationRequest(BaseModel):
    loan_type: str
    principal_amount: float
    interest_rate: float
    tenure_months: int

class LoanCalculationResponse(BaseModel):
    id: Optional[str] = None
    loan_type: str
    principal_amount: float
    interest_rate: float
    tenure_months: int
    emi_amount: float
    total_interest: float
    total_amount: float
    amortization_schedule: Optional[List[dict]] = None