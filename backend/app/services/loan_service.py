import logging
from fastapi import Depends, HTTPException, status
from database.connection import get_db_connection
from schemas.loan import LoanCalculationRequest, LoanCalculationResponse
from utils.dependencies import get_current_user
from utils.calculations import calculate_emi, generate_amortization_schedule
import uuid
from datetime import datetime

class LoansService:
    @staticmethod
    async def create_loan(loan_data: LoanCalculationRequest, current_user: dict):
        """Create a new loan record with EMI calculation"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            loan_id = str(uuid.uuid4())
            user_id = current_user["id"]

            emi_data = calculate_emi(
                principal=loan_data.principal_amount,
                rate=loan_data.interest_rate,
                tenure=loan_data.tenure_months
            )

            cursor.execute('''
                INSERT INTO loans (
                    id, user_id, loan_type, principal_amount, interest_rate, 
                    tenure_months, emi_amount, total_interest, total_amount
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                loan_id,
                user_id,
                loan_data.loan_type,
                loan_data.principal_amount,
                loan_data.interest_rate,
                loan_data.tenure_months,
                emi_data["emi_amount"],
                emi_data["total_interest"],
                emi_data["total_amount"]
            ))

            conn.commit()
            cursor.execute("SELECT * FROM loans WHERE id = ?", (loan_id,))
            loan = cursor.fetchone()

            amortization_schedule = generate_amortization_schedule(
                principal=loan_data.principal_amount,
                rate=loan_data.interest_rate,
                tenure=loan_data.tenure_months,
                emi=emi_data["emi_amount"]
            )

            conn.close()

            return LoanCalculationResponse(
                id=loan["id"],
                loan_type=loan["loan_type"],
                principal_amount=loan["principal_amount"],
                interest_rate=loan["interest_rate"],
                tenure_months=loan["tenure_months"],
                emi_amount=loan["emi_amount"],
                total_interest=loan["total_interest"],
                total_amount=loan["total_amount"],
                amortization_schedule=amortization_schedule
            )

        except Exception as e:
            logging.error(f"Error creating loan: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create loan")
    
    @staticmethod
    async def calculate_loan(loan_data: LoanCalculationRequest):
        """Calculate loan EMI and amortization schedule without saving to DB"""
        try:
            emi_data = calculate_emi(
                principal=loan_data.principal_amount,
                rate=loan_data.interest_rate,
                tenure=loan_data.tenure_months
            )

            amortization_schedule = generate_amortization_schedule(
                principal=loan_data.principal_amount,
                rate=loan_data.interest_rate,
                tenure=loan_data.tenure_months,
                emi=emi_data["emi_amount"]
            )

            return LoanCalculationResponse(
                id=None,
                loan_type=loan_data.loan_type,
                principal_amount=loan_data.principal_amount,
                interest_rate=loan_data.interest_rate,
                tenure_months=loan_data.tenure_months,
                emi_amount=emi_data["emi_amount"],
                total_interest=emi_data["total_interest"],
                total_amount=emi_data["total_amount"],
                amortization_schedule=amortization_schedule
            )

        except Exception as e:
            logging.error(f"Error calculating loan: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to calculate loan")

    @staticmethod
    async def get_loan(loan_id: str, current_user: dict):
        """Retrieve a specific loan record"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            user_id = current_user["id"]

            cursor.execute("SELECT * FROM loans WHERE id = ? AND user_id = ?", (loan_id, user_id))
            loan = cursor.fetchone()

            if not loan:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loan not found")

            amortization_schedule = generate_amortization_schedule(
                principal=loan["principal_amount"],
                rate=loan["interest_rate"],
                tenure=loan["tenure_months"],
                emi=loan["emi_amount"]
            )

            conn.close()

            return LoanCalculationResponse(
                id=loan["id"],
                loan_type=loan["loan_type"],
                principal_amount=loan["principal_amount"],
                interest_rate=loan["interest_rate"],
                tenure_months=loan["tenure_months"],
                emi_amount=loan["emi_amount"],
                total_interest=loan["total_interest"],
                total_amount=loan["total_amount"],
                amortization_schedule=amortization_schedule
            )

        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"Error fetching loan: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch loan")

    @staticmethod
    async def get_all_loans(current_user: dict):
        """Retrieve all loan records for the user"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            user_id = current_user["id"]

            cursor.execute("SELECT * FROM loans WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
            loans = cursor.fetchall()
            conn.close()

            return [
                LoanCalculationResponse(
                    id=loan["id"],
                    loan_type=loan["loan_type"],
                    principal_amount=loan["principal_amount"],
                    interest_rate=loan["interest_rate"],
                    tenure_months=loan["tenure_months"],
                    emi_amount=loan["emi_amount"],
                    total_interest=loan["total_interest"],
                    total_amount=loan["total_amount"],
                    amortization_schedule=generate_amortization_schedule(
                        principal=loan["principal_amount"],
                        rate=loan["interest_rate"],
                        tenure=loan["tenure_months"],
                        emi=loan["emi_amount"]
                    )
                ) for loan in loans
            ]

        except Exception as e:
            logging.error(f"Error fetching loans: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch loans")

    @staticmethod
    async def delete_loan(loan_id: str, current_user: dict):
        """Delete a loan record"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            user_id = current_user["id"]

            cursor.execute("SELECT id FROM loans WHERE id = ? AND user_id = ?", (loan_id, user_id))
            if not cursor.fetchone():
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loan not found or access denied")

            cursor.execute("DELETE FROM loans WHERE id = ? AND user_id = ?", (loan_id, user_id))
            conn.commit()
            conn.close()

            return {"message": "Loan record deleted successfully"}

        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"Error deleting loan: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete loan")
