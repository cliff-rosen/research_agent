from fastapi import APIRouter, Depends, Query, Body, Response, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Dict, TypedDict
from pydantic import BaseModel, Field
from database import get_db
from services import auth_service, research_service, ai_service, neo4j_service
from schemas import (
    SearchResult, ResearchAnswer, URLContent, QuestionAnalysis, 
    ExecuteQueriesRequest, GetResearchAnswerRequest, CurrentEventsCheck, 
    ResearchEvaluation, EvaluateAnswerRequest, ExtractKnowledgeGraphRequest,
    KnowledgeGraphElements
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


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
    logger.info(
        f"analyze_question_stream endpoint called with question: {question}")

    return StreamingResponse(
        research_service.analyze_question_stream(question),
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


@router.post("/execute-queries/stream")
async def execute_queries_stream(
    request: ExecuteQueriesRequest,
    current_user=Depends(auth_service.validate_token),
    db: Session = Depends(get_db)
):
    """Stream search results for multiple queries."""
    queries = request.queries
    logger.info(
        f"execute_queries_stream endpoint called with {len(queries)} queries")

    return StreamingResponse(
        research_service.execute_queries_stream(queries),
        media_type="text/event-stream"
    )

# DEPRECATED


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
    analysis = await research_service.analyze_question(question)

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


@router.post(
    "/evaluate-answer",
    response_model=ResearchEvaluation,
    summary="Evaluate how well an answer addresses a research question",
    responses={
        200: {
            "description": "Answer evaluation completed successfully",
            "content": {
                "application/json": {
                    "example": {
                        "completeness_score": 85.5,
                        "accuracy_score": 90.0,
                        "relevance_score": 88.5,
                        "overall_score": 88.0,
                        "missing_aspects": [
                            "Economic impact analysis",
                            "Long-term sustainability considerations"
                        ],
                        "improvement_suggestions": [
                            "Include more quantitative data",
                            "Address economic implications"
                        ],
                        "conflicting_aspects": [
                            {
                                "aspect": "Timeline analysis",
                                "conflict": "Inconsistent dates mentioned for key events"
                            }
                        ]
                    }
                }
            }
        },
        401: {"description": "Not authenticated"}
    }
)
async def evaluate_answer(
    request: EvaluateAnswerRequest,
    current_user=Depends(auth_service.validate_token),
    db: Session = Depends(get_db)
):
    """
    Evaluate how well an answer addresses a research question.

    Parameters:
    - **request**: EvaluateAnswerRequest containing:
        - question: The original research question
        - analysis: The analysis of the question's components
        - answer: The answer to evaluate

    Returns a detailed evaluation including:
    - Completeness score
    - Accuracy score
    - Relevance score
    - Overall score
    - Missing aspects
    - Improvement suggestions
    - Conflicting aspects
    """
    logger.info(
        f"evaluate_answer endpoint called with question: {request.question}")

    return await research_service.evaluate_answer(
        question=request.question,
        analysis=request.analysis,
        answer=request.answer
    )


@router.get(
    "/check-current-events/stream",
    summary="Stream the current events context check process",
    responses={
        200: {
            "description": "Current events context check streamed successfully",
            "content": {
                "application/x-ndjson": {
                    "example": {
                        "requires_current_context": True,
                        "reasoning": "Question involves recent developments",
                        "timeframe": "past month",
                        "key_events": ["event1", "event2"],
                        "search_queries": ["query1", "query2"]
                    }
                }
            }
        },
        401: {"description": "Not authenticated"}
    }
)
async def check_current_events_stream(
    question: str = Query(
        description="The question to check for current events context requirements"
    ),
    current_user=Depends(auth_service.validate_token),
    db: Session = Depends(get_db)
):
    """
    Stream the process of checking whether a question requires current events context.

    Parameters:
    - **question**: The input question to analyze

    Returns a stream of JSON objects containing the analysis of current events context requirements.
    """
    logger.info(
        f"check_current_events_stream endpoint called with question: {question}")

    return StreamingResponse(
        research_service.check_current_events_context_stream(question),
        media_type="application/x-ndjson"
    )


@router.get(
    "/check-current-events",
    response_model=CurrentEventsCheck,
    summary="Check if a question requires current events context",
    responses={
        200: {
            "description": "Current events context check completed successfully",
            "content": {
                "application/json": {
                    "example": {
                        "requires_current_context": True,
                        "reasoning": "Question involves recent developments",
                        "timeframe": "past month",
                        "key_events": ["event1", "event2"],
                        "search_queries": ["query1", "query2"]
                    }
                }
            }
        },
        401: {"description": "Not authenticated"}
    }
)
async def check_current_events(
    question: str = Query(
        description="The question to check for current events context requirements"
    ),
    current_user=Depends(auth_service.validate_token),
    db: Session = Depends(get_db)
):
    """
    Check whether a question requires current events context.

    Parameters:
    - **question**: The input question to analyze

    Returns an analysis of whether current events context is needed and how to gather it.
    """
    logger.info(
        f"check_current_events endpoint called with question: {question}")

    return await research_service.check_current_events_context(question)


@router.get(
    "/improve-question",
    summary="Analyze and improve a complex research question",
    responses={
        200: {
            "description": "Question analysis and improvements generated successfully",
            "content": {
                "application/json": {
                    "example": {
                        "original_question": "How does AI impact society",
                        "analysis": {
                            "clarity_issues": ["'AI' is too broad", "'impact' needs specification"],
                            "scope_issues": ["Question covers too many potential areas"],
                            "precision_issues": ["Type of impact not specified"],
                            "implicit_assumptions": ["Assumes uniform societal impact"],
                            "missing_context": ["Timeframe not specified"],
                            "structural_improvements": ["Break into specific aspects"]
                        },
                        "improved_question": "What are the primary economic and social impacts of machine learning technologies on employment and workforce skills in developed countries over the past decade?",
                        "improvement_explanation": "Specified AI type, impact areas, context, and timeframe"
                    }
                }
            }
        },
        401: {"description": "Not authenticated"}
    }
)
async def improve_question(
    question: str = Query(
        description="The complex question to analyze and improve"
    ),
    current_user=Depends(auth_service.validate_token),
    db: Session = Depends(get_db)
):
    """
    Analyze a complex question and suggest improvements for clarity, completeness, and effectiveness.

    Parameters:
    - **question**: The input question to analyze and improve

    Returns a detailed analysis of the question including clarity issues, scope considerations,
    implicit assumptions, and a suggested improved version of the question.
    """
    logger.info(f"improve_question endpoint called with question: {question}")
    return await ai_service.improve_question(question)


@router.post(
    "/extract-knowledge-graph",
    summary="Extract and store knowledge graph elements from a document",
    response_model=KnowledgeGraphElements,
    responses={
        200: {
            "description": "Knowledge graph elements successfully extracted and stored",
            "content": {
                "application/json": {
                    "example": {
                        "nodes": [
                            {
                                "id": "p1",
                                "label": "Person",
                                "properties": {
                                    "name": "John Smith",
                                    "role": "CEO"
                                }
                            }
                        ],
                        "relationships": [
                            {
                                "source": "p1",
                                "target": "c1",
                                "type": "LEADS",
                                "properties": {
                                    "since": "2020"
                                }
                            }
                        ]
                    }
                }
            }
        },
        401: {"description": "Not authenticated"},
        500: {"description": "Internal server error"}
    }
)
async def extract_knowledge_graph(
    request: ExtractKnowledgeGraphRequest,
    current_user=Depends(auth_service.validate_token),
    db: Session = Depends(get_db)
) -> KnowledgeGraphElements:
    """
    Extract knowledge graph elements from a document and store them in Neo4j.

    Parameters:
    - **document**: The text document to analyze for entities and relationships

    Returns the extracted knowledge graph elements that were stored.
    """
    logger.info("extract_knowledge_graph endpoint called")

    try:
        # Extract knowledge graph elements using AI service
        elements = await ai_service.extract_knowledge_graph_elements(request.document)
        
        # Ensure Neo4j connection
        if not neo4j_service.driver:
            await neo4j_service.connect()
            
        # Store elements in Neo4j
        await neo4j_service.store_knowledge_graph_elements(elements)
        
        # Return the elements directly since they're already a KnowledgeGraphElements instance
        return elements
    except Exception as e:
        logger.error(f"Error in extract_knowledge_graph: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process knowledge graph: {str(e)}"
        )
