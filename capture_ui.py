import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # Screenshot Campaigns Export Button
        await page.goto('http://localhost:3000/campaigns', wait_until='networkidle')
        await page.wait_for_timeout(3000)
        await page.screenshot(path='campaigns_export_ui.png')
        
        # Screenshot Sites Upload UI
        await page.goto('http://localhost:3000/sites', wait_until='networkidle')
        await page.wait_for_timeout(2000)
        await page.click('button:has-text("Upload Targets")')
        await page.wait_for_timeout(1000)
        await page.fill('textarea', 'https://newdomain.com/register\\nhttps://testedu.edu/login')
        await page.screenshot(path='sites_upload_ui.png')
        
        await browser.close()

asyncio.run(main())
