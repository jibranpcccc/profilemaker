const { chromium } = require('playwright');

const urls = [
  'https://hoc.salomon.edu.vn/student-registration/',
  'https://ieltsvietnam.edu.vn/student-registration/',
  'https://onthionline.edu.vn/student-registration/',
  'https://elearning.hutech.edu.vn/student-registration/',
  'https://lms.hcmute.edu.vn/student-registration/',
  'https://online.hocvienhanquoc.edu.vn/student-registration/',
  'https://umkmcerdaspajak.id/student-registration/',
  'https://lms.stiepari.ac.id/student-registration/',
  'https://elearning.unirow.ac.id/student-registration/',
  'https://lms.stikesmus.ac.id/student-registration/',
  'https://elearning.umsida.ac.id/student-registration/',
  'https://lms.universitasbumigora.ac.id/student-registration/',
  'https://elearning.stia-said.ac.id/student-registration/',
  'https://lms.gkce.edu.in/student-registration/',
  'https://lms.nitte.edu.in/student-registration/',
  'https://elearning.sxcce.edu.in/student-registration/',
  'https://lms.aiimsbhopal.edu.in/student-registration/',
  'https://lms.niituniversity.in/student-registration/',
  'https://elearn.cmrcet.ac.in/student-registration/',
  'https://mooc.esil.edu.kz/student-registration/',
  'https://lms.iitu.edu.kz/student-registration/',
  'https://online.narxoz.kz/student-registration/',
  'https://elearning.aiu.edu.kz/student-registration/',
  'https://lms.kaznu.kz/student-registration/',
  'https://academia.sanpablo.edu.ec/student-registration/',
  'https://altamira.edu.ec/student-registration/',
  'https://nazaret.edu.ec/student-registration/',
  'https://divinagracia.edu.ec/student-registration/',
  'https://lms.udla.edu.ec/student-registration/',
  'https://elearning.uta.edu.ec/student-registration/',
  'https://campus.ups.edu.ec/student-registration/',
  'https://ensp.edu.mx/student-registration/',
  'https://ceacuautla.edu.mx/student-registration/',
  'https://ictae.edu.mx/student-registration/',
  'https://cruzrojaslp.edu.mx/student-registration/',
  'https://lms.itsoeh.edu.mx/student-registration/',
  'https://campus.utng.edu.mx/student-registration/',
  'https://ncon.edu.sa/student-registration/',
  'https://lms.ppu.edu/student-registration/',
  'https://elearn.iau.edu.sa/student-registration/',
  'https://activethinkers.edu.ph/student-registration/',
  'https://dlsjbc.edu.ph/student-registration/',
  'https://lms.adnu.edu.ph/student-registration/',
  'https://elearning.slu.edu.ph/student-registration/',
  'https://lms.earist.edu.ph/student-registration/',
  'https://chili.edu.pl/student-registration/',
  'https://lms.wsb.edu.pl/student-registration/',
  'https://elearn.vizja.pl/student-registration/',
  'https://pibelearning.gov.bd/student-registration/',
  'https://lms.daffodilvarsity.edu.bd/student-registration/',
  'https://elearning.bracu.ac.bd/student-registration/',
  'https://esapa.edu.ar/student-registration/',
  'https://lanubedocente.21.edu.ar/student-registration/',
  'https://campus.uces.edu.ar/student-registration/'
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
