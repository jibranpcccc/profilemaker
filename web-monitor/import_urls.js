const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const os = require('os');

const rawUrls = `
https://www.haphong.edu.vn/profile/vanavob43247741/profile
https://www.nazaret.edu.ec/profile/vanavob43254639/profile
https://www.rosewood.edu.na/profile/vanavob43261719/profile
https://www.ictae.edu.mx/profile/vanavob43255272/profile
https://www.news.lafontana.edu.co/profile/vanavob43219559/profile
https://www.divinagracia.edu.ec/profile/vanavob43234838/profile
https://www.democracy-edu.or.kr/profile/vanavob4328761/profile
https://www.discoveryschool.edu.hn/members-area/vanavob43242209/profile?disableScrollToTop=true
https://www.altamira.edu.ec/profile/vanavob43298940/profile
https://www.aac.edu.sg/profile/vanavob43297216/profile
https://www.dlsjbc.edu.ph/profile/vanavob43277298/profile
https://www.csg.umich.edu/profile/vanavob43294318/profile
https://www.pepper-edu.com/profile/vanavob43280517/profile
https://www.britishschool.edu.mn/profile/vanavob4324365/profile
https://ih.hs.yzu.edu.tw/members-area/vanavob43261858/profile?disableScrollToTop=true
https://www.tarauaca.ac.gov.br/profile/vanavob43236017/profile
https://www.cbc.edu/profile/vanavob43285741/profile
https://www.capandgown.stanford.edu/profile/vanavob43257194/profile
https://www.wendover-pc.gov.uk/members-area/vanavob43232794/profile?disableScrollToTop=true
https://www.centrotecnologico.edu.mx/profile/vanavob43228190/profile
https://www.ceacuautla.edu.mx/profile/vanavob43246701/profile
https://www.orkhonschool.edu.mn/profile/vanavob43278107/profile
https://www.woorips.vic.edu.au/profile/vanavob43275667/profile
https://www.chili.edu.pl/profile/vanavob43263418/profile
https://www.cimurc.ba.gov.br/profile/vanavob43227634/profile
https://www.colorpositive.org/profile/vanavob43217504/profile
https://www.activethinkers.edu.ph/profile/vanavob43296068/profile
https://www.lanubedocente.21.edu.ar/profile/vanavob432277/profile
https://www.workingtontowncouncil.gov.uk/profile/vanavob43274873/profile
https://www.liceomontessoripalmira.edu.co/profile/vanavob4324305/profile
https://www.creswicknorthps.vic.edu.au/profile/vanavob43268613/profile
https://www.cruzrojaslp.edu.mx/profile/vanavob43297779/profile
https://www.bethrivkah.edu/profile/vanavob43219264/profile
https://www.lasallesancristobal.edu.mx/profile/vanavob43296384/profile
https://www.chrt.co.uk/profile/vanavob4322880/profile
https://www.ati.edu.my/profile/vanavob43217666/profile
https://www.edu-tribes.com/members-area/vanavob4325352/profile?disableScrollToTop=true
https://www.healthlinkdental.org/profile/vanavob43280211/profile
https://www.cu.edu.lr/profile/vanavob43291614/profile
https://www.eduamenity.com/profile/vanavob43231415/profile
https://www.sjspringvale.catholic.edu.au/profile/vanavob43222514/profile
https://www.veteranscup.org/profile/vanavob43283807/profile
https://www.qualitysheetmetalincorporated.org/profile/vanavob43234258/profile
https://www.hea.edu.au/profile/vanavob43278478/profile
https://www.lasallesancristobal.edu.mx/profile/vanavob43296384/profile
https://www.wendover-pc.gov.uk/members-area/vanavob43232794/profile?disableScrollToTop=true
https://pad.itiv.kit.edu/s/NP_ePySdX
https://edu.lu.lv/tag/index.php?tc=1&tag=alexistogel
https://independent.academia.edu/ALEXISTOGEL226
https://holycrossconvent.edu.na/profile/vanavob43242034/profile
https://dados.unifei.edu.br/user/alexistogel?__no_cache__=True
https://opendata.ternopilcity.gov.ua/user/alexistogels?__no_cache__=True
http://csdlcntmgialai.gov.vn/user/alexi-stogels?__no_cache__=True
https://dados.justica.gov.pt/user/alexistogel?__no_cache__=True
https://data.lutskrada.gov.ua/user/alexistogels?__no_cache__=True
https://dados.ifac.edu.br/cs_CZ/user/alexistogel?__no_cache__=True
https://opendata.klaten.go.id/user/alexistogel?__no_cache__=True
https://data.dniprorada.gov.ua/user/alexistogel?__no_cache__=True
https://data.aurora.linkeddata.es/id/user/alexistogel?__no_cache__=True
https://datos.estadisticas.pr/user/alexistogels?__no_cache__=True
https://homologa.cge.mg.gov.br/user/alexi-stogels
https://rciims.mona.uwi.edu/user/alexistogel?__no_cache__=True
https://data-catalogue.operandum-project.eu/user/alexistogel?__no_cache__=True
https://learndash.aula.edu.pe/miembros/alexi-stogels/activity/202989/
https://ensp.edu.mx/members/alexistogel/
https://lms.gkce.edu.in/profile/alexi-stogels/
https://academia.sanpablo.edu.ec/profile/alexi-stogels/
https://mooc.esil.edu.kz/profile/alexi-stogels/
https://esapa.edu.ar/profile/alexi-stogels/
https://ncon.edu.sa/profile/alexi-stogels/
https://pibelearning.gov.bd/profile/alexi-stogels/
https://portal.stem.edu.gr/profile/alexi-stogels/
https://edu.openu.in/profile/alexi-stogels/
https://edu.learningsuite.id/profile/alexi-stogels/
https://hoc.salomon.edu.vn/profile/alexi-stogels/
https://iviet.edu.vn/profile/alexi-stogels/
https://institutocrecer.edu.co/profile/alexi-stogels/
https://ontrip.80gigs.com/profile/alexi-stogels/
https://umkmcerdaspajak.id/profile/alexi-stogels/
https://academy.edutic.id/profile/alexi-stogels/
`;

async function processDomains() {
  const dbPath = path.join(process.env.LOCALAPPDATA, 'ProfileSubmissionAssistant', 'data.db');
  const db = new sqlite3.Database(dbPath);

  const datasetPath = path.join(__dirname, 'platform_dataset.json');
  let dataset = [];
  if (fs.existsSync(datasetPath)) {
    dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
  }

  // Parse strings to domains and types
  const lines = rawUrls.split('\n').filter(l => l.trim().length > 0);
  
  const parsedInputs = lines.map(line => {
    let urlStr = line.trim();
    if (!urlStr.startsWith('http')) urlStr = 'https://' + urlStr;
    try {
      const u = new URL(urlStr);
      let domain = u.hostname.replace('www.', '');
      
      let platform = 'Unknown';
      let signupUrl = '';
      let profileEditUrl = '';
      let profilePattern = '';
      
      // Auto-detect based on path string
      if (urlStr.includes('/profile/') && urlStr.includes('/profile/v')) {
         platform = 'Wix';
      } else if (urlStr.includes('/members-area/')) {
         platform = 'Wix';
      } else if (urlStr.includes('/user/')) {
         platform = 'CKAN';
         signupUrl = `https://${domain}/user/register`;
         profileEditUrl = `https://${domain}/user/edit`;
         profilePattern = `https://${domain}/user/{username}`;
      } else if (urlStr.includes('/members/alexistogel')) {
         platform = 'XenForo';
         signupUrl = `https://${domain}/register/`;
         profileEditUrl = `https://${domain}/account/personal-details`;
      } else if (urlStr.includes('learndash') || urlStr.includes('/profile/') || urlStr.includes('lms.')) {
         platform = 'TutorLMS / WP';
         signupUrl = `https://${domain}/student-registration/`;
         profileEditUrl = `https://${domain}/dashboard/settings/`;
         profilePattern = `https://${domain}/profile/{username}/`;
      }
      
      // Overrides for domains
      if (domain === 'pad.itiv.kit.edu') platform = 'HedgeDoc';
      if (domain === 'edu.lu.lv') platform = 'MediaWiki';
      if (domain === 'independent.academia.edu') platform = 'Academia';
      if (domain === 'csdlcntmgialai.gov.vn') signupUrl = `http://${domain}/user/register`;
      
      return { domain, fullUrl: urlStr, platform, signupUrl, profileEditUrl, profilePattern };
    } catch {
      return null;
    }
  }).filter(p => p !== null);

  console.log(`Parsed ${parsedInputs.length} potential lines.`);

  // 1. Get existing DB Sites
  const existingRows = await new Promise((res) => {
    db.all('SELECT DomainUrl, SiteName FROM Sites', [], (err, rows) => res(rows || []));
  });
  const existingDbDomains = new Set(existingRows.map(r => (r.SiteName || r.DomainUrl || '').replace('www.', '').toLowerCase()));
  const existingDatasetDomains = new Set(dataset.map(d => d.domain.toLowerCase()));

  const newValidSites = [];
  const duplicates = [];

  for (const it of parsedInputs) {
    if (existingDbDomains.has(it.domain.toLowerCase()) || 
        existingDatasetDomains.has(it.domain.toLowerCase())) {
        if (!duplicates.includes(it.domain)) duplicates.push(it.domain);
    } else {
        // Unique domain found!
        if (!newValidSites.find(s => s.domain === it.domain)) {
            newValidSites.push(it);
        }
    }
  }

  console.log(`\nFound ${duplicates.length} DUPLICATES (Already in Dataset/DB):`);
  console.log(duplicates.join(', '));

  console.log(`\nFound ${newValidSites.length} NEW DOMAINS ready to insert:`);
  newValidSites.forEach(s => console.log(`- ${s.domain} (${s.platform})`));

  // Write new valid sites to dataset.json
  const wixDefaults = {
    bio_selector: 'textarea, [contenteditable="true"]',
    website_selector: 'input[type="url"], input[name*="url"], input[name*="website"]',
    save_button: 'button:has-text("Save"), button:has-text("Update"), .save-button'
  };

  newValidSites.forEach(s => {
    const newEntry = {
      domain: s.domain,
      signup_url: s.signupUrl || `https://${s.domain}/register`,
      profile_edit_url: s.profileEditUrl || `https://${s.domain}/account`,
      profile_pattern: s.profilePattern || `https://${s.domain}/profile/{username}`,
      ...wixDefaults
    };
    if (s.platform === 'CKAN') {
       newEntry.bio_selector = '#field-about';
       newEntry.save_button = 'button[type="submit"][name="save"]';
    }
    dataset.push(newEntry);
  });

  fs.writeFileSync(datasetPath, JSON.stringify(dataset, null, 2), 'utf8');
  console.log(`\nSaved ${newValidSites.length} domains to platform_dataset.json`);

  // Insert into SQLite Tasks DB
  if (newValidSites.length > 0) {
      db.serialize(() => {
         const stmt = db.prepare(`INSERT INTO Sites (ProjectId, SiteName, Homepage, RegistrationFlowType, VerificationType, IsActive, CreatedAt) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`);
         newValidSites.forEach(s => {
             stmt.run(1, s.domain, `https://${s.domain}`, s.platform, 'email', 1);
         });
         stmt.finalize();
         console.log('Inserted into database Sites table. They are now actively pending for queue!');
      });
  }
}

processDomains().catch(console.error);
