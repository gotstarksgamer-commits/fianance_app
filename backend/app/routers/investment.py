from fastapi import APIRouter, Depends, status
from schemas.investment import InvestmentCreate, InvestmentResponse, UpdateInvestment
from services.investment_service import InvestmentsService
from utils.dependencies import get_current_user
from typing import List

router = APIRouter(prefix="/investments", tags=["Investments"])

@router.post("/", response_model=InvestmentResponse)
async def create_investment(investment_data: InvestmentCreate, current_user: dict = Depends(get_current_user)):
    return await InvestmentsService.create_investment(investment_data, current_user)

@router.get("/{investment_id}", response_model=InvestmentResponse)
async def get_investment(investment_id: str, current_user: dict = Depends(get_current_user)):
    return await InvestmentsService.get_investment(investment_id, current_user)

@router.get("/", response_model=List[InvestmentResponse])
async def get_all_investments(current_user: dict = Depends(get_current_user)):
    return await InvestmentsService.get_all_investments(current_user)

@router.put("/{investment_id}")
async def update_investment(investment_id: str, investment_data: UpdateInvestment, current_user: dict = Depends(get_current_user)):
    return await InvestmentsService.update_investment(investment_id, investment_data, current_user)

@router.delete("/{investment_id}")
async def delete_investment(investment_id: str, current_user: dict = Depends(get_current_user)):
    return await InvestmentsService.delete_investment(investment_id, current_user)