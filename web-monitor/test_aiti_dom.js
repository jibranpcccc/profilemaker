const { chromium } = require('playwright');

async function testAitiDOM() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('https://aiti.edu.vn/login/', { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="login"]', 'alexwg82421');
  await page.fill('input[name="password"]', 'Pass2780!Mx');
  await page.click('button[type="submit"], input[type="submit"], .button.primary');
  
  await page.waitForTimeout(4000);
  await page.goto('https://aiti.edu.vn/account/personal-details', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  
  const allLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a')).map(a => ({ href: a.href, text: a.innerText }));
  });
  
  console.log("ALL LINKS:");
  allLinks.filter(l => l.href && l.href.includes('aiti.edu.vn')).forEach(l => console.log(l.text.replace(/\n/g, ' '), '=>', l.href));

  await browser.close();
}

testAitiDOM();
