from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Dict, TypedDict
from pydantic import BaseModel
from database import get_db
from services import auth_service
from services.research_service import research_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class QuestionAnalysisResponse(BaseModel):
    key_components: List[str]
    scope_boundaries: List[str]
    success_criteria: List[str]
    conflicting_viewpoints: List[str]

@router.get(
    "/expand-question",
    response_model=List[str],
    summary="Expand a question into related search queries using AI",
    responses={
        200: {
            "description": "Question successfully expanded into related queries",
            "content": {
                "application/json": {
                    "example": [
                        "What are the core components of LangChain?",
                        "How does LangChain integrate with different LLM providers?",
                        "What are the main use cases for LangChain?"
                    ]
                }
            }
        },
        401: {"description": "Not authenticated"}
    }
)
async def expand_question(
    question: str = Query(
        description="The question to expand into related queries"
    ),
    current_user = Depends(auth_service.validate_token),
    db: Session = Depends(get_db)
):
    """
    Expand a question into multiple related search queries using AI.
    
    Parameters:
    - **question**: The input question to expand
    
    Returns a list of related search queries that help explore different aspects of the question.
    """
    logger.info(f"expand_question endpoint called with question: {question}")
    
    # Expand the question using research service
    expanded_queries = await research_service.expand_question(question)
    
    return expanded_queries

@router.get(
    "/analyze-question",
    response_model=QuestionAnalysisResponse,
    summary="Analyze a question to identify key components and scope",
    responses={
        200: {
            "description": "Question successfully analyzed",
            "content": {
                "application/json": {
                    "example": {
                        "key_components": [
                            "Impact of urban development on local climate",
                            "Heat island effect measurement methods",
                            "Mitigation strategies"
                        ],
                        "scope_boundaries": [
                            "Focus on metropolitan areas",
                            "Contemporary research (last 10 years)",
                            "Exclude rural heat effects"
                        ],
                        "success_criteria": [
                            "Quantifiable heat island measurements",
                            "Evidence-based mitigation strategies",
                            "Multiple case studies referenced"
                        ],
                        "conflicting_viewpoints": [
                            "Effectiveness of green roofs vs traditional solutions",
                            "Cost-benefit analysis methodologies",
                            "Impact measurement approaches"
                        ]
                    }
                }
            }
        },
        401: {"description": "Not authenticated"}
    }
)
async def analyze_question(
    question: str = Query(
        description="The question to analyze for scope and components"
    ),
    current_user = Depends(auth_service.validate_token),
    db: Session = Depends(get_db)
):
    """
    Analyze a question to identify its key components, scope boundaries, success criteria,
    and potential conflicting viewpoints.
    
    Parameters:
    - **question**: The input question to analyze
    
    Returns a structured analysis of the question including key components that need to be
    addressed, scope boundaries, success criteria, and potential areas of conflicting viewpoints.
    """
    logger.info(f"analyze_question endpoint called with question: {question}")
    
    # Analyze the question using research service
    analysis = await research_service.analyze_question(question)
    
    return analysis

