const fs = require('fs');
const path = require('path');

const datasetPath = path.resolve(__dirname, '..', 'platform_dataset.json');
let dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

const fixes = [
  {
    "domain": "haphong.edu.vn",
    "signup_url": "https://www.haphong.edu.vn/register",
    "profile_edit_url": "https://www.haphong.edu.vn/account",
    "profile_pattern": "https://www.haphong.edu.vn/profile/{username}",
    "bio_selector": "textarea, [contenteditable=\"true\"], [data-testid*=\"bio\"]",
    "website_selector": "input[type=\"url\"], input[name*=\"url\"], input[name*=\"website\"]",
    "save_button": "button:has-text(\"Save\"), button:has-text(\"Update\"), button[type=\"submit\"]"
  },
  {
    "domain": "holycrossconvent.edu.na",
    "signup_url": "https://holycrossconvent.edu.na/register",
    "profile_edit_url": "https://holycrossconvent.edu.na/account",
    "profile_pattern": "https://holycrossconvent.edu.na/profile/{username}",
    "bio_selector": "textarea, [contenteditable=\"true\"]",
    "website_selector": "input[type=\"url\"], input[name*=\"url\"], input[name*=\"website\"]",
    "save_button": "button:has-text(\"Save\"), button:has-text(\"Update\")"
  },
  {
    "domain": "rosewood.edu.na",
    "signup_url": "https://www.rosewood.edu.na/register",
    "profile_edit_url": "https://www.rosewood.edu.na/account",
    "profile_pattern": "https://www.rosewood.edu.na/profile/{username}",
    "bio_selector": "textarea, [contenteditable=\"true\"]",
    "website_selector": "input[type=\"url\"], input[name*=\"url\"], input[name*=\"website\"]",
    "save_button": "button:has-text(\"Save\"), button:has-text(\"Update\")"
  },
  {
    "domain": "woorips.vic.edu.au",
    "signup_url": "https://www.woorips.vic.edu.au/register",
    "profile_edit_url": "https://www.woorips.vic.edu.au/account",
    "profile_pattern": "https://www.woorips.vic.edu.au/profile/{username}",
    "bio_selector": "textarea, [contenteditable=\"true\"]",
    "website_selector": "input[type=\"url\"], input[name*=\"url\"], input[name*=\"website\"]",
    "save_button": "button:has-text(\"Save\"), button:has-text(\"Update\")"
  },
  {
    "domain": "orkhonschool.edu.mn",
    "signup_url": "https://www.orkhonschool.edu.mn/register",
    "profile_edit_url": "https://www.orkhonschool.edu.mn/account",
    "profile_pattern": "https://www.orkhonschool.edu.mn/profile/{username}",
    "bio_selector": "textarea, [contenteditable=\"true\"]",
    "website_selector": "input[type=\"url\"], input[name*=\"url\"], input[name*=\"website\"]",
    "save_button": "button:has-text(\"Save\"), button:has-text(\"Update\")"
  },
  {
    "domain": "lasallesancristobal.edu.mx",
    "signup_url": "https://www.lasallesancristobal.edu.mx/register",
    "profile_edit_url": "https://www.lasallesancristobal.edu.mx/account",
    "profile_pattern": "https://www.lasallesancristobal.edu.mx/profile/{username}",
    "bio_selector": "textarea, [contenteditable=\"true\"]",
    "website_selector": "input[type=\"url\"], input[name*=\"url\"], input[name*=\"website\"]",
    "save_button": "button:has-text(\"Save\"), button:has-text(\"Update\")"
  },
  {
    "domain": "lanubedocente.21.edu.ar",
    "signup_url": "https://www.lanubedocente.21.edu.ar/register",
    "profile_edit_url": "https://www.lanubedocente.21.edu.ar/account",
    "profile_pattern": "https://www.lanubedocente.21.edu.ar/profile/{username}",
    "bio_selector": "textarea, [contenteditable=\"true\"]",
    "website_selector": "input[type=\"url\"], input[name*=\"url\"], input[name*=\"website\"]",
    "save_button": "button:has-text(\"Save\"), button:has-text(\"Update\")"
  },
  {
    "domain": "tarauaca.ac.gov.br",
    "signup_url": "https://www.tarauaca.ac.gov.br/register",
    "profile_edit_url": "https://www.tarauaca.ac.gov.br/account",
    "profile_pattern": "https://www.tarauaca.ac.gov.br/profile/{username}",
    "bio_selector": "textarea, [contenteditable=\"true\"]",
    "website_selector": "input[type=\"url\"], input[name*=\"url\"], input[name*=\"website\"]",
    "save_button": "button:has-text(\"Save\"), button:has-text(\"Update\")"
  },
  {
    "domain": "centrotecnologico.edu.mx",
    "signup_url": "https://www.centrotecnologico.edu.mx/register",
    "profile_edit_url": "https://www.centrotecnologico.edu.mx/account",
    "profile_pattern": "https://www.centrotecnologico.edu.mx/profile/{username}",
    "bio_selector": "textarea, [contenteditable=\"true\"]",
    "website_selector": "input[type=\"url\"], input[name*=\"url\"], input[name*=\"website\"]",
    "save_button": "button:has-text(\"Save\"), button:has-text(\"Update\")"
  },
  {
    "domain": "institutocrecer.edu.co",
    "signup_url": "https://institutocrecer.edu.co/register",
    "profile_edit_url": "https://institutocrecer.edu.co/account",
    "profile_pattern": "https://institutocrecer.edu.co/profile/{username}",
    "bio_selector": "textarea, [contenteditable=\"true\"]",
    "website_selector": "input[type=\"url\"], input[name*=\"url\"], input[name*=\"website\"]",
    "save_button": "button:has-text(\"Save\"), button:has-text(\"Update\")"
  },
  {
    "domain": "aiti.edu.vn",
    "signup_url": "https://aiti.edu.vn/register",
    "profile_edit_url": "https://aiti.edu.vn/account",
    "profile_pattern": "https://aiti.edu.vn/profile/{username}",
    "bio_selector": "textarea, [contenteditable=\"true\"]",
    "website_selector": "input[type=\"url\"], input[name*=\"url\"], input[name*=\"website\"]",
    "save_button": "button:has-text(\"Save\"), button:has-text(\"Update\")"
  },
  {
    "domain": "learningsuite.id",
    "signup_url": "https://edu.learningsuite.id/register",
    "profile_edit_url": "https://edu.learningsuite.id/account",
    "profile_pattern": "https://edu.learningsuite.id/profile/{username}",
    "bio_selector": "textarea, [contenteditable=\"true\"]",
    "website_selector": "input[type=\"url\"], input[name*=\"url\"], input[name*=\"website\"]",
    "save_button": "button:has-text(\"Save\"), button:has-text(\"Update\")"
  },
  {
    "domain": "aula.edu.pe",
    "signup_url": "https://learndash.aula.edu.pe/student-registration/",
    "profile_edit_url": "https://learndash.aula.edu.pe/dashboard/settings/",
    "profile_pattern": "https://learndash.aula.edu.pe/profile/{username}/",
    "bio_selector": "textarea, [contenteditable=\"true\"]",
    "website_selector": "input[type=\"url\"], input[name*=\"url\"], input[name*=\"website\"]",
    "save_button": "button:has-text(\"Save\"), button:has-text(\"Update\")"
  },
  {
    "domain": "edutic.id",
    "signup_url": "https://academy.edutic.id/register",
    "profile_edit_url": "https://academy.edutic.id/account",
    "profile_pattern": "https://academy.edutic.id/profile/{username}",
    "bio_selector": "textarea, [contenteditable=\"true\"]",
    "website_selector": "input[type=\"url\"], input[name*=\"url\"], input[name*=\"website\"]",
    "save_button": "button:has-text(\"Save\"), button:has-text(\"Update\")"
  },
  {
    "domain": "lifewest.edu",
    "signup_url": "https://jobs.lifewest.edu/register",
    "profile_edit_url": "https://jobs.lifewest.edu/account",
    "profile_pattern": "https://jobs.lifewest.edu/profile/{username}",
    "bio_selector": "textarea, [contenteditable=\"true\"]",
    "website_selector": "input[type=\"url\"], input[name*=\"url\"], input[name*=\"website\"]",
    "save_button": "button:has-text(\"Save\"), button:has-text(\"Update\")"
  },
  {
    "domain": "bbiny.edu",
    "signup_url": "https://bbiny.edu/register",
    "profile_edit_url": "https://bbiny.edu/account",
    "profile_pattern": "https://bbiny.edu/profile/{username}",
    "bio_selector": "textarea, [contenteditable=\"true\"]",
    "website_selector": "input[type=\"url\"], input[name*=\"url\"], input[name*=\"website\"]",
    "save_button": "button:has-text(\"Save\"), button:has-text(\"Update\")"
  },
  {
    "domain": "pibelearning.gov.bd",
    "signup_url": "http://pibelearning.gov.bd/register",
    "profile_edit_url": "http://pibelearning.gov.bd/account",
    "profile_pattern": "http://pibelearning.gov.bd/profile/{username}",
    "bio_selector": "textarea, [contenteditable=\"true\"]",
    "website_selector": "input[type=\"url\"], input[name*=\"url\"], input[name*=\"website\"]",
    "save_button": "button:has-text(\"Save\"), button:has-text(\"Update\")"
  },
  {
    "domain": "blac.edu.pl",
    "signup_url": "https://blac.edu.pl/register",
    "profile_edit_url": "https://blac.edu.pl/account",
    "profile_pattern": "https://blac.edu.pl/profile/{username}",
    "bio_selector": "textarea, [contenteditable=\"true\"]",
    "website_selector": "input[type=\"url\"], input[name*=\"url\"], input[name*=\"website\"]",
    "save_button": "button:has-text(\"Save\"), button:has-text(\"Update\")"
  },
  {
    "domain": "sanpablo.edu.ec",
    "signup_url": "https://academia.sanpablo.edu.ec/register",
    "profile_edit_url": "https://academia.sanpablo.edu.ec/account",
    "profile_pattern": "https://academia.sanpablo.edu.ec/profile/{username}",
    "bio_selector": "textarea, [contenteditable=\"true\"]",
    "website_selector": "input[type=\"url\"], input[name*=\"url\"], input[name*=\"website\"]",
    "save_button": "button:has-text(\"Save\"), button:has-text(\"Update\")"
  }
];

let updatedCount = 0;

dataset.forEach(entry => {
  const fix = fixes.find(f => f.domain === entry.domain);
  if (fix) {
    if (entry.register_url) {
      delete entry.register_url;
    }
    Object.assign(entry, fix);
    updatedCount++;
  }
});

// Write back to file
fs.writeFileSync(datasetPath, JSON.stringify(dataset, null, 2), 'utf8');

console.log(`Successfully updated ${updatedCount} entries in platform_dataset.json`);

// Now map those domains to their SiteIds from sqlite
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(process.env.LOCALAPPDATA, 'ProfileSubmissionAssistant', 'data.db');
const db = new sqlite3.Database(dbPath);

const domainsToTest = fixes.map(f => f.domain);

db.all('SELECT Id, SiteName, DomainUrl, TargetUrl FROM SiteTasks', [], (err, rows) => {
  if (err) throw err;
  const targets = rows.filter(r => domainsToTest.some(d => (r.DomainUrl || '').includes(d) || (r.TargetUrl || '').includes(d) || (r.SiteName || '').includes(d)));
  const ids = targets.map(t => t.Id);
  console.log('Target SiteTask IDs to reset:', ids);
  
  if (ids.length > 0) {
    db.run(`DELETE FROM Proofs WHERE SiteTaskId IN (${ids.join(',')})`, () => {
      db.run(`UPDATE SiteTasks SET Status='Pending', CurrentStep='', EmailPassword='' WHERE Id IN (${ids.join(',')})`, () => {
        console.log('DB Reset Complete');
        
        // Save the unique SiteIds (not SiteTask Ids) for the API
        const uniqueSiteIds = [...new Set(targets.map(t => t.SiteId))];
        fs.writeFileSync('test_targets_fixed.json', JSON.stringify(uniqueSiteIds));
        console.log('Target Site IDs for API:', uniqueSiteIds);
        db.close();
      });
    });
  } else {
    db.close();
  }
});
