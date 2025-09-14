import logging
from fastapi import Depends, HTTPException, status
from database.connection import get_db_connection
from schemas.investment import InvestmentCreate, InvestmentResponse, UpdateInvestment
from utils.dependencies import get_current_user
import uuid
from datetime import date, datetime

class InvestmentsService:
    @staticmethod
    async def create_investment(investment_data: InvestmentCreate, current_user: dict = Depends(get_current_user)):
        """Create a new investment record"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            investment_id = str(uuid.uuid4())
            user_id = current_user["id"]

            cursor.execute('''
                INSERT INTO investments (
                    id, user_id, investment_type, name, amount,current_value, date, 
                    maturity_date, interest_rate, is_recurring, frequency
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                investment_id,
                user_id,
                investment_data.investment_type,
                investment_data.name,
                investment_data.amount,
                investment_data.current_value,
                investment_data.date,
                investment_data.maturity_date,
                investment_data.interest_rate,
                investment_data.is_recurring,
                investment_data.frequency
            ))

            conn.commit()
            cursor.execute("SELECT * FROM investments WHERE id = ?", (investment_id,))
            investment = cursor.fetchone()
            conn.close()

            return InvestmentResponse(
                id=investment["id"],
                investment_type=investment["investment_type"],
                name=investment["name"],
                amount=investment["amount"],
                current_value=investment["current_value"],
                date=investment["date"],
                maturity_date=investment["maturity_date"],
                interest_rate=investment["interest_rate"],
                is_recurring=investment["is_recurring"],
                frequency=investment["frequency"],
                created_at=investment["created_at"]
            )

        except Exception as e:
            logging.error(f"Error creating investment: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create investment")

    @staticmethod
    async def get_investment(investment_id: str, current_user: dict = Depends(get_current_user)):
        """Retrieve a specific investment record"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            user_id = current_user["id"]

            cursor.execute("SELECT * FROM investments WHERE id = ? AND user_id = ?", (investment_id, user_id))
            investment = cursor.fetchone()
            conn.close()

            if not investment:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Investment not found")

            return InvestmentResponse(
                id=investment["id"],
                investment_type=investment["investment_type"],
                name=investment["name"],
                amount=investment["amount"],
                current_value=investment["current_value"],
                date=investment["date"],
                maturity_date=investment["maturity_date"],
                interest_rate=investment["interest_rate"],
                is_recurring=investment["is_recurring"],
                frequency=investment["frequency"],
                created_at=investment["created_at"]
            )

        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"Error fetching investment: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch investment")

    @staticmethod
    async def get_all_investments(current_user: dict = Depends(get_current_user)):
        """Retrieve all investment records for the user"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            user_id = current_user["id"]

            cursor.execute("SELECT * FROM investments WHERE user_id = ? ORDER BY date DESC", (user_id,))
            investments = cursor.fetchall()
            conn.close()

            return [
                InvestmentResponse(
                    id=investment["id"],
                    investment_type=investment["investment_type"],
                    name=investment["name"],
                    amount=investment["amount"],
                    current_value=investment["current_value"],
                    date=investment["date"],
                    maturity_date=investment["maturity_date"],
                    interest_rate=investment["interest_rate"],
                    is_recurring=investment["is_recurring"],
                    frequency=investment["frequency"],
                    created_at=investment["created_at"]
                ) for investment in investments
            ]

        except Exception as e:
            logging.error(f"Error fetching investments: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch investments")

    @staticmethod
    async def update_investment(investment_id: str, investment_data: UpdateInvestment, current_user: dict = Depends(get_current_user)):
        """Update an existing investment record"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            user_id = current_user["id"]

            cursor.execute("SELECT id FROM investments WHERE id = ? AND user_id = ?", (investment_id, user_id))
            if not cursor.fetchone():
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Investment not found or access denied")

            update_fields = []
            update_values = []
            if investment_data.name is not None:
                update_fields.append("name = ?")
                update_values.append(investment_data.name)
            if investment_data.type is not None:
                update_fields.append("investment_type = ?")
                update_values.append(investment_data.type)
            if investment_data.amount is not None:
                update_fields.append("amount = ?")
                update_values.append(investment_data.amount)
            if investment_data.current_value is not None:
                update_fields.append("current_value = ?")
                update_values.append(investment_data.current_value)  
            if investment_data.date is not None:
                update_fields.append("date = ?")
                update_values.append(investment_data.date)
            if investment_data.notes is not None:
                update_fields.append("description = ?")
                update_values.append(investment_data.notes)

            if not update_fields:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields provided for update")

            update_fields.append("updated_at = CURRENT_TIMESTAMP")
            update_values.extend([investment_id, user_id])

            query = f"UPDATE investments SET {', '.join(update_fields)} WHERE id = ? AND user_id = ?"
            cursor.execute(query, tuple(update_values))
            conn.commit()
            conn.close()

            return {"message": "Investment record updated successfully"}

        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"Error updating investment: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update investment")

    @staticmethod
    async def delete_investment(investment_id: str, current_user: dict = Depends(get_current_user)):
        """Delete an investment record"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            user_id = current_user["id"]

            cursor.execute("SELECT id FROM investments WHERE id = ? AND user_id = ?", (investment_id, user_id))
            if not cursor.fetchone():
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Investment not found or access denied")

            cursor.execute("DELETE FROM investments WHERE id = ? AND user_id = ?", (investment_id, user_id))
            conn.commit()
            conn.close()

            return {"message": "Investment record deleted successfully"}

        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"Error deleting investment: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete investment")