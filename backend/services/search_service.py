from sqlalchemy.orm import Session
import logging
from typing import List, Dict, Optional
import aiohttp
from config.settings import settings
from schemas import SearchResult, URLContent
from services.ai_service import ai_service
import ssl
import certifi
from bs4 import BeautifulSoup
import trafilatura
import asyncio
import json
import re
import markdown
from pygments import highlight
from pygments.formatters import HtmlFormatter
from pygments.lexers import get_lexer_by_name, guess_lexer
from pygments.util import ClassNotFound
import mimetypes
import chardet

NUM_RESULTS = settings.GOOGLE_SEARCH_NUM_RESULTS

logger = logging.getLogger(__name__)


async def search(db: Session, query: str, user_id: int = 0) -> List[SearchResult]:
    """
    Perform web search for the given query using Google Custom Search API
    and score results using AI

    Args:
        db (Session): Database session
        query (str): Search query
        user_id (int): ID of the user performing the search

    Returns:
        List[SearchResult]: List of scored and sorted search results
    """
    logger.info(f"Performing web search for query: {query}")

    try:
        results = await google_search(query)

        # Transform results to match our SearchResult schema
        search_results = [
            SearchResult(
                title=result["title"],
                link=result["link"],
                snippet=result["snippet"],
                displayLink=result["displayLink"],
                pagemap=result["pagemap"],
                relevance_score=0.0  # Initialize score
            )
            for result in results
        ]

        # Score and sort results
        scored_results = await score_and_rank_results(query, search_results)
        return scored_results

    except Exception as e:
        logger.error(f"Error performing Google search: {str(e)}")
        return []


async def google_search(query: str,
                        api_key: str = settings.GOOGLE_SEARCH_API_KEY,
                        cx: str = settings.GOOGLE_SEARCH_ENGINE_ID,
                        num_results: int = NUM_RESULTS,
                        language: str = 'en',
                        safe: str = 'off') -> List[Dict]:
    """
    Perform a Google search using the Custom Search API.

    Args:
        query (str): The search query
        api_key (str): Your Google API key (defaults to settings.GOOGLE_SEARCH_API_KEY)
        cx (str): Your Custom Search Engine ID (defaults to settings.GOOGLE_SEARCH_ENGINE_ID)
        num_results (int): Number of results to return (max 10 per request)
        language (str): Language code for results (e.g., 'en' for English)
        safe (str): Safe search setting ('off', 'medium', or 'high')

    Returns:
        List[Dict]: List of search results, each containing 'title', 'link', and 'snippet'
    """
    base_url = "https://www.googleapis.com/customsearch/v1"

    params = {
        'key': api_key,
        'cx': cx,
        'q': query,
        'num': num_results,
        'hl': language,
        'safe': safe
    }

    try:
        # Create SSL context with verified certificates
        ssl_context = ssl.create_default_context(cafile=certifi.where())

        # Use the SSL context in the ClientSession
        async with aiohttp.ClientSession(connector=aiohttp.TCPConnector(ssl=ssl_context)) as session:
            async with session.get(base_url, params=params) as response:
                response.raise_for_status()
                data = await response.json()

                # Check if there are search results
                if 'items' not in data:
                    return []

                # Extract relevant information from each result
                results = []
                for item in data['items']:
                    result = {
                        'title': item.get('title', ''),
                        'link': item.get('link', ''),
                        'snippet': item.get('snippet', ''),
                        'displayLink': item.get('displayLink', ''),
                        'pagemap': item.get('pagemap', {})
                    }
                    results.append(result)

                return results

    except aiohttp.ClientError as e:
        logger.error(f"API request failed: {str(e)}")
        return []
    except Exception as e:
        logger.error(f"An error occurred during Google search: {str(e)}")
        return []


async def score_and_rank_results(query: str, results: List[SearchResult]) -> List[SearchResult]:
    """
    Score and rank search results based on relevance to the query.

    Args:
        query (str): The search query
        results (List[SearchResult]): List of search results to score

    Returns:
        List[SearchResult]: Scored and ranked results
    """
    try:
        # Convert SearchResult objects to dictionaries for AI scoring
        results_for_scoring = [
            {
                'url': result.link,
                'content': f"Title: {result.title}\nSnippet: {result.snippet}"
            }
            for result in results
        ]

        # Get scores from AI service
        scores = await ai_service.score_results(query, results_for_scoring)

        # Create a map of url to score
        score_map = {score['url']: score['score'] for score in scores}

        # Add scores to results
        scored_results = []
        for result in results:
            result_copy = result.copy()
            result_copy.relevance_score = score_map.get(result.link, 50.0)
            scored_results.append(result_copy)

        # Sort by score in descending order
        scored_results.sort(key=lambda x: x.relevance_score, reverse=True)

        return scored_results

    except Exception as e:
        logger.error(f"Error scoring results: {str(e)}")
        # Return original results with default score if scoring fails
        for result in results:
            result.relevance_score = 50.0
        return results


def detect_content_type(text: str, url: str) -> str:
    """
    Detect the content type of the text based on content patterns.
    """
    # First check for HTML content (most common case for web content)
    if '<html' in text.lower() or '<body' in text.lower() or '<div' in text.lower() or '<p>' in text.lower():
        return 'html'

    # Then check for markdown patterns
    if text.startswith('#') or '```' in text or re.search(r'\[.*\]\(.*\)', text):
        return 'markdown'

    # Check for code patterns
    if re.search(r'(function|class|import|export|const|let|var)\s+\w+', text):
        return 'code'

    # Default to HTML for web content
    if url.startswith(('http://', 'https://')):
        return 'html'

    return 'text'


def format_code(code: str, language: Optional[str] = None) -> str:
    """
    Format code with syntax highlighting.
    """
    try:
        if language:
            lexer = get_lexer_by_name(language)
        else:
            lexer = guess_lexer(code)

        formatter = HtmlFormatter(style='monokai', cssclass='source-code')
        return highlight(code, lexer, formatter)
    except ClassNotFound:
        return code


def format_content(text: str, content_type: str) -> str:
    """
    Format content based on its type.
    """
    if content_type == 'html':
        # Clean and format HTML
        soup = BeautifulSoup(text, 'html.parser')
        # Remove script and style elements
        for element in soup(['script', 'style', 'meta', 'link']):
            element.decompose()
        return str(soup)
    elif content_type == 'markdown':
        # Convert markdown to HTML
        return markdown.markdown(text, extensions=['fenced_code', 'tables'])
    elif content_type == 'code':
        # Apply syntax highlighting
        return format_code(text)
    else:
        # Plain text - wrap in markdown code block for proper formatting
        return f"```\n{text}\n```"


async def fetch_url_content(url: str) -> URLContent:
    """
    Fetch and extract clean content from a URL.

    Args:
        url (str): The URL to fetch content from

    Returns:
        URLContent: Pydantic model containing:
        - url: Original URL
        - title: Page title
        - text: Main content text as HTML
        - error: Error message if failed
        - content_type: Always 'html'
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
    }

    try:
        ssl_context = ssl.create_default_context(cafile=certifi.where())
        timeout = aiohttp.ClientTimeout(total=15)  # 15 seconds total timeout

        async with aiohttp.ClientSession(
            connector=aiohttp.TCPConnector(ssl=ssl_context),
            timeout=timeout,
            headers=headers
        ) as session:
            async with session.get(url) as response:
                response.raise_for_status()

                # Handle PDF files
                content_type = response.headers.get('Content-Type', '').lower()
                if 'application/pdf' in content_type:
                    return URLContent(
                        url=url,
                        title=url.split('/')[-1],
                        text='<p>This is a PDF document. Please click the link above to view it.</p>',
                        content_type='html',
                        error=''
                    )

                try:
                    html = await response.text()
                except UnicodeDecodeError:
                    # Try with different encoding if default fails
                    raw_data = await response.read()
                    detected = chardet.detect(raw_data)
                    html = raw_data.decode(
                        detected['encoding'] or 'utf-8', errors='ignore')

                # First try trafilatura for content extraction
                try:
                    extracted = trafilatura.extract(
                        html,
                        include_tables=True,
                        include_images=False,
                        include_links=True,
                        output_format='json',
                        with_metadata=True,
                        favor_precision=True
                    )

                    if extracted:
                        data = json.loads(extracted)
                        title = data.get('title', '')
                        text = data.get('text', '')

                        # Convert plain text to HTML paragraphs
                        if text:
                            paragraphs = [p.strip()
                                          for p in text.split('\n\n') if p.strip()]
                            content = '\n'.join(
                                [f'<p>{p}</p>' for p in paragraphs])
                        else:
                            content = '<p>No content could be extracted from this page.</p>'
                    else:
                        # Fallback to BeautifulSoup
                        soup = BeautifulSoup(html, 'html.parser')

                        # Get title - try meta title first, then regular title
                        title = ''
                        meta_title = soup.find('meta', property='og:title')
                        if meta_title:
                            title = meta_title.get('content', '')
                        if not title:
                            title_tag = soup.find('title')
                            if title_tag:
                                title = title_tag.string

                        # Remove unwanted elements
                        for tag in soup(['script', 'style', 'meta', 'link', 'header', 'footer', 'nav']):
                            tag.decompose()

                        # Try to find main content area
                        main_content = (
                            soup.find('main') or
                            soup.find('article') or
                            soup.find(['div', 'section'], class_=lambda x: x and any(
                                c in str(x).lower() for c in ['content', 'main', 'article', 'post', 'entry']))
                        )

                        if main_content:
                            # Clean up the content
                            content = str(main_content)
                        else:
                            # If no main content found, get all paragraphs
                            paragraphs = []
                            for p in soup.find_all(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
                                text = p.get_text().strip()
                                if text:
                                    paragraphs.append(str(p))
                            content = '\n'.join(
                                paragraphs) if paragraphs else '<p>No content could be extracted from this page.</p>'

                    # If no title found, use the URL's domain
                    if not title:
                        from urllib.parse import urlparse
                        domain = urlparse(url).netloc
                        title = domain.replace('www.', '').capitalize()

                    return URLContent(
                        url=url,
                        title=title,
                        text=content,
                        content_type='html',
                        error=''
                    )

                except Exception as e:
                    logger.error(
                        f"Error extracting content from {url}: {str(e)}")
                    return URLContent(
                        url=url,
                        title=url,
                        text='<p>Error extracting content from this page.</p>',
                        content_type='html',
                        error=str(e)
                    )

    except aiohttp.ClientError as e:
        error_msg = str(e)
        if isinstance(e, aiohttp.ClientResponseError):
            if e.status == 403:
                error_msg = "Access to this page is forbidden. The website may block automated access."
            elif e.status == 404:
                error_msg = "The page could not be found."
            elif e.status == 429:
                error_msg = "Too many requests. The website has temporarily blocked access."

        logger.error(f"Error fetching URL {url}: {error_msg}")
        return URLContent(
            url=url,
            title=url,
            text=f'<p>Error: {error_msg}</p>',
            content_type='html',
            error=error_msg
        )
    except Exception as e:
        logger.error(f"Error fetching URL {url}: {str(e)}")
        return URLContent(
            url=url,
            title=url,
            text='<p>An error occurred while fetching this content.</p>',
            content_type='html',
            error=str(e)
        )


async def fetch_urls_content(urls: List[str]) -> List[URLContent]:
    """
    Fetch and extract content from multiple URLs in parallel.

    Args:
        urls (List[str]): List of URLs to fetch content from

    Returns:
        List[URLContent]: List of URL contents, with error messages for failed fetches
    """
    try:
        # Create tasks for all URLs
        tasks = [fetch_url_content(url) for url in urls]

        # Execute all tasks in parallel
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Process results, converting exceptions to error messages
        processed_results = []
        for url, result in zip(urls, results):
            if isinstance(result, Exception):
                # If the result is an exception, create an error URLContent
                processed_results.append(URLContent(
                    url=url,
                    title="",
                    text="",
                    content_type="text",
                    error=str(result)
                ))
            else:
                # If successful, use the result directly
                processed_results.append(result)

        return processed_results
    except Exception as e:
        logger.error(f"Error in parallel URL fetching: {str(e)}")
        raise
