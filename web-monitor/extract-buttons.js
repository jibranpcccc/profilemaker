const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  console.log("Navigating...");
  await page.goto('https://democracy-edu.or.kr', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(20000);
  
  console.log("Extracting...");
  const navbar = await page.evaluate(() => {
    const container = document.body;
    const elements = Array.from(container.querySelectorAll('button, a'));
    return elements.map(el => ({
      tag: el.tagName,
      class: el.className,
      id: el.id,
      text: (el.innerText || '').trim()
    })).filter(x => x.text && x.text.length < 25);
  });
  
  console.log(JSON.stringify(navbar, null, 2));
  await browser.close();
})();
