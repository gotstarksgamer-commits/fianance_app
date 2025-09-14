from pydantic import BaseModel
from typing import Optional, List

class AIAnalysisRequest(BaseModel):
    query: str
    context: Optional[str] = None
    analysis_type: str = "general"

class AIAnalysisResponse(BaseModel):
    analysis: str
    recommendations: List[str]
    confidence: float = 0.85
    analysis_type: str