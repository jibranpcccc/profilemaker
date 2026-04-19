import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto('https://holycrossconvent.edu.na', wait_until='networkidle')
        await page.wait_for_timeout(3000)
        
        # Dump all buttons and links
        elements = await page.evaluate('''() => {
            const res = [];
            document.querySelectorAll('a, button, [role="button"]').forEach(el => {
                const text = el.innerText ? el.innerText.trim() : '';
                if(text) res.push({tag: el.tagName, id: el.id, class: el.className, text: text.substring(0,30)});
            });
            return res;
        }''')
        
        for e in elements:
            print(f"ELEM: {e}")
        
        print(f"Total elements with text: {len(elements)}")
        await browser.close()

asyncio.run(main())
