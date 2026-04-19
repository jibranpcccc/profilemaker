import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        try:
            r = await page.goto('https://holycrossconvent.edu.na/login', wait_until='networkidle', timeout=20000)
            print(f"URL after /login: {page.url}")
            # check if there's any auth modal
            has_login = await page.evaluate("() => document.querySelectorAll('[data-testid=\"login\"], input[type=\"email\"], button:has-text(\"Log In\")').length")
            print(f"Login elements found: {has_login}")
        except Exception as e:
            print("timeout", e)
        
        await browser.close()

asyncio.run(main())
