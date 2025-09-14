from fastapi import APIRouter, Depends, status
from schemas.income import IncomeCreate, IncomeResponse, UpdateIncome
from services.income_service import IncomeService
from utils.dependencies import get_current_user
from typing import List

router = APIRouter(prefix="/incomes", tags=["Income"])

@router.post("/", response_model=IncomeResponse)
async def create_income(income_data: IncomeCreate, current_user: dict = Depends(get_current_user)):
    return await IncomeService.create_income(income_data, current_user)

@router.get("/{income_id}", response_model=IncomeResponse)
async def get_income(income_id: str, current_user: dict = Depends(get_current_user)):
    return await IncomeService.get_income(income_id, current_user)

@router.get("/", response_model=List[IncomeResponse])
async def get_all_income(current_user: dict = Depends(get_current_user)):
    return await IncomeService.get_all_income(current_user)

@router.put("/{income_id}")
async def update_income(income_id: str, income_data: UpdateIncome, current_user: dict = Depends(get_current_user)):
    return await IncomeService.update_income(income_id, income_data, current_user)

@router.delete("/{income_id}")
async def delete_income(income_id: str, current_user: dict = Depends(get_current_user)):
    return await IncomeService.delete_income(income_id, current_user)