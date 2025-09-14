from fastapi import APIRouter, Depends, status
from schemas.budget import BudgetCreate, BudgetResponse, UpdateBudget
from services.budget_service import BudgetsService
from utils.dependencies import get_current_user
from typing import List

router = APIRouter(prefix="/budgets", tags=["Budgets"])

@router.post("/", response_model=BudgetResponse)
async def create_budget(budget_data: BudgetCreate, current_user: dict = Depends(get_current_user)):
    return await BudgetsService.create_budget(budget_data, current_user)

@router.get("/{budget_id}", response_model=BudgetResponse)
async def get_budget(budget_id: str, current_user: dict = Depends(get_current_user)):
    return await BudgetsService.get_budget(budget_id, current_user)

@router.get("/", response_model=List[BudgetResponse])
async def get_all_budgets(current_user: dict = Depends(get_current_user)):
    return await BudgetsService.get_all_budgets(current_user)

@router.put("/{budget_id}")
async def update_budget(budget_id: str, budget_data: UpdateBudget, current_user: dict = Depends(get_current_user)):
    return await BudgetsService.update_budget(budget_id, budget_data, current_user)

@router.delete("/{budget_id}")
async def delete_budget(budget_id: str, current_user: dict = Depends(get_current_user)):
    return await BudgetsService.delete_budget(budget_id, current_user)