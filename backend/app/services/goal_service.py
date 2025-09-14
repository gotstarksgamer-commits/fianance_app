import logging
from fastapi import Depends, HTTPException, status
from database.connection import get_db_connection
from schemas.goal import SavingsGoalCreate, SavingsGoalResponse, UpdateSavingsGoal
from utils.dependencies import get_current_user
import uuid
from datetime import datetime

class SavingsService:
    @staticmethod
    async def create_savings_goal(goal_data: SavingsGoalCreate, current_user: dict = Depends(get_current_user)):
        """Create a new savings goal"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            goal_id = str(uuid.uuid4())
            user_id = current_user["id"]

            cursor.execute('''
                INSERT INTO savings_goals (id, user_id, goal_name,goal_type, target_amount, current_amount, target_date, description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                goal_id,
                user_id,
                goal_data.goal_name,
                goal_data.goal_type,
                goal_data.target_amount,
                goal_data.current_amount,
                goal_data.target_date,
                goal_data.description
            ))

            conn.commit()
            cursor.execute("SELECT * FROM savings_goals WHERE id = ?", (goal_id,))
            goal = cursor.fetchone()
            conn.close()

            progress_percentage = (goal["current_amount"] / goal["target_amount"]) * 100 if goal["target_amount"] > 0 else 0

            return SavingsGoalResponse(
                id=goal["id"],
                goal_name=goal["goal_name"],
                goal_type=goal["goal_type"],
                target_amount=goal["target_amount"],
                current_amount=goal["current_amount"],
                target_date=goal["target_date"],
                description=goal["description"],
                progress_percentage=round(progress_percentage, 2),
                created_at=goal["created_at"]
            )

        except Exception as e:
            logging.error(f"Error creating savings goal: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create savings goal")

    @staticmethod
    async def get_savings_goal(goal_id: str, current_user: dict = Depends(get_current_user)):
        """Retrieve a specific savings goal"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            user_id = current_user["id"]

            cursor.execute("SELECT * FROM savings_goals WHERE id = ? AND user_id = ?", (goal_id, user_id))
            goal = cursor.fetchone()
            conn.close()

            if not goal:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Savings goal not found")

            progress_percentage = (goal["current_amount"] / goal["target_amount"]) * 100 if goal["target_amount"] > 0 else 0

            return SavingsGoalResponse(
                id=goal["id"],
                goal_name=goal["goal_name"],
                goal_type=goal["goal_type"],
                target_amount=goal["target_amount"],
                current_amount=goal["current_amount"],
                target_date=goal["target_date"],
                description=goal["description"],
                progress_percentage=round(progress_percentage, 2),
                created_at=goal["created_at"]
            )

        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"Error fetching savings goal: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch savings goal")

    @staticmethod
    async def get_all_savings_goals(current_user: dict = Depends(get_current_user)):
        """Retrieve all savings goals for the user"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            user_id = current_user["id"]

            cursor.execute("SELECT * FROM savings_goals WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
            goals = cursor.fetchall()
            conn.close()

            return [
                SavingsGoalResponse(
                    id=goal["id"],
                    goal_name=goal["goal_name"],
                    goal_type=goal["goal_type"],
                    target_amount=goal["target_amount"],
                    current_amount=goal["current_amount"],
                    target_date=goal["target_date"],
                    description=goal["description"],
                    progress_percentage=round((goal["current_amount"] / goal["target_amount"]) * 100, 2) if goal["target_amount"] > 0 else 0,
                    created_at=goal["created_at"]
                ) for goal in goals
            ]

        except Exception as e:
            logging.error(f"Error fetching savings goals: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch savings goals")

    @staticmethod
    async def update_savings_goal(goal_id: str, goal_data: UpdateSavingsGoal, current_user: dict = Depends(get_current_user)):
        """Update an existing savings goal"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            user_id = current_user["id"]

            cursor.execute("SELECT id FROM savings_goals WHERE id = ? AND user_id = ?", (goal_id, user_id))
            if not cursor.fetchone():
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Savings goal not found or access denied")

            update_fields = []
            update_values = []
            if goal_data.name is not None:
                update_fields.append("goal_name = ?")
                update_values.append(goal_data.name)
            if goal_data.goal_type is not None:
                update_fields.append("goal_type = ?")
                update_values.append(goal_data.goal_type)
            if goal_data.target_amount is not None:
                update_fields.append("target_amount = ?")
                update_values.append(goal_data.target_amount)
            if goal_data.current_amount is not None:
                update_fields.append("current_amount = ?")
                update_values.append(goal_data.current_amount)
            if goal_data.target_date is not None:
                update_fields.append("target_date = ?")
                update_values.append(goal_data.target_date)
            if goal_data.notes is not None:
                update_fields.append("description = ?")
                update_values.append(goal_data.notes)

            if not update_fields:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields provided for update")

            update_fields.append("updated_at = CURRENT_TIMESTAMP")
            update_values.extend([goal_id, user_id])

            query = f"UPDATE savings_goals SET {', '.join(update_fields)} WHERE id = ? AND user_id = ?"
            cursor.execute(query, tuple(update_values))
            conn.commit()
            conn.close()

            return {"message": "Savings goal updated successfully"}

        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"Error updating savings goal: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update savings goal")

    @staticmethod
    async def delete_savings_goal(goal_id: str, current_user: dict = Depends(get_current_user)):
        """Delete a savings goal"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            user_id = current_user["id"]

            cursor.execute("SELECT id FROM savings_goals WHERE id = ? AND user_id = ?", (goal_id, user_id))
            if not cursor.fetchone():
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Savings goal not found or access denied")

            cursor.execute("DELETE FROM savings_goals WHERE id = ? AND user_id = ?", (goal_id, user_id))
            conn.commit()
            conn.close()

            return {"message": "Savings goal deleted successfully"}

        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"Error deleting savings goal: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete savings goal")