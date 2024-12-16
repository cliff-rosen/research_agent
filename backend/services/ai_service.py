import logging
from typing import Optional, List, Dict, TypedDict, AsyncGenerator
from config.settings import settings
from .llm.base import LLMProvider
from .llm.anthropic_provider import AnthropicProvider
from .llm.openai_provider import OpenAIProvider
from schemas import QuestionAnalysis, ResearchAnswer, URLContent

logger = logging.getLogger(__name__)

EXPAND_QUESTION_PROMPT = """You are a search query expansion expert that helps users find comprehensive information by generating relevant alternative search queries.

Break down the question into multiple search queries that will help find comprehensive information. Consider:
- Different aspects and phrasings of the concepts
- Alternative terminology
- Related subtopics
- Specific and general versions of the query

Return ONLY a list of search queries, with each query on a new line starting with "- ".

Example format:
- first search query here
- second search query here
- third search query here

IMPORTANT: Return ONLY the list of queries with "- " prefix. Do not include any sections, explanations, or other formatting."""

ANALYZE_QUESTION_PROMPT = """You are an expert research analyst. Analyze the given question and break down your analysis into clear sections using markdown.

Your response should be formatted in markdown with these sections:

## Key Components
- List the main elements that need to be addressed
- Each point should be a bullet point
- Focus on core concepts and requirements

## Scope Boundaries
- Define clear limits and constraints
- Specify what is and isn't included
- Establish the context and timeframe

## Success Criteria
- List what constitutes a complete answer
- Include measurable or verifiable points
- Define quality expectations

## Conflicting Viewpoints
- Identify potential areas of disagreement
- Note competing theories or approaches
- Highlight controversial aspects

Focus on questions that:
- Require multiple sources and synthesis of information
- Span multiple subject areas or disciplines
- Have potential for conflicting information
- Need specific, detailed answers with evidence

Use proper markdown formatting:
- Use ## for section headings
- Use - for bullet points
- Use **bold** for emphasis
- Keep formatting clean and consistent

IMPORTANT: Return ONLY the markdown text. Do not include any JSON formatting or additional explanations."""

SCORE_RESULTS_PROMPT = """You are an expert at evaluating search results for relevance to a query.
For each search result, analyze its relevance to the query and provide a score from 0-100 where:
- 90-100: Perfect match, directly answers the query
- 70-89: Highly relevant, contains most of the needed information
- 50-69: Moderately relevant, contains some useful information
- 30-49: Somewhat relevant, tangentially related
- 0-29: Not relevant or too general

Consider:
- How directly the content answers the query
- The specificity and depth of information
- The credibility of the source domain
- The comprehensiveness of the snippet
- The relevance of the title

IMPORTANT: Your response must be a valid JSON array of objects. Each object must have exactly two fields:
- "url": the exact URL from the search result
- "score": a number between 0 and 100

Example response format:
[
    {"url": "example.com/page1", "score": 85},
    {"url": "example.com/page2", "score": 45}
]

Do not include any other text or explanation in your response, only the JSON array."""

RESEARCH_ANSWER_PROMPT = """You are an expert research analyst synthesizing information to answer a question.

Question: {question}

Source Content:
{source_content}

Analyze the sources and provide a comprehensive answer. Your response must be a valid JSON object with these exact keys:
{{
    "answer": "detailed answer in markdown format, using proper markdown syntax for headings, lists, emphasis, etc.",
    "sources_used": ["list of URLs that contributed to the answer"],
    "confidence_score": number between 0-100 indicating confidence in the answer
}}

Guidelines:
- Format your answer using markdown syntax:
  - Use ## for section headings
  - Use * or - for bullet points
  - Use **text** for emphasis
  - Use > for important quotes or key points
  - Use --- for section breaks
- Synthesize information across sources
- Cite specific sources when making claims
- Acknowledge uncertainties or conflicting information
- Focus on answering the core question
- Structure your answer with clear sections
- Use markdown to improve readability

Example response format:
{{
    "answer": "## Overview\\n\\nBased on the analyzed sources, the key findings are...\\n\\n### Key Points\\n\\n* First important point\\n* Second important point\\n\\n> Important note: key consideration...\\n\\n### Detailed Analysis\\n\\nFurther examination reveals...",
    "sources_used": ["https://example.com/source1", "https://example.com/source2"],
    "confidence_score": 85
}}

IMPORTANT: Your response must be ONLY a valid JSON object. Do not include any explanatory text, markdown formatting, or code blocks outside the JSON structure."""


class AIService:
    def __init__(self):
        self.provider: LLMProvider = AnthropicProvider()

    def set_provider(self, provider: str):
        """Change the LLM provider"""
        if provider == "openai":
            self.provider = OpenAIProvider()
        elif provider == "anthropic":
            self.provider = AnthropicProvider()
        else:
            raise ValueError(f"Unsupported provider: {provider}")

    async def analyze_question_scope(self, question: str, model: Optional[str] = None) -> QuestionAnalysis:
        """
        Analyze a question to determine its key components, scope, and success criteria.

        Args:
            question: The question to analyze
            model: Optional specific model to use

        Returns:
            QuestionAnalysis: Pydantic model containing the analysis components
        """
        try:
            messages = [
                {"role": "user", "content": f"Analyze this question: {question}"}
            ]

            content = await self.provider.create_chat_completion(
                messages=messages,
                system=ANALYZE_QUESTION_PROMPT,
                model=model
            )

            try:
                # Clean the response string
                response_text = content.strip()
                if response_text.startswith('```json'):
                    response_text = response_text.split('```')[1].strip()
                elif response_text.startswith('```'):
                    response_text = response_text.split('```')[1].strip()

                # Parse JSON response and create Pydantic model
                import json
                analysis_dict = json.loads(response_text)

                # Create and validate with Pydantic model
                return QuestionAnalysis(
                    key_components=analysis_dict.get('key_components', []),
                    scope_boundaries=analysis_dict.get('scope_boundaries', []),
                    success_criteria=analysis_dict.get('success_criteria', []),
                    conflicting_viewpoints=analysis_dict.get('conflicting_viewpoints', [])
                )

            except json.JSONDecodeError as e:
                logger.error(f"Error parsing analysis JSON response: {str(e)}\nResponse: {content}")
                return QuestionAnalysis(
                    key_components=[],
                    scope_boundaries=[],
                    success_criteria=[],
                    conflicting_viewpoints=[]
                )

        except Exception as e:
            logger.error(f"Error in analyze_question_scope: {str(e)}")
            return QuestionAnalysis(
                key_components=[],
                scope_boundaries=[],
                success_criteria=[],
                conflicting_viewpoints=[]
            )

    async def analyze_question_scope_stream(self, question: str, model: Optional[str] = None) -> AsyncGenerator[str, None]:
        """
        Stream the analysis of a question, returning raw response chunks as they arrive.

        Args:
            question: The question to analyze
            model: Optional specific model to use

        Yields:
            Raw text chunks from the LLM response
        """
        try:
            messages = [
                {"role": "user", "content": f"Analyze this question: {question}"}
            ]

            async for chunk in self.provider.create_chat_completion_stream(
                messages=messages,
                system=ANALYZE_QUESTION_PROMPT,
                model=model
            ):
                yield chunk

        except Exception as e:
            logger.error(f"Error in analyze_question_scope_stream: {str(e)}")
            raise

    async def expand_query(self, question: str) -> List[str]:
        """
        Expand a question into multiple search queries.
        """
        try:
            prompt = f"""Given this research question, generate a set of search queries that will help find relevant information.
            Break down complex concepts and consider different aspects and phrasings.
            
            Question: {question}
            
            Return only the list of search queries, one per line starting with "- ".
            """
            
            response = await self.openai_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=1000
            )
            
            queries = response.choices[0].message.content.strip().split('\n')
            return [q.strip('- ').strip() for q in queries if q.strip().startswith('-')]
            
        except Exception as e:
            logger.error(f"Error in expand_query: {str(e)}")
            return []

    async def expand_query_stream(self, question: str):
        """
        Stream the process of expanding a question into search queries with explanations.
        """
        try:
            # Generate the explanatory markdown
            messages = [{"role": "user", "content": f"Question: {question}"}]
            
            async for chunk in self.provider.create_chat_completion_stream(
                messages=messages,
                system=EXPAND_QUESTION_PROMPT
            ):
                yield chunk
                    
        except Exception as e:
            logger.error(f"Error in expand_query_stream: {str(e)}")
            yield "Error: Failed to expand query. Please try again.\n"

    async def get_research_answer(self,
                                  question: str,
                                  source_content: List[URLContent],
                                  model: Optional[str] = None
                                  ) -> ResearchAnswer:
        """
        Generate a final research answer from analyzed sources.

        Args:
            question: The research question
            source_content: List of URLContent objects containing the source content
            model: Optional specific model to use

        Returns:
            ResearchAnswer: Final synthesized answer with sources and confidence
        """
        try:
            # Format source content for the prompt
            formatted_sources = "\n\n".join([
                f"Source ({content.url}):\nTitle: {content.title}\n{content.text}"
                for content in source_content
                if not content.error  # Skip sources with errors
            ])

            messages = [
                {"role": "user", "content": RESEARCH_ANSWER_PROMPT.format(
                    question=question,
                    source_content=formatted_sources
                )}
            ]

            content = await self.provider.create_chat_completion(
                messages=messages,
                system=RESEARCH_ANSWER_PROMPT,
                model=model
            )

            # Parse JSON response
            response_text = content.strip()

            # Remove any markdown code block markers
            if '```' in response_text:
                # Extract content between first and last ```
                parts = response_text.split('```')
                if len(parts) >= 3:
                    response_text = parts[1]
                    if response_text.startswith('json'):
                        response_text = response_text[4:]
                    response_text = response_text.strip()

            # Clean up any remaining whitespace or newlines
            response_text = response_text.strip()

            try:
                # Try to fix common JSON issues
                if response_text.endswith(','):
                    response_text = response_text[:-1]
                if '"sources_used": [' in response_text and not ']' in response_text.split('"sources_used": [')[1]:
                    response_text = response_text.split('"sources_used": [')[0] + '"sources_used": []}'

                import json
                result = json.loads(response_text)
            except json.JSONDecodeError as e:
                logger.error(f"JSON parsing error: {str(e)}")
                logger.error(f"Response text: {response_text}")

                # Try to salvage the answer if possible
                answer_match = '"answer": "(.+?)",' in response_text
                if answer_match:
                    return ResearchAnswer(
                        answer=answer_match.group(1),
                        sources_used=[],
                        confidence_score=0.0
                    )
                raise

            # Validate required fields
            if not isinstance(result.get('answer'), str):
                raise ValueError("Missing or invalid 'answer' field in response")

            # Ensure sources is a list and contains valid URLs
            sources = result.get('sources_used', [])
            if not isinstance(sources, list):
                sources = []
            # Filter out any truncated or invalid URLs
            sources = [s for s in sources if isinstance(s, str) and s.startswith('http')]

            # Ensure confidence score is valid
            try:
                confidence = float(result.get('confidence_score', 0.0))
                # Clamp between 0 and 100
                confidence = max(0.0, min(100.0, confidence))
            except (TypeError, ValueError):
                confidence = 0.0

            return ResearchAnswer(
                answer=result['answer'],
                sources_used=sources,
                confidence_score=confidence
            )

        except Exception as e:
            logger.error(f"Error generating research answer: {str(e)}")
            logger.error(f"Question: {question}")
            logger.error(f"Number of sources: {len(source_content)}")
            return ResearchAnswer(
                answer="Error generating answer. Please try again.",
                sources_used=[],
                confidence_score=0.0
            )

    async def get_research_answer_stream(self,
                                       question: str,
                                       source_content: List[URLContent],
                                       model: Optional[str] = None
                                       ) -> AsyncGenerator[str, None]:
        """
        Stream a research answer from analyzed sources.

        Args:
            question: The research question
            source_content: List of URLContent objects containing the source content
            model: Optional specific model to use

        Yields:
            Raw text chunks from the LLM response
        """
        try:
            # Format source content for the prompt
            formatted_sources = "\n\n".join([
                f"Source ({content.url}):\nTitle: {content.title}\n{content.text}"
                for content in source_content
                if not content.error  # Skip sources with errors
            ])

            messages = [
                {"role": "user", "content": RESEARCH_ANSWER_PROMPT.format(
                    question=question,
                    source_content=formatted_sources
                )}
            ]

            async for chunk in self.provider.create_chat_completion_stream(
                messages=messages,
                system=RESEARCH_ANSWER_PROMPT,
                model=model
            ):
                yield chunk

        except Exception as e:
            logger.error(f"Error streaming research answer: {str(e)}")
            logger.error(f"Question: {question}")
            logger.error(f"Number of sources: {len(source_content)}")
            raise

    async def close(self):
        """Cleanup method to close the provider session"""
        await self.provider.close()


# Create a singleton instance
ai_service = AIService()

__all__ = ['ai_service']
