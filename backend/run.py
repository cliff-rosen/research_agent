from services.search_service import expand_query
import asyncio
async def main():   
    query = "what is langchain?"
    queries = await expand_query(query)
    for query in queries:
        print(query + "\n")

if __name__ == "__main__":
    asyncio.run(main())

