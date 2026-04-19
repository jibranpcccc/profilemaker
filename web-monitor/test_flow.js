const { chromium } = require('playwright');

async function testFullFlow() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const rand = Math.floor(Math.random() * 10000);
  const username = 'testuser' + rand;
  const email = username + '@geezek.com';
  
  console.log(`[1] Registering ${username} on blac.edu.pl...`);
  await page.goto('https://blac.edu.pl/student-registration/');
  await page.fill('input[name="first_name"]', 'Test');
  await page.fill('input[name="last_name"]', 'User');
  await page.fill('input[name="user_login"]', username);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', 'Password123!');
  await page.fill('input[name="password_confirmation"]', 'Password123!');
  await page.click('button.tutor-button');
  await page.waitForTimeout(5000);
  
  console.log(`[2] Navigating to profile edit (SESSION PRESERVED)...`);
  await page.goto('https://blac.edu.pl/dashboard/settings/');
  await page.waitForTimeout(3000);
  
  console.log(`[3] Injecting bio with backlink...`);
  const bioArea = 'textarea[name="tutor_profile_bio"]';
  const bioVal = `This is a test bio.\n\nVisit my site: <a href="https://megawin188.id/">megawin</a>`;
  try {
    await page.fill(bioArea, bioVal);
    await page.click('button.tutor-btn-primary');
    await page.waitForTimeout(4000);
    console.log(`[4] Profile fully updated!`);
  } catch (e) {
    console.log("Failed to inject bio:", e.message);
  }
  
  const profileUrl = `https://blac.edu.pl/profile/${username}/`;
  console.log(`[5] Verifying public guest visibility at ${profileUrl}...`);
  
  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();
  const response = await guestPage.goto(profileUrl);
  
  console.log(`HTTP STATUS: ${response.status()}`);
  const html = await guestPage.content();
  
  if (html.includes('megawin188.id')) {
    console.log("✅ SUCCESS: Found backlink in the HTML of the public profile!");
  } else {
    console.log("❌ FAILURE: Backlink not visible on public profile.");
  }

  await browser.close();
}

testFullFlow();
