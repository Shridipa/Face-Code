import asyncio
from leetcode_fetcher import fetch_question_content

async def main():
    slug = "climbing-stairs"
    content = await fetch_question_content(slug)
    print(f"Slug: {slug}")
    print(f"Content length: {len(content.get('content', ''))}")
    print(f"Content prefix: {content.get('content', '')[:100]}...")
    
if __name__ == "__main__":
    asyncio.run(main())
