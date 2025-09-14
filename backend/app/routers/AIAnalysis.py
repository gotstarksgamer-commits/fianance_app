from fastapi import APIRouter, Depends
from schemas.AIAnalysis import AIAnalysisRequest, AIAnalysisResponse
from services.AIAnalysis_service import AIAnalysisService
from utils.dependencies import get_current_user

router = APIRouter(prefix="/ai", tags=["AI Analysis"])

@router.post("/analyze", response_model=AIAnalysisResponse)
async def analyze_data(analysis_request: AIAnalysisRequest, current_user: dict = Depends(get_current_user)):
    return await AIAnalysisService.analyze_data(analysis_request, current_user)