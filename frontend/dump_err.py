import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        errors = []
        page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda exc: errors.append(str(exc)))
        
        await page.goto("http://localhost:5175/practice", wait_until="networkidle")
        await asyncio.sleep(2)  # Give React time to crash
        
        for e in errors:
            print(f"ERROR: {e}")
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
