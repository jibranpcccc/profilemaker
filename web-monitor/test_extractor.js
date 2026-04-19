const { chromium } = require('playwright');

async function testExtractor() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log("Navigating to blac.edu.pl login...");
  await page.goto('https://blac.edu.pl/dashboard/', { waitUntil: 'domcontentloaded' });
  
  // Fill login
  await page.fill('input[name="log"]', 'alexwg42159');
  await page.fill('input[name="pwd"]', 'Pass9975!Mx');
  await page.click('button[type="submit"]', { timeout: 3000 });
  
  console.log("Logged in. Waiting for dashboard to load...");
  await page.waitForTimeout(4000);
  
  // Run the exact DOM extractor logic from automation.ts STEP 8
  const dynamicExtractedUrl = await page.evaluate((uname) => {
    const anchors = Array.from(document.querySelectorAll('a'));
    const matches = anchors
      .map(a => a.href)
      .filter(h => h.toLowerCase().includes(uname.toLowerCase()) && 
                  (h.includes('/members/') || h.includes('/profile/') || h.includes('/author/') || h.includes('/user/')));
    
    if (matches.length > 0) {
       return matches.sort((a, b) => a.length - b.length)[0];
    }
    return null;
  }, 'alexwg42159');
  
  console.log("=== EXTRACTION RESULT ===");
  console.log(dynamicExtractedUrl);
  console.log("=========================");
  await browser.close();
}

testExtractor();
