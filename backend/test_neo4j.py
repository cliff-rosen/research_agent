import asyncio
import logging
from neo4j import AsyncGraphDatabase
from config.settings import settings

logging.basicConfig(level=logging.DEBUG)
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
            result = await session.run("RETURN 1 as num")
            record = await result.single()
            logger.info(f"Test query result: {record['num']}")

    except Exception as e:
        logger.error(f"Connection failed: {str(e)}", exc_info=True)
    finally:
        if driver:
            await driver.close()

if __name__ == "__main__":
    asyncio.run(test_connection())
