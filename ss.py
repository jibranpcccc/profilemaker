import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto('https://holycrossconvent.edu.na/login', wait_until='networkidle')
        await page.wait_for_timeout(3000)
        await page.screenshot(path='wix_login_modal.png')
        await browser.close()
asyncio.run(main())
