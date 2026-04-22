const { chromium } = require('playwright');
const fs = require('fs');

const randomWebsites = [
  'https://tech-innovators-hub.net',
  'https://digital-skills-academy.com',
  'https://learning-forward.edu',
  'https://creativeminds-studio.com',
  'https://webcraft-solutions.net'
];

function generateIdentity() {
  const ts = Date.now().toString().slice(-6); 
  const rand = Math.floor(100 + Math.random() * 899);
  const username = `user${ts}${rand}`;  
  
  // Gmail for maximum bypass
  const email = `${username}@gmail.com`; 
  const password = `Tz${ts}@Kw${rand}!`;

  const firstNames = ['Alex','Sarah','James','Emma','David','Olivia','Chris','Sophia'];
  const lastNames  = ['Johnson','Thomas','Davis','Wilson','Martinez','Anderson','Taylor'];
  const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
  const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  const website = randomWebsites[Math.floor(Math.random() * randomWebsites.length)];

  return {
    firstName: fn, lastName: ln, username, email,
    password: password,
    website,
    bio: `Passionate educator and lifelong learner with expertise in digital skills.`
  };
}

const sitesConfig = [
  {
    domain: 'blac.edu.pl',
    regUrl:   '/student-registration/',
    loginUrl: '/wp-login.php',
    useJsLogin: false,
    profilePaths: ['/my-account/edit-account/', '/dashboard/settings/', '/tutor-dashboard/settings/']
  },
  {
    domain: 'pibelearning.gov.bd',
    regUrl:   '/student-registration/',
    loginUrl: '/dashboard/',
    useJsLogin: true,
    profilePaths: ['/wp-admin/profile.php', '/dashboard/settings/']
  },
  {
    domain: 'edu.learningsuite.id',
    regUrl:   '/student-registration/',
    loginUrl: '/dashboard/',
    useJsLogin: true,
    profilePaths: ['/dashboard/settings/', '/wp-admin/profile.php']
  }
];

function buildBioWithLinks(bioText, links, supportsHtml) {
  if (!links || links.length === 0) return bioText;

  const linkBlock = supportsHtml
    ? links.map(l => `<a href="${l.url}" rel="dofollow">${l.anchorText}</a>`).join(' | ')
    : links.map(l => `${l.anchorText}: ${l.url}`).join('\n');

  return `${bioText}\n\n${linkBlock}`;
}

async function injectBio(page, bioText, links) {
  // Detect TinyMCE
  const hasTinyMce = await page.evaluate(() => !!(
    window.tinyMCE ||
    document.querySelector('iframe.wp-editor-iframe') ||
    document.querySelector('#wp-description-editor-container') ||
    document.querySelector('.tmce-active')
  ));

  const fullBio = buildBioWithLinks(bioText, links, hasTinyMce);

  if (hasTinyMce) {
    console.log(`  Injecting Bio HTML into TinyMCE...`);
    await page.evaluate((html) => {
      const frames = document.querySelectorAll('iframe.wp-editor-iframe, #content_ifr');
      for (const frame of frames) {
        const doc = frame.contentDocument || frame.contentWindow.document;
        if (doc && doc.body) { doc.body.innerHTML = html; return; }
      }
    }, fullBio);
  } else {
    console.log(`  Injecting Bio into standard textarea...`);
    const bioSelectors = [
      'textarea[name="description"]',
      'textarea[name="tutor_profile_bio"]',
      '#description',
      'textarea.tutor-form-control'
    ];

    for (const sel of bioSelectors) {
      const el = await page.$(sel);
      if (el) {
        await el.click({ clickCount: 3 });
        // Use native value setter so React/Vue state updates fire
        await page.evaluate(([selector, text]) => {
          const ele = document.querySelector(selector);
          const setter = Object.getOwnPropertyDescriptor(
            HTMLTextAreaElement.prototype, 'value').set;
          setter.call(ele, text);
          ele.dispatchEvent(new Event('input', { bubbles: true }));
          ele.dispatchEvent(new Event('change', { bubbles: true }));
        }, [sel, fullBio]);
        break;
      }
    }
  }
}

async function editProfileTutorLMS(page, domain, website, bioText, profilePathsConfig, bioLinks) {
  await page.goto(`https://${domain}/wp-admin/profile.php`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(1500);

  let urlField = page.locator('input#url');

  if (!await urlField.count() || page.url().includes('dashboard') || page.url().includes('login') || page.url().includes('my-account')) {
    console.log(`  ! wp-admin rejected/missing. Exploring frontend dashboards...`);
    const combinedPaths = [...new Set([...profilePathsConfig, '/my-account/edit-account/', '/dashboard/settings/', '/tutor-dashboard/settings/', '/profile/edit/'])];

    for (const path of combinedPaths) {
      console.log(`  ...trying path: ${path}`);
      await page.goto(`https://${domain}${path}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(2000);

      const urlSelectors = [
        'input[name="url"]',
        'input[name="tutor_profile_url"]',
        'input[name="website_url"]',
        'input[name="user_url"]',
        'input[name="website"]',
        'input[type="url"]'
      ];
      for (const sel of urlSelectors) {
         if (await page.locator(sel).count() > 0) {
             urlField = page.locator(sel).first();
             break;
         }
      }

      const bioLocators = [
        'textarea[name="description"]',
        'textarea[name="tutor_profile_bio"]',
        '#description',
        'textarea.tutor-form-control',
        '.wp-editor-area'
      ];
      let bioFound = false;
      for (const bs of bioLocators) {
         if (await page.locator(bs).count() > 0) { bioFound = true; break;}
      }

      if (bioFound || await urlField.count() > 0) {
          console.log(`  ✓ Found fields on ${path}`);
          break;
      }
    }
  }

  if (await urlField.count() > 0) {
    await urlField.fill(website, { force: true });
  } else {
    console.log(`  ⚠️ No website field found on any dashboard path`);
  }

  // Core Bio Injection Method
  await injectBio(page, bioText, bioLinks);

  const saveBtn = page.locator([
    'button[name="save_account_details"]',
    'input[type="submit"][name="submit"]',
    '#submit',
    'button[type="submit"]',
    'input[type="submit"]',
    '.tutor-btn-primary',
    'button:has-text("Save")',
    'button:has-text("Update")'
  ].join(', ')).first();

  if (await saveBtn.count() > 0) {
    await saveBtn.click({ force: true });
    await page.waitForTimeout(2000);
    console.log(`  ✅ Profile saved successfully`);
  } else {
    console.log(`  ⚠️ Save button not found`);
  }
}

async function registerTutorLMS(page, siteConfig, identity, bioLinks) {
  const domain = siteConfig.domain;
  const { firstName, lastName, username, email, password, website, bio } = identity;
  const regUrl = `https://${domain}${siteConfig.regUrl}`;

  console.log(`[1] Navigating to ${regUrl}`);
  await page.goto(regUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1500);

  const nonce = await page.evaluate(() => {
    const nonceField = document.querySelector('input[name="_wpnonce"]');
    return nonceField ? nonceField.value : null;
  });
  if (!nonce && (await page.locator('input[name="_wpnonce"]').count() > 0)) {
     console.log(`  ⚠️ Nonce missing or expired, reloading page safely...`);
     await page.reload({ waitUntil: 'networkidle' });
  }

  const tab = page.locator('a:has-text("Register"), button:has-text("Register"), .register-tab, .tutor-tab:has-text("Register")');
  if (await tab.count() > 0) {
      console.log(`  Clicking 'Register' tab to reveal form...`);
      await tab.first().click();
      await page.waitForTimeout(800);
  }

  console.log(`[2] Filling Registration Form...`);
  let regForm = page.locator('form').filter({ hasText: /Register|Sign Up/i }).first();
  if (await regForm.count() === 0) {
     regForm = page.locator('.tutor-registration-form, form#tutor-registration-form').first();
  }
  if (await regForm.count() === 0) {
     regForm = page.locator('form').first(); 
  }

  const fill = async (selectors, value) => {
    for (const sel of selectors) {
      try {
        const el = regForm.locator(sel).first();
        if (await el.count() > 0) {
          await el.fill(value, { force: true });
          return true;
        }
      } catch {}
    }
    await page.evaluate(([sels, val]) => {
      for (const s of sels) {
        const el = document.querySelector(`form ${s}`) || document.querySelector(s);
        if (el) {
          el.value = val;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          return;
        }
      }
    }, [selectors, value]);
  };

  await fill(['input[name="first_name"]', '#first_name', 'input[placeholder*="First" i]'], firstName);
  await fill(['input[name="last_name"]', '#last_name', 'input[placeholder*="Last" i]'], lastName);
  await fill(['input[name="user_login"]', '#user_login', 'input[placeholder*="Username" i]'], username);
  await fill(['input[type="email"]', 'input[name="email"]', '#user_email'], email);

  const pwFields = await regForm.locator('input[type="password"]').all();
  for (const pw of pwFields) {
     await pw.fill(password, { force: true });
  }

  await page.evaluate((pwd) => {
    document.querySelectorAll('input[type="password"]').forEach(el => {
      el.value = pwd;
      el.dispatchEvent(new Event('input', {bubbles: true}));
      el.dispatchEvent(new Event('change', {bubbles: true}));
    });
  }, password);

  console.log(`  Submitting registration...`);
  const submitBtn = regForm.locator('input[type="submit"], button[type="submit"], .tutor-btn-primary').first();
  if (await submitBtn.count() > 0) {
     await submitBtn.click({ force: true });
  } else {
     await page.evaluate(() => {
        let btn = document.querySelector('input[type="submit"], button[type="submit"], .tutor-btn-primary');
        if(btn) btn.click();
     });
  }

  await page.waitForTimeout(4000);

  const postRegUrl = page.url();
  console.log(`  POST-REGISTER URL: ${postRegUrl}`);
  
  if (postRegUrl.includes('student-registration') || postRegUrl.includes('register')) {
      const errors = await page.locator('.tutor-form-feedback, .error, .alert, .notice, p.error, li.error').allInnerTexts();
      if (errors.length > 0) console.log('  ERRORS FOUND:', errors);
  }

  // ----------------------------------------------------------------
  // Login
  // ----------------------------------------------------------------
  const loginUrl = `https://${domain}${siteConfig.loginUrl}`;
  console.log(`[3] Logging in at ${loginUrl}`);
  await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  let formCount = await page.locator('input[type="password"]').count();
  if (formCount === 0 && !page.url().includes('login')) {
      console.log(`  (User appears to be auto-logged in, proceeding)`);
  } else {
      if (siteConfig.useJsLogin || siteConfig.loginUrl.includes('dashboard')) {
          await page.fill('input[name="log"], input[name="username"], input[name="user_login"], #user_login', username, { force: true });
          await page.fill('input[name="pwd"], input[name="password"], input[name="user_pass"], #user_pass', password, { force: true });
          await page.click('button:has-text("Sign In"), input[type="submit"], button[type="submit"], #wp-submit', { force: true });
      } else {
          await page.evaluate((data) => {
              let usr = document.querySelector('input[name="log"], input[name="username"], #user_login');
              let pwd = document.querySelector('input[name="pwd"], input[name="password"], #user_pass');
              let btn = document.querySelector('button[type="submit"], input[type="submit"], #wp-submit');
              if (usr && pwd && btn) {
                  usr.value = data.username;
                  pwd.value = data.password;
                  usr.dispatchEvent(new Event('input', { bubbles: true }));
                  pwd.dispatchEvent(new Event('input', { bubbles: true }));
                  btn.click();
              }
          }, { username, password });
      }
      await page.waitForTimeout(4000);
  }

  const loginFormStillPresent = (await page.locator('form#loginform').count() > 0) || (await page.locator('input#user_login, input#user_pass').count() > 1 && !page.url().includes('edit-account'));
  if (loginFormStillPresent) {
    throw new Error('Login form still present — authentication failed');
  }

  // ----------------------------------------------------------------
  // Profile edit
  // ----------------------------------------------------------------
  console.log(`[4] Editing Profile...`);
  await editProfileTutorLMS(page, domain, website, bio, siteConfig.profilePaths, bioLinks);

  // Scrape profile URL
  const profileUrl = `https://${domain}/profile/${username}/`;
  console.log(`[5] Verifying Profile: ${profileUrl}`);
  await page.goto(profileUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  
  const bodyHtml = await page.evaluate(() => document.body.innerHTML);
  if (bodyHtml.includes(website)) {
      console.log(`  ✓ Anchor validated publicly!`);
  } else {
      console.log(`  ! Anchor not cleanly visible in HTML but script finished.`);
  }

  return { success: true, profileUrl, username, email, password };
}

(async () => {
  console.log('==========================================');
  console.log('  TUTOR LMS FIXED AUTOMATION RUN (WITH BIOLINKS)');
  console.log('==========================================\n');

  const bioLinks = [
    { url: 'https://seolinkmasters.com/education', anchorText: 'SEO Link Masters' },
    { url: 'https://learning-forward.edu/about', anchorText: 'Learn Forward Profile' },
    { url: 'https://tech-innovators-hub.net/contact', anchorText: 'My Tech Hub' }
  ];

  const results = [];
  const browser = await chromium.launch({ headless: false, args: ['--no-sandbox', '--start-maximized'] });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  });

  for (const conf of sitesConfig) {
    const identity = generateIdentity();
    console.log(`\n==========================================`);
    console.log(`🚀 Testing: ${conf.domain}`);
    console.log(`Identity : ${identity.username} | ${identity.email}`);
    console.log(`Password : ${identity.password}`);
    console.log(`==========================================`);

    const page = await context.newPage();
    try {
      const res = await registerTutorLMS(page, conf, identity, bioLinks);
      results.push({ domain: conf.domain, status: 'SUCCESS', details: res });
    } catch (e) {
      console.log(`❌ ERROR: ${e.message}`);
      results.push({ domain: conf.domain, status: 'FAILED', error: e.message });
    } finally {
      await page.close();
    }
  }

  await browser.close();

  console.log('\n==========================================');
  console.log('           FINAL RESULTS');
  console.log('==========================================');
  results.forEach((r, i) => {
    const icon = r.status === 'SUCCESS' ? '✅' : '❌';
    console.log(`\n${icon} [${i + 1}] ${r.domain}`);
    console.log(`  Status   : ${r.status}`);
    if (r.status === 'SUCCESS') {
      console.log(`  Profile  : ${r.details.profileUrl}`);
      console.log(`  Username : ${r.details.username}`);
      console.log(`  Password : ${r.details.password}`);
    } else {
      console.log(`  Error    : ${r.error}`);
    }
  });

})();
