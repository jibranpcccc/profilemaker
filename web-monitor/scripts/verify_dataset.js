const { chromium } = require('playwright');
const fs = require('fs');

async function run() {
  const data = JSON.parse(fs.readFileSync('../platform_dataset.json', 'utf8'));
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    console.log(`\nTesting [${i+1}/${data.length}] ${d.domain}...`);
    const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/134.0.0.0 Safari/537.36' });
    const page = await context.newPage();
    let status = { domain: d.domain, success: true, missing: [] };

    try {
      await page.goto(d.register_url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(4000);

      if (d.pre_fill_actions) {
        for (const action of d.pre_fill_actions) {
          const actionSelectors = action.split(',').map(s => s.trim());
          let clicked = false;
          for (const s of actionSelectors) {
            try { await page.click(s, { timeout: 3000 }); clicked = true; break; } catch(e) {}
          }
          if (clicked) await page.waitForTimeout(2000);
        }
      }

      for (const [key, selectorRaw] of Object.entries(d.fields)) {
        const selectors = selectorRaw.split(',').map(s => s.trim());
        let found = false;
        for (const s of selectors) {
          try {
            const count = await page.evaluate((sel) => document.querySelectorAll(sel).length, s);
            if (count > 0) { found = true; break; }
          } catch(e) {}
        }
        if (!found) {
          status.success = false;
          status.missing.push(`${key}: ${selectorRaw}`);
        }
      }
    } catch (err) {
      status.success = false;
      status.missing.push(`PAGE_LOAD_ERROR: ${err.message}`);
    }

    results.push(status);
    console.log(`Result: ${status.success ? 'OK' : 'FAILED (' + status.missing.length + ' missing)'}`);
    if (!status.success) console.log(`  Missing: ${status.missing.join(' | ')}`);
    await context.close();
  }

  await browser.close();
  fs.writeFileSync('verification_results.json', JSON.stringify(results, null, 2));
  console.log('\nDone. Results saved to verification_results.json');
}

run().catch(console.error);
