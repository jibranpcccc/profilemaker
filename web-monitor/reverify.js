// reverify.js
const fs = require('fs');
const { chromium } = require('playwright');
const { execSync } = require('child_process');

const GITHUB_REPO = 'jibranpcccc/profilemaker';
const GITHUB_FILE = 'live_links.json';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

(async () => {
  const links = JSON.parse(fs.readFileSync('live_links.json'));
  const dead  = links.filter(r => !r.profileLive);
  
  if (dead.length === 0) {
    console.log('✅ All profiles in live_links.json are already live!');
    process.exit(0);
  }

  console.log(`\n🔍 Re-verifying ${dead.length} profiles waiting for email activation...`);
  const browser = await chromium.launch({ headless: true });

  let newLiveCount = 0;

  for (const r of dead) {
    const page = await (await browser.newContext()).newPage();
    try {
      await page.goto(r.profileUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(2000);
      const live = await page.evaluate(() =>
        !document.title.toLowerCase().includes('not found') &&
        !document.body.innerText.includes('404')
      );
      if (live) {
        r.profileLive = true;
        console.log(`✅ NOW LIVE → ${r.profileUrl}`);
        newLiveCount++;
      } else {
        console.log(`⚠️  Still dead → ${r.profileUrl}`);
      }
    } catch { console.log(`❌ Error → ${r.profileUrl}`); }
    await page.close();
  }

  await browser.close();
  fs.writeFileSync('live_links.json', JSON.stringify(links, null, 2));

  console.log(`\n\n══════════════════════════════════════════════`);
  console.log(`  RE-VERIFY COMPLETE`);
  console.log(`══════════════════════════════════════════════`);
  console.log(`  🔄 Newly activated : ${newLiveCount}`);
  console.log(`  ✅ Total live now  : ${links.filter(r=>r.profileLive).length}/${links.length}`);
  
  if (newLiveCount > 0 && GITHUB_TOKEN) {
    console.log(`  🚀 Pushing updates to GitHub...`);
    try {
      const { Octokit } = require('@octokit/rest');
      const octokit = new Octokit({ auth: GITHUB_TOKEN });
      const [owner, repo] = GITHUB_REPO.split('/');
      const content = Buffer.from(JSON.stringify(links, null, 2)).toString('base64');
      
      let sha;
      try {
        const { data } = await octokit.repos.getContent({ owner, repo, path: GITHUB_FILE });
        sha = data.sha;
      } catch {}

      await octokit.repos.createOrUpdateFileContents({ owner, repo, path: GITHUB_FILE, message: `Re-verify activated ${newLiveCount} new profiles`, content, sha });
      console.log(`  ✅ Pushed updates to GitHub!`);
    } catch (e) {
      console.log(`  ❌ GitHub API error: ${e.message}`);
    }
  }
})();
