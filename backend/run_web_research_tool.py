from langchain_community.retrievers.web_research import WebResearchRetriever
from langchain_google_community import GoogleSearchAPIWrapper
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from typing import List, Optional
import logging
import os
from config.settings import settings


class WebResearchTool:
    def __init__(self, google_api_key: str, google_cse_id: str, openai_api_key: str):
        """
        Initialize the WebResearchTool with required API keys and configurations.

        Args:
            google_api_key (str): Google Custom Search API key
            google_cse_id (str): Google Custom Search Engine ID
            openai_api_key (str): OpenAI API key
        """
        # Set up logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

        # Set required environment variables
        os.environ["GOOGLE_CSE_ID"] = settings.GOOGLE_SEARCH_ENGINE_ID
        os.environ["GOOGLE_API_KEY"] = settings.GOOGLE_SEARCH_API_KEY
        os.environ["OPENAI_API_KEY"] = settings.OPENAI_API_KEY
        os.environ["USER_AGENT"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"

        self.retriever = None
        self.initialize_retriever()

    def initialize_retriever(self) -> None:
        """Initialize the WebResearchRetriever with all necessary components."""
        try:
            # Initialize search wrapper with explicit credentials
            search = GoogleSearchAPIWrapper(
                google_api_key=os.getenv("GOOGLE_API_KEY"),
                google_cse_id=os.getenv("GOOGLE_CSE_ID")
            )

            # Initialize language model
            llm = ChatOpenAI(
                temperature=0,
                model="gpt-3.5-turbo",
                api_key=os.getenv("OPENAI_API_KEY")
            )

            # Initialize embeddings
            embeddings = OpenAIEmbeddings(api_key=os.getenv("OPENAI_API_KEY"))

            # Create vectorstore with placeholder
            vectorstore = FAISS.from_texts(
                ["placeholder text for initialization"],
                embeddings
            )

            # Configure text splitter
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=100,
            )

            # Initialize web research retriever
            self.retriever = WebResearchRetriever.from_llm(
                vectorstore=vectorstore,
                llm=llm,
                search=search,
                num_search_results=3,  # Configurable
                text_splitter=text_splitter,
                allow_dangerous_requests=True
            )

            self.logger.info("WebResearchRetriever initialized successfully")

        except Exception as e:
            self.logger.error(
                f"Failed to initialize WebResearchRetriever: {str(e)}")
            raise

    def search(self, query: str, num_results: Optional[int] = 3) -> List[dict]:
        """
        Perform a web search and return relevant documents.

        Args:
            query (str): The search query
            num_results (int, optional): Number of results to return. Defaults to 3.

        Returns:
            List[dict]: List of documents with their metadata
        """
        try:
            if not self.retriever:
                raise ValueError("WebResearchRetriever not initialized")

            self.logger.info(f"Executing search query: {query}")
            docs = self.retriever.get_relevant_documents(query)

            # Format results
            results = []
            for doc in docs[:num_results]:
                results.append({
                    'content': doc.page_content,
                    'source': doc.metadata.get('source', 'N/A'),
                    'title': doc.metadata.get('title', 'N/A')
                })

            return results

        except Exception as e:
            self.logger.error(f"Error during web search: {str(e)}")
            return []


def main():
    """Example usage of the WebResearchTool"""
    try:
        # Initialize the tool
        research_tool = WebResearchTool(
            google_api_key="your_google_api_key",
            google_cse_id="your_google_cse_id",
            openai_api_key="your_openai_api_key"
        )

        # Perform a search
        query = "What are the latest developments in quantum computing?"
        results = research_tool.search(query)

        # Display results
        for i, result in enumerate(results, 1):
            print(f"\nResult {i}:")
            print(f"Source: {result['source']}")
            print(f"Title: {result['title']}")
            print(f"Content: {result['content'][:200]}...")  # First 200 chars

    except Exception as e:
        logging.error(f"Main execution failed: {str(e)}")


if __name__ == "__main__":
    main()
