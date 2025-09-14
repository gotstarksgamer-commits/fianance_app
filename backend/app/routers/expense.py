from fastapi import APIRouter, Depends, status, UploadFile, File
from schemas.expense import ExpenseCreate, ExpenseResponse, UpdateExpense
from services.expense_service import ExpensesService
from utils.dependencies import get_current_user
from typing import List

router = APIRouter(prefix="/expenses", tags=["Expenses"])

@router.post("/", response_model=ExpenseResponse)
async def create_expense(expense_data: ExpenseCreate, current_user: dict = Depends(get_current_user)):
    return await ExpensesService.create_expense(expense_data, current_user)

@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense(expense_id: str, current_user: dict = Depends(get_current_user)):
    return await ExpensesService.get_expense(expense_id, current_user)

@router.get("/", response_model=List[ExpenseResponse])
async def get_all_expenses(current_user: dict = Depends(get_current_user)):
    return await ExpensesService.get_all_expenses(current_user)

@router.put("/{expense_id}")
async def update_expense(expense_id: str, expense_data: UpdateExpense, current_user: dict = Depends(get_current_user)):
    return await ExpensesService.update_expense(expense_id, expense_data, current_user)

@router.delete("/{expense_id}")
async def delete_expense(expense_id: str, current_user: dict = Depends(get_current_user)):
    return await ExpensesService.delete_expense(expense_id, current_user)

@router.post("/upload-receipt/{expense_id}")
async def upload_receipt(expense_id: str, file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    return await ExpensesService.upload_receipt(expense_id, file, current_user)