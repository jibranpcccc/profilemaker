/**
 * find_tutorlms_sites.js  v2 — Seed-list prober (no search engine)
 * Directly probes /student-registration/ on hundreds of known edu domains
 * then confirms Tutor LMS form presence via DOM inspection
 */

const { chromium } = require('playwright');
const fs = require('fs');

// Seed list: universities & institutes known to use WordPress LMS in these regions
// Format: bare hostname (no https//)
const SEED_DOMAINS = [
  // Bangladesh .edu.bd
  'lms.aust.edu.bd','lms.bracu.ac.bd','online.aiub.edu.bd',
  'lms.iub.edu.bd','learn.nstu.edu.bd','elearn.sust.edu',
  'lms.pust.ac.bd','lms.hstu.ac.bd','lms.just.edu.bd',
  'courses.daffodilvarsity.edu.bd','lms.brac.net',

  // Indonesia .ac.id
  'elearning.unhas.ac.id','lms.umy.ac.id','lms.uii.ac.id',
  'elearning.uai.ac.id','lms.ub.ac.id','kuliah.uad.ac.id',
  'elearning.amikom.ac.id','lms.stikesmus.ac.id','lms.stmikpontianak.ac.id',
  'lms.ubharajaya.ac.id','elearn.upnvj.ac.id','learn.itb.ac.id',
  'lms.ukm.ac.id','lms.unesa.ac.id','elearning.unud.ac.id',

  // Nepal .edu.np
  'lms.ku.edu.np','elearning.tu.edu.np','online.pokhara.edu.np',
  'lms.islingt.edu.np','courses.softwarica.edu.np',
  'learn.cmc.edu.np','lms.ncit.edu.np','lms.apex.edu.np',
  'elearn.kist.edu.np','lms.kathford.edu.np',

  // Pakistan .edu.pk
  'lms.uol.edu.pk','learn.vu.edu.pk','lms.iqra.edu.pk',
  'lms.ucp.edu.pk','elearn.bzu.edu.pk','lms.aiou.edu.pk',
  'courses.ciit.net.pk','lms.ssuet.edu.pk','lms.hamdard.edu.pk',
  'elearning.nust.edu.pk','lms.comsats.edu.pk','lms.umt.edu.pk',

  // Nigeria .edu.ng
  'lms.unilag.edu.ng','elearn.unn.edu.ng','learn.unaab.edu.ng',
  'lms.lasu.edu.ng','elearn.eksu.edu.ng','courses.abuad.edu.ng',
  'lms.noun.edu.ng','lms.oau.edu.ng','elearning.uniben.edu.ng',

  // Philippines .edu.ph
  'lms.ust.edu.ph','online.dlsu.edu.ph','elearn.admu.edu.ph',
  'lms.mapua.edu.ph','courses.pup.edu.ph','lms.feu.edu.ph',
  'learn.tip.edu.ph','lms.ue.edu.ph','lms.ceu.edu.ph',
  'elearn.plm.edu.ph','lms.slu.edu.ph',

  // Vietnam .edu.vn
  'lms.hust.edu.vn','elearning.hcmut.edu.vn','lms.ueh.edu.vn',
  'online.vnua.edu.vn','lms.dut.udn.vn','lms.agu.edu.vn',
  'elearn.ctu.edu.vn','lms.bvu.edu.vn',

  // Latin America .edu.co / .edu.pe / .edu.ec / .edu.bo / .edu.py
  'lms.unal.edu.co','virtual.udea.edu.co','lms.unbosque.edu.co',
  'online.ean.edu.co','lms.uniminuto.edu.co','aula.uao.edu.co',
  'virtual.unillanos.edu.co','lms.usco.edu.co',
  'lms.pucp.edu.pe','virtual.unmsm.edu.pe','campus.upn.edu.pe',
  'lms.ucsm.edu.pe','elearning.ucv.edu.pe','aula.upeu.edu.pe',
  'lms.uce.edu.ec','virtual.utpl.edu.ec','lms.ups.edu.ec',
  'elearning.ug.edu.ec','lms.espol.edu.ec',

  // Egypt / Jordan / Africa
  'lms.asu.edu.eg','elearn.fci-cu.edu.eg','online.aun.edu.eg',
  'lms.ju.edu.jo','elearn.hu.edu.jo','lms.zuj.edu.jo',
  'virtual.aast.edu','lms.aiu.edu.gh','elearn.knust.edu.gh',

  // Kazakhstan / Central Asia
  'lms.narxoz.kz','elearn.kaznu.kz','online.alatoo.edu.kg',
  'lms.iuk.edu.kz','elearn.sdu.edu.kz',

  // Additional generic WordPress LMS sites (non-.edu TLD)
  'lms.teacheron.com','elearning.khanacademy.io','courses.simplilearn.com',
];

const BATCH_SIZE = 5; // concurrent checks

async function checkDomain(ctx, domain) {
  const regUrl = `https://${domain}/student-registration/`;
  const page = await ctx.newPage();
  try {
    const resp = await page.goto(regUrl, {
      waitUntil: 'domcontentloaded', timeout: 12000
    });
    const status = resp ? resp.status() : 0;
    if (status === 404 || status === 410) {
      await page.close();
      return { domain, status, verdict: 'NOT_FOUND' };
    }
    const result = await page.evaluate(() => ({
      hasTutorBtn:    !!document.querySelector('[name="tutor_register_student_btn"]'),
      hasTutorNonce:  !!document.querySelector('[name="_tutor_nonce"]'),
      hasPassConf:    !!document.querySelector('[name="password_confirmation"]'),
      hasCaptcha:     !!document.querySelector('.g-recaptcha,[data-sitekey]'),
      hasForm:        !!document.querySelector('form'),
      fieldNames:     Array.from(document.querySelectorAll('input')).map(e=>e.name).filter(Boolean),
      title:          document.title.substring(0,40),
      url:            location.href,
    }));
    await page.close();
    const isTutor = result.hasTutorBtn || result.hasTutorNonce || result.hasPassConf;
    return {
      domain, regUrl, status,
      verdict: isTutor ? (result.hasCaptcha ? 'TUTOR_CAPTCHA' : 'TUTOR_CLEAN') : 'NOT_TUTOR',
      ...result
    };
  } catch (e) {
    await page.close();
    return { domain, verdict: 'DEAD', error: e.message.substring(0, 70) };
  }
}

(async () => {
  console.log(`🔍 TUTOR LMS SEED PROBER v2\n   Testing ${SEED_DOMAINS.length} domains...\n`);
  const browser = await chromium.launch({
    headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36'
  });

  const results = [];
  // Process in batches
  for (let i = 0; i < SEED_DOMAINS.length; i += BATCH_SIZE) {
    const batch = SEED_DOMAINS.slice(i, i + BATCH_SIZE);
    const checks = await Promise.all(batch.map(d => checkDomain(ctx, d)));
    for (const r of checks) {
      if (r.verdict === 'TUTOR_CLEAN') {
        console.log(`✅ CLEAN  : ${r.domain}`);
      } else if (r.verdict === 'TUTOR_CAPTCHA') {
        console.log(`⚠️  CAPTCHA: ${r.domain}`);
      } else if (r.verdict === 'DEAD') {
        console.log(`💀 DEAD   : ${r.domain}`);
      } else {
        console.log(`❌ ${r.verdict.padEnd(9)}: ${r.domain}`);
      }
      results.push(r);
    }
  }

  await browser.close();

  const clean   = results.filter(r => r.verdict === 'TUTOR_CLEAN');
  const captcha = results.filter(r => r.verdict === 'TUTOR_CAPTCHA');

  console.log('\n\n══════════════════════════════════════════════');
  console.log('  RESULTS SUMMARY');
  console.log('══════════════════════════════════════════════');
  console.log(`  ✅ Clean Tutor LMS : ${clean.length}`);
  clean.forEach(s => console.log(`     ${s.regUrl}`));
  console.log(`  ⚠️  Has CAPTCHA     : ${captcha.length}`);
  captcha.forEach(s => console.log(`     ${s.regUrl}`));

  fs.writeFileSync('tutor_lms_found.json', JSON.stringify(
    results.filter(r => r.verdict.startsWith('TUTOR')), null, 2
  ));
  console.log(`\n  Saved → tutor_lms_found.json`);
})();
