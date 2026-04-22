const { chromium } = require('playwright');
const fs = require('fs');

const CONFIG = {
  bioLinks: [
    { url: 'https://seolinkmasters.com/education', anchorText: 'SEO Link Masters' },
    { url: 'https://learning-forward.edu/about', anchorText: 'Learn Forward Profile' },
    { url: 'https://tech-innovators-hub.net/contact', anchorText: 'My Tech Hub' }
  ]
};

const domainsConfig = [
  { domain: 'iviet.edu.vn',       regUrl: '/student-registration/', profilePaths: ['/thong-tin-tai-khoan/', '/dashboard/settings/', '/wp-admin/profile.php'] },
  { domain: 'mooc.esil.edu.kz',   regUrl: '/student-registration/', profilePaths: ['/dashboard/settings/', '/wp-admin/profile.php', '/my-account/edit-account/'] },
  { domain: 'academy.edutic.id',  regUrl: '/student-registration/', profilePaths: ['/dashboard/settings/', '/wp-admin/profile.php', '/my-account/edit-account/'] },
  { domain: 'lms.gkce.edu.in',    regUrl: '/student-registration/', profilePaths: ['/dashboard/settings/', '/wp-admin/profile.php', '/my-account/edit-account/'] }
];

function generateIdentity() {
  const ts = Date.now().toString().slice(-6); 
  const rand = Math.floor(100 + Math.random() * 899);
  const username = `user${ts}${rand}`;  
  const email = `${username}@gmail.com`; 
  const password = `Tz${ts}@Kw${rand}!`;

  const firstNames = ['Alex','Sarah','James','Emma','David','Olivia','Chris','Sophia'];
  const lastNames  = ['Johnson','Thomas','Davis','Wilson','Martinez','Anderson','Taylor'];
  const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
  const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  return {
    firstName: fn, lastName: ln, username, email, password,
    website: CONFIG.bioLinks[0].url,
    bio: `Passionate educator and lifelong learner with expertise in digital skills.`
  };
}

function buildBioWithLinks(bioText, links, supportsHtml) {
  if (!links || links.length === 0) return bioText;
  const linkBlock = supportsHtml
    ? links.map(l => `<a href="${l.url}" rel="dofollow">${l.anchorText}</a>`).join(' | ')
    : links.map(l => `${l.anchorText}: ${l.url}`).join('\n');
  return `${bioText}\n\n${linkBlock}`;
}

async function injectBio(page, bioText, links) {
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
        await page.evaluate(([selector, text]) => {
          const ele = document.querySelector(selector);
          const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
          setter.call(ele, text);
          ele.dispatchEvent(new Event('input', { bubbles: true }));
          ele.dispatchEvent(new Event('change', { bubbles: true }));
        }, [sel, fullBio]);
        break;
      }
    }
  }
}

async function executePipeline(page, conf, identity) {
  console.log(`[1] Registration Phase -> https://${conf.domain}`);
  await page.goto(`https://${conf.domain}${conf.regUrl}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(2000);

  // Fallback click on any register tab if hidden
  const tab = page.locator('a:has-text("Register"), button:has-text("Register"), .register-tab, .tutor-tab:has-text("Register")');
  if (await tab.count() > 0) {
      await tab.first().click();
      await page.waitForTimeout(1000);
  }

  // Inject user credentials
  await page.fill('input[name="first_name"]', identity.firstName);
  await page.fill('input[name="last_name"]', identity.lastName);
  await page.fill('input[name="user_login"]', identity.username);
  await page.fill('input[type="email"], input[name="email"]', identity.email);
  
  const pwds = await page.locator('input[type="password"]').all();
  for (const pw of pwds) await pw.fill(identity.password);
  
  // Accept terms if existent
  const cb = page.locator('input[type="checkbox"]').first();
  if (await cb.count() > 0) await cb.check({ force: true });

  await page.click('input[type="submit"], button[type="submit"]', { force: true });
  await page.waitForTimeout(5000);

  console.log(`  POST-REGISTER URL: ${page.url()}`);
  
  console.log(`[2] Profile Setup Phase -> Exploring paths...`);
  let urlField = page.locator('input#url, input[name="url"], input[name="tutor_profile_url"]');
  for (const path of conf.profilePaths) {
     if (await urlField.count() > 0) break;
     console.log(`  ...hitting: ${path}`);
     await page.goto(`https://${conf.domain}${path}`, { waitUntil: 'domcontentloaded' });
     await page.waitForTimeout(2000);
     urlField = page.locator('input#url, input[name="url"], input[name="tutor_profile_url"], input[name="website"]');
  }

  if (await urlField.count() > 0) {
     await urlField.first().fill(identity.website, { force: true });
  } else {
     console.log(`  ⚠️ No website field found.`);
  }

  // Inject Bio and Links
  await injectBio(page, identity.bio, CONFIG.bioLinks);

  // Save changes
  const saveBtn = page.locator('button[name="save_account_details"], input[type="submit"][name="submit"], #submit, button[type="submit"], .tutor-btn-primary').first();
  if (await saveBtn.count() > 0) {
     await saveBtn.click({ force: true });
     await page.waitForTimeout(2000);
     console.log(`  ✅ Profile saved!`);
  } else {
     console.log(`  ⚠️ Save button not found`);
  }

  return { profileUrl: `https://${conf.domain}/profile/${identity.username}/` };
}

(async () => {
    console.log("=== EXECUTING AUTOMATED 4-PHASE BATCH LMS PIPELINE ===");
    const results = [];
    const browser = await chromium.launch({ headless: false, args: ['--no-sandbox', '--start-maximized'] });
    const context = await browser.newContext();
    
    for (const conf of domainsConfig) {
        const id = generateIdentity();
        console.log(`\n==========================================`);
        console.log(`🚀 Target   : ${conf.domain}`);
        console.log(`Identity : ${id.username} / ${id.email}`);
        console.log(`==========================================`);
        
        const page = await context.newPage();
        try {
           const res = await executePipeline(page, conf, id);
           results.push({ domain: conf.domain, status: 'SUCCESS', ...res, ...id });
        } catch (e) {
           console.log(`❌ FAILED: ${e.message}`);
           results.push({ domain: conf.domain, status: 'FAILED', error: e.message });
        } finally {
           await page.close();
        }
    }
    
    await browser.close();
    
    const outpath = `results_${Date.now()}.json`;
    fs.writeFileSync(outpath, JSON.stringify(results, null, 2));
    console.log(`\n✅ Sequence Complete. Results persisted to: ${outpath}`);
})();
