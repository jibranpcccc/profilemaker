import asyncio
import aiohttp
import sqlite3
import os

db_path = os.path.join(os.environ['LOCALAPPDATA'], 'ProfileSubmissionAssistant', 'data.db')

async def check_site(session, url, name):
    res = {'name': name, 'url': url, 'status': 'Website Down', 'blocker': 'Timeout/DNS'}
    try:
        async with session.get(url, timeout=10, allow_redirects=True) as response:
            if response.status == 200:
                text = await response.text()
                if "cloudflare" in text.lower() or "challenge" in text.lower():
                    res['status'] = 'Failed'
                    res['blocker'] = 'Anti-bot (Cloudflare)'
                elif "captcha" in text.lower() or "g-recaptcha" in text.lower():
                    res['blocker'] = 'CAPTCHA'
                    res['status'] = 'Working'
                else:
                    res['status'] = 'Working'
                    res['blocker'] = 'None'
            elif response.status in [403, 401]:
                res['status'] = 'Failed'
                res['blocker'] = 'Anti-bot / Permission Denied'
            else:
                res['status'] = 'Failed'
                res['blocker'] = f'Technical Issue ({response.status})'
    except Exception as e:
        pass
    return res

async def main():
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute('SELECT SiteName, SignupUrl FROM Sites')
    sites = c.fetchall()
    
    async with aiohttp.ClientSession() as session:
        tasks = [check_site(session, s[1], s[0]) for s in sites]
        results = await asyncio.gather(*tasks)
        
        for r in results:
            print(f"RES|{r['name']}|{r['url']}|{r['status']}|{r['blocker']}")

if __name__ == '__main__':
    # Need to fix event loop policy for windows
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
