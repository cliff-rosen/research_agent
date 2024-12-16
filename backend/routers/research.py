from fastapi import APIRouter, Depends, Query, Body, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Dict, TypedDict
from pydantic import BaseModel, Field
from database import get_db
from services import auth_service, ai_service
from services.research_service import research_service
from schemas import SearchResult, ResearchAnswer, URLContent, QuestionAnalysis, ExecuteQueriesRequest, GetResearchAnswerRequest
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "/analyze-question",
    response_model=QuestionAnalysis,
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
    current_user=Depends(auth_service.validate_token),
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
    analysis = await research_service.analyze_question_scope(question)

    return analysis


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
    current_user=Depends(auth_service.validate_token),
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


@router.post(
    "/execute-queries",
    response_model=List[SearchResult],
    summary="Execute multiple search queries and collate results",
    responses={
        200: {
            "description": "Search results successfully retrieved and collated",
            "model": List[SearchResult]
        },
        401: {"description": "Not authenticated"}
    }
)
async def execute_queries(
    request: ExecuteQueriesRequest,
    current_user=Depends(auth_service.validate_token),
    db: Session = Depends(get_db)
):
    """
    Execute multiple search queries and return collated, deduplicated results

    Parameters:
    - **queries**: List of search queries to execute

    Returns a list of unique search results from all queries, sorted by relevance.
    """
    # Take only the first 3 queries
    queries = request.queries[:3]
    logger.info(
        f"execute_queries endpoint called with {len(queries)} queries (limited to first 3)")
    return await research_service.execute_queries(db, queries, current_user.user_id)


@router.post(
    "/get-answer",
    response_model=ResearchAnswer,
    summary="Generate a research answer from analyzed sources",
    responses={
        200: {
            "description": "Research answer successfully generated",
            "content": {
                "application/json": {
                    "example": {
                        "answer": "Based on the analyzed sources, the impact of urban development...",
                        "sources_used": [
                            "https://example.com/urban-development-study",
                            "https://example.com/climate-research"
                        ],
                        "confidence_score": 85.5
                    }
                }
            }
        },
        401: {"description": "Not authenticated"}
    }
)
async def get_research_answer(
    request: GetResearchAnswerRequest,
    current_user=Depends(auth_service.validate_token),
    db: Session = Depends(get_db)
):
    """
    Generate a comprehensive research answer from analyzed sources.

    Parameters:
    - **question**: The research question to answer
    - **source_content**: List of URL content objects to analyze

    Returns a research answer with synthesized information, sources used, and confidence score.
    """
    logger.info(
        f"get_research_answer endpoint called with question: {request.question}")
    logger.info(f"Number of sources provided: {len(request.source_content)}")

    # Use AI service to generate the research answer
    result = await ai_service.get_research_answer(
        question=request.question,
        source_content=request.source_content
    )
    return result


@router.get(
    "/analyze-question/stream",
    summary="Stream the question analysis process",
    responses={
        200: {
            "description": "Question analysis streamed successfully",
            "content": {
                "application/x-ndjson": {
                    "example": {
                        "type": "key_components",
                        "data": ["component1", "component2"]
                    }
                }
            }
        },
        401: {"description": "Not authenticated"}
    }
)
async def analyze_question_stream(
    question: str = Query(
        description="The question to analyze for scope and components"
    ),
    current_user=Depends(auth_service.validate_token),
    db: Session = Depends(get_db)
):
    """
    Stream the question analysis process, returning components as they are generated.
    
    Parameters:
    - **question**: The input question to analyze
    
    Returns a stream of JSON objects, each containing:
    - **type**: The type of data being returned (key_components, scope_boundaries, etc.)
    - **data**: The actual data for that component
    """
    logger.info(f"analyze_question_stream endpoint called with question: {question}")
    
    return StreamingResponse(
        research_service.analyze_question_scope_stream(question),
        media_type="application/x-ndjson"
    )


@router.get("/expand-question/stream")
async def expand_question_stream(
    question: str = Query(..., description="The question to expand"),
    db: Session = Depends(get_db),
    current_user=Depends(auth_service.validate_token),
):
    """
    Stream the question expansion process, returning markdown-formatted results.
    """
    return StreamingResponse(
        research_service.expand_question_stream(question),
        media_type="text/event-stream"
    )
