const { chromium } = require('playwright');
const fs = require('fs');

async function testSite() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Create an account real quick via direct API if possible, or just go to registration
  await page.goto('https://blac.edu.pl/student-registration/');
  await page.waitForTimeout(2000);
  
  const rand = Math.floor(Math.random() * 10000);
  const username = 'testuser' + rand;
  const email = username + '@geezek.com';
  
  await page.fill('input[name="first_name"]', 'Test');
  await page.fill('input[name="last_name"]', 'User');
  await page.fill('input[name="user_login"]', username);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', 'Password123!');
  await page.fill('input[name="password_confirmation"]', 'Password123!');
  
  await page.click('button.tutor-button');
  await page.waitForTimeout(5000);
  
  // Go to profile edit
  await page.goto('https://blac.edu.pl/dashboard/settings/');
  await page.waitForTimeout(5000);
  
  const html = await page.content();
  const title = await page.title();
  const text = await page.evaluate(() => document.body.innerText.substring(0, 1000));
  
  console.log("TITLE:", title);
  console.log("TEXT START:\n", text);
  console.log("HAS BIO SELECTOR?", html.includes('tutor_profile_bio'));
  
  await browser.close();
}

testSite();
