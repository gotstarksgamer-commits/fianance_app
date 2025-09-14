import logging
from schemas.dashboard import DashboardResponse
from fastapi import Depends, HTTPException, status
from database.connection import get_db_connection
from utils.dependencies import get_current_user
from datetime import datetime, timezone
from dateutil.relativedelta import relativedelta
import calendar

class DashboardService:
    @staticmethod
    async def get_complete_dashboard(current_user: dict = Depends(get_current_user)):
        """Get comprehensive dashboard data for user"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            user_id = current_user["id"]
            
            # Basic financial data for user
            cursor.execute('SELECT SUM(amount) as total FROM expenses WHERE user_id = ?', (user_id,))
            total_expenses = cursor.fetchone()['total'] or 0
            
            cursor.execute('SELECT SUM(amount) as total FROM income WHERE user_id = ?', (user_id,))
            total_income = cursor.fetchone()['total'] or 0
            
            cursor.execute('SELECT SUM(amount) as total FROM investments WHERE user_id = ?', (user_id,))
            total_investments = cursor.fetchone()['total'] or 0
            
            # Savings goals progress for user
            cursor.execute('''
                SELECT COUNT(*) as count, SUM(current_amount) as saved, SUM(target_amount) as target 
                FROM savings_goals WHERE user_id = ?
            ''', (user_id,))
            goals_data = cursor.fetchone()
            
            # Budget alerts for user
            cursor.execute('''
                SELECT b.category, b.monthly_limit, b.alert_threshold,
                    COALESCE(SUM(e.amount), 0) as spent
                FROM budgets b
                LEFT JOIN expenses e ON b.category = e.category 
                    AND b.user_id = e.user_id
                    AND strftime('%Y-%m', e.date) = strftime('%Y-%m', 'now')
                WHERE b.user_id = ?
                GROUP BY b.category, b.monthly_limit, b.alert_threshold
            ''', (user_id,))
            budget_data = cursor.fetchall()
            
            budget_alerts = []
            for budget in budget_data:
                percentage = (budget['spent'] / budget['monthly_limit']) * 100 if budget['monthly_limit'] > 0 else 0
                if percentage >= budget['alert_threshold']:
                    budget_alerts.append({
                        "category": budget['category'],
                        "spent": budget['spent'],
                        "limit": budget['monthly_limit'],
                        "percentage": round(percentage, 2)
                    })
            
            # Investment breakdown for user
            cursor.execute('''
                SELECT investment_type, SUM(amount) as total
                FROM investments
                WHERE user_id = ?
                GROUP BY investment_type
                ORDER BY total DESC
            ''', (user_id,))
            investment_breakdown = {row['investment_type']: row['total'] for row in cursor.fetchall()}
            
            conn.close()
            
            return {
                "user_name": current_user["name"],
                "total_income": total_income,
                "total_expenses": total_expenses,
                "total_investments": total_investments,
                "net_worth": total_income - total_expenses + total_investments,
                "savings_goals": {
                    "count": goals_data['count'] or 0,
                    "saved": goals_data['saved'] or 0,
                    "target": goals_data['target'] or 0,
                    "progress": ((goals_data['saved'] or 0) / (goals_data['target'] or 1)) * 100
                },
                "budget_alerts": budget_alerts,
                "investment_breakdown": investment_breakdown
            }
            
        except Exception as e:
            logging.error(f"Error fetching complete dashboard: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to fetch dashboard data")

    @staticmethod
    async def get_dashboard(current_user: dict = Depends(get_current_user)):
        """Get dashboard data with user's financial overview"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            user_id = current_user["id"]
            
            # Get total expenses for user
            cursor.execute('SELECT SUM(amount) as total FROM expenses WHERE user_id = ?', (user_id,))
            total_expenses_result = cursor.fetchone()
            total_expenses = total_expenses_result['total'] or 0
            
            # Get total income for user
            cursor.execute('SELECT SUM(amount) as total FROM income WHERE user_id = ?', (user_id,))
            total_income_result = cursor.fetchone()
            total_income = total_income_result['total'] or 0
            
            # Get monthly expenses for user (current year)
            cursor.execute('''
                SELECT strftime('%Y-%m', date) as month, SUM(amount) as total
                FROM expenses 
                WHERE user_id = ? AND date >= date('now', 'start of year')
                GROUP BY strftime('%Y-%m', date)
                ORDER BY month
            ''', (user_id,))
            monthly_data = cursor.fetchall()
            monthly_expenses = {row['month']: row['total'] for row in monthly_data}
            
            # Get category breakdown for user
            cursor.execute('''
                SELECT category, SUM(amount) as total
                FROM expenses
                WHERE user_id = ?
                GROUP BY category
                ORDER BY total DESC
            ''', (user_id,))
            category_data = cursor.fetchall()
            category_breakdown = {row['category']: row['total'] for row in category_data}
            
            # Get recent transactions for user
            cursor.execute('''
                SELECT category, amount, description, date
                FROM expenses
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT 10
            ''', (user_id,))
            recent_data = cursor.fetchall()
            recent_transactions = []
            for row in recent_data:
                recent_transactions.append({
                    "type": "expense",
                    "category": row['category'],
                    "amount": row['amount'],
                    "description": row['description'],
                    "date": row['date']
                })
            
            conn.close()
            
            return DashboardResponse(
                total_expenses=total_expenses,
                total_income=total_income,
                monthly_expenses=monthly_expenses,
                category_breakdown=category_breakdown,
                recent_transactions=recent_transactions
            )
            
        except Exception as e:
            logging.error(f"Error fetching dashboard data: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to fetch dashboard data")

    @staticmethod
    async def get_monthly_income(current_user: dict = Depends(get_current_user)):
        """Get monthly income data for the current year"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            user_id = current_user["id"]
            
            cursor.execute('''
                SELECT strftime('%Y-%m', date) as month, SUM(amount) as total
                FROM income 
                WHERE user_id = ? AND date >= date('now', 'start of year')
                GROUP BY strftime('%Y-%m', date)
                ORDER BY month
            ''', (user_id,))
            monthly_data = cursor.fetchall()
            monthly_income = {row['month']: row['total'] for row in monthly_data}
            
            conn.close()
            return monthly_income
            
        except Exception as e:
            logging.error(f"Error fetching monthly income data: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to fetch monthly income data")

    @staticmethod
    async def get_cashflow_analysis(current_user: dict, period: str = "6months"):
        """Get cash flow analysis for specified period"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            user_id = current_user["id"]
            
            # Calculate period months
            periods = {
                "3months": 3,
                "6months": 6, 
                "1year": 12
            }
            months_back = periods.get(period, 6)
            
            # Get monthly cash flow data
            cursor.execute('''
                WITH monthly_cashflow AS (
                    SELECT 
                        strftime('%Y-%m', date) as month,
                        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income,
                        0 as expenses
                    FROM income 
                    WHERE user_id = ? AND date >= date('now', '-{} months')
                    GROUP BY strftime('%Y-%m', date)
                    
                    UNION ALL
                    
                    SELECT 
                        strftime('%Y-%m', date) as month,
                        0 as income,
                        SUM(amount) as expenses
                    FROM expenses
                    WHERE user_id = ? AND date >= date('now', '-{} months')
                    GROUP BY strftime('%Y-%m', date)
                )
                SELECT 
                    month,
                    SUM(income) as total_income,
                    SUM(expenses) as total_expenses,
                    SUM(income) - SUM(expenses) as net_flow
                FROM monthly_cashflow
                GROUP BY month
                ORDER BY month
            '''.format(months_back, months_back), (user_id, user_id))
            
            cashflow_data = []
            cumulative_savings = 0
            
            for row in cursor.fetchall():
                net_flow = row['total_income'] - row['total_expenses']
                cumulative_savings += net_flow
                
                # Format month name
                year, month = row['month'].split('-')
                month_name = f"{calendar.month_abbr[int(month)]} {year}"
                
                cashflow_data.append({
                    "month": month_name,
                    "income": float(row['total_income']),
                    "expenses": float(row['total_expenses']),
                    "net_flow": float(net_flow),
                    "cumulative_savings": float(cumulative_savings)
                })
            
            # Calculate summary
            if cashflow_data:
                avg_income = sum(item['income'] for item in cashflow_data) / len(cashflow_data)
                avg_expenses = sum(item['expenses'] for item in cashflow_data) / len(cashflow_data)
                avg_net_flow = sum(item['net_flow'] for item in cashflow_data) / len(cashflow_data)
                total_savings = sum(item['net_flow'] for item in cashflow_data)
            else:
                avg_income = avg_expenses = avg_net_flow = total_savings = 0
            
            conn.close()
            
            return {
                "cashflow_data": cashflow_data,
                "summary": {
                    "avg_monthly_income": float(avg_income),
                    "avg_monthly_expenses": float(avg_expenses), 
                    "avg_net_flow": float(avg_net_flow),
                    "total_period_savings": float(total_savings)
                }
            }
            
        except Exception as e:
            logging.error(f"Error fetching cashflow analysis: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to fetch cashflow data")

    @staticmethod
    async def get_budget_performance(current_user: dict):
        """Get budget vs actual performance"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            user_id = current_user["id"]
            
            # Get budget performance data
            cursor.execute('''
                SELECT 
                    b.category,
                    b.monthly_limit as budgeted,
                    COALESCE(SUM(e.amount), 0) as actual
                FROM budgets b
                LEFT JOIN expenses e ON b.category = e.category 
                    AND b.user_id = e.user_id
                    AND strftime('%Y-%m', e.date) = strftime('%Y-%m', 'now')
                WHERE b.user_id = ?
                GROUP BY b.category, b.monthly_limit
            ''', (user_id,))
            
            budget_performance = []
            for row in cursor.fetchall():
                budgeted = float(row['budgeted'])
                actual = float(row['actual'])
                variance = actual - budgeted
                variance_percent = (variance / budgeted * 100) if budgeted > 0 else 0
                
                # Determine status
                if actual > budgeted:
                    status = "over_budget"
                elif actual > (budgeted * 0.8):
                    status = "near_budget"
                else:
                    status = "under_budget"
                
                budget_performance.append({
                    "category": row['category'],
                    "budgeted": budgeted,
                    "actual": actual,
                    "variance": variance,
                    "variance_percent": variance_percent,
                    "status": status
                })
            
            conn.close()
            
            return {
                "budget_performance": budget_performance
            }
            
        except Exception as e:
            logging.error(f"Error fetching budget performance: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to fetch budget performance")

    @staticmethod
    async def get_investment_performance(current_user: dict):
        """Get investment portfolio performance"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            user_id = current_user["id"]
            
            # Get total investment values
            cursor.execute('''
                SELECT 
                    COALESCE(SUM(amount), 0) as total_invested,
                    COALESCE(SUM(COALESCE(current_value, amount)), 0) as total_value
                FROM investments 
                WHERE user_id = ?
            ''', (user_id,))
            
            totals = cursor.fetchone()
            total_invested = float(totals['total_invested'])
            total_value = float(totals['total_value'])
            total_returns = total_value - total_invested
            return_percentage = (total_returns / total_invested * 100) if total_invested > 0 else 0
            
            # Get asset allocation
            cursor.execute('''
                SELECT 
                    investment_type as asset_type,
                    COALESCE(SUM(amount), 0) as amount,
                    COALESCE(SUM(COALESCE(current_value, amount)), 0) as current_value
                FROM investments
                WHERE user_id = ?
                GROUP BY investment_type
                HAVING SUM(amount) > 0
            ''', (user_id,))
            
            allocation = []
            allocation_data = cursor.fetchall()
            
            for row in allocation_data:
                amount = float(row['current_value'])
                invested = float(row['amount'])
                returns = amount - invested
                return_rate = (returns / invested * 100) if invested > 0 else 0
                percentage = (amount / total_value * 100) if total_value > 0 else 0
                
                allocation.append({
                    "asset_type": row['asset_type'],
                    "amount": amount,
                    "percentage": percentage,
                    "returns": returns,
                    "return_rate": return_rate
                })
            
            # Get performance history (mock data for now - enhance with real historical data later)
            performance_history = []
            if total_value > 0:
                for i in range(6):
                    month_date = datetime.now() - relativedelta(months=i)
                    month_str = month_date.strftime('%Y-%m')
                    
                    # Simple growth simulation
                    growth_factor = 1 + (0.01 * (6-i))  # Simulate growth over time
                    performance_history.append({
                        "date": month_str,
                        "portfolio_value": total_value * growth_factor,
                        "invested_amount": total_invested
                    })
                
                performance_history.reverse()  # Chronological order
            
            conn.close()
            
            return {
                "portfolio": {
                    "total_value": total_value,
                    "total_invested": total_invested,
                    "total_returns": total_returns,
                    "return_percentage": return_percentage,
                    "allocation": allocation,
                    "performance_history": performance_history
                }
            }
            
        except Exception as e:
            logging.error(f"Error fetching investment performance: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to fetch investment performance")

    @staticmethod
    async def get_financial_health_score(current_user: dict):
        """Calculate comprehensive financial health score"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            user_id = current_user["id"]
            
            # Get financial data for scoring with proper null handling
            cursor.execute('SELECT COALESCE(SUM(amount), 0) as total FROM income WHERE user_id = ?', (user_id,))
            total_income = float(cursor.fetchone()['total'])
            
            cursor.execute('SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ?', (user_id,))
            total_expenses = float(cursor.fetchone()['total'])
            
            cursor.execute('SELECT COALESCE(SUM(amount), 0) as total FROM investments WHERE user_id = ?', (user_id,))
            total_investments = float(cursor.fetchone()['total'])
            
            # Calculate emergency fund (assuming emergency type goals)
            cursor.execute('''
                SELECT COALESCE(SUM(current_amount), 0) as emergency_fund
                FROM savings_goals 
                WHERE user_id = ? AND (goal_type = 'emergency' OR goal_name LIKE '%emergency%')
            ''', (user_id,))
            emergency_fund = float(cursor.fetchone()['emergency_fund'])
            
            # Calculate monthly expenses average (avoid division by zero)
            monthly_expenses = max(total_expenses / 12, 1) if total_expenses > 0 else 1
            
            # Calculate scores (0-100)
            
            # Emergency Fund Score (months of expenses covered)
            emergency_months = emergency_fund / monthly_expenses
            emergency_fund_score = min(100, (emergency_months / 6) * 100)  # 6 months = 100%
            
            # Debt Management Score (simplified for now)
            debt_management_score = 85  # Can be enhanced with actual debt data
            
            # Savings Rate Score
            if total_income > 0:
                savings_rate = ((total_income - total_expenses) / total_income * 100)
                savings_rate_score = min(100, max(0, savings_rate * 5))  # 20% savings rate = 100%
            else:
                savings_rate_score = 0
            
            # Investment Diversity Score
            cursor.execute('''
                SELECT COUNT(DISTINCT investment_type) as types
                FROM investments WHERE user_id = ? AND amount > 0
            ''', (user_id,))
            investment_types = cursor.fetchone()['types'] or 0
            investment_diversity_score = min(100, investment_types * 25)  # 4 types = 100%
            
            # Budget Adherence Score
            cursor.execute('''
                SELECT COUNT(*) as budget_count FROM budgets WHERE user_id = ?
            ''', (user_id,))
            budget_count = cursor.fetchone()['budget_count']
            
            if budget_count > 0:
                cursor.execute('''
                    SELECT AVG(adherence_score) as avg_adherence FROM (
                        SELECT 
                            CASE 
                                WHEN b.monthly_limit > 0 THEN 
                                    MAX(0, 100 - (COALESCE(expense_total, 0) / b.monthly_limit * 100))
                                ELSE 100 
                            END as adherence_score
                        FROM budgets b
                        LEFT JOIN (
                            SELECT 
                                category, 
                                user_id,
                                SUM(amount) as expense_total
                            FROM expenses 
                            WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
                            GROUP BY category, user_id
                        ) e ON b.category = e.category AND b.user_id = e.user_id
                        WHERE b.user_id = ?
                    ) adherence_calc
                ''', (user_id,))
                
                result = cursor.fetchone()
                budget_adherence_score = max(0, float(result['avg_adherence'] or 80))
            else:
                budget_adherence_score = 80  # Default score when no budgets exist
            
            # Calculate overall score
            overall_score = int((
                emergency_fund_score * 0.25 +
                debt_management_score * 0.20 +
                savings_rate_score * 0.25 +
                investment_diversity_score * 0.15 +
                budget_adherence_score * 0.15
            ))
            
            # Generate recommendations
            recommendations = []
            if emergency_fund_score < 60:
                needed_amount = max(0, (6 * monthly_expenses) - emergency_fund)
                recommendations.append({
                    "area": "emergency_fund",
                    "suggestion": f"Build emergency fund by ₹{int(needed_amount):,}",
                    "impact": f"+{int((60 - emergency_fund_score) * 0.25)} points"
                })
            
            if savings_rate_score < 60 and total_income > 0:
                recommendations.append({
                    "area": "savings_rate",
                    "suggestion": "Increase monthly savings rate to at least 15%",
                    "impact": f"+{int((60 - savings_rate_score) * 0.25)} points"
                })
            
            if investment_diversity_score < 60:
                recommendations.append({
                    "area": "investment_diversity",
                    "suggestion": "Diversify investments across different asset types",
                    "impact": f"+{int((60 - investment_diversity_score) * 0.15)} points"
                })
            
            if budget_adherence_score < 80 and budget_count == 0:
                recommendations.append({
                    "area": "budget_management",
                    "suggestion": "Create monthly budgets for better expense control",
                    "impact": "+5 points"
                })
            
            conn.close()
            
            return {
                "health_score": {
                    "overall_score": max(0, overall_score),
                    "components": {
                        "emergency_fund": max(0, int(emergency_fund_score)),
                        "debt_management": int(debt_management_score),
                        "savings_rate": max(0, int(savings_rate_score)),
                        "investment_diversity": int(investment_diversity_score),
                        "budget_adherence": max(0, int(budget_adherence_score))
                    },
                    "recommendations": recommendations
                }
            }
            
        except Exception as e:
            logging.error(f"Error calculating financial health score: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to calculate health score")

    @staticmethod
    async def get_income_sources(current_user: dict):
        """Get income source breakdown"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            user_id = current_user["id"]
            
            # Get income by source
            cursor.execute('''
                SELECT 
                    source,
                    SUM(amount) as total_amount
                FROM income
                WHERE user_id = ?
                GROUP BY source
                ORDER BY total_amount DESC
            ''', (user_id,))
            
            income_data = cursor.fetchall()
            total_income = sum(row['total_amount'] for row in income_data)
            
            # Get growth data (comparing current year to previous)
            cursor.execute('''
                SELECT 
                    source,
                    SUM(CASE WHEN strftime('%Y', date) = strftime('%Y', 'now') 
                        THEN amount ELSE 0 END) as current_year,
                    SUM(CASE WHEN strftime('%Y', date) = strftime('%Y', 'now', '-1 year') 
                        THEN amount ELSE 0 END) as previous_year
                FROM income
                WHERE user_id = ?
                GROUP BY source
            ''', (user_id,))
            
            growth_data = {row['source']: {
                'current': row['current_year'],
                'previous': row['previous_year']
            } for row in cursor.fetchall()}
            
            income_sources = []
            for row in income_data:
                source = row['source']
                amount = float(row['total_amount'])
                percentage = (amount / total_income * 100) if total_income > 0 else 0
                
                # Calculate growth
                growth = None
                if source in growth_data:
                    current = growth_data[source]['current']
                    previous = growth_data[source]['previous']
                    if previous > 0:
                        growth = ((current - previous) / previous * 100)
                
                income_sources.append({
                    "source": source,
                    "amount": amount,
                    "percentage": percentage,
                    "growth": growth
                })
            
            conn.close()
            
            return {
                "income_sources": income_sources
            }
            
        except Exception as e:
            logging.error(f"Error fetching income sources: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to fetch income sources")