from neo4j import AsyncGraphDatabase
from typing import List, Dict, Any, Optional
import logging
from config.settings import settings

logger = logging.getLogger(__name__)


class Neo4jService:
    def __init__(self):
        # Get connection details from settings
        self.uri = settings.NEO4J_URI
        self.api_key = settings.NEO4J_API_KEY
        self.driver = None

    async def connect(self):
        """Initialize the Neo4j driver connection."""
        try:
            if not self.driver:
                self.driver = AsyncGraphDatabase.driver(
                    self.uri,
                    auth=("neo4j", self.api_key),
                    database=settings.NEO4J_DATABASE,
                    max_connection_lifetime=3600,
                    max_connection_pool_size=50,
                    connection_timeout=30
                )
                # Verify connection
                await self.driver.verify_connectivity()
                logger.info("Successfully connected to Neo4j database")
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j: {str(e)}")
            raise

    async def close(self):
        """Close the Neo4j driver connection."""
        if self.driver:
            await self.driver.close()
            self.driver = None
            logger.info("Neo4j connection closed")

    async def execute_query(self, query: str, parameters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Execute a Cypher query and return the results.

        Args:
            query (str): The Cypher query to execute
            parameters (Dict[str, Any], optional): Query parameters. Defaults to None.

        Returns:
            List[Dict[str, Any]]: List of query results
        """
        if not self.driver:
            await self.connect()

        try:
            async with self.driver.session(database=settings.NEO4J_DATABASE) as session:
                result = await session.run(query, parameters or {})
                records = await result.data()
                return records
        except Exception as e:
            logger.error(f"Error executing Neo4j query: {str(e)}")
            raise

    async def create_research_node(self, question: str, metadata: Dict[str, Any]) -> str:
        """
        Create a research question node in Neo4j.

        Args:
            question (str): The research question
            metadata (Dict[str, Any]): Additional metadata about the question

        Returns:
            str: The ID of the created node
        """
        query = """
        CREATE (q:ResearchQuestion {
            question: $question,
            timestamp: datetime(),
            metadata: $metadata
        })
        RETURN id(q) as node_id
        """

        try:
            result = await self.execute_query(query, {
                "question": question,
                "metadata": metadata
            })
            return result[0]["node_id"]
        except Exception as e:
            logger.error(f"Error creating research node: {str(e)}")
            raise

    async def link_search_results(self, question_id: str, search_results: List[Dict[str, Any]]):
        """
        Link search results to a research question node.

        Args:
            question_id (str): The ID of the research question node
            search_results (List[Dict[str, Any]]): List of search results to link
        """
        query = """
        MATCH (q:ResearchQuestion) WHERE id(q) = $question_id
        UNWIND $results as result
        CREATE (s:SearchResult {
            title: result.title,
            url: result.link,
            snippet: result.snippet,
            relevance_score: result.relevance_score
        })
        CREATE (q)-[:HAS_RESULT]->(s)
        """

        try:
            await self.execute_query(query, {
                "question_id": question_id,
                "results": search_results
            })
        except Exception as e:
            logger.error(f"Error linking search results: {str(e)}")
            raise

    async def get_research_history(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Retrieve recent research questions and their results.

        Args:
            limit (int): Maximum number of questions to retrieve

        Returns:
            List[Dict[str, Any]]: List of research questions with their results
        """
        query = """
        MATCH (q:ResearchQuestion)
        OPTIONAL MATCH (q)-[:HAS_RESULT]->(s:SearchResult)
        WITH q, collect(s) as results
        RETURN q.question as question,
               q.timestamp as timestamp,
               q.metadata as metadata,
               results
        ORDER BY q.timestamp DESC
        LIMIT $limit
        """

        try:
            return await self.execute_query(query, {"limit": limit})
        except Exception as e:
            logger.error(f"Error retrieving research history: {str(e)}")
            raise


# Create a singleton instance
neo4j_service = Neo4jService()

# Export the singleton instance
__all__ = ['neo4j_service']