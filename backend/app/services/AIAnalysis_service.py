import logging
from fastapi import Depends, HTTPException, status
from schemas.AIAnalysis import AIAnalysisRequest, AIAnalysisResponse
from utils.dependencies import get_current_user
import ollama

class AIAnalysisService:
    @staticmethod
    async def analyze_data(analysis_request: AIAnalysisRequest, current_user: dict = Depends(get_current_user)):
        """Perform AI analysis on user data"""
        try:
            prompt = f"User Query: {analysis_request.query}\nContext: {analysis_request.context or 'No additional context provided'}\nAnalysis Type: {analysis_request.analysis_type}\nPlease provide a detailed financial analysis and recommendations."
            
            response = ollama.generate(
                model="llama3",  # Assuming a default model; adjust as needed
                prompt=prompt
            )

            analysis_result = response.get("response", "No analysis generated")
            recommendations = analysis_result.split("\n")[:3]  # Simplified parsing
            return AIAnalysisResponse(
                analysis=analysis_result,
                recommendations=recommendations,
                confidence=0.85,  # Static confidence as per original
                analysis_type=analysis_request.analysis_type
            )

        except Exception as e:
            logging.error(f"Error performing AI analysis: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to perform AI analysis")