from fastapi import APIRouter, Depends, status
from schemas.auth import PasswordChangeRequest, RefreshTokenRequest, UserRegister, UserLogin, TokenResponse, UserResponse
from services.auth_service import AuthService
from utils.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
async def register_user(user_data: UserRegister):
    return await AuthService.register_user(user_data)

@router.post("/login", response_model=TokenResponse)
async def login_user(user_credentials: UserLogin):
    return await AuthService.login_user(user_credentials)

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(token_request: RefreshTokenRequest):
    return await AuthService.refresh_token(token_request)

@router.post("/logout")
async def logout_user(current_user: dict = Depends(get_current_user)):
    return await AuthService.logout_user(current_user)

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return await AuthService.get_current_user_info(current_user)

@router.put("/change-password")
async def change_password(
password_data: PasswordChangeRequest,
current_user: dict = Depends(get_current_user)
):
    return await AuthService.change_password(password_data, current_user)