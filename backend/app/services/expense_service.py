import logging
from fastapi import Depends, HTTPException, status, UploadFile
from database.connection import get_db_connection
from schemas.expense import ExpenseCreate, ExpenseResponse, UpdateExpense
from utils.dependencies import get_current_user
import uuid
from pathlib import Path
from datetime import datetime

ROOT_DIR = Path(__file__).parent.parent

class ExpensesService:
    @staticmethod
    async def create_expense(expense_data: ExpenseCreate, current_user: dict = Depends(get_current_user)):
        """Create a new expense record"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            expense_id = str(uuid.uuid4())
            user_id = current_user["id"]

            cursor.execute('''
                INSERT INTO expenses (id, user_id, amount, category, subcategory, description, date)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                expense_id,
                user_id,
                expense_data.amount,
                expense_data.category,
                expense_data.subcategory,
                expense_data.description,
                expense_data.date
            ))

            conn.commit()
            cursor.execute("SELECT * FROM expenses WHERE id = ?", (expense_id,))
            expense = cursor.fetchone()
            conn.close()

            return ExpenseResponse(
                id=expense["id"],
                amount=expense["amount"],
                category=expense["category"],
                subcategory=expense["subcategory"],
                description=expense["description"],
                date=expense["date"],
                receipt_path=expense["receipt_path"],
                created_at=expense["created_at"]
            )

        except Exception as e:
            logging.error(f"Error creating expense: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create expense")

    @staticmethod
    async def get_expense(expense_id: str, current_user: dict = Depends(get_current_user)):
        """Retrieve a specific expense record"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            user_id = current_user["id"]

            cursor.execute("SELECT * FROM expenses WHERE id = ? AND user_id = ?", (expense_id, user_id))
            expense = cursor.fetchone()
            conn.close()

            if not expense:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")

            return ExpenseResponse(
                id=expense["id"],
                amount=expense["amount"],
                category=expense["category"],
                subcategory=expense["subcategory"],
                description=expense["description"],
                date=expense["date"],
                receipt_path=expense["receipt_path"],
                created_at=expense["created_at"]
            )

        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"Error fetching expense: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch expense")

    @staticmethod
    async def get_all_expenses(current_user: dict = Depends(get_current_user)):
        """Retrieve all expense records for the user"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            user_id = current_user["id"]

            cursor.execute("SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC", (user_id,))
            expenses = cursor.fetchall()
            conn.close()

            return [
                ExpenseResponse(
                    id=expense["id"],
                    amount=expense["amount"],
                    category=expense["category"],
                    subcategory=expense["subcategory"],
                    description=expense["description"],
                    date=expense["date"],
                    receipt_path=expense["receipt_path"],
                    created_at=expense["created_at"]
                ) for expense in expenses
            ]

        except Exception as e:
            logging.error(f"Error fetching expenses: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch expenses")

    @staticmethod
    async def update_expense(expense_id: str, expense_data: UpdateExpense, current_user: dict = Depends(get_current_user)):
        """Update an existing expense record"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            user_id = current_user["id"]

            cursor.execute("SELECT id FROM expenses WHERE id = ? AND user_id = ?", (expense_id, user_id))
            if not cursor.fetchone():
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found or access denied")

            update_fields = []
            update_values = []
            if expense_data.category is not None:
                update_fields.append("category = ?")
                update_values.append(expense_data.category)
            if expense_data.amount is not None:
                update_fields.append("amount = ?")
                update_values.append(expense_data.amount)
            if expense_data.date is not None:
                update_fields.append("date = ?")
                update_values.append(expense_data.date)
            if expense_data.description is not None:
                update_fields.append("description = ?")
                update_values.append(expense_data.description)

            if not update_fields:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields provided for update")

            update_fields.append("updated_at = CURRENT_TIMESTAMP")
            update_values.extend([expense_id, user_id])

            query = f"UPDATE expenses SET {', '.join(update_fields)} WHERE id = ? AND user_id = ?"
            cursor.execute(query, tuple(update_values))
            conn.commit()
            conn.close()

            return {"message": "Expense record updated successfully"}

        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"Error updating expense: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update expense")

    @staticmethod
    async def delete_expense(expense_id: str, current_user: dict = Depends(get_current_user)):
        """Delete an expense record"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            user_id = current_user["id"]

            cursor.execute("SELECT id FROM expenses WHERE id = ? AND user_id = ?", (expense_id, user_id))
            if not cursor.fetchone():
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found or access denied")

            cursor.execute("DELETE FROM expenses WHERE id = ? AND user_id = ?", (expense_id, user_id))
            conn.commit()
            conn.close()

            return {"message": "Expense record deleted successfully"}

        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"Error deleting expense: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete expense")

    @staticmethod
    async def upload_receipt(expense_id: str, file: UploadFile, current_user: dict = Depends(get_current_user)):
        """Upload receipt for a user's expense"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            user_id = current_user["id"]

            cursor.execute('SELECT id FROM expenses WHERE id = ? AND user_id = ?', (expense_id, user_id))
            expense = cursor.fetchone()

            if not expense:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")

            upload_dir = ROOT_DIR / "uploads" / "receipts"
            upload_dir.mkdir(parents=True, exist_ok=True)

            file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
            unique_filename = f"{expense_id}_{uuid.uuid4().hex[:8]}.{file_extension}"
            file_path = upload_dir / unique_filename

            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)

            cursor.execute('''
                UPDATE expenses 
                SET receipt_path = ?
                WHERE id = ? AND user_id = ?
            ''', (str(file_path), expense_id, user_id))

            receipt_id = str(uuid.uuid4())
            cursor.execute('''
                INSERT INTO receipts (id, expense_id, file_name, file_path, file_size)
                VALUES (?, ?, ?, ?, ?)
            ''', (receipt_id, expense_id, file.filename, str(file_path), len(content)))

            conn.commit()
            conn.close()

            return {
                "message": "Receipt uploaded successfully",
                "receipt_id": receipt_id,
                "filename": unique_filename
            }

        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"Error uploading receipt: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to upload receipt")