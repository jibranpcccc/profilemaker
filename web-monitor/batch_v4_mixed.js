/**
 * batch_v4_mixed.js  v2
 * Fixes:
 *  - hoc.salomon.edu.vn: networkidle wait + navigation guard on fills
 *  - Wix: iframe-aware signup + increased modal wait
 */

const { chromium } = require('playwright');
const fs = require('fs');

const identity = {
  firstName: 'Sarah',
  lastName:  'Mitchell',
  username:  'sarahmitchell_' + Date.now().toString().slice(-5),
  email:     'sarahmitchell_' + Date.now().toString().slice(-5) + '@gmail.com',
  password:  'Secure@Pass2025!',
  bio:       'Hair care enthusiast sharing styling tips, healthy hair routines, and product reviews.',
  website:   'https://yourtargetsite.com',
};

const SITES = [
  // Tutor LMS — only the 1 failure + keeping others for re-verify
  { domain:'hoc.salomon.edu.vn',     platform:'tutor',     regPath:'/student-registration/' },
  // Wix — all 10
  { domain:'haphong.edu.vn',               platform:'wix' },
  { domain:'holycrossconvent.edu.na',       platform:'wix' },
  { domain:'rosewood.edu.na',               platform:'wix' },
  { domain:'woorips.vic.edu.au',            platform:'wix' },
  { domain:'orkhonschool.edu.mn',           platform:'wix' },
  { domain:'lasallesancristobal.edu.mx',    platform:'wix' },
  { domain:'nazaret.edu.ec',                platform:'wix' },
  { domain:'ictae.edu.mx',                  platform:'wix' },
  { domain:'divinagracia.edu.ec',           platform:'wix' },
  { domain:'discoveryschool.edu.hn',        platform:'wix' },
];

const results = [];

// ── HELPER: safe fill (guards against mid-navigation context loss) ──
async function safeFill(page, selector, value) {
  try {
    const el = await page.$(selector);
    if (el) { await el.fill(value); return true; }
  } catch {}
  return false;
}

// ── TUTOR LMS (with networkidle + nav guard) ───────────────────
async function registerTutor(page, site) {
  try {
    await page.goto(`https://${site.domain}${site.regPath}`, {
      waitUntil: 'networkidle', timeout: 25000
    });
  } catch {
    // fallback to domcontentloaded if networkidle times out
    await page.goto(`https://${site.domain}${site.regPath}`, {
      waitUntil: 'domcontentloaded', timeout: 20000
    });
  }
  await page.waitForTimeout(2000);

  const nonce = await page.$('input[name="_tutor_nonce"]');
  if (!nonce) return { verdict: 'NO_FORM', url: page.url() };

  await safeFill(page, 'input[name="name"]',                  identity.firstName + ' ' + identity.lastName);
  await safeFill(page, 'input[name="first_name"]',            identity.firstName);
  await safeFill(page, 'input[name="last_name"]',             identity.lastName);
  await safeFill(page, 'input[name="email"]',                 identity.email);
  await safeFill(page, 'input[name="user_login"]',            identity.username);
  await safeFill(page, 'input[name="password"]',              identity.password);
  await safeFill(page, 'input[name="password_confirmation"]', identity.password);

  try {
    await page.click('[name="tutor_register_student_btn"]');
    await page.waitForTimeout(4000);
  } catch {}
  return { verdict: 'SUBMITTED', url: page.url() };
}

// ── WIX IFRAME-AWARE HANDLER ───────────────────────────────────
async function registerWix(page, site) {
  await page.goto(`https://www.${site.domain}`, {
    waitUntil: 'domcontentloaded', timeout: 25000
  });
  await page.waitForTimeout(4000); // let Wix JS fully boot

  // Step 1: find & click the signup trigger (main DOM first, then iframes)
  const signupTriggers = [
    "button:has-text('Sign up')",
    "button:has-text('Join')",
    "a:has-text('Sign up')",
    "[data-testid='signUp.switchToSignUp']",
    "button:has-text('Registrarse')",
    "button:has-text('Únete')",
    "button:has-text('Iniciar sesión')",
    "button:has-text('Register')",
    "button:has-text('Log in')",
    "a:has-text('Login')",
  ];

  let opened = false;

  // Try main DOM triggers
  for (const sel of signupTriggers) {
    try {
      const el = await page.$(sel);
      if (el) {
        await el.click();
        await page.waitForTimeout(3000);
        opened = true;
        console.log(`    Opened via main DOM: ${sel}`);
        break;
      }
    } catch {}
  }

  // If not opened, look inside ALL iframes
  if (!opened) {
    const frames = page.frames();
    console.log(`    Checking ${frames.length} frames for signup triggers...`);
    for (const frame of frames) {
      if (opened) break;
      for (const sel of signupTriggers) {
        try {
          const el = await frame.$(sel);
          if (el) {
            await el.click();
            await page.waitForTimeout(3000);
            opened = true;
            console.log(`    Opened via iframe (${frame.url().substring(0, 60)}): ${sel}`);
            break;
          }
        } catch {}
      }
    }
  }

  if (!opened) {
    // Last resort: dump all visible button texts for debugging
    const btns = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button, a[href="#"]'))
        .map(e => e.textContent.trim())
        .filter(t => t.length > 0 && t.length < 40)
        .slice(0, 15)
    );
    console.log(`    Visible buttons: ${JSON.stringify(btns)}`);
    return { verdict: 'NO_SIGNUP_BTN', url: page.url(), debugBtns: btns };
  }

  // Step 2: find email+password — check main DOM then all frames
  let emailEl = null, passEl = null, targetFrame = null;

  // Check main page first
  await page.waitForTimeout(2000);
  emailEl = await page.$('input[type="email"]');
  passEl  = await page.$('input[type="password"]');

  // If not in main DOM, search all iframes
  if (!emailEl || !passEl) {
    for (const frame of page.frames()) {
      try {
        const e = await frame.$('input[type="email"]');
        const p = await frame.$('input[type="password"]');
        if (e && p) {
          emailEl = e; passEl = p; targetFrame = frame;
          console.log(`    Found fields in iframe: ${frame.url().substring(0, 60)}`);
          break;
        }
      } catch {}
    }
  }

  if (!emailEl || !passEl) return { verdict: 'NO_FIELDS', url: page.url() };

  await emailEl.fill(identity.email);
  await passEl.fill(identity.password);

  // Step 3: find and click submit inside the same frame
  const submitSelectors = [
    "button[type='submit']",
    "button:has-text('Sign up')",
    "button:has-text('Continue')",
    "button:has-text('Join')",
    "button:has-text('Registrarse')",
  ];

  const searchContext = targetFrame || page;
  for (const sel of submitSelectors) {
    try {
      const btn = await searchContext.$(sel);
      if (btn) { await btn.click(); break; }
    } catch {}
  }
  await page.waitForTimeout(5000);

  // Step 4: handle display name step
  let nameEl = await page.$("[data-testid='display-name-input'], input[aria-label*='name' i]");
  if (!nameEl) {
    for (const frame of page.frames()) {
      try {
        nameEl = await frame.$("[data-testid='display-name-input'], input[aria-label*='name' i]");
        if (nameEl) break;
      } catch {}
    }
  }
  if (nameEl) {
    await nameEl.fill(identity.firstName + ' ' + identity.lastName);
    await page.waitForTimeout(1000);
    for (const sel of ["button:has-text('Done')", "button:has-text('Continue')", "button[type='submit']"]) {
      try {
        const b = await page.$(sel) || await page.frames().find(async f => await f.$(sel));
        if (b) { await b.click(); break; }
      } catch {}
    }
    await page.waitForTimeout(3000);
  }

  // Step 5: fill profile
  const profileResult = await fillWixProfile(page, site);
  return { verdict: 'SUBMITTED', url: page.url(), ...profileResult };
}

// ── WIX PROFILE FILL ──────────────────────────────────────────
async function fillWixProfile(page, site) {
  const profileUrl = `https://www.${site.domain}/profile/${identity.username}/profile`;
  try {
    await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);

    const bioSel = "[data-testid='bio-input'], textarea[name='bio'], [aria-label*='bio' i], [placeholder*='bio' i]";
    const webSel = "[data-testid='customLink-url'], input[placeholder*='URL' i], input[placeholder*='website' i]";

    // Check main DOM + iframes for bio/website fields
    let bioFilled = false, webFilled = false;
    const contexts = [page, ...page.frames()];
    for (const ctx of contexts) {
      try {
        if (!bioFilled) {
          const bioEl = await ctx.$(bioSel);
          if (bioEl) { await bioEl.click(); await bioEl.fill(identity.bio); bioFilled = true; }
        }
        if (!webFilled) {
          const webEl = await ctx.$(webSel);
          if (webEl) { await webEl.click(); await webEl.fill(identity.website); webFilled = true; }
        }
      } catch {}
      if (bioFilled && webFilled) break;
    }

    for (const ctx of contexts) {
      try {
        const saveBtn = await ctx.$("[data-testid='save-button'], button:has-text('Save'), button:has-text('Update')");
        if (saveBtn) { await saveBtn.click(); await page.waitForTimeout(2000); break; }
      } catch {}
    }

    return { profileFilled: bioFilled || webFilled, profileUrl };
  } catch (e) {
    return { profileFilled: false, profileError: e.message.substring(0, 60) };
  }
}

// ── MAIN ──────────────────────────────────────────────────────
(async () => {
  console.log('🚀 BATCH V4 v2 — Iframe-Aware Wix + Tutor Fix\n');
  console.log(`   Identity: ${identity.email}\n`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  });

  for (const site of SITES) {
    console.log(`\n[${site.platform.toUpperCase()}] ${site.domain}`);
    const page = await ctx.newPage();
    let result = { domain: site.domain, platform: site.platform };

    try {
      const r = site.platform === 'tutor'
        ? await registerTutor(page, site)
        : await registerWix(page, site);
      Object.assign(result, r);
      console.log(`  → ${r.verdict} | ${r.url}`);
    } catch (e) {
      result.verdict = 'ERROR';
      result.error = e.message.substring(0, 80);
      console.log(`  ❌ ERROR: ${result.error}`);
    }

    results.push(result);
    await page.close();
    await new Promise(r => setTimeout(r, 2000));
  }

  await browser.close();

  const ok  = results.filter(r => r.verdict === 'SUBMITTED');
  const bad = results.filter(r => r.verdict !== 'SUBMITTED');

  console.log('\n\n══════════════════════════════════════════════');
  console.log('  BATCH V4 v2 RESULTS');
  console.log('══════════════════════════════════════════════');
  console.log(`  ✅ Submitted : ${ok.length}/${SITES.length}`);
  ok.forEach(r  => console.log(`     ${r.domain} [${r.platform}]`));
  console.log(`  ❌ Failed    : ${bad.length}`);
  bad.forEach(r => console.log(`     ${r.domain} → ${r.verdict} | ${r.error || r.debugBtns || ''}`));

  fs.writeFileSync('batch_v4v2_results.json', JSON.stringify(results, null, 2));
  console.log('\n  Saved → batch_v4v2_results.json');
})();
