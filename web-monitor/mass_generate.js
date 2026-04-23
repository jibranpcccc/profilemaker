/**
 * mass_generate.js  v5 — Batched + GitHub Push
 * Run:  node mass_generate.js --batch=A   (CKAN/Moodle tier 1 — 15 domains)
 *       node mass_generate.js --batch=B   (Moodle tier 2 — next 15 domains)
 *       node mass_generate.js --batch=ALL (all 30)
 */

const { chromium } = require('playwright');
const { execSync }  = require('child_process');
const fs = require('fs');

// ── CONFIG ────────────────────────────────────────────────────
const TARGET_URL  = 'https://yourtargetsite.com';
const GITHUB_REPO = 'jibranpcccc/profilemaker';   // ← change this
const GITHUB_FILE = 'live_links.json';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''; // set via: export GITHUB_TOKEN=ghp_xxx

// ── DOMAIN PRIORITY LISTS ─────────────────────────────────────
// BATCH A — Easiest (CKAN: pure HTML forms, no JS rendering)
const BATCH_A = [
  { domain:'dados.unifei.edu.br',               platform:'CKAN',   signupurl:'https://dados.unifei.edu.br/user/register',               profilepattern:'https://dados.unifei.edu.br/user/USERNAME' },
  { domain:'opendata.ternopilcity.gov.ua',       platform:'CKAN',   signupurl:'https://opendata.ternopilcity.gov.ua/user/register',       profilepattern:'https://opendata.ternopilcity.gov.ua/user/USERNAME' },
  { domain:'dados.justica.gov.pt',               platform:'CKAN',   signupurl:'https://dados.justica.gov.pt/user/register',               profilepattern:'https://dados.justica.gov.pt/user/USERNAME' },
  { domain:'data.lutskrada.gov.ua',              platform:'CKAN',   signupurl:'https://data.lutskrada.gov.ua/user/register',              profilepattern:'https://data.lutskrada.gov.ua/user/USERNAME' },
  { domain:'opendata.klaten.go.id',              platform:'CKAN',   signupurl:'https://opendata.klaten.go.id/user/register',              profilepattern:'https://opendata.klaten.go.id/user/USERNAME' },
  { domain:'data.dniprorada.gov.ua',             platform:'CKAN',   signupurl:'https://data.dniprorada.gov.ua/user/register',             profilepattern:'https://data.dniprorada.gov.ua/user/USERNAME' },
  { domain:'data.aurora.linkeddata.es',          platform:'CKAN',   signupurl:'https://data.aurora.linkeddata.es/user/register',          profilepattern:'https://data.aurora.linkeddata.es/user/USERNAME' },
  { domain:'datos.estadisticas.pr',              platform:'CKAN',   signupurl:'https://datos.estadisticas.pr/user/register',              profilepattern:'https://datos.estadisticas.pr/user/USERNAME' },
  { domain:'homologa.cge.mg.gov.br',             platform:'CKAN',   signupurl:'https://homologa.cge.mg.gov.br/user/register',             profilepattern:'https://homologa.cge.mg.gov.br/user/USERNAME' },
  { domain:'rciims.mona.uwi.edu',                platform:'CKAN',   signupurl:'https://rciims.mona.uwi.edu/user/register',                profilepattern:'https://rciims.mona.uwi.edu/user/USERNAME' },
  { domain:'csdlcntmgialai.gov.vn',              platform:'CKAN',   signupurl:'http://csdlcntmgialai.gov.vn/user/register',               profilepattern:'https://csdlcntmgialai.gov.vn/user/USERNAME' },
  { domain:'data-catalogue.operandum-project.eu',platform:'CKAN',   signupurl:'https://data-catalogue.operandum-project.eu/user/register',profilepattern:'https://data-catalogue.operandum-project.eu/user/USERNAME' },
  { domain:'mooc.esil.edu.kz',                   platform:'Moodle', signupurl:'https://mooc.esil.edu.kz/student-registration/',           profilepattern:'https://mooc.esil.edu.kz/profile/USERNAME' },
  { domain:'esapa.edu.ar',                        platform:'Moodle', signupurl:'https://esapa.edu.ar/student-registration/',               profilepattern:'https://esapa.edu.ar/profile/USERNAME' },
  { domain:'ncon.edu.sa',                         platform:'Moodle', signupurl:'https://ncon.edu.sa/student-registration/',                profilepattern:'https://ncon.edu.sa/profile/USERNAME' },
];

// BATCH B — Next easiest (Moodle + confirmed working TutorLMS)
const BATCH_B = [
  { domain:'portal.stem.edu.gr',      platform:'Moodle',   signupurl:'https://portal.stem.edu.gr/student-registration/',     profilepattern:'https://portal.stem.edu.gr/profile/USERNAME' },
  { domain:'edu.openu.in',             platform:'Moodle',   signupurl:'https://edu.openu.in/student-registration/',           profilepattern:'https://edu.openu.in/profile/USERNAME' },
  { domain:'lms.gkce.edu.in',          platform:'Moodle',   signupurl:'https://lms.gkce.edu.in/student-registration/',        profilepattern:'https://lms.gkce.edu.in/profile/USERNAME' },
  { domain:'academia.sanpablo.edu.ec', platform:'Moodle',   signupurl:'https://academia.sanpablo.edu.ec/student-registration/',profilepattern:'https://academia.sanpablo.edu.ec/profile/USERNAME' },
  { domain:'hoc.salomon.edu.vn',       platform:'Moodle',   signupurl:'https://hoc.salomon.edu.vn/student-registration/',     profilepattern:'https://hoc.salomon.edu.vn/profile/USERNAME' },
  { domain:'academy.edutic.id',        platform:'Moodle',   signupurl:'https://academy.edutic.id/student-registration/',      profilepattern:'https://academy.edutic.id/profile/USERNAME' },
  { domain:'edu.learningsuite.id',     platform:'TutorLMS', signupurl:'https://edu.learningsuite.id/student-registration/',   profilepattern:'https://edu.learningsuite.id/profile/USERNAME' },
  { domain:'iviet.edu.vn',             platform:'TutorLMS', signupurl:'https://iviet.edu.vn/student-registration/',           profilepattern:'https://iviet.edu.vn/profile/USERNAME' },
  { domain:'ontrip.80gigs.com',        platform:'TutorLMS', signupurl:'https://ontrip.80gigs.com/student-registration/',      profilepattern:'https://ontrip.80gigs.com/profile/USERNAME' },
  { domain:'umkmcerdaspajak.id',       platform:'TutorLMS', signupurl:'https://umkmcerdaspajak.id/student-registration/',     profilepattern:'https://umkmcerdaspajak.id/profile/USERNAME' },
  { domain:'dados.ifac.edu.br',        platform:'CKAN',     signupurl:'https://dados.ifac.edu.br/user/register',              profilepattern:'https://dados.ifac.edu.br/user/USERNAME' },
  { domain:'learndash.aula.edu.pe',    platform:'Moodle',   signupurl:'https://learndash.aula.edu.pe/register/',              profilepattern:'https://learndash.aula.edu.pe/profile/USERNAME' },
  { domain:'pibelearning.gov.bd',      platform:'WordPress',signupurl:'https://pibelearning.gov.bd/wp-login.php?action=register', profilepattern:'https://pibelearning.gov.bd/author/USERNAME' },
  { domain:'sarkariresult.education',  platform:'Wix',      signupurl:'https://www.sarkariresult.education/register',         profilepattern:'https://sarkariresult.education/profile/USERNAME' },
  { domain:'dlsjbc.edu.ph',            platform:'Wix',      signupurl:'https://dlsjbc.edu.ph/register',                      profilepattern:'https://dlsjbc.edu.ph/profile/USERNAME' },
];

// ── IDENTITY POOL ─────────────────────────────────────────────
const NAMES = [
  ['Sarah','Mitchell'],['Emma','Clarke'],['Laura','Bennett'],['Olivia','Harper'],
  ['Grace','Turner'],['Sophia','Reed'],['Mia','Foster'],['Chloe','Morgan'],
  ['Ava','Sullivan'],['Lily','Webb'],['Hannah','Price'],['Zoe','Coleman'],
  ['Isabella','Grant'],['Natalie','Hughes'],['Madison','Perry'],
];

const BIOS = [
  'Hair care enthusiast sharing pro styling tips, healthy hair routines, and honest product reviews.',
  'Passionate about healthy hair growth, natural treatments, and products for every hair type.',
  'Weekly hair tutorials, deep conditioning tips, and the best hair care tools reviewed.',
];

function makeIdentity(i) {
  const [first, last] = NAMES[i % NAMES.length];
  const ts = Date.now().toString().slice(-6) + String(i).padStart(2,'0');
  return {
    firstName: first, lastName: last,
    username:  `${first.toLowerCase()}${ts}`,
    email:     `${first.toLowerCase()}.${last.toLowerCase()}.${ts}@gmail.com`,
    password:  `Hair@${ts}!`,
    bio:       BIOS[i % BIOS.length],
    website:   TARGET_URL,
  };
}

// ── SAFE FILL ─────────────────────────────────────────────────
async function safeFill(page, selector, value) {
  try {
    const el = await page.$(selector);
    if (el) { await el.fill(value); return true; }
  } catch {}
  return false;
}

// ── VERIFY PROFILE ────────────────────────────────────────────
async function verifyProfile(page, profileUrl) {
  try {
    await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    return await page.evaluate((target) => ({
      exists:  !document.title.toLowerCase().includes('not found') && !document.body.innerText.includes('404'),
      hasLink: !!document.querySelector(`a[href*="${target}"]`),
      title:   document.title.substring(0, 60),
    }), TARGET_URL);
  } catch (e) {
    return { exists: false, hasLink: false, error: e.message.substring(0, 50) };
  }
}

// ── CKAN HANDLER ──────────────────────────────────────────────
async function registerCKAN(page, site, id) {
  await page.goto(site.signupurl, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1500);

  await safeFill(page, '#field-username, input[name="name"]',       id.username);
  await safeFill(page, '#field-fullname, input[name="fullname"]',   `${id.firstName} ${id.lastName}`);
  await safeFill(page, '#field-email,    input[name="email"]',       id.email);
  await safeFill(page, '#field-password1,input[name="password1"]',  id.password);
  await safeFill(page, '#field-password2,input[name="password2"]',  id.password);

  if (!await page.$('form')) return { verdict: 'NO_FORM', url: page.url() };
  try { await page.locator('button[type="submit"], input[type="submit"]').first().click(); } catch {}
  await page.waitForTimeout(4000);
  return { verdict: 'SUBMITTED', url: page.url() };
}

// ── MOODLE HANDLER ────────────────────────────────────────────
async function registerMoodle(page, site, id) {
  await page.goto(site.signupurl, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1500);

  await safeFill(page, '#username, input[name="username"]', id.username);
  await safeFill(page, '#password, input[name="password"]', id.password);
  await safeFill(page, '#email,    input[name="email"]',    id.email);
  await safeFill(page, '#email2,   input[name="email2"]',   id.email);
  await safeFill(page, '#firstname,input[name="firstname"]',id.firstName);
  await safeFill(page, '#lastname, input[name="lastname"]', id.lastName);

  if (!await page.$('form')) return { verdict: 'NO_FORM', url: page.url() };
  try { await page.locator('input[type="submit"][value*="Create"], button[type="submit"]').first().click(); } catch {}
  await page.waitForTimeout(5000);
  return { verdict: 'SUBMITTED', url: page.url() };
}

// ── TUTOR LMS HANDLER ─────────────────────────────────────────
async function registerTutor(page, site, id) {
  await page.goto(site.signupurl, { waitUntil: 'networkidle', timeout: 25000 });
  await page.waitForTimeout(1500);

  if (!await page.$('input[name="_tutor_nonce"]')) return { verdict: 'NO_FORM', url: page.url() };

  await safeFill(page, 'input[name="first_name"]',            id.firstName);
  await safeFill(page, 'input[name="last_name"]',             id.lastName);
  await safeFill(page, 'input[name="email"]',                 id.email);
  await safeFill(page, 'input[name="user_login"]',            id.username);
  await safeFill(page, 'input[name="password"]',              id.password);
  await safeFill(page, 'input[name="password_confirmation"]', id.password);

  const before = page.url();
  try { await page.click('[name="tutor_register_student_btn"]'); } catch {}
  await page.waitForTimeout(4000);
  return { verdict: page.url() !== before ? 'SUBMITTED' : 'SAME_PAGE', url: page.url() };
}

// ── WIX HANDLER ───────────────────────────────────────────────
async function registerWix(page, site, id) {
  await page.goto(`https://www.${site.domain}`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  try {
    const signupBtn = await page.$('[data-testid="signUp.switchToSignUp"], button:has-text("Sign up"), a:has-text("Sign up"), button:has-text("Join")');
    if (signupBtn) await signupBtn.click();
    await page.waitForTimeout(2000);
  } catch {}

  await safeFill(page, 'input[type="email"]',    id.email);
  await safeFill(page, 'input[type="password"]', id.password);

  try { await page.locator('button[type="submit"]').first().click(); } catch {}
  await page.waitForTimeout(5000);
  return { verdict: 'SUBMITTED', url: page.url() };
}

// ── WORDPRESS HANDLER ─────────────────────────────────────────
async function registerWordPress(page, site, id) {
  await page.goto(site.signupurl, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1500);
  await safeFill(page, '#user_login, input[name="user_login"]', id.username);
  await safeFill(page, '#user_email, input[name="user_email"]', id.email);
  try { await page.locator('#wp-submit, input[type="submit"]').first().click(); } catch {}
  await page.waitForTimeout(4000);
  const msg = await page.$eval('.message, #login_error', el => el?.textContent || '').catch(() => '');
  return { verdict: (msg.includes('check') || msg.includes('email')) ? 'SUBMITTED' : 'SAME_PAGE', url: page.url() };
}

// ── ROUTE ─────────────────────────────────────────────────────
async function registerSite(page, site, id) {
  const p = (site.platform || '').toLowerCase();
  if (p === 'ckan')        return registerCKAN(page, site, id);
  if (p === 'moodle')      return registerMoodle(page, site, id);
  if (p === 'tutorlms')    return registerTutor(page, site, id);
  if (p === 'wordpress')   return registerWordPress(page, site, id);
  if (p === 'wix')         return registerWix(page, site, id);
  return registerMoodle(page, site, id); // fallback
}

// ── GITHUB PUSH ───────────────────────────────────────────────
async function pushToGitHub(liveLinks) {
  if (!GITHUB_TOKEN) {
    console.log('  ⚠️  No GITHUB_TOKEN set — skipping push. Run: export GITHUB_TOKEN=ghp_xxx');
    return;
  }
  try {
    const { Octokit } = require('@octokit/rest');
    const octokit = new Octokit({ auth: GITHUB_TOKEN });
    const [owner, repo] = GITHUB_REPO.split('/');
    const content = Buffer.from(JSON.stringify(liveLinks, null, 2)).toString('base64');

    // Get current SHA (needed for update)
    let sha;
    try {
      const { data } = await octokit.repos.getContent({ owner, repo, path: GITHUB_FILE });
      sha = data.sha;
    } catch {}

    await octokit.repos.createOrUpdateFileContents({
      owner, repo,
      path: GITHUB_FILE,
      message: `Update live_links.json — ${liveLinks.length} profiles [${new Date().toISOString()}]`,
      content,
      sha,
    });
    console.log(`\n  ✅ Pushed to GitHub → https://github.com/${GITHUB_REPO}/blob/main/${GITHUB_FILE}`);
  } catch (e) {
    console.log(`  ❌ GitHub push failed: ${e.message}`);
    // Fallback: git CLI
    try {
      fs.writeFileSync(GITHUB_FILE, JSON.stringify(liveLinks, null, 2));
      execSync(`git add ${GITHUB_FILE} && git commit -m "Update live links" && git push`, { stdio: 'inherit' });
      console.log('  ✅ Pushed via git CLI');
    } catch (e2) {
      console.log('  ❌ git CLI also failed:', e2.message);
    }
  }
}

// ── MAIN ──────────────────────────────────────────────────────
(async () => {
  const batchArg = (process.argv.find(a => a.startsWith('--batch=')) || '--batch=A').split('=')[1].toUpperCase();
  const SITES = batchArg === 'B' ? BATCH_B : batchArg === 'ALL' ? [...BATCH_A, ...BATCH_B] : BATCH_A;

  console.log(`\n🚀 MASS GENERATOR v5  |  Batch ${batchArg}  |  ${SITES.length} domains`);
  console.log(`   Target : ${TARGET_URL}\n`);

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const allResults = [], liveResults = [];

  for (let i = 0; i < SITES.length; i++) {
    const site = SITES[i];
    const id   = makeIdentity(i);
    const ctx  = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();

    console.log(`\n[${i+1}/${SITES.length}] ${site.domain}  [${site.platform}]`);
    console.log(`  👤 ${id.email}`);

    const result = { domain: site.domain, platform: site.platform, email: id.email, username: id.username, password: id.password };

    try {
      const r = await registerSite(page, site, id);
      Object.assign(result, r);

      if (r.verdict === 'SUBMITTED') {
        const profileUrl = (site.profilepattern || '').replace(/USERNAME|\{username\}/ig, id.username);
        result.profileUrl = profileUrl;
        const verify = await verifyProfile(page, profileUrl);
        result.profileLive = verify.exists;
        result.linkPresent  = verify.hasLink;

        if (verify.exists) {
          liveResults.push(result);
          const icon = verify.hasLink ? '🔗 LIVE+LINK' : '✅ LIVE';
          console.log(`  ${icon} → ${profileUrl}`);
        } else {
          console.log(`  ⚠️  Profile 404 → ${profileUrl}`);
        }
      } else {
        console.log(`  ❌ ${r.verdict}`);
      }
    } catch (e) {
      result.verdict = 'ERROR'; result.error = e.message.substring(0,80);
      console.log(`  ❌ ERROR: ${result.error}`);
    }

    allResults.push(result);
    await ctx.close();
    await new Promise(r => setTimeout(r, 1200));
  }

  await browser.close();

  // ── SAVE + PUSH ──────────────────────────────────────────────
  const existingLive = fs.existsSync('live_links.json') ? JSON.parse(fs.readFileSync('live_links.json')) : [];
  const merged = [...existingLive, ...liveResults];
  const dedupedLive = [...new Map(merged.map(r => [r.domain, r])).values()];

  fs.writeFileSync('live_links.json', JSON.stringify(dedupedLive, null, 2));
  fs.writeFileSync(`mass_results_batch${batchArg}.json`, JSON.stringify(allResults, null, 2));

  console.log(`\n\n══════════════════════════════════════════════`);
  console.log(`  BATCH ${batchArg} COMPLETE`);
  console.log(`══════════════════════════════════════════════`);
  console.log(`  ✅ Submitted : ${allResults.filter(r=>r.verdict==='SUBMITTED').length}/${SITES.length}`);
  console.log(`  🌐 Live      : ${liveResults.length}`);
  console.log(`  📊 Total live_links.json: ${dedupedLive.length}`);
  liveResults.forEach(r => console.log(`  → ${r.profileUrl}`));

  await pushToGitHub(dedupedLive);
})();
