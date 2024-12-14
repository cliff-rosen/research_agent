import requests
from typing import Optional, Dict, Any
from config.settings import settings
import json

class GoogleCustomSearch:
    def __init__(self, api_key: str, cx: str):
        """
        Initialize the Google Custom Search client.
        
        Args:
            api_key (str): Your Google API key
            cx (str): Your Custom Search Engine ID
        """
        self.base_url = "https://www.googleapis.com/customsearch/v1"
        self.api_key = api_key
        self.cx = cx

    def search(
        self,
        query: str,
        num_results: int = 10,
        language: str = "en",
        safe: str = "off",
        **additional_params: Any
    ) -> Dict[str, Any]:
        """
        Perform a Google Custom Search.
        
        Args:
            query (str): Search query
            num_results (int): Number of results to return (1-10)
            language (str): Language for search results
            safe (str): Safe search setting ('off', 'medium', 'high')
            **additional_params: Additional parameters to pass to the API
            
        Returns:
            Dict containing the search results
            
        Raises:
            requests.exceptions.RequestException: If the API request fails
            ValueError: If invalid parameters are provided
        """
        if not (1 <= num_results <= 10):
            raise ValueError("num_results must be between 1 and 10")
            
        params = {
            'key': self.api_key,
            'cx': self.cx,
            'q': query,
            'num': num_results,
            'hl': language,
            'safe': safe,
            **additional_params
        }
        
        try:
            response = requests.get(self.base_url, params=params)
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            print(f"Error making request: {e}")
            raise
            
    def pretty_print_results(self, results: Dict[str, Any]) -> None:
        """
        Print search results in a readable format.
        
        Args:
            results (Dict): Search results from the search() method
        """
        if 'items' not in results:
            print("No results found")
            return
            
        for i, item in enumerate(results['items'], 1):
            print(f"\nResult {i}:")
            print(f"Title: {item.get('title', 'N/A')}")
            print(f"Link: {item.get('link', 'N/A')}")
            print(f"Snippet: {item.get('snippet', 'N/A')}")
            print("-" * 80)

# Example usage:
if __name__ == "__main__":
    # Replace with your actual API key and Search Engine ID
    API_KEY = settings.GOOGLE_SEARCH_API_KEY
    CX = settings.GOOGLE_SEARCH_ENGINE_ID
    
    searcher = GoogleCustomSearch(API_KEY, CX)
    
    try:
        results = searcher.search(
            query="Python programming",
            num_results=5,
            language="en",
            safe="off"
        )
        searcher.pretty_print_results(results)
        
    except Exception as e:
        print(f"An error occurred: {e}")