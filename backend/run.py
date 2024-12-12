import requests
from typing import List, Dict, Optional

def google_search(query: str, 
                 api_key: str, 
                 cx: str, 
                 num_results: int = 10, 
                 language: str = 'en',
                 safe: str = 'off') -> List[Dict]:
    """
    Perform a Google search using the Custom Search API.
    
    Args:
        query (str): The search query
        api_key (str): Your Google API key
        cx (str): Your Custom Search Engine ID
        num_results (int): Number of results to return (max 10 per request)
        language (str): Language code for results (e.g., 'en' for English)
        safe (str): Safe search setting ('off', 'medium', or 'high')
    
    Returns:
        List[Dict]: List of search results, each containing 'title', 'link', and 'snippet'
    
    Raises:
        requests.exceptions.RequestException: If the API request fails
        KeyError: If the API response is missing expected data
        ValueError: If invalid parameters are provided
    """
    
    # Validate parameters
    if num_results < 1 or num_results > 10:
        raise ValueError("num_results must be between 1 and 10")
    
    # Base URL for Google Custom Search API
    base_url = "https://www.googleapis.com/customsearch/v1"
    
    # Parameters for the API request
    params = {
        'key': api_key,
        'cx': cx,
        'q': query,
        'num': num_results,
        'lr': f'lang_{language}',
        'safe': safe
    }
    
    try:
        # Make the API request
        response = requests.get(base_url, params=params)
        response.raise_for_status()  # Raise exception for bad status codes
        
        # Parse the response
        data = response.json()
        
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
        
    except requests.exceptions.RequestException as e:
        raise requests.exceptions.RequestException(f"API request failed: {str(e)}")
    except KeyError as e:
        raise KeyError(f"Unexpected API response format: {str(e)}")
    except Exception as e:
        raise Exception(f"An error occurred: {str(e)}")

# Example usage
if __name__ == "__main__":

    # Replace with your actual API key and Custom Search Engine ID
    API_KEY = "AIzaSyDxT-UpFuK0xejdGYi0iF6lDXpqyt0yp8E"
    CX = "27704082b3f274080"
    
    try:
        results = google_search(
            query="Python programming",
            api_key=API_KEY,
            cx=CX,
            num_results=5
        )
        
        for i, result in enumerate(results, 1):
            print(f"\nResult {i}:")
            print(f"Title: {result['title']}")
            print(f"URL: {result['link']}")
            print(f"Snippet: {result['snippet']}")
            
    except Exception as e:
        print(f"Error: {str(e)}")

