from fastapi import APIRouter, Depends
from services.dashboard_service import DashboardService
from utils.dependencies import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/")
async def get__dashboard(current_user: dict = Depends(get_current_user)):
    return await DashboardService.get_dashboard(current_user)

@router.get("/complete")
async def get_complete_dashboard(current_user: dict = Depends(get_current_user)):
    return await DashboardService.get_complete_dashboard(current_user)

@router.get("/monthly-income")
async def get_monthly_income_data(current_user: dict = Depends(get_current_user)):
    return await DashboardService.get_monthly_income(current_user)

@router.get("/cashflow/{period}")
async def get_cashflow_analysis(
    period: str,
    current_user: dict = Depends(get_current_user)
):
    """Get cash flow analysis data for specified period"""
    return await DashboardService.get_cashflow_analysis(current_user, period)

@router.get("/budget/performance")
async def get_budget_performance(current_user: dict = Depends(get_current_user)):
    """Get budget vs actual performance data"""
    return await DashboardService.get_budget_performance(current_user)

@router.get("/investments/performance")
async def get_investment_performance(current_user: dict = Depends(get_current_user)):
    """Get investment portfolio performance data"""
    return await DashboardService.get_investment_performance(current_user)

@router.get("/health-score")
async def get_financial_health_score(current_user: dict = Depends(get_current_user)):
    """Get comprehensive financial health score"""
    return await DashboardService.get_financial_health_score(current_user)

@router.get("/income/sources")
async def get_income_sources(current_user: dict = Depends(get_current_user)):
    """Get income source breakdown"""
    return await DashboardService.get_income_sources(current_user)