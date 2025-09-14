from fastapi import APIRouter, Depends, status
from schemas.loan import LoanCalculationRequest, LoanCalculationResponse
from services.loan_service import LoansService
from utils.dependencies import get_current_user
from typing import List

router = APIRouter(prefix="/loans", tags=["Loans"])

@router.post("/", response_model=LoanCalculationResponse)
async def create_loan(loan_data: LoanCalculationRequest, current_user: dict = Depends(get_current_user)):
    return await LoansService.create_loan(loan_data, current_user)

@router.post("/calculate", response_model=LoanCalculationResponse)
async def calculate_loan_payment(loan_data: LoanCalculationRequest):
    return await LoansService.calculate_loan(loan_data)

@router.get("/{loan_id}", response_model=LoanCalculationResponse)
async def get_loan(loan_id: str, current_user: dict = Depends(get_current_user)):
    return await LoansService.get_loan(loan_id, current_user)

@router.get("/", response_model=List[LoanCalculationResponse])
async def get_all_loans(current_user: dict = Depends(get_current_user)):
    return await LoansService.get_all_loans(current_user)

@router.delete("/{loan_id}")
async def delete_loan(loan_id: str, current_user: dict = Depends(get_current_user)):
    return await LoansService.delete_loan(loan_id, current_user)
