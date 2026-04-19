const fs = require('fs');
const path = require('path');

const datasetPath = path.resolve(__dirname, 'platform_dataset.json');
let dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

const fixes = [
  {
    "domain": "pad.itiv.kit.edu",
    "signup_url": "https://pad.itiv.kit.edu/",
    "profile_edit_url": "https://pad.itiv.kit.edu/user/settings",
    "profile_pattern": "https://pad.itiv.kit.edu/user/{username}",
    "pre_fill_actions": ["button:has-text('Sign up')", "a:has-text('Register')", "[data-testid*='signup']"],
    "bio_selector": "textarea[name*='about'], textarea#about, .about-textarea, textarea[placeholder*='bio']",
    "website_selector": "input[name*='url'], input#url, input[name*='website']",
    "save_button": "button:has-text('Save'), button[type='submit'], .btn-primary"
  },
  {
    "domain": "edu.lu.lv",
    "signup_url": "https://edu.lu.lv/",
    "profile_edit_url": "https://edu.lu.lv/user/edit",
    "profile_pattern": "https://edu.lu.lv/user/{username}",
    "pre_fill_actions": ["button:has-text('Sign up')", "a:has-text('Register')", ".login a"],
    "bio_selector": "#field-about, textarea[name*='about'], .user-about",
    "website_selector": "input[name*='url'], input#url, input[name*='website']",
    "save_button": "button:has-text('Save'), input[type='submit']"
  },
  {
    "domain": "independent.academia.edu",
    "signup_url": "https://independent.academia.edu/",
    "profile_edit_url": "https://independent.academia.edu/settings",
    "profile_pattern": "https://independent.academia.edu/{username}",
    "pre_fill_actions": ["button:has-text('Join for free')", "a:has-text('Sign up')", ".signup-button"],
    "bio_selector": "textarea[name*='bio'], #user_bio, textarea.about",
    "website_selector": "input[name*='website'], input#website, input[type='url']",
    "save_button": "button:has-text('Save changes'), button[type='submit']"
  },
  {
    "domain": "holycrossconvent.edu.na",
    "signup_url": "https://holycrossconvent.edu.na/",
    "profile_edit_url": "https://holycrossconvent.edu.na/account",
    "profile_pattern": "https://holycrossconvent.edu.na/profile/{username}/profile",
    "pre_fill_actions": ["[data-testid='signUp.switchToSignUp']", "button:has-text('Sign up')"],
    "bio_selector": "#bio, textarea, [contenteditable='true']",
    "website_selector": "input[type='url'], input[name*='website']",
    "save_button": "button:has-text('Save'), button[type='submit']"
  },
  {
    "domain": "dados.unifei.edu.br",
    "signup_url": "https://dados.unifei.edu.br/user/register",
    "profile_edit_url": "https://dados.unifei.edu.br/user/edit",
    "profile_pattern": "https://dados.unifei.edu.br/user/{username}",
    "bio_selector": "#field-about, textarea[name*='about']",
    "website_selector": "input[name*='url'], input#url",
    "save_button": "button[type='submit'][name='save']"
  },
  {
    "domain": "opendata.ternopilcity.gov.ua",
    "signup_url": "https://opendata.ternopilcity.gov.ua/user/register",
    "profile_edit_url": "https://opendata.ternopilcity.gov.ua/user/edit",
    "profile_pattern": "https://opendata.ternopilcity.gov.ua/user/{username}",
    "bio_selector": "#field-about, textarea[name*='about']",
    "website_selector": "input[name*='url'], input#url",
    "save_button": "button[type='submit'][name='save']"
  },
  {
    "domain": "csdlcntmgialai.gov.vn",
    "signup_url": "http://csdlcntmgialai.gov.vn/user/register",
    "profile_edit_url": "https://csdlcntmgialai.gov.vn/user/edit",
    "profile_pattern": "https://csdlcntmgialai.gov.vn/user/{username}",
    "bio_selector": "#field-about, textarea[name*='about']",
    "website_selector": "input[name*='url'], input#url",
    "save_button": "button[type='submit'][name='save']"
  },
  {
    "domain": "dados.justica.gov.pt",
    "signup_url": "https://dados.justica.gov.pt/user/register",
    "profile_edit_url": "https://dados.justica.gov.pt/user/edit",
    "profile_pattern": "https://dados.justica.gov.pt/user/{username}",
    "bio_selector": "#field-about, textarea[name*='about']",
    "website_selector": "input[name*='url'], input#url",
    "save_button": "button[type='submit'][name='save']"
  },
  {
    "domain": "data.lutskrada.gov.ua",
    "signup_url": "https://data.lutskrada.gov.ua/user/register",
    "profile_edit_url": "https://data.lutskrada.gov.ua/user/edit",
    "profile_pattern": "https://data.lutskrada.gov.ua/user/{username}",
    "bio_selector": "#field-about, textarea[name*='about']",
    "website_selector": "input[name*='url'], input#url",
    "save_button": "button[type='submit'][name='save']"
  },
  {
    "domain": "dados.ifac.edu.br",
    "signup_url": "https://dados.ifac.edu.br/user/register",
    "profile_edit_url": "https://dados.ifac.edu.br/user/edit",
    "profile_pattern": "https://dados.ifac.edu.br/user/{username}",
    "bio_selector": "#field-about, textarea[name*='about']",
    "website_selector": "input[name*='url'], input#url",
    "save_button": "button[type='submit'][name='save']"
  },
  {
    "domain": "opendata.klaten.go.id",
    "signup_url": "https://opendata.klaten.go.id/user/register",
    "profile_edit_url": "https://opendata.klaten.go.id/user/edit",
    "profile_pattern": "https://opendata.klaten.go.id/user/{username}",
    "bio_selector": "#field-about, textarea[name*='about']",
    "website_selector": "input[name*='url'], input#url",
    "save_button": "button[type='submit'][name='save']"
  },
  {
    "domain": "data.dniprorada.gov.ua",
    "signup_url": "https://data.dniprorada.gov.ua/user/register",
    "profile_edit_url": "https://data.dniprorada.gov.ua/user/edit",
    "profile_pattern": "https://data.dniprorada.gov.ua/user/{username}",
    "bio_selector": "#field-about, textarea[name*='about']",
    "website_selector": "input[name*='url'], input#url",
    "save_button": "button[type='submit'][name='save']"
  },
  {
    "domain": "data.aurora.linkeddata.es",
    "signup_url": "https://data.aurora.linkeddata.es/user/register",
    "profile_edit_url": "https://data.aurora.linkeddata.es/user/edit",
    "profile_pattern": "https://data.aurora.linkeddata.es/user/{username}",
    "bio_selector": "#field-about, textarea[name*='about']",
    "website_selector": "input[name*='url'], input#url",
    "save_button": "button[type='submit'][name='save']"
  },
  {
    "domain": "datos.estadisticas.pr",
    "signup_url": "https://datos.estadisticas.pr/user/register",
    "profile_edit_url": "https://datos.estadisticas.pr/user/edit",
    "profile_pattern": "https://datos.estadisticas.pr/user/{username}",
    "bio_selector": "#field-about, textarea[name*='about']",
    "website_selector": "input[name*='url'], input#url",
    "save_button": "button[type='submit'][name='save']"
  },
  {
    "domain": "homologa.cge.mg.gov.br",
    "signup_url": "https://homologa.cge.mg.gov.br/user/register",
    "profile_edit_url": "https://homologa.cge.mg.gov.br/user/edit",
    "profile_pattern": "https://homologa.cge.mg.gov.br/user/{username}",
    "bio_selector": "#field-about, textarea[name*='about']",
    "website_selector": "input[name*='url'], input#url",
    "save_button": "button[type='submit'][name='save']"
  },
  {
    "domain": "rciims.mona.uwi.edu",
    "signup_url": "https://rciims.mona.uwi.edu/user/register",
    "profile_edit_url": "https://rciims.mona.uwi.edu/user/edit",
    "profile_pattern": "https://rciims.mona.uwi.edu/user/{username}",
    "bio_selector": "#field-about, textarea[name*='about']",
    "website_selector": "input[name*='url'], input#url",
    "save_button": "button[type='submit'][name='save']"
  },
  {
    "domain": "data-catalogue.operandum-project.eu",
    "signup_url": "https://data-catalogue.operandum-project.eu/user/register",
    "profile_edit_url": "https://data-catalogue.operandum-project.eu/user/edit",
    "profile_pattern": "https://data-catalogue.operandum-project.eu/user/{username}",
    "bio_selector": "#field-about, textarea[name*='about']",
    "website_selector": "input[name*='url'], input#url",
    "save_button": "button[type='submit'][name='save']"
  },
  {
    "domain": "learndash.aula.edu.pe",
    "signup_url": "https://learndash.aula.edu.pe/student-registration/",
    "profile_edit_url": "https://learndash.aula.edu.pe/dashboard/settings/",
    "profile_pattern": "https://learndash.aula.edu.pe/miembros/{username}/",
    "bio_selector": "textarea, [contenteditable='true']",
    "website_selector": "input[type='url'], input[name*='url'], input[name*='website']",
    "save_button": "button:has-text('Save'), button[type='submit']"
  }
];

let addedCount = 0;
let updatedCount = 0;

fixes.forEach(fix => {
  const existingIndex = dataset.findIndex(entry => entry.domain === fix.domain);
  if (existingIndex !== -1) {
    // Overwrite existing entry
    delete dataset[existingIndex].register_url;
    dataset[existingIndex] = { ...dataset[existingIndex], ...fix };
    updatedCount++;
  } else {
    // Add new entry
    dataset.push(fix);
    addedCount++;
    console.log(`Added missing modal domain: ${fix.domain}`);
  }
});

// Final duplication purge using Map 
const uniqueMap = new Map();
dataset.forEach(item => uniqueMap.set(item.domain, item));
const finalDataset = Array.from(uniqueMap.values());

if (dataset.length !== finalDataset.length) {
    console.log(`Removed ${dataset.length - finalDataset.length} duplicate entries during purge.`);
}

fs.writeFileSync(datasetPath, JSON.stringify(finalDataset, null, 2), 'utf8');
console.log(`Successfully patched! Added ${addedCount}, updated ${updatedCount}. Total unique domains: ${finalDataset.length}`);
