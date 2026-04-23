/**
 * profile_filler.js
 * Reads mass_results_live.json and injects bio + website link into each profile
 * Usage: node profile_filler.js
 */

const { chromium } = require('playwright');
const fs = require('fs');

const TARGET_URL = 'https://yourtargetsite.com';
const BIO = 'Hair care enthusiast sharing pro styling tips, healthy hair routines, and honest product reviews.';
const results = JSON.parse(fs.readFileSync('live_links.json')).filter(r => r.profileLive && !r.linkPresent);

// Load selectors from dataset for each domain
const dataset = [
  ...JSON.parse(fs.readFileSync('platform_dataset.json')),
  ...(fs.existsSync('new_dataset_updates.json') ? JSON.parse(fs.readFileSync('new_dataset_updates.json')) : []),
];
const dataMap = {};
dataset.forEach(s => { if (s.domain) dataMap[s.domain] = s; });

async function fillProfile(page, record) {
  const meta = dataMap[record.domain] || {};
  const editUrl = (meta.profileediturl || meta.profileEditUrl || '')
    .replace(/USERNAME|\{username\}/ig, record.username)
    || `https://${record.domain}/profile/${record.username}/edit`;

  // Login first
  const loginUrl = `https://${record.domain}/wp-login.php`;
  try {
    await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.fill('#user_login, input[name="log"]',    record.username);
    await page.fill('#user_pass,  input[name="pwd"]',    record.password);
    await page.click('#wp-submit, input[type="submit"]');
    await page.waitForTimeout(3000);
  } catch {}

  // Navigate to profile edit page
  await page.goto(editUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);

  // Bio selectors (covers Tutor LMS, Moodle, LearnDash, CKAN)
  const bioSelectors = [
    meta.bioSelector,
    'textarea[name="description"]',
    'textarea[name="bio"]',
    '#field-about',
    'textarea.bio',
    '[data-testid="bio-input"]',
    'textarea',
  ].filter(Boolean);

  let bioFilled = false;
  for (const sel of bioSelectors) {
    try {
      const el = await page.$(sel);
      if (el) {
        await el.click();
        await el.fill(BIO + ' ' + TARGET_URL);
        bioFilled = true;
        break;
      }
    } catch {}
  }

  // Website URL selectors
  const webSelectors = [
    meta.websiteSelector,
    'input[name="url"]',
    'input[name="website"]',
    'input[type="url"]',
    '#url',
  ].filter(Boolean);

  let webFilled = false;
  for (const sel of webSelectors) {
    try {
      const el = await page.$(sel);
      if (el) {
        await el.fill(TARGET_URL);
        webFilled = true;
        break;
      }
    } catch {}
  }

  // Save
  const saveSelectors = [
    meta.saveButton,
    'input[type="submit"][name="submit"]',
    'button[type="submit"]',
    'input[type="submit"]',
  ].filter(Boolean);

  let saved = false;
  for (const sel of saveSelectors) {
    try {
      const el = await page.$(sel);
      if (el) { await el.click(); saved = true; break; }
    } catch {}
  }

  await page.waitForTimeout(3000);
  return { bioFilled, webFilled, saved, editUrl };
}

(async () => {
  console.log(`\n✏️  PROFILE FILLER`);
  console.log(`   Profiles to fill : ${results.length}`);
  console.log(`   Target URL       : ${TARGET_URL}\n`);

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const filled = [];

  for (let i = 0; i < results.length; i++) {
    const record = results[i];
    console.log(`\n[${i+1}/${results.length}] ${record.domain}`);

    const ctx  = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();

    try {
      const r = await fillProfile(page, record);
      const ok = r.bioFilled || r.webFilled;
      console.log(`  ${ok ? '✅' : '❌'} bio:${r.bioFilled} web:${r.webFilled} saved:${r.saved}`);
      console.log(`  Edit URL: ${r.editUrl}`);
      filled.push({ ...record, ...r, fillStatus: ok ? 'FILLED' : 'FAILED' });
    } catch (e) {
      console.log(`  ❌ ERROR: ${e.message.substring(0, 70)}`);
      filled.push({ ...record, fillStatus: 'ERROR', error: e.message.substring(0, 70) });
    }

    await ctx.close();
    await new Promise(r => setTimeout(r, 1500));
  }

  await browser.close();

  const ok = filled.filter(r => r.fillStatus === 'FILLED');
  console.log(`\n\n══════════════════════════════════════════════`);
  console.log(`  PROFILE FILL COMPLETE`);
  console.log(`══════════════════════════════════════════════`);
  console.log(`  ✅ Filled  : ${ok.length}/${results.length}`);
  ok.forEach(r => console.log(`  🔗 ${r.profileUrl}`));

  fs.writeFileSync('filled_profiles.json', JSON.stringify(filled, null, 2));
  console.log(`\n  Saved → filled_profiles.json`);
})();
