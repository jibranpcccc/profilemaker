const { chromium } = require('playwright');

async function testAiti() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log("Navigating to aiti.edu.vn login...");
  await page.goto('https://aiti.edu.vn/login/', { waitUntil: 'domcontentloaded' });
  
  console.log("Filling login...");
  await page.fill('input[name="login"]', 'alexwg82421');
  await page.fill('input[name="password"]', 'Pass2780!Mx');
  await page.click('button[type="submit"], input[type="submit"], .button.primary');
  
  console.log("Logged in. Navigating to profile edit...");
  await page.waitForTimeout(4000);
  await page.goto('https://aiti.edu.vn/account/personal-details', { waitUntil: 'domcontentloaded' });
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
  }, 'alexwg82421');
  
  console.log("=== EXTRACTION RESULT ===");
  console.log(dynamicExtractedUrl);
  console.log("=========================");
  await browser.close();
}

testAiti();
