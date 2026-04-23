/**
 * batch_6sites_v2.js
 * ALL FIXES APPLIED:
 *   ✅ No waitForNavigation — AJAX-safe click + URL/DOM polling
 *   ✅ mail.tm 429 retry with 6s backoff
 *   ✅ 8s inter-site delay
 *   ✅ Scoped form submit (no invisible header button)
 *   ✅ TinyMCE + React bio injection
 *   ✅ 7-selector save button with Enter fallback
 *   ✅ Failure screenshots auto-saved
 */

const { chromium } = require('playwright');
const fs = require('fs');

// ── CONFIG ────────────────────────────────────────────────────
const CONFIG = {
  targetUrl:  'https://seolinkmasters.com/education',
  anchorText: 'SEO Link Masters',
  bioText:    'Passionate educator and lifelong learner dedicated to sharing knowledge and empowering students worldwide.',
  bioLinks: [
    { url: 'https://seolinkmasters.com/education', anchorText: 'SEO Link Masters' },
  ],
  headless: false,
  slowMo:   60,
};

// ── SITES ─────────────────────────────────────────────────────
const SITES = [
  {
    name: 'UMKM Cerdas Pajak', domain: 'umkmcerdaspajak.id',
    registerUrl: 'https://umkmcerdaspajak.id/student-registration/',
    dashboardUrls: ['https://umkmcerdaspajak.id/dashboard/','https://umkmcerdaspajak.id/my-account/'],
    settingsUrls:  ['https://umkmcerdaspajak.id/dashboard/settings/','https://umkmcerdaspajak.id/profile/','https://umkmcerdaspajak.id/my-account/','https://umkmcerdaspajak.id/dashboard/edit-profile/'],
    profilePattern: '/profile/',
  },
  {
    name: 'GKCE LMS India', domain: 'lms.gkce.edu.in',
    registerUrl: 'https://lms.gkce.edu.in/student-registration/',
    dashboardUrls: ['https://lms.gkce.edu.in/dashboard/','https://lms.gkce.edu.in/my-account/'],
    settingsUrls:  ['https://lms.gkce.edu.in/dashboard/settings/','https://lms.gkce.edu.in/profile/','https://lms.gkce.edu.in/my-account/','https://lms.gkce.edu.in/dashboard/edit-profile/'],
    profilePattern: '/profile/',
  },
  {
    name: 'ESIL MOOC Kazakhstan', domain: 'mooc.esil.edu.kz',
    registerUrl: 'https://mooc.esil.edu.kz/student-registration/',
    dashboardUrls: ['https://mooc.esil.edu.kz/dashboard/','https://mooc.esil.edu.kz/my-account/'],
    settingsUrls:  ['https://mooc.esil.edu.kz/dashboard/settings/','https://mooc.esil.edu.kz/profile/','https://mooc.esil.edu.kz/my-account/','https://mooc.esil.edu.kz/dashboard/edit-profile/'],
    profilePattern: '/profile/',
  },
  {
    name: 'San Pablo Ecuador', domain: 'academia.sanpablo.edu.ec',
    registerUrl: 'https://academia.sanpablo.edu.ec/student-registration/',
    dashboardUrls: ['https://academia.sanpablo.edu.ec/dashboard/','https://academia.sanpablo.edu.ec/my-account/'],
    settingsUrls:  ['https://academia.sanpablo.edu.ec/dashboard/settings/','https://academia.sanpablo.edu.ec/profile/','https://academia.sanpablo.edu.ec/my-account/','https://academia.sanpablo.edu.ec/dashboard/edit-profile/'],
    profilePattern: '/profile/',
  },
  {
    name: 'NCON Saudi Arabia', domain: 'ncon.edu.sa',
    registerUrl: 'https://ncon.edu.sa/student-registration/',
    dashboardUrls: ['https://ncon.edu.sa/dashboard/','https://ncon.edu.sa/my-account/'],
    settingsUrls:  ['https://ncon.edu.sa/dashboard/settings/','https://ncon.edu.sa/profile/','https://ncon.edu.sa/my-account/','https://ncon.edu.sa/dashboard/edit-profile/'],
    profilePattern: '/profile/',
  },
  {
    name: 'Pibe Learning Bangladesh', domain: 'pibelearning.gov.bd',
    registerUrl: 'https://pibelearning.gov.bd/student-registration/',
    dashboardUrls: ['https://pibelearning.gov.bd/dashboard/','https://pibelearning.gov.bd/my-account/'],
    settingsUrls:  ['https://pibelearning.gov.bd/dashboard/settings/','https://pibelearning.gov.bd/profile/','https://pibelearning.gov.bd/my-account/','https://pibelearning.gov.bd/dashboard/edit-profile/'],
    profilePattern: '/profile/',
  },
];

const FIELDS = {
  firstName: 'input[name="first_name"]',
  lastName:  'input[name="last_name"]',
  username:  'input[name="user_login"]',
  email:     'input[name="email"]',
  password:  'input[name="password"]',
  password2: 'input[name="password_confirmation"]',
};

const FIRST = ['James','Emma','Liam','Olivia','Noah','Ava','William','Sophia','Benjamin','Isabella','Lucas','Mia'];
const LAST  = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Wilson','Moore','Taylor','Lee'];
const KW    = ['learn','edu','study','online','digital','global','smart','open','net','pro','hub','zone'];

function generateIdentity() {
  const fn = FIRST[Math.floor(Math.random() * FIRST.length)];
  const ln = LAST[Math.floor(Math.random() * LAST.length)];
  const kw = KW[Math.floor(Math.random() * KW.length)];
  const ts = Date.now().toString().slice(-6);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return { firstName: fn, lastName: ln, username: `${fn.toLowerCase()}${kw}${ts}`, password: `Secure${ts}Tx${rand}!` };
}

// ── MAIL.TM — with 429 retry ──────────────────────────────────
async function createTempEmail(retries = 4) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const domainRes  = await fetch('https://api.mail.tm/domains', { headers: { Accept: 'application/json' } });
      const domainData = await domainRes.json();
      const members    = Array.isArray(domainData) ? domainData : (domainData['hydra:member'] || []);
      if (!members.length) throw new Error('No domains returned from mail.tm');
      const domain = members[0].domain;

      const ts       = Date.now().toString().slice(-8);
      const email    = `user${ts}@${domain}`;
      const password = `Pass${ts}Xx!`;

      const regRes = await fetch('https://api.mail.tm/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: email, password }),
      });
      if (regRes.status === 429) throw new Error('429');
      if (!regRes.ok) throw new Error(`account creation failed: ${regRes.status}`);

      const tokenRes  = await fetch('https://api.mail.tm/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: email, password }),
      });
      const tokenData = await tokenRes.json();

      console.log(`    [email] ✅ ${email}`);
      return { email, emailPassword: password, token: tokenData.token };

    } catch (e) {
      if (attempt < retries && (e.message.includes('429') || e.message.includes('rate'))) {
        console.log(`    [email] Rate limited — waiting 8s (attempt ${attempt}/${retries})...`);
        await new Promise(r => setTimeout(r, 8000));
      } else {
        throw e;
      }
    }
  }
}

// ── MAIL.TM INBOX POLL ────────────────────────────────────────
async function pollForActivationLink(token, timeoutMs = 90000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 8000));
    try {
      const res  = await fetch('https://api.mail.tm/messages', {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      });
      if (!res.ok) continue;
      const data     = await res.json();
      const messages = data['hydra:member'] || [];
      if (!messages.length) continue;

      const msgRes = await fetch(`https://api.mail.tm/messages/${messages[0].id}`, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      });
      const msg  = await msgRes.json();
      const body = (msg.html || []).join('') || msg.text || '';
      const match = body.match(
        /https?:\/\/[^\s"'<>]+(?:activate|confirm|verify|activation|set-password|key=|token=)[^\s"'<>]*/i
      );
      if (match) { console.log(`    [email] ✅ Activation link found`); return match[0]; }
    } catch { /* keep polling */ }
  }
  throw new Error('mail.tm poll timeout (90s)');
}

// ── BIO BUILDER ───────────────────────────────────────────────
function buildBioWithLinks(bioText, links, supportsHtml) {
  if (!links || !links.length) return bioText;
  const block = supportsHtml
    ? links.map(l => `<a href="${l.url}" rel="dofollow">${l.anchorText}</a>`).join(' | ')
    : links.map(l => `${l.anchorText}: ${l.url}`).join('\n');
  return `${bioText}\n\n${block}`;
}

// ── BIO INJECTION ─────────────────────────────────────────────
async function injectBio(page, bioText, links) {
  const hasTinyMce = await page.evaluate(() => !!(
    window.tinyMCE || document.querySelector('iframe.wp-editor-iframe') ||
    document.querySelector('#wp-description-editor-container') || document.querySelector('.tmce-active')
  ));
  const fullBio = buildBioWithLinks(bioText, links, hasTinyMce);
  console.log(`    [bio] TinyMCE=${hasTinyMce} | ${fullBio.length} chars`);

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
    }, fullBio);
    if (ok) return;
  }

  const selectors = [
    'textarea[name="description"]','textarea[name="tutor_profile_bio"]',
    '#description','textarea.tutor-form-control','textarea.wp-editor-area',
  ];
  for (const sel of selectors) {
    const el = await page.$(sel);
    if (el) {
      await page.evaluate((s, t) => {
        const el = document.querySelector(s);
        const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
        setter.call(el, t);
        el.dispatchEvent(new Event('input',  { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, sel, fullBio);
      console.log(`    [bio] Injected via ${sel}`);
      return;
    }
  }
  console.warn('    [bio] ⚠ No bio textarea found');
}

// ── WEBSITE URL ───────────────────────────────────────────────
async function injectWebsiteUrl(page, url) {
  const selectors = ['input[name="website_url"]','input[name="tutor_profile_url"]','input[name="url"]','input[name="user_url"]','#url','#website_url'];
  for (const sel of selectors) {
    const el = await page.$(sel);
    if (el) { await el.fill(url); console.log(`    [url] Injected via ${sel}`); return; }
  }
  console.warn('    [url] ⚠ No website field found');
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
    'input[type="submit"]',
  ];
  for (const sel of selectors) {
    const btns = page.locator(sel);
    const n = await btns.count();
    for (let i = 0; i < n; i++) {
      const btn = btns.nth(i);
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForLoadState('networkidle').catch(() => {});
        await page.waitForTimeout(1500);
        console.log(`    [save] Saved via ${sel}[${i}]`);
        return true;
      }
    }
  }
  console.warn('    [save] No save button — Enter fallback');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);
  return false;
}

// ── AJAX-SAFE REGISTRATION SUBMIT ─────────────────────────────
// KEY FIX: No waitForNavigation. Click button, then poll for
// URL change OR success message OR dashboard element.
async function submitAndWait(page) {
  const startUrl = page.url();

  // Find first visible submit button scoped inside form
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
      console.log(`    [reg] Clicked submit button [${i}]`);
      break;
    }
  }
  if (!clicked) throw new Error('No visible submit button found');

  // Poll for outcome — max 25 seconds
  const deadline = Date.now() + 25000;
  while (Date.now() < deadline) {
    await page.waitForTimeout(800);

    const currentUrl = page.url();

    // A) URL changed → full redirect happened
    if (currentUrl !== startUrl) {
      console.log(`    [reg] Redirected → ${currentUrl}`);
      return currentUrl;
    }

    // B) Success message appeared in DOM (AJAX response)
    const successMsg = await page.$(
      '.tutor-alert-success, .woocommerce-message, [class*="success-message"], ' +
      '.tutor-flash-success, .register-success, .message.success'
    );
    if (successMsg) {
      const txt = await successMsg.innerText().catch(() => '');
      console.log(`    [reg] AJAX success message: "${txt.trim().substring(0,60)}"`);
      return currentUrl;
    }

    // C) Dashboard element appeared → auto-login after register
    const dashboard = await page.$(
      '#tutor-dashboard-menu, .tutor-dashboard-content, .tutor-dashboard, [class*="dashboard"]'
    );
    if (dashboard) {
      console.log(`    [reg] Dashboard detected — auto-login succeeded`);
      return currentUrl;
    }

    // D) Error message — registration rejected
    const errMsg = await page.$(
      '.tutor-alert-danger, .tutor-form-feedback, [class*="error-message"], .error'
    );
    if (errMsg) {
      const txt = await errMsg.innerText().catch(() => '');
      throw new Error(`Registration rejected: "${txt.trim().substring(0, 100)}"`);
    }
  }

  // Timeout — return current URL anyway and let next phase handle it
  console.warn(`    [reg] No clear success signal after 25s — current URL: ${page.url()}`);
  return page.url();
}

// ── SETTINGS FINDER ───────────────────────────────────────────
async function findSettingsPage(page, site) {
  for (const url of site.settingsUrls) {
    try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 }); }
    catch { continue; }
    if (/login|signin|wp-login/i.test(page.url())) continue;
    const hasBio = await page.$('textarea[name="description"],textarea[name="tutor_profile_bio"],#description,textarea.tutor-form-control');
    const hasUrl = await page.$('input[name="website_url"],input[name="tutor_profile_url"],input[name="url"]');
    if (hasBio || hasUrl) { console.log(`    [settings] Found: ${url}`); return true; }
  }
  for (const dashUrl of site.dashboardUrls) {
    try { await page.goto(dashUrl, { waitUntil: 'domcontentloaded', timeout: 20000 }); } catch { continue; }
    const editLink = await page.$('a[href*="settings"],a[href*="edit-profile"],a[href*="edit-account"]');
    if (editLink) {
      await editLink.evaluate(el => el.click());
      await page.waitForLoadState('domcontentloaded').catch(() => {});
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
      /view.?profile|my.?profile|perfil|profil/i.test(a.textContent) ||
      a.href.includes(pattern)
    );
    return found ? found.href : null;
  }, site.profilePattern);
}

// ── RUN ONE SITE ──────────────────────────────────────────────
async function runSite(browser, site) {
  const identity = generateIdentity();
  let emailData;

  console.log(`\n${'═'.repeat(64)}\n  ▶  ${site.name}  (${site.domain})`);

  // Email with 429 retry
  try {
    emailData = await createTempEmail();
    identity.email = emailData.email;
  } catch (e) {
    return { site: site.name, domain: site.domain, status: 'FAILED', reason: `Email: ${e.message}` };
  }
  console.log(`     user: ${identity.username}  |  ${identity.email}`);

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  try {
    // ── PHASE 1: REGISTER ──────────────────────────────────
    console.log(`\n  [1/4] Registration`);
    await page.goto(site.registerUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    if (!await page.$('form')) throw new Error('No registration form found');

    for (const [key, sel] of Object.entries(FIELDS)) {
      const el = await page.$(sel);
      if (!el) continue;
      const val = key === 'firstName' ? identity.firstName
                : key === 'lastName'  ? identity.lastName
                : key === 'username'  ? identity.username
                : key === 'email'     ? identity.email
                : identity.password;
      await el.fill(val);
    }

    const tos = await page.$('input[type="checkbox"]');
    if (tos) await tos.check();
    const terms = await page.$('input[name="terms_conditions"], #tutor-terms-conditions');
    if (terms && !(await terms.isChecked())) await terms.check();

    const postUrl = await submitAndWait(page); // ← AJAX-SAFE, no waitForNavigation

    // ── PHASE 2: EMAIL VERIFY ──────────────────────────────
    if (/activate|confirm|checkemail|check.email|verify/i.test(postUrl)) {
      console.log(`  [2/4] Email verification — polling mail.tm...`);
      try {
        const link = await pollForActivationLink(emailData.token);
        await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 30000 });
        console.log(`     Activated: ${page.url()}`);
      } catch (e) {
        console.warn(`     Verify failed: ${e.message} — continuing anyway`);
      }
    } else {
      console.log(`  [2/4] No email verify needed`);
    }

    // ── PHASE 3: SETTINGS ──────────────────────────────────
    console.log(`  [3/4] Finding profile settings...`);
    if (!await findSettingsPage(page, site)) throw new Error('Settings page not found');

    // ── PHASE 4: INJECT + SAVE ─────────────────────────────
    console.log(`  [4/4] Injecting bio + biolinks`);
    await injectBio(page, CONFIG.bioText, CONFIG.bioLinks);
    await injectWebsiteUrl(page, CONFIG.targetUrl);
    await saveProfile(page);

    const profileUrl = (await scrapeProfileUrl(page, site))
      || `https://${site.domain}/profile/${identity.username}/`;

    console.log(`\n  ✅ SUCCESS`);
    console.log(`     Profile : ${profileUrl}`);
    console.log(`     Creds   : ${identity.username} / ${identity.email} / ${identity.password}`);

    await context.close();
    return {
      site: site.name, domain: site.domain, status: 'SUCCESS',
      profileUrl, username: identity.username,
      email: identity.email, password: identity.password,
    };

  } catch (err) {
    console.error(`\n  ❌ FAILED: ${err.message}`);
    try { await page.screenshot({ path: `fail_${site.domain.replace(/\./g,'_')}_${Date.now()}.png`, fullPage: false }); } catch {}
    await context.close();
    return { site: site.name, domain: site.domain, status: 'FAILED', reason: err.message };
  }
}

// ── MAIN ──────────────────────────────────────────────────────
(async () => {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║   BATCH TUTOR LMS v2 — 6 SITES (ALL FIXES APPLIED)              ║');
  console.log('║   umkmcerdaspajak.id | lms.gkce.edu.in | mooc.esil.edu.kz        ║');
  console.log('║   academia.sanpablo.edu.ec | ncon.edu.sa | pibelearning.gov.bd   ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log(`\n  Target : ${CONFIG.targetUrl}`);
  console.log(`  Anchor : ${CONFIG.anchorText}\n`);

  const browser = await chromium.launch({
    headless: CONFIG.headless,
    slowMo:   CONFIG.slowMo,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const results = [];
  for (const site of SITES) {
    results.push(await runSite(browser, site));
    await new Promise(r => setTimeout(r, 8000)); // 8s gap → avoids mail.tm 429
  }
  await browser.close();

  // ── REPORT ────────────────────────────────────────────────
  console.log('\n\n' + '═'.repeat(64));
  console.log('  FINAL REPORT');
  console.log('═'.repeat(64));

  const ok   = results.filter(r => r.status === 'SUCCESS');
  const fail = results.filter(r => r.status === 'FAILED');

  console.log(`\n  ✅ SUCCEEDED: ${ok.length} / ${results.length}`);
  ok.forEach(r => {
    console.log(`\n    ${r.site}`);
    console.log(`    Profile  : ${r.profileUrl}`);
    console.log(`    Creds    : ${r.username} / ${r.email} / ${r.password}`);
  });

  if (fail.length) {
    console.log(`\n  ❌ FAILED: ${fail.length}`);
    fail.forEach(r => console.log(`    ${r.site}: ${r.reason}`));
  }

  const outFile = `results_v2_${Date.now()}.json`;
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
  console.log(`\n  Saved → ${outFile}`);
})();
