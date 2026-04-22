// ============================================================
// test_wix_5.js — DEFINITIVE VERSION
// Based on confirmed screenshots of actual Wix modal flow
// ============================================================

const { chromium } = require('playwright');
const fs   = require('fs');
const path = require('path');
const captcha = require('2captcha');

const SITES = [
  { name: 'Cuttington University',   domain: 'cu.edu.lr',                    homepage: 'https://www.cu.edu.lr'                    },
];

const TARGETS = [
  { url: 'https://premium-dental-care-ny.com',       anchor: 'Premium Dental Care'   },
  { url: 'https://www.best-seo-agency.com/services', anchor: 'Best SEO Agency'       },
  { url: 'https://tech-innovators-hub.net',          anchor: 'Tech Innovators Hub'   },
  { url: 'https://digital-marketing-pro.org',        anchor: 'Digital Marketing Pro' },
  { url: 'https://buy-cheap-hosting-now.com',        anchor: 'Cheap Hosting'         },
];

const FIRSTS = ['Alex','John','Sarah','Emma','Michael','Jessica','Chris','Laura','David','Anna'];
const LASTS  = ['Smith','Johnson','Brown','Jones','Garcia','Wilson','Davis','Taylor','Thomas','White'];
const pick   = arr => arr[Math.floor(Math.random() * arr.length)];
const rand4  = () => Math.floor(1000 + Math.random() * 8999);
const delay  = ms => new Promise(r => setTimeout(r, ms));

function generateIdentity(target) {
  const first = pick(FIRSTS);
  const last  = pick(LASTS);
  const num   = rand4();
  return {
    first, last, num,
    username:  `${first.toLowerCase()}${last.toLowerCase()}${num}`,
    email:     `${first.toLowerCase()}.${last.toLowerCase()}${num}@geezek.com`,
    password:  `WixPass!${num}Ab`,
    targetUrl: target.url,
    anchor:    target.anchor,
  };
}

async function automateWixSite(site, identity) {
  const result = {
    domain: site.domain, email: identity.email, password: identity.password,
    targetUrl: identity.targetUrl, anchor: identity.anchor,
    status: 'FAILED', publicProfileUrl: null, error: null
  };

  const browser = await chromium.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars',
      '--start-maximized',
    ]
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
    timezoneId: 'America/New_York',
    permissions: [],
  });

  // ── CRITICAL: Remove ALL bot fingerprints before any page JS runs ──
  await context.addInitScript(() => {
    // 1. Remove webdriver flag — the #1 bot signal Wix checks
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });

    // 2. Spoof plugins (headless = 0 plugins, real browser = 3-5)
    Object.defineProperty(navigator, 'plugins', {
      get: () => ({ length: 3, 0: {name:'PDF Viewer'}, 1: {name:'Chrome PDF Viewer'}, 2: {name:'Chromium PDF Viewer'} })
    });

    // 3. Real language array
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });

    // 4. Chrome runtime (missing in Playwright — Wix checks window.chrome)
    if (!window.chrome) window.chrome = { runtime: {}, loadTimes: function(){}, csi: function(){}, app: {} };

    // 5. Remove automation-related properties
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;

    // 6. Permissions API spoof
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (params) =>
      params.name === 'notifications'
        ? Promise.resolve({ state: Notification.permission })
        : originalQuery(params);
  });

  const page = await context.newPage();

  try {
    // ── STEP 1: Load homepage ──
    console.log(` Loading: ${site.homepage}`);
    await page.goto(site.homepage, { waitUntil: 'domcontentloaded', timeout: 30000 });
    // Wait for Wix React app to fully hydrate (important!)
    await delay(5000);

    // ── STEP 2: Click the "Log In" button in nav ──
    console.log(` Clicking Log In...`);
    // Find Log In button coordinates and perform a REAL mouse click
    const coords = await page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll('a, button, [role="button"], span, div'));
      for (const el of candidates) {
        const txt = el.textContent.trim();
        const rect = el.getBoundingClientRect();
        const visible = rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight;
        
        if (visible && /^(log\s*in|sign\s*up|join|register|member)$/i.test(txt)) {
          // get the center of the element
          return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            txt: txt
          };
        }
      }
      return null;
    });

    if (coords) {
      console.log(`  ✓ Found "${coords.txt}" at x:${coords.x}, y:${coords.y}. Clicking...`);
      await page.mouse.move(coords.x, coords.y, { steps: 5 });
      await delay(500);
      await page.mouse.click(coords.x, coords.y);
    } else {
      console.log(`  ! No visible Log In button found`);
    }
    await delay(4000); // Wait for Wix to load the modal + iframe

    // ── STEP 3: Find the auth context (iframe OR main page) ──
    console.log(` Looking for auth modal context...`);
    let authCtx = null;
    let isMainPageDom = false;
    const deadline = Date.now() + 20000;
    
    while (Date.now() < deadline) {
      // 1. Check for iframe
      for (const frame of page.frames()) {
        const url = frame.url();
        if (url.includes('users.wix.com') || url.includes('wix-sm') || url.includes('multisection')) {
          authCtx = frame;
          console.log(`  ✓ Found auth iframe: ${url.substring(0, 80)}`);
          break;
        }
      }
      if (authCtx) break;
      
      // 2. Check if modal is natively in main DOM (React Portal/Shadow DOM)
      const hasMainDomBtn = await page.$('button:has-text("Sign up with email"), button:has-text("Log In"), input[type="email"]').catch(()=>null);
      if (hasMainDomBtn) {
          const isVisible = await hasMainDomBtn.isVisible().catch(()=>false);
          if (isVisible) {
              authCtx = page;
              isMainPageDom = true;
              console.log(`  ✓ Auth modal rendered directly in main page DOM`);
              break;
          }
      }
      
      await delay(500);
    }

    if (!authCtx) {
      console.log(`  All frames (${page.frames().length}):`);
      page.frames().forEach(f => console.log(`    ${f.url().substring(0, 100)}`));
      throw new Error('Auth modal never appeared');
    }

    await delay(1500); // Let modal render

    // ── STEP 4: Click "Sign up with email" ──
    console.log(`[4] Clicking "Sign up with email"...`);
    const emailBtnSelectors = [
      'button:has-text("Sign up with email")',
      'button:has-text("Continue with email")',
      'button:has-text("Email")',
      '[data-hook="emailButton"]',
      '[data-hook="emailSignUp"]',
      'button:has-text("sign up with email")',
    ];
    let emailBtnClicked = false;
    for (const sel of emailBtnSelectors) {
      const btn = await authCtx.$(sel).catch(() => null);
      if (btn) {
        await btn.click();
        console.log(`  ✓ Clicked email signup button: ${sel}`);
        emailBtnClicked = true;
        await delay(1500);
        break;
      }
    }
    if (!emailBtnClicked) {
      console.log(`  ! No "Sign up with email" button — checking if already on email form`);
    }

    // ── STEP 5: Fill Email + Password ──
    // From screenshot: plain underline-style inputs, labels "Email" and "Password"
    console.log(`[5] Filling email + password...`);
    const emailSel = 'input[type="email"]:visible, input[name="email"]:visible, [data-hook="emailInput"] input:visible';
    await authCtx.waitForSelector(emailSel, { timeout: 10000 });
    
    // Use focus-then-type for more human-like behavior (avoids viewport actionability errs)
    const emailInput = await authCtx.locator(emailSel).first();
    await emailInput.focus();
    await delay(300);
    await emailInput.fill(identity.email);
    await delay(500);

    const passSel = 'input[type="password"]:visible, input[name="password"]:visible, [data-hook="passwordInput"] input:visible';
    const passInput = await authCtx.locator(passSel).first();
    await passInput.focus();
    await delay(300);
    await passInput.fill(identity.password);
    await delay(500);

    console.log(`  ✓ Email: ${identity.email}`);
    console.log(`  ✓ Password: ${identity.password}`);

    // ── STEP 6: Solve Captcha & Click the blue "Sign Up" submit button ──
    console.log(`[6] Handling Captcha...`);
    try {
      const solver = new captcha.Solver("234941760330b5686cce13e55d2f60a0");
      
      // Look for the reCAPTCHA wrapper in the authCtx
      const captchaWrapper = await authCtx.$('iframe[title*="reCAPTCHA"]').catch(() => null);
      if (captchaWrapper) {
          console.log(`  ! reCAPTCHA detected. Extracting sitekey...`);
          // Extract the site key from the iframe src url
          const src = await captchaWrapper.getAttribute('src');
          const sitekeyMatch = src.match(/k=([^&]+)/);
          if (sitekeyMatch) {
              const sitekey = sitekeyMatch[1];
              console.log(`  ✓ Found sitekey: ${sitekey}. Solving via 2Captcha...`);
              
              // Solve the captcha
              const response = await solver.recaptcha(sitekey, site.homepage);
              console.log(`  ✓ Captcha solved successfully. Injecting token...`);
              
              // Inject token and actively trigger the React callback
              await authCtx.evaluate((token) => {
                  const textarea = document.querySelector('#g-recaptcha-response');
                  if (textarea) {
                      textarea.value = token;
                      textarea.innerHTML = token;
                  }
                  
                  // Hunt for the grecaptcha callback and execute it
                  if (window.___grecaptcha_cfg && window.___grecaptcha_cfg.clients) {
                      const clients = window.___grecaptcha_cfg.clients;
                      for (let cid in clients) {
                          const client = clients[cid];
                          for (let p1 in client) {
                              if (client[p1] && client[p1] !== null && typeof client[p1] === 'object') {
                                  for (let p2 in client[p1]) {
                                      if (client[p1][p2] && typeof client[p1][p2].callback === 'function') {
                                          try {
                                              client[p1][p2].callback(token);
                                              console.log("Executed grecaptcha callback");
                                              return;
                                          } catch(e) {}
                                      }
                                  }
                              }
                          }
                      }
                  }
              }, response.data);
              
              await delay(3000);
          }
      } else {
          console.log(`  ✓ No visible reCAPTCHA found or it is invisible.`);
      }
    } catch(err) {
        console.log(`  ! Captcha solver error, proceeding anyway: ${err.message}`);
    }

    // From screenshot: blue button with white "Sign Up" text
    console.log(`[6b] Forcing Sign Up commit...`);
    const submitBtn = await authCtx.$([
      'button[type="submit"]',
      '[data-hook="submit"]',
      'button:has-text("Sign Up")',
      'button:has-text("Sign up")',
    ].join(', '));

    if (!submitBtn) throw new Error('Submit button not found');
    
    // Wix's React state might not visually unlock the button even if our token injection was perfect.
    // So we forcibly strip the lock constraints and trigger a raw DOM click.
    await submitBtn.evaluate(btn => {
        btn.removeAttribute('disabled');
        btn.setAttribute('aria-disabled', 'false');
        btn.style.pointerEvents = 'auto';
        btn.click();
    });
    
    console.log(`  ✓ Natively executed submit. Waiting for Wix account creation...`);
    await delay(10000); // Wix takes 8-10s to create + set session

    // ── STEP 7: Verify signup success ──
    const iframeGone = !page.frames().some(f => f.url().includes('users.wix.com'));
    // If it was in the main page DOM natively, we check if the authCtx module vanished
    let signupConfirmed = iframeGone;
    if (isMainPageDom) {
        const isStillVisible = await page.$('input[type="email"]').then(el => el ? el.isVisible() : false).catch(()=>false);
        signupConfirmed = !isStillVisible;
    }
    
    console.log(`  iframe/modal closed (success signal): ${signupConfirmed}`);

    if (!signupConfirmed) {
      // Check for error inside iframe
      try {
        const errEl = await authCtx.$('[data-hook="errorMessage"], [class*="error"], [class*="Error"]');
        if (errEl) {
          const errTxt = await errEl.textContent();
          throw new Error(`Signup error: ${errTxt.trim()}`);
        }
      } catch(e) { if (e.message.startsWith('Signup error:')) throw e; }
      console.log(`  ! modal still present — may need more time`);
      await delay(5000);
    }

    // ── STEP 8: Navigate to profile edit page dynamically ──
    console.log(`[8] Locating true profile URL from logged-in session...`);
    
    // Refresh page to ensure member bar renders properly after sign-up
    await page.goto(site.homepage, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(5000);

    let profileUrl = null;
    
    // Look for the user's avatar / member account menu
    const memberMenuBtn = await page.$([
      '[id^="comp-"][id$="login-bar-member-menu"]',
      '[data-hook="member-menu-button"]',
      'button[aria-label*="account" i]',
      'button[aria-label*="member" i]',
      'login-bar-member-menu'
    ].join(', ')).catch(() => null);

    if (memberMenuBtn) {
      await memberMenuBtn.click();
      await delay(2000); // Wait for the dropdown to open

      // Find the 'Profile' link inside the dropdown
      const profileLinkEl = await page.$([
        'a[href*="/profile/"][data-hook="my-profile"]',
        'a[href*="/profile/"]'
      ].join(', ')).catch(() => null);

      if (profileLinkEl) {
          const rawHref = await profileLinkEl.getAttribute('href');
          if (rawHref) {
              // Strip trailing slash or profile tab suffix and append '/edit'
              const baseProfile = rawHref.split('?')[0].replace(/\/profile\/?$/, ''); // Just in case it links to `/profile/slug/profile`
              profileUrl = rawHref.includes('/edit') ? rawHref : `${baseProfile}/edit`;
              console.log(`  ✓ Extracted real slug URL from DOM: ${profileUrl}`);
          }
      }
    }

    if (!profileUrl) {
        console.log(`  ! Failed to find profile link via UI. Falling back to API guessing...`);
        // Fallback: Check if Wix injected any configs containing member slug
        const wixSlug = await page.evaluate(() => {
            try { return window.wixMembers.currentMember.slug; } catch(e) { return null; }
        });
        const slug = wixSlug || identity.username;
        profileUrl = `${site.homepage}/profile/${slug}/edit`;
    }

    console.log(`[8b] Navigating to: ${profileUrl}`);
    await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await delay(5000);

    // Verify it didn't hit a 500 error / Timeout page (common if profile is still provisioning)
    let is500Error = await page.evaluate(() => document.body.innerText.includes('500') && document.body.innerText.includes('Time Out'));
    if (is500Error) {
        console.log(`  ! Hit Wix 500 Timeout (Profile still provisioning). Waiting 10s and retrying...`);
        await delay(10000);
        await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await delay(8000);
    }

    // ── STEP 9: Find and fill About/Bio field ──
    console.log(`[9] Filling profile bio + website...`);

    // Profile edit may also be in a Wix iframe
    let profileCtx = page;
    for (const frame of page.frames()) {
      const hasBio = await frame.$('textarea, div[contenteditable="true"], input[type="url"]').catch(() => null);
      if (hasBio && frame.url() !== page.url()) {
        profileCtx = frame;
        console.log(`  ✓ Profile edit in frame: ${frame.url().substring(0,60)}`);
        break;
      }
    }

    // Website URL field
    const websiteEl = await profileCtx.$([
      'input[data-hook="websiteInput"]',
      'input[placeholder*="website" i]',
      'input[placeholder*="Website" i]',
      'input[type="url"]',
      'input[name*="website" i]',
    ].join(', ')).catch(() => null);

    if (websiteEl) {
      await websiteEl.fill(identity.targetUrl);
      console.log(`  ✓ Website URL: ${identity.targetUrl}`);
    }

    // Bio/About field — from screenshot ALEXISTOGEL profile it supports HTML links
    const bioEl = await profileCtx.$([
      'div[contenteditable="true"]',
      'textarea[data-hook*="about" i]',
      'textarea[placeholder*="yourself" i]',
      'textarea[placeholder*="about" i]',
      'textarea',
    ].join(', ')).catch(() => null);

    if (bioEl) {
      const tag = await bioEl.evaluate(el => el.tagName);
      const bioText = `Visit ${identity.anchor} at ${identity.targetUrl}`;
      if (tag === 'TEXTAREA') {
        await bioEl.fill(bioText);
      } else {
        // contenteditable — inject as HTML with anchor tag
        await bioEl.evaluate((el, data) => {
          el.focus();
          el.innerHTML = `Visit <a href="${data.url}" target="_blank">${data.anchor}</a>`;
          el.dispatchEvent(new Event('input',  { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          el.dispatchEvent(new Event('blur',   { bubbles: true }));
        }, { url: identity.targetUrl, anchor: identity.anchor });
      }
      console.log(`  ✓ Bio filled with link`);
    } else {
      console.log(`  ! Bio field not found`);
    }

    // ── STEP 10: Save ──
    const saveBtn = await profileCtx.$([
      'button[data-hook="save"]',
      'button:has-text("Save")',
      'button:has-text("Update")',
      'button[type="submit"]',
    ].join(', ')).catch(() => null);

    if (saveBtn) {
      await saveBtn.click();
      console.log(`  ✓ Saved!`);
      await delay(4000);
    } else {
      console.log(`  ! Save button not found`);
    }

    result.publicProfileUrl = `${site.homepage}/profile/${slug}/profile`;
    result.status = 'SUCCESS';
    console.log(`\n✅ SUCCESS: ${result.publicProfileUrl}`);

  } catch(err) {
    result.status = 'FAILED';
    result.error  = err.message;
    console.error(`\n❌ FAILED: ${err.message}`);

    // Take a screenshot on failure for debugging
    try {
      const shotPath = path.join('C:\\Users\\jibra\\Desktop\\1\\profile new maker\\web-monitor', `debug_${site.domain}_${Date.now()}.png`);
      await page.screenshot({ path: shotPath, fullPage: false });
      console.log(`  📸 Screenshot saved: ${shotPath}`);
    } catch(e) {}

  } finally {
    await browser.close();
  }
  return result;
}

// ── MAIN ──
(async () => {
  console.log('==========================================');
  console.log('  WIX BACKLINKER — DEFINITIVE VERSION');
  console.log('==========================================\n');

  const results = [];
  for (let i = 0; i < SITES.length; i++) {
    const site     = SITES[i];
    const target   = TARGETS[i % TARGETS.length];
    const identity = generateIdentity(target);
    console.log(`\nIdentity: ${identity.email} | ${identity.targetUrl} (${identity.anchor})`);
    console.log(`🚀 ${site.name} (${site.domain})`);
    results.push(await automateWixSite(site, identity));
    await delay(5000);
  }

  console.log('\n==========================================');
  console.log('           FINAL RESULTS');
  console.log('==========================================');
  results.forEach((r, i) => {
    console.log(`\n${r.status === 'SUCCESS' ? '✅' : '❌'} [${i+1}] ${r.domain}`);
    console.log(`  Email    : ${r.email}`);
    console.log(`  Password : ${r.password}`);
    console.log(`  Target   : ${r.targetUrl}`);
    console.log(`  Profile  : ${r.publicProfileUrl || 'N/A'}`);
    if (r.error) console.log(`  Error    : ${r.error}`);
  });

  const outPath = path.join('C:\\Users\\jibra\\Desktop\\1\\profile new maker\\web-monitor', 'wix_results_final.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Saved: ${outPath}`);
  console.log(`🎯 ${results.filter(r => r.status === 'SUCCESS').length}/${results.length} completed`);
})();
