import logging
from fastapi import Depends, HTTPException, status
from database.connection import get_db_connection
from schemas.income import IncomeCreate, IncomeResponse, UpdateIncome
from utils.dependencies import get_current_user
import uuid
from datetime import datetime

class IncomeService:
    @staticmethod
    async def create_income(income_data: IncomeCreate, current_user: dict = Depends(get_current_user)):
        """Create a new income record"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            income_id = str(uuid.uuid4())
            user_id = current_user["id"]

            cursor.execute('''
                INSERT INTO income (id, user_id, amount, source, description, date, is_recurring, frequency)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                income_id,
                user_id,
                income_data.amount,
                income_data.source,
                income_data.description,
                income_data.date,
                income_data.is_recurring,
                income_data.frequency
            ))

            conn.commit()
            cursor.execute("SELECT * FROM income WHERE id = ?", (income_id,))
            income = cursor.fetchone()
            conn.close()

            return IncomeResponse(
                id=income["id"],
                amount=income["amount"],
                source=income["source"],
                description=income["description"],
                date=income["date"],
                is_recurring=income["is_recurring"],
                frequency=income["frequency"],
                created_at=income["created_at"]
            )

        except Exception as e:
            logging.error(f"Error creating income: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create income")

    @staticmethod
    async def get_income(income_id: str, current_user: dict = Depends(get_current_user)):
        """Retrieve a specific income record"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            user_id = current_user["id"]

            cursor.execute("SELECT * FROM income WHERE id = ? AND user_id = ?", (income_id, user_id))
            income = cursor.fetchone()
            conn.close()

            if not income:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Income record not found")

            return IncomeResponse(
                id=income["id"],
                amount=income["amount"],
                source=income["source"],
                description=income["description"],
                date=income["date"],
                is_recurring=income["is_recurring"],
                frequency=income["frequency"],
                created_at=income["created_at"]
            )

        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"Error fetching income: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch income")

    @staticmethod
    async def get_all_income(current_user: dict = Depends(get_current_user)):
        """Retrieve all income records for the user"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            user_id = current_user["id"]

            cursor.execute("SELECT * FROM income WHERE user_id = ? ORDER BY date DESC", (user_id,))
            incomes = cursor.fetchall()
            conn.close()

            return [
                IncomeResponse(
                    id=income["id"],
                    amount=income["amount"],
                    source=income["source"],
                    description=income["description"],
                    date=income["date"],
                    is_recurring=income["is_recurring"],
                    frequency=income["frequency"],
                    created_at=income["created_at"]
                ) for income in incomes
            ]

        except Exception as e:
            logging.error(f"Error fetching incomes: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch incomes")

    @staticmethod
    async def update_income(income_id: str, income_data: UpdateIncome, current_user: dict = Depends(get_current_user)):
        """Update an existing income record"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            user_id = current_user["id"]

            cursor.execute("SELECT id FROM income WHERE id = ? AND user_id = ?", (income_id, user_id))
            if not cursor.fetchone():
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Income record not found or access denied")

            update_fields = []
            update_values = []
            if income_data.source is not None:
                update_fields.append("source = ?")
                update_values.append(income_data.source)
            if income_data.amount is not None:
                update_fields.append("amount = ?")
                update_values.append(income_data.amount)
            if income_data.date is not None:
                update_fields.append("date = ?")
                update_values.append(income_data.date)
            if income_data.description is not None:
                update_fields.append("description = ?")
                update_values.append(income_data.description)
            if income_data.frequency is not None:
                update_fields.append("frequency = ?")
                update_values.append(income_data.frequency)

            if not update_fields:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields provided for update")

            update_fields.append("updated_at = CURRENT_TIMESTAMP")
            update_values.extend([income_id, user_id])

            query = f"UPDATE income SET {', '.join(update_fields)} WHERE id = ? AND user_id = ?"
            cursor.execute(query, tuple(update_values))
            conn.commit()
            conn.close()

            return {"message": "Income record updated successfully"}

        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"Error updating income: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update income")

    @staticmethod
    async def delete_income(income_id: str, current_user: dict = Depends(get_current_user)):
        """Delete an income record"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            user_id = current_user["id"]

            cursor.execute("SELECT id FROM income WHERE id = ? AND user_id = ?", (income_id, user_id))
            if not cursor.fetchone():
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Income record not found or access denied")

            cursor.execute("DELETE FROM income WHERE id = ? AND user_id = ?", (income_id, user_id))
            conn.commit()
            conn.close()

            return {"message": "Income record deleted successfully"}

        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"Error deleting income: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete income")