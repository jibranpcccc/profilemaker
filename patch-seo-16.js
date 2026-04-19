const fs = require('fs');
const path = require('path');

const datasetPath = path.resolve(__dirname, 'platform_dataset.json');
let dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

const fixes = [
  {
    "domain": "ensp.edu.mx",
    "signup_url": "https://ensp.edu.mx/register",
    "profile_edit_url": "https://ensp.edu.mx/members/{username}/profile/edit/",
    "profile_pattern": "https://ensp.edu.mx/members/{username}/",
    "bio_selector": "textarea[name*='description'], #description, textarea#description, .wp-editor-area",
    "website_selector": "input[name*='url'], input#url, input[name*='website']",
    "save_button": "input[type='submit'], button[type='submit'], .submit, button.primary"
  },
  {
    "domain": "lms.gkce.edu.in",
    "signup_url": "https://lms.gkce.edu.in/student-registration/",
    "profile_edit_url": "https://lms.gkce.edu.in/dashboard/settings/",
    "profile_pattern": "https://lms.gkce.edu.in/profile/{username}/",
    "bio_selector": "textarea, [contenteditable='true'], #ld-profile-bio",
    "website_selector": "input[type='url'], input[name*='url'], input[name*='website']",
    "save_button": "button:has-text('Save'), button[type='submit'], .ld-button"
  },
  {
    "domain": "academia.sanpablo.edu.ec",
    "signup_url": "https://academia.sanpablo.edu.ec/student-registration/",
    "profile_edit_url": "https://academia.sanpablo.edu.ec/dashboard/settings/",
    "profile_pattern": "https://academia.sanpablo.edu.ec/profile/{username}/",
    "bio_selector": "textarea, [contenteditable='true']",
    "website_selector": "input[type='url'], input[name*='url'], input[name*='website']",
    "save_button": "button:has-text('Save'), button[type='submit']"
  },
  {
    "domain": "mooc.esil.edu.kz",
    "signup_url": "https://mooc.esil.edu.kz/student-registration/",
    "profile_edit_url": "https://mooc.esil.edu.kz/dashboard/settings/",
    "profile_pattern": "https://mooc.esil.edu.kz/profile/{username}/",
    "bio_selector": "textarea, [contenteditable='true']",
    "website_selector": "input[type='url'], input[name*='url'], input[name*='website']",
    "save_button": "button:has-text('Save'), button[type='submit']"
  },
  {
    "domain": "esapa.edu.ar",
    "signup_url": "https://esapa.edu.ar/student-registration/",
    "profile_edit_url": "https://esapa.edu.ar/dashboard/settings/",
    "profile_pattern": "https://esapa.edu.ar/profile/{username}/",
    "bio_selector": "textarea, [contenteditable='true']",
    "website_selector": "input[type='url'], input[name*='url'], input[name*='website']",
    "save_button": "button:has-text('Save'), button[type='submit']"
  },
  {
    "domain": "ncon.edu.sa",
    "signup_url": "https://ncon.edu.sa/student-registration/",
    "profile_edit_url": "https://ncon.edu.sa/dashboard/settings/",
    "profile_pattern": "https://ncon.edu.sa/profile/{username}/",
    "bio_selector": "textarea, [contenteditable='true']",
    "website_selector": "input[type='url'], input[name*='url'], input[name*='website']",
    "save_button": "button:has-text('Save'), button[type='submit']"
  },
  {
    "domain": "pibelearning.gov.bd",
    "signup_url": "https://pibelearning.gov.bd/register",
    "profile_edit_url": "https://pibelearning.gov.bd/profile/edit/",
    "profile_pattern": "https://pibelearning.gov.bd/profile/{username}",
    "bio_selector": "textarea[name*='bio'], textarea#bio, #user_description",
    "website_selector": "input[name*='url'], input#url, input[name*='website']",
    "save_button": "input[type='submit'], button[type='submit'], .btn-primary"
  },
  {
    "domain": "portal.stem.edu.gr",
    "signup_url": "https://portal.stem.edu.gr/student-registration/",
    "profile_edit_url": "https://portal.stem.edu.gr/dashboard/settings/",
    "profile_pattern": "https://portal.stem.edu.gr/profile/{username}/",
    "bio_selector": "textarea, [contenteditable='true']",
    "website_selector": "input[type='url'], input[name*='url'], input[name*='website']",
    "save_button": "button:has-text('Save'), button[type='submit']"
  },
  {
    "domain": "edu.openu.in",
    "signup_url": "https://edu.openu.in/student-registration/",
    "profile_edit_url": "https://edu.openu.in/dashboard/settings/",
    "profile_pattern": "https://edu.openu.in/profile/{username}/",
    "bio_selector": "textarea, [contenteditable='true']",
    "website_selector": "input[type='url'], input[name*='url'], input[name*='website']",
    "save_button": "button:has-text('Save'), button[type='submit']"
  },
  {
    "domain": "edu.learningsuite.id",
    "signup_url": "https://edu.learningsuite.id/student-registration/",
    "profile_edit_url": "https://edu.learningsuite.id/dashboard/settings/",
    "profile_pattern": "https://edu.learningsuite.id/profile/{username}/",
    "bio_selector": "textarea, [contenteditable='true']",
    "website_selector": "input[type='url'], input[name*='url'], input[name*='website']",
    "save_button": "button:has-text('Save'), button[type='submit']"
  },
  {
    "domain": "hoc.salomon.edu.vn",
    "signup_url": "https://hoc.salomon.edu.vn/student-registration/",
    "profile_edit_url": "https://hoc.salomon.edu.vn/dashboard/settings/",
    "profile_pattern": "https://hoc.salomon.edu.vn/profile/{username}/",
    "bio_selector": "textarea, [contenteditable='true']",
    "website_selector": "input[type='url'], input[name*='url'], input[name*='website']",
    "save_button": "button:has-text('Save'), button[type='submit']"
  },
  {
    "domain": "iviet.edu.vn",
    "signup_url": "https://iviet.edu.vn/student-registration/",
    "profile_edit_url": "https://iviet.edu.vn/dashboard/settings/",
    "profile_pattern": "https://iviet.edu.vn/profile/{username}/",
    "bio_selector": "textarea, [contenteditable='true']",
    "website_selector": "input[type='url'], input[name*='url'], input[name*='website']",
    "save_button": "button:has-text('Save'), button[type='submit']"
  },
  {
    "domain": "institutocrecer.edu.co",
    "signup_url": "https://institutocrecer.edu.co/register",
    "profile_edit_url": "https://institutocrecer.edu.co/account",
    "profile_pattern": "https://institutocrecer.edu.co/profile/{username}",
    "bio_selector": "textarea, [contenteditable='true']",
    "website_selector": "input[type='url'], input[name*='url'], input[name*='website']",
    "save_button": "button:has-text('Save'), button[type='submit']"
  },
  {
    "domain": "ontrip.80gigs.com",
    "signup_url": "https://ontrip.80gigs.com/student-registration/",
    "profile_edit_url": "https://ontrip.80gigs.com/dashboard/settings/",
    "profile_pattern": "https://ontrip.80gigs.com/profile/{username}/",
    "bio_selector": "textarea, [contenteditable='true']",
    "website_selector": "input[type='url'], input[name*='url'], input[name*='website']",
    "save_button": "button:has-text('Save'), button[type='submit']"
  },
  {
    "domain": "umkmcerdaspajak.id",
    "signup_url": "https://umkmcerdaspajak.id/student-registration/",
    "profile_edit_url": "https://umkmcerdaspajak.id/dashboard/settings/",
    "profile_pattern": "https://umkmcerdaspajak.id/profile/{username}/",
    "bio_selector": "textarea, [contenteditable='true']",
    "website_selector": "input[type='url'], input[name*='url'], input[name*='website']",
    "save_button": "button:has-text('Save'), button[type='submit']"
  },
  {
    "domain": "academy.edutic.id",
    "signup_url": "https://academy.edutic.id/student-registration/",
    "profile_edit_url": "https://academy.edutic.id/dashboard/settings/",
    "profile_pattern": "https://academy.edutic.id/profile/{username}/",
    "bio_selector": "textarea, [contenteditable='true']",
    "website_selector": "input[type='url'], input[name*='url'], input[name*='website']",
    "save_button": "button:has-text('Save'), button[type='submit']"
  }
];

let updatedCount = 0;
let missedDomains = [];

fixes.forEach(fix => {
  const datasetEntry = dataset.find(entry => entry.domain === fix.domain);
  if (datasetEntry) {
    Object.assign(datasetEntry, fix);
    // Remove old properties if they exist
    delete datasetEntry.register_url;
    updatedCount++;
  } else {
    // If not found, add it
    dataset.push(fix);
    updatedCount++;
    console.log(`Added missing domain: ${fix.domain}`);
  }
});

fs.writeFileSync(datasetPath, JSON.stringify(dataset, null, 2), 'utf8');
console.log(`Successfully patched ${updatedCount} high-value SEO domains in platform_dataset.json`);
