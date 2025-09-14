from fastapi import APIRouter
from services.util_service import UtilService


router = APIRouter(prefix="/categories", tags=["Util"])

@router.get("/")
async def get_categories():
    return await UtilService.get_categories();