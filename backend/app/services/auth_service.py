import logging
from fastapi import HTTPException, Depends, status
from database.connection import get_db_connection
from utils.auth import PasswordUtils, JWTUtils
from schemas.auth import PasswordChangeRequest, RefreshTokenRequest, TokenResponse, UserRegister, UserLogin, UserResponse
import uuid
from datetime import datetime, timedelta

from config import ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS
from utils.dependencies import get_current_user

class AuthService:
    
    @staticmethod
    async def register_user(user_data: UserRegister):
        """Register a new user"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Check if user already exists
            cursor.execute("SELECT id FROM users WHERE email = ?", (user_data.email,))
            if cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            
            # Create new user
            user_id = str(uuid.uuid4())
            password_hash = PasswordUtils.hash_password(user_data.password)
            
            cursor.execute('''
                INSERT INTO users (id, name, email, password_hash)
                VALUES (?, ?, ?, ?)
            ''', (user_id, user_data.name, user_data.email, password_hash))
            
            conn.commit()
            
            # Get created user
            cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            user = cursor.fetchone()
            conn.close()
            
            # Create tokens
            access_token = JWTUtils.create_access_token(data={"sub": user_id})
            refresh_token = JWTUtils.create_refresh_token(data={"sub": user_id})
            
            # Store refresh token
            conn = get_db_connection()
            cursor = conn.cursor()
            token_id = str(uuid.uuid4())
            token_hash = PasswordUtils.hash_password(refresh_token)
            expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
            
            cursor.execute('''
                INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
                VALUES (?, ?, ?, ?)
            ''', (token_id, user_id, token_hash, expires_at))
            
            conn.commit()
            conn.close()
            
            user_response = UserResponse(
                id=user["id"],
                name=user["name"],
                email=user["email"],
                is_active=user["is_active"],
                is_verified=user["is_verified"],
                created_at=user["created_at"]
            )
            
            return TokenResponse(
                access_token=access_token,
                refresh_token=refresh_token,
                expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                user=user_response
            )
            
        except Exception as e:
            logging.error(f"Error registering user: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Registration failed"
            )

    @staticmethod
    async def login_user(user_credentials: UserLogin):
        """Login user"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Get user by email
            cursor.execute("SELECT * FROM users WHERE email = ?", (user_credentials.email,))
            user = cursor.fetchone()
            
            if not user or not PasswordUtils.verify_password(user_credentials.password, user["password_hash"]):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )
            
            if not user["is_active"]:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Account is deactivated"
                )
            
            # Create tokens
            access_token = JWTUtils.create_access_token(data={"sub": user["id"]})
            refresh_token = JWTUtils.create_refresh_token(data={"sub": user["id"]})
            
            # Store refresh token
            token_id = str(uuid.uuid4())
            token_hash = PasswordUtils.hash_password(refresh_token)
            expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
            
            cursor.execute('''
                INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
                VALUES (?, ?, ?, ?)
            ''', (token_id, user["id"], token_hash, expires_at))
            
            conn.commit()
            conn.close()
            
            user_response = UserResponse(
                id=user["id"],
                name=user["name"],
                email=user["email"],
                is_active=user["is_active"],
                is_verified=user["is_verified"],
                created_at=user["created_at"]
            )
            
            return TokenResponse(
                access_token=access_token,
                refresh_token=refresh_token,
                expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                user=user_response
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"Error logging in user: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Login failed"
            )

    @staticmethod
    async def refresh_token(token_request: RefreshTokenRequest):
        """Refresh access token"""
        try:
            # Decode refresh token
            payload = JWTUtils.decode_token(token_request.refresh_token)
            
            if payload.get("type") != "refresh":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token type"
                )
            
            user_id = payload.get("sub")
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token"
                )
            
            # Verify refresh token in database
            conn = get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT * FROM refresh_tokens 
                WHERE user_id = ? AND is_revoked = 0 AND expires_at > datetime('now')
            ''', (user_id,))
            
            stored_tokens = cursor.fetchall()
            token_valid = False
            
            for stored_token in stored_tokens:
                if PasswordUtils.verify_password(token_request.refresh_token, stored_token["token_hash"]):
                    token_valid = True
                    break
            
            if not token_valid:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired refresh token"
                )
            
            # Get user
            cursor.execute("SELECT * FROM users WHERE id = ? AND is_active = 1", (user_id,))
            user = cursor.fetchone()
            
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found or inactive"
                )
            
            # Create new tokens
            new_access_token = JWTUtils.create_access_token(data={"sub": user_id})
            new_refresh_token = JWTUtils.create_refresh_token(data={"sub": user_id})
            
            # Store new refresh token and revoke old one
            cursor.execute('''
                UPDATE refresh_tokens 
                SET is_revoked = 1 
                WHERE user_id = ? AND is_revoked = 0
            ''', (user_id,))
            
            token_id = str(uuid.uuid4())
            token_hash = PasswordUtils.hash_password(new_refresh_token)
            expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
            
            cursor.execute('''
                INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
                VALUES (?, ?, ?, ?)
            ''', (token_id, user_id, token_hash, expires_at))
            
            conn.commit()
            conn.close()
            
            user_response = UserResponse(
                id=user["id"],
                name=user["name"],
                email=user["email"],
                is_active=user["is_active"],
                is_verified=user["is_verified"],
                created_at=user["created_at"]
            )
            
            return TokenResponse(
                access_token=new_access_token,
                refresh_token=new_refresh_token,
                expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                user=user_response
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"Error refreshing token: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Token refresh failed"
            )

    @staticmethod
    async def logout_user(current_user: dict = Depends(get_current_user)):
        """Logout user by revoking refresh tokens"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                UPDATE refresh_tokens 
                SET is_revoked = 1 
                WHERE user_id = ? AND is_revoked = 0
            ''', (current_user["id"],))
            
            conn.commit()
            conn.close()
            
            return {"message": "Successfully logged out"}
            
        except Exception as e:
            logging.error(f"Error logging out user: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Logout failed"
            )

    @staticmethod
    async def get_current_user_info(current_user: dict = Depends(get_current_user)):
        """Get current user information"""
        return UserResponse(
            id=current_user["id"],
            name=current_user["name"],
            email=current_user["email"],
            is_active=current_user["is_active"],
            is_verified=current_user["is_verified"],
            created_at=""  # You might want to fetch this from the database
        )

    @staticmethod
    async def change_password(
        password_data: PasswordChangeRequest,
        current_user: dict = Depends(get_current_user)
    ):
        """Change user password"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Get current user with password hash
            cursor.execute("SELECT password_hash FROM users WHERE id = ?", (current_user["id"],))
            user = cursor.fetchone()
            
            # Verify current password
            if not PasswordUtils.verify_password(password_data.current_password, user["password_hash"]):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Current password is incorrect"
                )
            
            # Update password
            new_password_hash = PasswordUtils.hash_password(password_data.new_password)
            cursor.execute('''
                UPDATE users 
                SET password_hash = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            ''', (new_password_hash, current_user["id"]))
            
            # Revoke all refresh tokens to force re-login
            cursor.execute('''
                UPDATE refresh_tokens 
                SET is_revoked = 1 
                WHERE user_id = ?
            ''', (current_user["id"],))
            
            conn.commit()
            conn.close()
            
            return {"message": "Password changed successfully. Please login again."}
            
        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"Error changing password: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Password change failed"
            )