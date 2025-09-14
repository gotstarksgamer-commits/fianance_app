from pydantic import BaseModel
from typing import List, Optional

class DashboardResponse(BaseModel):
    total_expenses: float
    total_income: float
    monthly_expenses: dict
    category_breakdown: dict
    recent_transactions: List[dict]

class CashFlowData(BaseModel):
    month: str
    income: float
    expenses: float
    net_flow: float
    cumulative_savings: float

class CashFlowSummary(BaseModel):
    avg_monthly_income: float
    avg_monthly_expenses: float
    avg_net_flow: float
    total_period_savings: float

class CashFlowResponse(BaseModel):
    cashflow_data: List[CashFlowData]
    summary: CashFlowSummary

class BudgetPerformanceItem(BaseModel):
    category: str
    budgeted: float
    actual: float
    variance: float
    variance_percent: float
    status: str  # "under_budget", "over_budget", "near_budget"

class BudgetPerformanceResponse(BaseModel):
    budget_performance: List[BudgetPerformanceItem]

class AssetAllocation(BaseModel):
    asset_type: str
    amount: float
    percentage: float
    returns: float
    return_rate: float

class PerformanceHistory(BaseModel):
    date: str
    portfolio_value: float
    invested_amount: float

class Portfolio(BaseModel):
    total_value: float
    total_invested: float
    total_returns: float
    return_percentage: float
    allocation: List[AssetAllocation]
    performance_history: List[PerformanceHistory]

class InvestmentPerformanceResponse(BaseModel):
    portfolio: Portfolio

class HealthScoreComponents(BaseModel):
    emergency_fund: int
    debt_management: int
    savings_rate: int
    investment_diversity: int
    budget_adherence: int

class HealthScoreRecommendation(BaseModel):
    area: str
    suggestion: str
    impact: str

class HealthScore(BaseModel):
    overall_score: int
    components: HealthScoreComponents
    recommendations: List[HealthScoreRecommendation]

class FinancialHealthScoreResponse(BaseModel):
    health_score: HealthScore

class IncomeSource(BaseModel):
    source: str
    amount: float
    percentage: float
    growth: Optional[float] = None

class IncomeSourcesResponse(BaseModel):
    income_sources: List[IncomeSource]