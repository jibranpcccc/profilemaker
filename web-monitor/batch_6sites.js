/**
 * batch_6sites.js
 * Full automation: Register → Email Verify → Dashboard → Bio + Biolinks
 *
 * Sites:
 *   1. umkmcerdaspajak.id       (Indonesia)
 *   2. lms.gkce.edu.in          (India)
 *   3. mooc.esil.edu.kz         (Kazakhstan)
 *   4. academia.sanpablo.edu.ec (Ecuador)
 *   5. ncon.edu.sa              (Saudi Arabia)
 *   6. pibelearning.gov.bd      (Bangladesh)
 */

const { chromium } = require('playwright');
const Imap         = require('imap');
const { simpleParser } = require('mailparser');
const fs           = require('fs');

const CONFIG = {
  targetUrl:  'https://seolinkmasters.com/education',
  anchorText: 'SEO Link Masters',
  bioText:    'Passionate educator and lifelong learner dedicated to sharing knowledge and empowering students worldwide.',
  bioLinks: [
    { url: 'https://seolinkmasters.com/education', anchorText: 'SEO Link Masters' },
  ],
  geezekApi: 'https://geezek.com/create_email.php',
  imap: {
    host: 'mail.geezek.com', port: 993,
    tls: true, tlsOptions: { rejectUnauthorized: false },
  },
  proxyUrl: '',
  headless: false,
  slowMo:   80,
};

const SITES = [
  {
    name: 'UMKM Cerdas Pajak', domain: 'umkmcerdaspajak.id',
    registerUrl: 'https://umkmcerdaspajak.id/student-registration/',
    dashboardUrls: ['https://umkmcerdaspajak.id/dashboard/','https://umkmcerdaspajak.id/my-account/'],
    settingsUrls: ['https://umkmcerdaspajak.id/dashboard/settings/','https://umkmcerdaspajak.id/profile/','https://umkmcerdaspajak.id/my-account/','https://umkmcerdaspajak.id/dashboard/edit-profile/'],
    profilePattern: '/profile/', useProxy: false,
  },
  {
    name: 'GKCE LMS India', domain: 'lms.gkce.edu.in',
    registerUrl: 'https://lms.gkce.edu.in/student-registration/',
    dashboardUrls: ['https://lms.gkce.edu.in/dashboard/','https://lms.gkce.edu.in/my-account/'],
    settingsUrls: ['https://lms.gkce.edu.in/dashboard/settings/','https://lms.gkce.edu.in/profile/','https://lms.gkce.edu.in/my-account/','https://lms.gkce.edu.in/dashboard/edit-profile/'],
    profilePattern: '/profile/', useProxy: false,
  },
  {
    name: 'ESIL MOOC Kazakhstan', domain: 'mooc.esil.edu.kz',
    registerUrl: 'https://mooc.esil.edu.kz/student-registration/',
    dashboardUrls: ['https://mooc.esil.edu.kz/dashboard/','https://mooc.esil.edu.kz/my-account/'],
    settingsUrls: ['https://mooc.esil.edu.kz/dashboard/settings/','https://mooc.esil.edu.kz/profile/','https://mooc.esil.edu.kz/my-account/','https://mooc.esil.edu.kz/dashboard/edit-profile/'],
    profilePattern: '/profile/', useProxy: false,
  },
  {
    name: 'San Pablo Ecuador', domain: 'academia.sanpablo.edu.ec',
    registerUrl: 'https://academia.sanpablo.edu.ec/student-registration/',
    dashboardUrls: ['https://academia.sanpablo.edu.ec/dashboard/','https://academia.sanpablo.edu.ec/my-account/'],
    settingsUrls: ['https://academia.sanpablo.edu.ec/dashboard/settings/','https://academia.sanpablo.edu.ec/profile/','https://academia.sanpablo.edu.ec/my-account/','https://academia.sanpablo.edu.ec/dashboard/edit-profile/'],
    profilePattern: '/profile/', useProxy: false,
  },
  {
    name: 'NCON Saudi Arabia', domain: 'ncon.edu.sa',
    registerUrl: 'https://ncon.edu.sa/student-registration/',
    dashboardUrls: ['https://ncon.edu.sa/dashboard/','https://ncon.edu.sa/my-account/'],
    settingsUrls: ['https://ncon.edu.sa/dashboard/settings/','https://ncon.edu.sa/profile/','https://ncon.edu.sa/my-account/','https://ncon.edu.sa/dashboard/edit-profile/'],
    profilePattern: '/profile/', useProxy: false,
  },
  {
    name: 'Pibe Learning Bangladesh', domain: 'pibelearning.gov.bd',
    registerUrl: 'https://pibelearning.gov.bd/student-registration/',
    dashboardUrls: ['https://pibelearning.gov.bd/dashboard/','https://pibelearning.gov.bd/my-account/'],
    settingsUrls: ['https://pibelearning.gov.bd/dashboard/settings/','https://pibelearning.gov.bd/profile/','https://pibelearning.gov.bd/my-account/','https://pibelearning.gov.bd/dashboard/edit-profile/'],
    profilePattern: '/profile/', useProxy: true,
  },
];

const FIELDS = {
  firstName: 'input[name="first_name"]', lastName: 'input[name="last_name"]',
  username:  'input[name="user_login"]', email:    'input[name="email"]',
  password:  'input[name="password"]',   password2: 'input[name="password2"]',
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

async function createGeezekEmail(browser) {
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  try {
    await page.goto('https://geezek.com', { waitUntil: 'networkidle', timeout: 20000 });

    // DEBUG: print page so we can see exact button labels
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('    [geezek] Page preview:', bodyText.substring(0, 300).replace(/\n/g, ' '));

    // Try all common generate button patterns
    const generateSelectors = [
      'button:has-text("Generate")',
      'a:has-text("Generate")',
      'button:has-text("Create")',
      'button:has-text("Get")',
      'button:has-text("New")',
      'input[type="submit"]',
      '.generate-btn',
      '#generate',
    ];

    let clicked = false;
    for (const sel of generateSelectors) {
      const btn = page.locator(sel).first();
      if (await btn.count() > 0 && await btn.isVisible()) {
        await btn.click();
        console.log(`    [geezek] Clicked via: ${sel}`);
        clicked = true;
        break;
      }
    }

    if (!clicked) {
      // Dump all buttons so we can see exactly what's on the page
      const buttons = await page.evaluate(() =>
        Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"], a'))
          .map(el => `${el.tagName} | "${el.textContent.trim().substring(0, 40)}" | id=${el.id} | class=${el.className}`)
          .join('\\n')
      );
      console.log('    [geezek] All clickable elements:\\n', buttons);
      throw new Error('No Generate button found — check log above');
    }

    await page.waitForTimeout(2000);

    const afterText = await page.evaluate(() => document.body.innerText);
    console.log('    [geezek] Post-click:', afterText.substring(0, 400).replace(/\n/g, ' '));

    // Extract email address
    const emailMatch = afterText.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i);
    if (!emailMatch) throw new Error('No email address found in Geezek response');
    const email = emailMatch[0];

    // Extract password if shown
    const passMatch = afterText.match(/password[:\s]+([^\s\n]+)/i)
                   || afterText.match(/pass[:\s]+([^\s\n]+)/i);
    const emailPassword = passMatch ? passMatch[1] : `GzPass${Date.now().toString().slice(-6)}`;

    console.log(`    [geezek] ✅ ${email}`);
    await context.close();
    return { email, emailPassword };

  } catch (e) {
    try { await page.screenshot({ path: `geezek_debug_${Date.now()}.png` }); } catch {}
    await context.close();
    throw new Error(`Geezek UI failed: ${e.message}`);
  }
}

function pollForActivationLink(emailUser, emailPass, timeoutMs = 90000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const attempt = () => {
      if (Date.now() > deadline) return reject(new Error('Email verify timeout (90s)'));
      const imap = new Imap({ user: emailUser, password: emailPass, host: CONFIG.imap.host, port: CONFIG.imap.port, tls: CONFIG.imap.tls, tlsOptions: CONFIG.imap.tlsOptions });
      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err) => {
          if (err) { imap.end(); return setTimeout(attempt, 10000); }
          imap.search(['UNSEEN'], (err, results) => {
            if (err || !results.length) { imap.end(); return setTimeout(attempt, 10000); }
            const f = imap.fetch(results, { bodies: '' });
            let found = false;
            f.on('message', (msg) => {
              msg.on('body', (stream) => {
                simpleParser(stream, (err, mail) => {
                  if (err || found) return;
                  const text = mail.html || mail.text || '';
                  const match = text.match(/https?:\/\/[^\s"'<>]+(?:activate|confirm|verify|activation|set-password|key=|token=)[^\s"'<>]*/i);
                  if (match) { found = true; imap.end(); resolve(match[0]); }
                });
              });
            });
            f.once('end', () => { if (!found) { imap.end(); setTimeout(attempt, 10000); } });
          });
        });
      });
      imap.once('error', () => setTimeout(attempt, 10000));
      imap.connect();
    };
    attempt();
  });
}

function buildBioWithLinks(bioText, links, supportsHtml) {
  if (!links || !links.length) return bioText;
  const block = supportsHtml
    ? links.map(l => `<a href="${l.url}" rel="dofollow">${l.anchorText}</a>`).join(' | ')
    : links.map(l => `${l.anchorText}: ${l.url}`).join('\n');
  return `${bioText}\n\n${block}`;
}

async function injectBio(page, bioText, links) {
  const hasTinyMce = await page.evaluate(() => !!(
    window.tinyMCE || document.querySelector('iframe.wp-editor-iframe') ||
    document.querySelector('#wp-description-editor-container') || document.querySelector('.tmce-active')
  ));
  const fullBio = buildBioWithLinks(bioText, links, hasTinyMce);
  console.log(`    [bio] TinyMCE=${hasTinyMce} | ${fullBio.length} chars`);
  if (hasTinyMce) {
    const injected = await page.evaluate((html) => {
      const frames = document.querySelectorAll('iframe.wp-editor-iframe, #content_ifr, #description_ifr');
      for (const f of frames) { const doc = f.contentDocument || f.contentWindow.document; if (doc && doc.body) { doc.body.innerHTML = html; return true; } }
      if (window.tinyMCE && window.tinyMCE.activeEditor) { window.tinyMCE.activeEditor.setContent(html); return true; }
      return false;
    }, fullBio);
    if (injected) return;
  }
  const selectors = ['textarea[name="description"]','textarea[name="tutor_profile_bio"]','#description','textarea.tutor-form-control','textarea.wp-editor-area'];
  for (const sel of selectors) {
    const el = await page.$(sel);
    if (el) {
      await page.evaluate((s, t) => {
        const el = document.querySelector(s);
        const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
        setter.call(el, t);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, sel, fullBio);
      console.log(`    [bio] Injected via ${sel}`);
      return;
    }
  }
  console.warn('    [bio] ⚠ No bio textarea found');
}

async function injectWebsiteUrl(page, url) {
  const selectors = ['input[name="website_url"]','input[name="tutor_profile_url"]','input[name="url"]','input[name="user_url"]','#url','#website_url'];
  for (const sel of selectors) {
    const el = await page.$(sel);
    if (el) { await el.fill(url); console.log(`    [url] Injected via ${sel}`); return; }
  }
  console.warn('    [url] ⚠ No website URL field found');
}

async function saveProfile(page) {
  const saveSelectors = ['main button[type="submit"]','.tutor-dashboard-content button[type="submit"]','#tutor-profile-edit-form button[type="submit"]','form.tutor-form button[type="submit"]','[name="tutor_save_profile"]','button.tutor-btn-primary','input[type="submit"]'];
  for (const sel of saveSelectors) {
    const btns = page.locator(sel);
    const count = await btns.count();
    for (let i = 0; i < count; i++) {
      const btn = btns.nth(i);
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForLoadState('networkidle');
        console.log(`    [save] Saved via ${sel}[${i}]`);
        return true;
      }
    }
  }
  console.warn('    [save] No save button — trying Enter fallback');
  await page.keyboard.press('Enter');
  await page.waitForLoadState('networkidle');
  return false;
}

async function submitRegistrationForm(page) {
  const formSubmit = page.locator('form button[type="submit"], form input[type="submit"]').first();
  if (await formSubmit.count() > 0 && await formSubmit.isVisible()) {
    await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }), formSubmit.click()]);
    return;
  }
  const all = page.locator('button[type="submit"], input[type="submit"]');
  const n = await all.count();
  for (let i = 0; i < n; i++) {
    const btn = all.nth(i);
    if (await btn.isVisible()) {
      await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }), btn.click()]);
      return;
    }
  }
  throw new Error('No visible submit button found in registration form');
}

async function findSettingsPage(page, site) {
  for (const url of site.settingsUrls) {
    try { await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 }); } catch { continue; }
    if (/login|signin|wp-login/i.test(page.url())) continue;
    const hasBio = await page.$('textarea[name="description"], textarea[name="tutor_profile_bio"], #description, textarea.tutor-form-control');
    const hasUrl = await page.$('input[name="website_url"], input[name="tutor_profile_url"], input[name="url"]');
    if (hasBio || hasUrl) { console.log(`    [settings] Found at: ${url}`); return true; }
  }
  for (const dashUrl of site.dashboardUrls) {
    try { await page.goto(dashUrl, { waitUntil: 'networkidle', timeout: 20000 }); } catch { continue; }
    const editLink = await page.$('a[href*="settings"], a[href*="edit-profile"], a[href*="edit-account"], a[href*="profile"]');
    if (editLink) { await editLink.click(); await page.waitForLoadState('networkidle'); console.log(`    [settings] Found via dashboard: ${page.url()}`); return true; }
  }
  return false;
}

async function scrapeProfileUrl(page, site) {
  return await page.evaluate((pattern) => {
    const links = Array.from(document.querySelectorAll('a[href]'));
    const found = links.find(a => /view.?profile|my.?profile|perfil|profil/i.test(a.textContent) || a.href.includes(pattern));
    return found ? found.href : null;
  }, site.profilePattern);
}

async function runSite(browser, site) {
  const identity = generateIdentity();
  let geezek;
  console.log(`\n${'═'.repeat(64)}\n  ▶  ${site.name}  (${site.domain})`);
  try { geezek = await createGeezekEmail(browser); identity.email = geezek.email; }
  catch (e) { return { site: site.name, domain: site.domain, status: 'FAILED', reason: `Geezek: ${e.message}` }; }
  console.log(`     user: ${identity.username}  |  ${identity.email}`);

  const contextOptions = { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
  if (site.useProxy && CONFIG.proxyUrl) contextOptions.proxy = { server: CONFIG.proxyUrl };
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  try {
    console.log(`\n  [1/4] Registration`);
    await page.goto(site.registerUrl, { waitUntil: 'networkidle', timeout: 30000 });
    if (!await page.$('form')) throw new Error('No registration form on page');
    for (const [key, sel] of Object.entries(FIELDS)) {
      const el = await page.$(sel);
      if (!el) continue;
      await el.fill(key === 'firstName' ? identity.firstName : key === 'lastName' ? identity.lastName : key === 'username' ? identity.username : key === 'email' ? identity.email : identity.password);
    }
    const tos = await page.$('input[type="checkbox"]');
    if (tos) await tos.check();
    await submitRegistrationForm(page);
    const postUrl = page.url();
    console.log(`     Post-register: ${postUrl}`);

    if (/activate|confirm|checkemail|check.email|verify/i.test(postUrl)) {
      console.log(`  [2/4] Email verification — polling IMAP...`);
      try {
        const link = await pollForActivationLink(geezek.email, geezek.emailPassword);
        await page.goto(link, { waitUntil: 'networkidle', timeout: 30000 });
        console.log(`     Post-activation: ${page.url()}`);
      } catch (e) { console.warn(`     Email verify failed: ${e.message} — continuing`); }
    } else { console.log(`  [2/4] Auto-login — no email verify needed`); }

    console.log(`  [3/4] Finding profile settings...`);
    if (!await findSettingsPage(page, site)) throw new Error('Profile settings not found');

    console.log(`  [4/4] Injecting bio + biolinks`);
    await injectBio(page, CONFIG.bioText, CONFIG.bioLinks);
    await injectWebsiteUrl(page, CONFIG.targetUrl);
    await saveProfile(page);

    const profileUrl = (await scrapeProfileUrl(page, site)) || `https://${site.domain}/profile/${identity.username}/`;
    console.log(`\n  ✅ SUCCESS\n     Profile : ${profileUrl}\n     Creds   : ${identity.username}  /  ${identity.email}  /  ${identity.password}`);
    await context.close();
    return { site: site.name, domain: site.domain, status: 'SUCCESS', profileUrl, username: identity.username, email: identity.email, password: identity.password };

  } catch (err) {
    console.error(`\n  ❌ FAILED: ${err.message}`);
    try { await page.screenshot({ path: `fail_${site.domain.replace(/\./g,'_')}_${Date.now()}.png` }); } catch {}
    await context.close();
    return { site: site.name, domain: site.domain, status: 'FAILED', reason: err.message };
  }
}

(async () => {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║   BATCH TUTOR LMS — 6 SITES                                      ║');
  console.log('║   umkmcerdaspajak.id | lms.gkce.edu.in | mooc.esil.edu.kz        ║');
  console.log('║   academia.sanpablo.edu.ec | ncon.edu.sa | pibelearning.gov.bd   ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log(`\n  Target : ${CONFIG.targetUrl}\n  Anchor : ${CONFIG.anchorText}\n`);

  const browser = await chromium.launch({ headless: CONFIG.headless, slowMo: CONFIG.slowMo, args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const results = [];
  for (const site of SITES) {
    results.push(await runSite(browser, site));
    await new Promise(r => setTimeout(r, 3000));
  }
  await browser.close();

  console.log('\n\n' + '═'.repeat(64) + '\n  FINAL REPORT\n' + '═'.repeat(64));
  const ok = results.filter(r => r.status === 'SUCCESS');
  const fail = results.filter(r => r.status === 'FAILED');
  console.log(`\n  ✅ SUCCEEDED: ${ok.length} / ${results.length}`);
  ok.forEach(r => console.log(`\n    ${r.site}\n    Profile  : ${r.profileUrl}\n    Creds    : ${r.username}  /  ${r.email}  /  ${r.password}`));
  if (fail.length) { console.log(`\n  ❌ FAILED: ${fail.length}`); fail.forEach(r => console.log(`    ${r.site}: ${r.reason}`)); }
  const outFile = `results_6sites_${Date.now()}.json`;
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
  console.log(`\n  Results saved → ${outFile}`);
})();
