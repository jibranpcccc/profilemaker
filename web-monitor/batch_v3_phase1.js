/**
 * batch_v3_phase1.js
 * First phase of V3 expansion: 4 new Tutor LMS sites only.
 * Applies the stabilized engine (DeepSeek stubs, DOM clicks, mail.tm x4 backoff).
 */

const { chromium } = require('playwright');
const fs = require('fs');

// ── CONFIG ────────────────────────────────────────────────────
const CONFIG = {
  targetUrl:   'https://seolinkmasters.com/education',
  anchorText:  'SEO Link Masters',
  niche:       'education and e-learning',
  deepseekKey: '',  // ← paste your DeepSeek API key here (optional)
  headless: false,
  slowMo:   60,
};

// ── SITES (4 Tutor LMS ONLY) ──────────────────────────────────
const SITES = [
  {
    name: 'Instituto Crecer Colombia', domain: 'institutocrecer.edu.co',
    platform: 'tutorlms',
    registerUrl: 'https://institutocrecer.edu.co/student-registration/',
    dashboardUrls: ['https://institutocrecer.edu.co/dashboard/','https://institutocrecer.edu.co/my-account/'],
    settingsUrls:  ['https://institutocrecer.edu.co/dashboard/settings/','https://institutocrecer.edu.co/profile/','https://institutocrecer.edu.co/dashboard/edit-profile/'],
    profilePattern: '/profile/',
  },
  {
    name: 'SOU Kyrgyzstan', domain: 'sou.edu.kg',
    platform: 'tutorlms',
    registerUrl: 'https://sou.edu.kg/student-registration/',
    dashboardUrls: ['https://sou.edu.kg/dashboard/','https://sou.edu.kg/my-account/'],
    settingsUrls:  ['https://sou.edu.kg/dashboard/settings/','https://sou.edu.kg/profile/','https://sou.edu.kg/dashboard/edit-profile/'],
    profilePattern: '/profile/',
  },
  {
    name: 'BBINY Education', domain: 'bbiny.edu',
    platform: 'tutorlms',
    registerUrl: 'https://bbiny.edu/student-registration/',
    dashboardUrls: ['https://bbiny.edu/dashboard/','https://bbiny.edu/my-account/'],
    settingsUrls:  ['https://bbiny.edu/dashboard/settings/','https://bbiny.edu/profile/','https://bbiny.edu/dashboard/edit-profile/'],
    profilePattern: '/profile/',
  },
  {
    name: 'AIOU Pakistan', domain: 'lms.aiou.edu.pk',
    platform: 'tutorlms',
    registerUrl: 'https://lms.aiou.edu.pk/student-registration/',
    dashboardUrls: ['https://lms.aiou.edu.pk/dashboard/','https://lms.aiou.edu.pk/my-account/'],
    settingsUrls:  ['https://lms.aiou.edu.pk/dashboard/settings/','https://lms.aiou.edu.pk/profile/','https://lms.aiou.edu.pk/dashboard/edit-profile/'],
    profilePattern: '/profile/',
  }
];

// ── IDENTITY ──────────────────────────────────────────────────
const FIRST = ['James','Emma','Liam','Olivia','Noah','Ava','William','Sophia','Benjamin','Isabella','Lucas','Mia'];
const LAST  = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Wilson','Moore','Taylor','Lee'];
const KW    = ['learn','edu','study','online','digital','global','smart','open','net','pro','hub','zone'];

function generateIdentity() {
  const fn   = FIRST[Math.floor(Math.random() * FIRST.length)];
  const ln   = LAST[Math.floor(Math.random() * LAST.length)];
  const kw   = KW[Math.floor(Math.random() * KW.length)];
  const ts   = Date.now().toString().slice(-6);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return { firstName: fn, lastName: ln, username: `${fn.toLowerCase()}${kw}${ts}`, password: `Secure${ts}Tx${rand}!` };
}

// ── DEEPSEEK BIO ─────────────────────────────────────────────
async function generateBio(niche, targetUrl, anchorText) {
  if (!CONFIG.deepseekKey) return fallbackBio(anchorText, targetUrl);
  try {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${CONFIG.deepseekKey}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{
          role: 'user',
          content: `Write a 60-word professional educator bio for a ${niche} enthusiast. \nNaturally include this backlink in the text: <a href="${targetUrl}" rel="dofollow">${anchorText}</a>\nReturn ONLY the bio text with the HTML link embedded. No quotes, no explanation.`,
        }],
        max_tokens: 200, temperature: 0.8,
      }),
    });
    const data = await res.json();
    const bio  = data.choices?.[0]?.message?.content?.trim();
    if (bio && bio.length > 20) { console.log('    [bio] ✅ DeepSeek generated'); return bio; }
  } catch (e) { console.warn('    [bio] DeepSeek failed:', e.message); }
  return fallbackBio(anchorText, targetUrl);
}

function fallbackBio(anchorText, targetUrl) {
  const templates = [
    `Passionate educator committed to empowering learners worldwide. Dedicated to sharing quality resources through <a href="${targetUrl}" rel="dofollow">${anchorText}</a> and fostering a global learning community.`,
    `Lifelong learner and education advocate. Sharing valuable academic insights and resources at <a href="${targetUrl}" rel="dofollow">${anchorText}</a> to help students achieve their full potential.`,
    `Digital education enthusiast helping students navigate the modern learning landscape. Explore curated resources at <a href="${targetUrl}" rel="dofollow">${anchorText}</a> for evidence-based learning strategies.`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

// ── MAIL.TM ───────────────────────────────────────────────────
async function createTempEmail(retries = 4) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const domainRes  = await fetch('https://api.mail.tm/domains', { headers: { Accept: 'application/json' } });
      const domainData = await domainRes.json();
      const members    = Array.isArray(domainData) ? domainData : (domainData['hydra:member'] || []);
      if (!members.length) throw new Error('No domains from mail.tm');
      const domain = members[0].domain;
      const ts     = Date.now().toString().slice(-8);
      const email  = `user${ts}@${domain}`;
      const pass   = `Pass${ts}Xx!`;

      const regRes = await fetch('https://api.mail.tm/accounts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: email, password: pass }),
      });
      if (regRes.status === 429) throw new Error('429');
      if (!regRes.ok) throw new Error(`account create failed: ${regRes.status}`);

      const tokenRes  = await fetch('https://api.mail.tm/token', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: email, password: pass }),
      });
      const tokenData = await tokenRes.json();
      console.log(`    [email] ✅ ${email}`);
      return { email, emailPassword: pass, token: tokenData.token };

    } catch (e) {
      if (attempt < retries && (e.message.includes('429') || e.message.includes('rate'))) {
        console.log(`    [email] Rate limited — waiting 8s (attempt ${attempt}/${retries})...`);
        await new Promise(r => setTimeout(r, 8000));
      } else { throw e; }
    }
  }
}

// ── MAIL.TM POLL ─────────────────────────────────────────────
async function pollForActivationLink(token, timeoutMs = 90000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 8000));
    try {
      const res  = await fetch('https://api.mail.tm/messages', {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      });
      if (!res.ok) continue;
      const data = await res.json();
      const msgs = data['hydra:member'] || [];
      if (!msgs.length) continue;
      const msgRes = await fetch(`https://api.mail.tm/messages/${msgs[0].id}`, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      });
      const msg  = await msgRes.json();
      const body = (msg.html || []).join('') || msg.text || '';
      const match = body.match(/https?:\/\/[^\s"'<>]+(?:activate|confirm|verify|activation|set-password|key=|token=)[^\s"'<>]*/i);
      if (match) { console.log('    [email] ✅ Activation link found'); return match[0]; }
    } catch { /* keep polling */ }
  }
  throw new Error('mail.tm poll timeout (90s)');
}

// ── BIO INJECTION ─────────────────────────────────────────────
async function injectBio(page, bioHtml) {
  const hasTinyMce = await page.evaluate(() => !!(
    window.tinyMCE || document.querySelector('iframe.wp-editor-iframe') ||
    document.querySelector('.tmce-active')
  ));
  console.log(`    [bio] TinyMCE=${hasTinyMce} | ${bioHtml.length} chars`);

  if (hasTinyMce) {
    const ok = await page.evaluate((html) => {
      const frames = document.querySelectorAll('iframe.wp-editor-iframe,#content_ifr,#description_ifr');
      for (const f of frames) {
        const doc = f.contentDocument || f.contentWindow.document;
        if (doc && doc.body) { doc.body.innerHTML = html; return true; }
      }
      if (window.tinyMCE && window.tinyMCE.activeEditor) {
        window.tinyMCE.activeEditor.setContent(html); return true;
      }
      return false;
    }, bioHtml);
    if (ok) { console.log('    [bio] ✅ TinyMCE injected'); return; }
  }

  // Plain textarea fallback
  const selectors = [
    'textarea[name="description"]', 'textarea[name="tutor_profile_bio"]',
    '#description', 'textarea.tutor-form-control', 'textarea.wp-editor-area',
    'textarea[name="field_3"]',   // BuddyBoss extended profile
    'textarea[name="about"]',
    'textarea',                    // last resort
  ];
  const plainText = bioHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  for (const sel of selectors) {
    const el = await page.$(sel);
    if (el) {
      await page.evaluate((s, t) => {
        const el = document.querySelector(s);
        const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
        setter.call(el, t);
        el.dispatchEvent(new Event('input',  { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, sel, plainText);
      console.log(`    [bio] ✅ Injected via ${sel}`);
      return;
    }
  }
  console.warn('    [bio] ⚠ No bio field found');
}

// ── WEBSITE URL ───────────────────────────────────────────────
async function injectWebsiteUrl(page, url) {
  const selectors = [
    'input[name="website_url"]', 'input[name="tutor_profile_url"]',
    'input[name="url"]',         'input[name="user_url"]',
    'input[name="website"]',     '#url', '#website', '#website_url',
    'input[placeholder*="website" i]', 'input[placeholder*="url" i]',
  ];
  for (const sel of selectors) {
    const el = await page.$(sel);
    if (el) { await el.fill(url); console.log(`    [url] ✅ Injected via ${sel}`); return; }
  }
  console.warn('    [url] ⚠ No website URL field found');
}

// ── SAVE PROFILE ──────────────────────────────────────────────
async function saveProfile(page) {
  const selectors = [
    'main button[type="submit"]',
    '.tutor-dashboard-content button[type="submit"]',
    '#tutor-profile-edit-form button[type="submit"]',
    'form.tutor-form button[type="submit"]',
    '[name="tutor_save_profile"]',
    'button.tutor-btn-primary',
    'button[type="submit"]',
    'input[type="submit"]',
  ];
  for (const sel of selectors) {
    const btns = page.locator(sel);
    const n = await btns.count();
    for (let i = 0; i < n; i++) {
      const btn = btns.nth(i);
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForLoadState('domcontentloaded').catch(() => {});
        await page.waitForTimeout(1500);
        console.log(`    [save] ✅ Saved via ${sel}[${i}]`);
        return true;
      }
    }
  }
  console.warn('    [save] ⚠ No save button — Enter fallback');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);
  return false;
}

// ── TUTOR LMS: AJAX-SAFE SUBMIT ───────────────────────────────
async function submitTutorLMS(page) {
  const startUrl = page.url();
  const candidates = page.locator(
    '[name="tutor_register_student_btn"], form button[type="submit"], form input[type="submit"]'
  );
  const n = await candidates.count();
  let clicked = false;
  for (let i = 0; i < n; i++) {
    const btn = candidates.nth(i);
    if (await btn.isVisible()) {
      await btn.click();
      clicked = true;
      console.log(`    [reg] Clicked submit [${i}]`);
      break;
    }
  }
  if (!clicked) throw new Error('No visible submit button');

  const deadline = Date.now() + 25000;
  while (Date.now() < deadline) {
    await page.waitForTimeout(800);
    const cur = page.url();
    if (cur !== startUrl) { console.log(`    [reg] Redirected → ${cur}`); return cur; }
    const ok = await page.$('.tutor-alert-success,.woocommerce-message,[class*="success-message"],.tutor-flash-success');
    if (ok) { const t = await ok.innerText().catch(() => ''); console.log(`    [reg] AJAX success: "${t.substring(0,60)}"`); return cur; }
    const dash = await page.$('#tutor-dashboard-menu,.tutor-dashboard-content,.tutor-dashboard');
    if (dash) { console.log('    [reg] Dashboard detected — auto-login'); return cur; }
    const err = await page.$('.tutor-alert-danger,.tutor-form-feedback,[class*="error-message"]');
    if (err) { const t = await err.innerText().catch(() => ''); throw new Error(`Rejected: "${t.substring(0,100)}"`); }
  }
  console.warn(`    [reg] No signal after 25s — ${page.url()}`);
  return page.url();
}


// ── SETTINGS FINDER (Tutor LMS) ───────────────────────────────
async function findTutorSettings(page, site) {
  for (const url of site.settingsUrls) {
    try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 }); } catch { continue; }
    if (/login|signin|wp-login/i.test(page.url())) continue;
    const hasBio = await page.$('textarea[name="description"],textarea[name="tutor_profile_bio"],#description,textarea.tutor-form-control');
    const hasUrl = await page.$('input[name="website_url"],input[name="tutor_profile_url"],input[name="url"]');
    if (hasBio || hasUrl) { console.log(`    [settings] Found: ${url}`); return true; }
  }
  // Fallback — scan dashboard for edit link
  for (const dashUrl of site.dashboardUrls) {
    try { await page.goto(dashUrl, { waitUntil: 'domcontentloaded', timeout: 20000 }); } catch { continue; }
    const editLink = await page.$('a[href*="settings"],a[href*="edit-profile"],a[href*="edit-account"]');
    if (editLink) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {}),
        editLink.evaluate(el => el.click()),  // force DOM click — no visibility check
      ]);
      console.log(`    [settings] Found via link: ${page.url()}`);
      return true;
    }
  }
  return false;
}

// ── SCRAPE PROFILE URL ────────────────────────────────────────
async function scrapeProfileUrl(page, site) {
  return await page.evaluate((pattern) => {
    const links = Array.from(document.querySelectorAll('a[href]'));
    const found = links.find(a =>
      /view.?profile|my.?profile|perfil|profil|miembros/i.test(a.textContent) ||
      a.href.includes(pattern)
    );
    return found ? found.href : null;
  }, site.profilePattern);
}

// ── RUN ONE SITE ──────────────────────────────────────────────
async function runSite(browser, site, bioHtml) {
  const identity = generateIdentity();
  let emailData;

  console.log(`\n${"═".repeat(64)}\n  ▶  ${site.name}  (${site.domain})  [${site.platform}]`);

  try {
    emailData = await createTempEmail();
    identity.email = emailData.email;
  } catch (e) {
    return { site: site.name, domain: site.domain, platform: site.platform, status: 'FAILED', reason: `Email: ${e.message}` };
  }
  console.log(`     user: ${identity.username}  |  ${identity.email}`);

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  try {
    let postUrl = '';

    // ── PHASE 1: REGISTER (platform-aware) ────────────────
    console.log('\n  [1/4] Registration');

    if (site.platform === 'tutorlms') {
      await page.goto(site.registerUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      if (!await page.$('form')) throw new Error('No registration form');
      const fieldMap = {
        'first_name': identity.firstName, 'last_name': identity.lastName,
        'user_login': identity.username,  'email': identity.email,
        'password': identity.password, 'password_confirmation': identity.password,
      };
      for (const [name, val] of Object.entries(fieldMap)) {
        const el = await page.$(`input[name="${name}"]`);
        if (el) await el.fill(val);
      }
      const tos = await page.$('input[name="terms_conditions"],#tutor-terms-conditions,input[type="checkbox"]');
      if (tos && !(await tos.isChecked())) await tos.check();
      postUrl = await submitTutorLMS(page);

    } 
    
    // ── PHASE 2: EMAIL VERIFY ──────────────────────────────
    if (/activate|confirm|checkemail|verify/i.test(postUrl)) {
      console.log('  [2/4] Email verification — polling mail.tm...');
      try {
        const link = await pollForActivationLink(emailData.token);
        await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 30000 });
        console.log(`     Activated: ${page.url()}`);
      } catch (e) { console.warn(`     Verify warning: ${e.message} — continuing`); }
    } else { console.log('  [2/4] No email verify needed'); }

    // ── PHASE 3: SETTINGS ──────────────────────────────────
    console.log('  [3/4] Finding profile settings...');
    let settingsFound = false;
    if (site.platform === 'tutorlms') {
      settingsFound = await findTutorSettings(page, site);
    }
    if (!settingsFound) throw new Error('Settings page not found');

    // ── PHASE 4: INJECT + SAVE ─────────────────────────────
    console.log('  [4/4] Injecting bio + biolinks');
    await injectBio(page, bioHtml);
    await injectWebsiteUrl(page, CONFIG.targetUrl);
    await saveProfile(page);

    const profileUrl = (await scrapeProfileUrl(page, site))
      || `https://${site.domain}/profile/${identity.username}/`;

    console.log('\n  ✅ SUCCESS');
    console.log(`     Profile : ${profileUrl}`);
    console.log(`     Creds   : ${identity.username} / ${identity.email} / ${identity.password}`);

    await context.close();
    return {
      site: site.name, domain: site.domain, platform: site.platform,
      status: 'SUCCESS', profileUrl,
      username: identity.username, email: identity.email, password: identity.password,
    };

  } catch (err) {
    console.error(`\n  ❌ FAILED: ${err.message}`);
    try { await page.screenshot({ path: `fail_${site.domain.replace(/\./g,'_')}_${Date.now()}.png` }); } catch {}
    await context.close();
    return { site: site.name, domain: site.domain, platform: site.platform, status: 'FAILED', reason: err.message };
  }
}

// ── CSV EXPORT ────────────────────────────────────────────────
function exportCsv(results) {
  const header = 'Site,Domain,Platform,Status,ProfileURL,Username,Email,Password,Reason';
  const rows = results.map(r =>
    [r.site, r.domain, r.platform, r.status, r.profileUrl||''
     , r.username||'', r.email||'', r.password||'', r.reason||'']
    .map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')
  );
  const csv = [header, ...rows].join('\n');
  const file = `results_v3_${Date.now()}.csv`;
  fs.writeFileSync(file, csv);
  console.log(`\n  CSV → ${file}`);
  return file;
}

// ── MAIN ──────────────────────────────────────────────────────
(async () => {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║   BATCH v3 — PHASE 1: 4 NEW TUTOR LMS TARGETS                    ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log(`\n  Target : ${CONFIG.targetUrl}`);
  console.log(`  Anchor : ${CONFIG.anchorText}\n`);

  console.log('  Generating bio...');
  const bioHtml = await generateBio(CONFIG.niche, CONFIG.targetUrl, CONFIG.anchorText);
  console.log(`  Bio: ${bioHtml.substring(0, 80)}...\n`);

  const browser = await chromium.launch({
    headless: CONFIG.headless, slowMo: CONFIG.slowMo,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const results = [];
  for (const site of SITES) {
    results.push(await runSite(browser, site, bioHtml));
    await new Promise(r => setTimeout(r, 8000)); // 8s gap
  }
  await browser.close();

  // ── REPORT ────────────────────────────────────────────────
  console.log('\n\n' + '═'.repeat(64));
  console.log('  FINAL REPORT');
  console.log('═'.repeat(64));
  const ok   = results.filter(r => r.status === 'SUCCESS');
  const fail = results.filter(r => r.status === 'FAILED');
  console.log(`\n  ✅ SUCCEEDED: ${ok.length} / ${results.length}`);
  ok.forEach(r => { console.log(`\n    ${r.site} [${r.platform}]\n    Profile  : ${r.profileUrl}\n    Creds    : ${r.username} / ${r.email} / ${r.password}`); });
  if (fail.length) { console.log(`\n  ❌ FAILED: ${fail.length}`); fail.forEach(r => console.log(`    ${r.site}: ${r.reason}`)); }

  const jsonFile = `results_v3_${Date.now()}.json`;
  fs.writeFileSync(jsonFile, JSON.stringify(results, null, 2));
  exportCsv(results);
  console.log(`  JSON → ${jsonFile}`);
})();
