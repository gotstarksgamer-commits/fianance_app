import logging
from fastapi import Depends, HTTPException, status
from database.connection import get_db_connection
from schemas.budget import BudgetCreate, BudgetResponse, UpdateBudget
from utils.dependencies import get_current_user
import uuid
from datetime import datetime, timezone

class BudgetsService:
    @staticmethod
    async def create_budget(budget_data: BudgetCreate, current_user: dict = Depends(get_current_user)):
        """Create or update a budget record"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            user_id = current_user["id"]
            budget_id = str(uuid.uuid4())

            cursor.execute('SELECT id FROM budgets WHERE category = ? AND user_id = ?', (budget_data.category, user_id))
            existing = cursor.fetchone()

            if existing:
                cursor.execute('''
                    UPDATE budgets 
                    SET monthly_limit = ?, alert_threshold = ?
                    WHERE category = ? AND user_id = ?
                ''', (budget_data.monthly_limit, budget_data.alert_threshold, budget_data.category, user_id))
                budget_id = existing['id']
            else:
                cursor.execute('''
                    INSERT INTO budgets (id, user_id, category, monthly_limit, alert_threshold)
                    VALUES (?, ?, ?, ?, ?)
                ''', (budget_id, user_id, budget_data.category, budget_data.monthly_limit, budget_data.alert_threshold))

            conn.commit()

            cursor.execute('''
                SELECT SUM(amount) as spent
                FROM expenses 
                WHERE category = ? AND user_id = ? AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
            ''', (budget_data.category, user_id))

            spent_result = cursor.fetchone()
            current_spent = spent_result['spent'] or 0
            conn.close()

            remaining = budget_data.monthly_limit - current_spent
            percentage_used = (current_spent / budget_data.monthly_limit) * 100 if budget_data.monthly_limit > 0 else 0
            is_over_budget = current_spent > budget_data.monthly_limit

            return BudgetResponse(
                id=budget_id,
                category=budget_data.category,
                monthly_limit=budget_data.monthly_limit,
                current_spent=current_spent,
                remaining=remaining,
                alert_threshold=budget_data.alert_threshold,
                percentage_used=round(percentage_used, 2),
                is_over_budget=is_over_budget,
                created_at=datetime.now(timezone.utc).isoformat()
            )

        except Exception as e:
            logging.error(f"Error creating budget: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create budget")

    @staticmethod
    async def get_budget(budget_id: str, current_user: dict = Depends(get_current_user)):
        """Retrieve a specific budget record"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            user_id = current_user["id"]

            cursor.execute("SELECT * FROM budgets WHERE id = ? AND user_id = ?", (budget_id, user_id))
            budget = cursor.fetchone()

            if not budget:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")

            cursor.execute('''
                SELECT SUM(amount) as spent
                FROM expenses 
                WHERE category = ? AND user_id = ? AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
            ''', (budget["category"], user_id))

            spent_result = cursor.fetchone()
            current_spent = spent_result['spent'] or 0
            conn.close()

            remaining = budget["monthly_limit"] - current_spent
            percentage_used = (current_spent / budget["monthly_limit"]) * 100 if budget["monthly_limit"] > 0 else 0
            is_over_budget = current_spent > budget["monthly_limit"]

            return BudgetResponse(
                id=budget["id"],
                category=budget["category"],
                monthly_limit=budget["monthly_limit"],
                current_spent=current_spent,
                remaining=remaining,
                alert_threshold=budget["alert_threshold"],
                percentage_used=round(percentage_used, 2),
                is_over_budget=is_over_budget,
                created_at=budget["created_at"]
            )

        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"Error fetching budget: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch budget")

    @staticmethod
    async def get_all_budgets(current_user: dict = Depends(get_current_user)):
        """Retrieve all budget records for the user"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            user_id = current_user["id"]

            cursor.execute('SELECT * FROM budgets WHERE user_id = ? ORDER BY category', (user_id,))
            budgets = cursor.fetchall()

            result = []
            for budget in budgets:
                cursor.execute('''
                    SELECT SUM(amount) as spent
                    FROM expenses 
                    WHERE category = ? AND user_id = ? AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
                ''', (budget['category'], user_id))

                spent_result = cursor.fetchone()
                current_spent = spent_result['spent'] or 0

                remaining = budget['monthly_limit'] - current_spent
                percentage_used = (current_spent / budget['monthly_limit']) * 100 if budget['monthly_limit'] > 0 else 0
                is_over_budget = current_spent > budget['monthly_limit']

                result.append(BudgetResponse(
                    id=budget['id'],
                    category=budget['category'],
                    monthly_limit=budget['monthly_limit'],
                    current_spent=current_spent,
                    remaining=remaining,
                    alert_threshold=budget['alert_threshold'],
                    percentage_used=round(percentage_used, 2),
                    is_over_budget=is_over_budget,
                    created_at=budget['created_at']
                ))

            conn.close()
            return result

        except Exception as e:
            logging.error(f"Error fetching budgets: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch budgets")

    @staticmethod
    async def update_budget(budget_id: str, budget_data: UpdateBudget, current_user: dict = Depends(get_current_user)):
        """Update an existing budget record"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            user_id = current_user["id"]

            cursor.execute("SELECT id FROM budgets WHERE id = ? AND user_id = ?", (budget_id, user_id))
            if not cursor.fetchone():
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget record not found or access denied")

            update_fields = []
            update_values = []
            if budget_data.category is not None:
                update_fields.append("category = ?")
                update_values.append(budget_data.category)
            if budget_data.amount is not None:
                update_fields.append("monthly_limit = ?")
                update_values.append(budget_data.amount)
            if budget_data.start_date is not None or budget_data.end_date is not None:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Start and end dates not supported for budgets")

            if not update_fields:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No valid fields provided for update")

            update_fields.append("updated_at = CURRENT_TIMESTAMP")
            update_values.extend([budget_id, user_id])

            query = f"UPDATE budgets SET {', '.join(update_fields)} WHERE id = ? AND user_id = ?"
            cursor.execute(query, tuple(update_values))
            conn.commit()
            conn.close()

            return {"message": "Budget record updated successfully"}

        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"Error updating budget: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update budget")

    @staticmethod
    async def delete_budget(budget_id: str, current_user: dict = Depends(get_current_user)):
        """Delete a budget record"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            user_id = current_user["id"]

            cursor.execute("SELECT id FROM budgets WHERE id = ? AND user_id = ?", (budget_id, user_id))
            if not cursor.fetchone():
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget record not found or access denied")

            cursor.execute("DELETE FROM budgets WHERE id = ? AND user_id = ?", (budget_id, user_id))
            conn.commit()
            conn.close()

            return {"message": "Budget record deleted successfully"}

        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"Error deleting budget: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete budget")