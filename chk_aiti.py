import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto('https://aiti.edu.vn/register/', wait_until='networkidle')
        
        username_visible = await page.evaluate("() => document.querySelector('input[name=\"username\"]') != null")
        login_visible = await page.evaluate("() => document.querySelector('input[name=\"login\"]') != null")
        print(f"Username visible: {username_visible}")
        print(f"Login visible: {login_visible}")
        
        # Dump input texts
        inputs = await page.evaluate('''() => {
            return Array.from(document.querySelectorAll('input:not([type="hidden"])')).map(e => e.name + ' (' + e.type + ')');
        }''')
        print("Inputs:", inputs)
        
        await browser.close()
asyncio.run(main())
