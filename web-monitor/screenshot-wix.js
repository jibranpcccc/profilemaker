const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ 
    viewport: { width: 1280, height: 800 } 
  });
  console.log("Navigating...");
  await page.goto('https://ictae.edu.mx/', { waitUntil: 'networkidle', timeout: 60000 }).catch(()=>console.log("timeout"));
  await page.waitForTimeout(5000);
  
  await page.screenshot({ path: 'C:\\Users\\jibra\\.gemini\\antigravity\\brain\\752b7e2a-13f9-4b7a-9912-64ed19d8d7df\\artifacts\\wix-ictae.png', fullPage: true });
  console.log("Screenshot taken.");
  
  await browser.close();
})();
