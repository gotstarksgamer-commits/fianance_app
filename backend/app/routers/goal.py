from fastapi import APIRouter, Depends, status
from schemas.goal import SavingsGoalCreate, SavingsGoalResponse, UpdateSavingsGoal
from services.goal_service import SavingsService
from utils.dependencies import get_current_user
from typing import List

router = APIRouter(prefix="/savings-goals", tags=["Savings Goals"])

@router.post("/", response_model=SavingsGoalResponse)
async def create_savings_goal(goal_data: SavingsGoalCreate, current_user: dict = Depends(get_current_user)):
    return await SavingsService.create_savings_goal(goal_data, current_user)

@router.get("/{goal_id}", response_model=SavingsGoalResponse)
async def get_savings_goal(goal_id: str, current_user: dict = Depends(get_current_user)):
    return await SavingsService.get_savings_goal(goal_id, current_user)

@router.get("/", response_model=List[SavingsGoalResponse])
async def get_all_savings_goals(current_user: dict = Depends(get_current_user)):
    return await SavingsService.get_all_savings_goals(current_user)

@router.put("/{goal_id}")
async def update_savings_goal(goal_id: str, goal_data: UpdateSavingsGoal, current_user: dict = Depends(get_current_user)):
    return await SavingsService.update_savings_goal(goal_id, goal_data, current_user)

@router.delete("/{goal_id}")
async def delete_savings_goal(goal_id: str, current_user: dict = Depends(get_current_user)):
    return await SavingsService.delete_savings_goal(goal_id, current_user)