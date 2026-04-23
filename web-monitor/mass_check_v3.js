const { chromium } = require('playwright');

const urls = [
  'https://elearning.uniten.edu.my/student-registration/',
  'https://elearn.daffodilvarsity.edu.bd/student-registration/',
  'https://lms.smkn1soreang.sch.id/student-registration/',
  'https://learn.ileaderz.com.ng/student-registration/',
  'https://lms.poltekbandung.ac.id/student-registration/',
  'https://lms.undip.ac.id/student-registration/',
  'https://courses.binus.edu/student-registration/',
  'https://moodle.univ-biskra.dz/student-registration/',
  'https://elearn.cu.edu.eg/student-registration/',
  'https://lms.edu.al/student-registration/'
];

(async () => {
   console.log("=== BATCH CHECKING BULK DOMAINS FOR TUTOR LMS FORMS ===");
   const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
   const context = await browser.newContext({ ignoreHTTPSErrors: true });
   
   // We will execute in batches of 6 to manage memory and network properly
   const batchSize = 6;
   const liveUrls = [];
   
   for (let i = 0; i < urls.length; i += batchSize) {
       const batch = urls.slice(i, i + batchSize);
       await Promise.all(batch.map(async (url) => {
           let page;
           try {
               page = await context.newPage();
               const resp = await page.goto(url, { timeout: 15000, waitUntil: 'domcontentloaded' });
               const status = resp ? resp.status() : 'Unknown';
               
               if (status === 200 || status === 403) {
                   const html = await page.content();
                   const hasForm = html.includes('user_login') || html.includes('tutor') || html.includes('student-registration') || html.includes('first_name');
                   if (hasForm) {
                       console.log(`✅ LIVE: ${url}`);
                       liveUrls.push(url);
                   } else {
                       console.log(`❌ ${status} (No Form): ${url}`);
                   }
               } else {
                   console.log(`❌ ${status}: ${url}`);
               }
           } catch(e) {
               console.log(`💀 DEAD: ${url} -> ${e.message.split('\\n')[0]}`);
           } finally {
               if (page) await page.close();
           }
       }));
   }
   
   await browser.close();
   
   console.log("\\n\\n==========================================");
   console.log("             FINAL LIVE TARGETS");
   console.log("==========================================");
   liveUrls.forEach(v => console.log(v));
})();
