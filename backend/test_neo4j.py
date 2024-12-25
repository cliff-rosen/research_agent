import asyncio
import logging
from neo4j import AsyncGraphDatabase
from services.neo4j_service import neo4j_service
from config.settings import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def test_connection():
    try:
        # Print connection details
        logger.info(f"Testing connection to: {settings.NEO4J_URI}")
        logger.info(f"API key present: {bool(settings.NEO4J_API_KEY)}")
        logger.info(f"Database name: {settings.NEO4J_DATABASE}")

        # Create driver
        driver = AsyncGraphDatabase.driver(
            settings.NEO4J_URI,
            auth=("neo4j", settings.NEO4J_API_KEY),
            database=settings.NEO4J_DATABASE
        )

        # Test connection
        await driver.verify_connectivity()
        logger.info("Connection successful!")

        # Try a simple query
        async with driver.session(database=settings.NEO4J_DATABASE) as session:
            result = await session.run("Match (n:PERSON) return n.name")
            record = await result.single()
            logger.info(f"Test query result: {record}")

    except Exception as e:
        logger.error(f"Connection failed: {str(e)}", exc_info=True)
    finally:
        if driver:
            await driver.close()

# asyncio.run(test_connection())
# create async function
async def test_neo4j_service():
    query = "MATCH (p:PERSON) RETURN p"
    result = await neo4j_service.execute_query(query)
    print(result)

asyncio.run(test_neo4j_service())
