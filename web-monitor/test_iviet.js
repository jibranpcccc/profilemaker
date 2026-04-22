const { chromium } = require('playwright');

const SITE = {
  name: 'iViet Education',
  registerUrl: 'https://iviet.edu.vn/student-registration/',
  dashboardUrls: [
    '/dashboard/',
    '/hoc-vien/',       // Vietnamese "student" path
    '/my-account/',
    '/tai-khoan/',
  ],
  bioSelectors: [
    'textarea[name="description"]',
    'textarea[name="tutor_profile_bio"]',
    '#description',
    'textarea.tutor-form-control'
  ]
};

function generateIdentity() {
  const ts = Date.now().toString().slice(-6); 
  const rand = Math.floor(100 + Math.random() * 899);
  const username = `user${ts}${rand}`;  
  const email = `${username}@gmail.com`; 
  const password = `Tz${ts}@Kw${rand}!`;
  return {
    firstName: 'Alex', lastName: 'Taylor', username, email, password,
    website: 'https://creativeminds-studio.com',
    bio: 'Passionate educator and lifelong learner.'
  };
}

async function registerIViet(page, identity) {
  console.log(`[1] Navigating to ${SITE.registerUrl}`);
  await page.goto(SITE.registerUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });

  console.log(`[2] Filling Form...`);
  await page.fill('input[name="first_name"]', identity.firstName);
  await page.fill('input[name="last_name"]', identity.lastName);
  await page.fill('input[name="user_login"]', identity.username);
  await page.fill('input[type="email"], input[name="email"]', identity.email);
  
  const pwds = await page.locator('input[type="password"]').all();
  for (const p of pwds) await p.fill(identity.password);

  console.log(`[3] Submitting...`);
  await page.click('input[type="submit"], button[type="submit"]', { force: true });
  await page.waitForTimeout(4000);

  const postUrl = page.url();
  console.log('Post-register URL:', postUrl);
  return postUrl;
}

(async () => {
    console.log("=== TESTING iviet.edu.vn ===");
    const browser = await chromium.launch({ headless: false, args: ['--no-sandbox'] });
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
        const id = generateIdentity();
        console.log(`Identity: ${id.username} / ${id.password}`);
        await registerIViet(page, id);
    } catch(e) {
        console.log("Error:", e);
    } finally {
        await browser.close();
    }
})();
