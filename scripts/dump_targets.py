import asyncio
from playwright.async_api import async_playwright

async def check_domain(p, name, url):
    print(f"\n--- Checking {name} ({url}) ---")
    browser = await p.chromium.launch(headless=True)
    page = await browser.new_page()
    try:
        response = await page.goto(url, wait_until='networkidle', timeout=20000)
        print(f"Status: {response.status if response else 'Unknown'}, URL: {page.url}")
        
        inputs = await page.evaluate('''() => {
            return Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea, [role="button"], button')).map(e => {
                let id = e.id ? "#" + e.id : "";
                let name = e.name ? " name=" + e.name : "";
                let type = e.type ? " type=" + e.type : "";
                let cls = e.className ? " class=" + e.className : "";
                let text = (e.innerText || "").trim().substring(0, 20);
                return `${e.tagName}${id}${name}${type}${cls} -> ${text}`;
            });
        }''')
        for i in inputs:
            print("  ", i)
    except Exception as e:
        print("Error:", e)
    finally:
        await browser.close()

async def main():
    async with async_playwright() as p:
        await check_domain(p, "academy.edutic.id", "https://academy.edutic.id/student-registration/")
        await check_domain(p, "aiti.edu.vn", "https://aiti.edu.vn/register/")
        await check_domain(p, "learndash.aula.edu.pe", "https://learndash.aula.edu.pe/register/")
        await check_domain(p, "ensp.edu.mx", "https://ensp.edu.mx/register/")

asyncio.run(main())
