const { chromium } = require('playwright');

const domains = [
  'institutocrecer.edu.co',
  'academia.sanpablo.edu.ec',
  'altamira.edu.ec',
  'divinagracia.edu.ec',
  'nazaret.edu.ec',
  'hoc.salomon.edu.vn',
  'mooc.esil.edu.kz',
  'academy.edutic.id',
  'lms.gkce.edu.in',
  'activethinkers.edu.ph',
  'dlsjbc.edu.ph'
];

(async () => {
   console.log("=== BATCH CHECKING 11 BLOCKED DOMAINS FOR TUTOR LMS FORMS ===");
   const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
   const context = await browser.newContext();
   
   for (const d of domains) {
       const p = await context.newPage();
       try {
          const resp = await p.goto(`https://${d}/student-registration/`, { timeout: 20000, waitUntil: 'domcontentloaded' });
          const status = resp ? resp.status() : 'Unknown';
          const formCount = await p.locator('form').count();
          const userLoginCount = await p.locator('input[name="user_login"], input[name="username"]').count();
          const emailCount = await p.locator('input[name="email"], input[type="email"]').count();
          
          if (formCount > 0 && (userLoginCount > 0 || emailCount > 0)) {
              console.log(`✅ [CONFIRMED] ${d} => Status: ${status} | Found valid Tutor LMS form!`);
          } else {
              console.log(`❌ [REJECTED] ${d} => Status: ${status} | Page loaded but no registration form found.`);
          }
       } catch(e) {
          console.log(`⚠️  [ERROR] ${d} => Connection failed: ${e.message.split('\n')[0]}`);
       } finally {
          await p.close();
       }
   }
   await browser.close();
})();
