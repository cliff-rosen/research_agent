import asyncio
from services.ai_service import ai_service

async def main():
    print("start")
    try:
        response = await ai_service.generate("hello")
        print(response)
    finally:
        await ai_service.close()

if __name__ == "__main__":
    asyncio.run(main())