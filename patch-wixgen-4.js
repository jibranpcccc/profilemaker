const fs = require('fs');
const path = require('path');

const datasetPath = path.resolve(__dirname, 'platform_dataset.json');
let dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

const fixes = [
  {
    "domain": "wix_generic",
    "signup_url": "https://www.{domain}/",
    "profile_edit_url": "https://www.{domain}/account",
    "profile_pattern": "https://www.{domain}/profile/{username}/profile",
    "pre_fill_actions": [
      "[data-testid='signUp.switchToSignUp']",
      "button:has-text('Sign up')",
      "button:has-text('Join')",
      "a:has-text('Sign up')",
      "button:has-text('Iniciar sesión')"
    ],
    "bio_selector": "#bio, textarea, [contenteditable='true'], [data-testid*='bio'], .bio-textarea",
    "website_selector": "input[type='url'], input[name*='website'], input[placeholder*='website'], input[name*='url']",
    "save_button": "button:has-text('Save'), button[type='submit'], .save-button, [data-testid*='save']"
  },
  {
    "domain": "discoveryschool.edu.hn",
    "signup_url": "https://www.discoveryschool.edu.hn/student-registration/",
    "profile_edit_url": "https://www.discoveryschool.edu.hn/dashboard/settings/",
    "profile_pattern": "https://www.discoveryschool.edu.hn/members-area/{username}/profile",
    "bio_selector": "textarea, [contenteditable='true']",
    "website_selector": "input[type='url'], input[name*='url'], input[name*='website']",
    "save_button": "button:has-text('Save'), button[type='submit']"
  },
  {
    "domain": "ih.hs.yzu.edu.tw",
    "signup_url": "https://ih.hs.yzu.edu.tw/student-registration/",
    "profile_edit_url": "https://ih.hs.yzu.edu.tw/dashboard/settings/",
    "profile_pattern": "https://ih.hs.yzu.edu.tw/members-area/{username}/profile",
    "bio_selector": "textarea, [contenteditable='true']",
    "website_selector": "input[type='url'], input[name*='url'], input[name*='website']",
    "save_button": "button:has-text('Save'), button[type='submit']"
  },
  {
    "domain": "edu-tribes.com",
    "signup_url": "https://www.edu-tribes.com/student-registration/",
    "profile_edit_url": "https://www.edu-tribes.com/dashboard/settings/",
    "profile_pattern": "https://www.edu-tribes.com/members-area/{username}/profile",
    "bio_selector": "textarea, [contenteditable='true']",
    "website_selector": "input[type='url'], input[name*='url'], input[name*='website']",
    "save_button": "button:has-text('Save'), button[type='submit']"
  },
  {
    "domain": "wendover-pc.gov.uk",
    "signup_url": "https://www.wendover-pc.gov.uk/student-registration/",
    "profile_edit_url": "https://www.wendover-pc.gov.uk/dashboard/settings/",
    "profile_pattern": "https://www.wendover-pc.gov.uk/members-area/{username}/profile",
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
    // Insert new ones exactly at the top? It doesn't strictly matter if it's at the top because we do specific lookups first, but we can unshift generic templates 
    if(fix.domain === 'wix_generic') {
        dataset.unshift(fix);
    } else {
        dataset.push(fix);
    }
    addedCount++;
    console.log(`Added missing domain: ${fix.domain}`);
  }
});

const uniqueMap = new Map();
dataset.forEach(item => uniqueMap.set(item.domain, item));
const finalDataset = Array.from(uniqueMap.values());

fs.writeFileSync(datasetPath, JSON.stringify(finalDataset, null, 2), 'utf8');
console.log(`Successfully patched! Added ${addedCount}, updated ${updatedCount}. Total unique domains: ${finalDataset.length}`);
