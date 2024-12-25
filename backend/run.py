# test neo4j
import asyncio
from services.neo4j_service import neo4j_service
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


async def main():
    try:
        # Print connection details (without API key)
        logger.info(f"Attempting to connect to Neo4j at: {neo4j_service.uri}")

        # Connect to Neo4j
        await neo4j_service.connect()

        # Add a research question to neo4j
        node_id = await neo4j_service.create_research_node(
            "what is langchain?",
            {"query": "what is langchain?"}
        )

        print(f"Created node with ID: {node_id}")

    except Exception as e:
        logger.error(f"Error: {str(e)}", exc_info=True)
    finally:
        # Close the connection
        await neo4j_service.close()

# Run the async main function
if __name__ == "__main__":
    asyncio.run(main())
