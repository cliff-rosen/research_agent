import logging
from typing import Optional, List, Dict, TypedDict
from config.settings import settings
from .llm.base import LLMProvider
from .llm.anthropic_provider import AnthropicProvider
from .llm.openai_provider import OpenAIProvider
from schemas import QuestionAnalysis, ResearchAnswer, URLContent

logger = logging.getLogger(__name__)

EXPAND_QUERY_PROMPT = """
You are a search query expansion expert that helps users find comprehensive information by generating relevant alternative search queries. Expand the following query into a list of related queries separated by newlines: 
{query}\
"""

ANALYZE_QUESTION_PROMPT = """You are an expert research analyst. Analyze the given question and return a JSON object with these exact keys:
{
    "key_components": [list of main elements that need to be addressed],
    "scope_boundaries": [list defining clear limits and constraints],
    "success_criteria": [list specifying what constitutes a complete answer],
    "conflicting_viewpoints": [list of potential areas of disagreement]
}

Focus on questions that:
- Require multiple sources and synthesis of information
- Span multiple subject areas or disciplines
- Have potential for conflicting information
- Need specific, detailed answers with evidence

IMPORTANT: Your response must be a valid JSON object with these exact keys:
- key_components: array of strings
- scope_boundaries: array of strings
- success_criteria: array of strings
- conflicting_viewpoints: array of strings

Example response format:
{
    "key_components": [
        "Impact of technology on education",
        "Remote learning effectiveness",
        "Student engagement metrics"
    ],
    "scope_boundaries": [
        "K-12 education focus",
        "Last 5 years of research",
        "US educational system context"
    ],
    "success_criteria": [
        "Quantifiable learning outcomes",
        "Student satisfaction metrics",
        "Teacher feedback analysis"
    ],
    "conflicting_viewpoints": [
        "Screen time impact debate",
        "Traditional vs digital methods",
        "Socioeconomic access disparities"
    ]
}

Do not include any explanatory text, only return the JSON object."""

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
                    response_text = response_text.split('"sources_used": [')[
                        0] + '"sources_used": []}'

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
                raise ValueError(
                    "Missing or invalid 'answer' field in response")

            # Ensure sources is a list and contains valid URLs
            sources = result.get('sources_used', [])
            if not isinstance(sources, list):
                sources = []
            # Filter out any truncated or invalid URLs
            sources = [s for s in sources if isinstance(
                s, str) and s.startswith('http')]

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

    async def expand_query(self,
                           query: str,
                           model: Optional[str] = None
                           ) -> List[str]:
        """
        Expand a query into related queries

        Args:
            query: The query to expand
            model: Optional specific model to use
        """
        prompt = EXPAND_QUERY_PROMPT.format(query=query)
        query_expansion = await self.provider.generate(
            prompt=prompt,
            model=model,
            max_tokens=500
        )
        return query_expansion.split("\n")

    async def analyze_question_scope(self,
                                     question: str,
                                     model: Optional[str] = None
                                     ) -> QuestionAnalysis:
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
                    conflicting_viewpoints=analysis_dict.get(
                        'conflicting_viewpoints', [])
                )

            except json.JSONDecodeError as e:
                logger.error(
                    f"Error parsing analysis JSON response: {str(e)}\nResponse: {content}")
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

    async def score_results(self,
                            query: str,
                            results: List[Dict[str, str]],
                            model: Optional[str] = None
                            ) -> List[Dict[str, float]]:
        """Score search results based on relevance to the query."""
        try:
            logger.info(f"Scoring {len(results)} results for query: {query}")
            if model:
                logger.info(f"Using specified model: {model}")

            # Format results for the prompt
            results_text = "\n\n".join([
                f"URL: {result['url']}\n{result['content']}"
                for result in results
            ])
            logger.debug(f"Formatted results for scoring:\n{results_text}")

            prompt = f"{SCORE_RESULTS_PROMPT}\n\nQuery: {query}\n\nResults to score:\n{results_text}"
            logger.debug(f"Full prompt:\n{prompt}")

            # Get scores from AI
            logger.info("Requesting scores from AI provider...")
            response = await self.provider.generate(
                prompt=prompt,
                model=model,
                max_tokens=1000
            )
            logger.debug(f"Raw AI response:\n{response}")

            try:
                # Clean the response string
                response_text = response.strip()
                if response_text.startswith('```json'):
                    logger.debug(
                        "Detected JSON code block, extracting content")
                    response_text = response_text.split('```')[1].strip()
                elif response_text.startswith('```'):
                    logger.debug("Detected code block, extracting content")
                    response_text = response_text.split('```')[1].strip()

                logger.debug(f"Cleaned response text:\n{response_text}")

                # Parse the JSON response
                import json
                scores = json.loads(response_text)
                logger.debug(f"Parsed JSON scores: {scores}")

                if not isinstance(scores, list):
                    logger.error(
                        f"AI response is not a list. Type: {type(scores)}")
                    raise ValueError("Invalid response format")

                # Validate and clean up scores
                validated_scores = []
                result_urls = {result['url'] for result in results}
                logger.debug(f"Valid URLs: {result_urls}")

                for score in scores:
                    logger.debug(f"Processing score entry: {score}")
                    if not isinstance(score, dict):
                        logger.warning(
                            f"Skipping non-dict score entry: {score}")
                        continue

                    if 'url' not in score or 'score' not in score:
                        logger.warning(
                            f"Skipping score entry missing required fields: {score}")
                        continue

                    if score['url'] not in result_urls:
                        logger.warning(
                            f"Skipping score for unknown URL: {score['url']}")
                        continue

                    try:
                        # Ensure score is a number and within bounds
                        original_score = score['score']
                        score['score'] = max(
                            0, min(100, float(score['score'])))
                        if score['score'] != original_score:
                            logger.info(
                                f"Adjusted score for {score['url']} from {original_score} to {score['score']}")
                        validated_scores.append(score)
                        logger.debug(f"Validated score entry: {score}")
                    except (TypeError, ValueError):
                        logger.error(
                            f"Invalid score value for URL {score['url']}: {score.get('score')}")
                        continue

                # Ensure we have scores for all results
                if len(validated_scores) < len(results):
                    logger.warning(
                        f"Missing scores for some URLs. Found {len(validated_scores)} of {len(results)}")
                    missing_urls = result_urls - \
                        {score['url'] for score in validated_scores}
                    for url in missing_urls:
                        default_score = {'url': url, 'score': 50.0}
                        validated_scores.append(default_score)
                        logger.warning(
                            f"Added default score for missing URL: {url}")

                logger.info(
                    f"Successfully scored {len(validated_scores)} results")
                logger.debug(f"Final validated scores: {validated_scores}")
                return validated_scores

            except json.JSONDecodeError as e:
                logger.error(
                    f"Error parsing score results JSON: {str(e)}\nResponse: {response}")
                default_scores = [{'url': result['url'],
                                   'score': 50.0} for result in results]
                logger.info(
                    f"Returning default scores for {len(default_scores)} results")
                return default_scores

        except Exception as e:
            logger.error(f"Error in score_results: {str(e)}", exc_info=True)
            default_scores = [{'url': result['url'], 'score': 50.0}
                              for result in results]
            logger.info(
                f"Returning default scores for {len(default_scores)} results")
            return default_scores

    async def close(self):
        """Cleanup method to close the provider session"""
        await self.provider.close()


# Create a singleton instance
ai_service = AIService()

__all__ = ['ai_service']
