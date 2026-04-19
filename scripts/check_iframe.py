import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto('https://holycrossconvent.edu.na/login', wait_until='networkidle')
        await page.wait_for_timeout(4000)
        
        frames = page.frames
        print(f"Total frames: {len(frames)}")
        
        for i, f in enumerate(frames):
            try:
                emails = await f.evaluate("() => document.querySelectorAll('input[type=\"email\"], input[name=\"email\"]').length")
                if emails > 0:
                    print(f"Frame {i} ({f.url}) has email input!")
            except Exception as e:
                pass
                
        await browser.close()
asyncio.run(main())
