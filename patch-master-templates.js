const fs = require('fs');
const path = require('path');

const datasetPath = path.resolve(__dirname, 'platform_dataset.json');
let dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

const masterTemplates = [
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
      "button:has-text('Iniciar sesión')",
      "button:has-text('Entrar')"
    ],
    "bio_selector": "#bio, textarea, [contenteditable='true'], [data-testid*='bio'], .bio-textarea, textarea[placeholder*='bio']",
    "website_selector": "input[type='url'], input[name*='website'], input[placeholder*='website'], input[name*='url']",
    "save_button": "button:has-text('Save'), button[type='submit'], .save-button, [data-testid*='save'], button.primary"
  },
  {
    "domain": "learndash_generic",
    "signup_url": "https://www.{domain}/student-registration/",
    "profile_edit_url": "https://www.{domain}/dashboard/settings/",
    "profile_pattern": "https://www.{domain}/profile/{username}/",
    "bio_selector": "textarea, [contenteditable='true'], #ld-profile-bio, textarea[name*='bio']",
    "website_selector": "input[type='url'], input[name*='url'], input[name*='website']",
    "save_button": "button:has-text('Save'), button[type='submit'], .ld-button, .btn-primary"
  },
  {
    "domain": "ckan_generic",
    "signup_url": "https://{domain}/user/register",
    "profile_edit_url": "https://{domain}/user/edit",
    "profile_pattern": "https://{domain}/user/{username}",
    "bio_selector": "#field-about, textarea[name*='about'], .about, textarea[placeholder*='about']",
    "website_selector": "input[name*='url'], input#url, input[name*='website']",
    "save_button": "button[type='submit'][name='save'], button:has-text('Save'), input[type='submit']"
  },
  {
    "domain": "academia_generic",
    "signup_url": "https://independent.academia.edu/",
    "profile_edit_url": "https://independent.academia.edu/settings",
    "profile_pattern": "https://independent.academia.edu/{username}",
    "pre_fill_actions": [
      "button:has-text('Join for free')",
      "a:has-text('Sign up')",
      ".signup-button",
      "button:has-text('Create account')"
    ],
    "bio_selector": "textarea[name*='bio'], #user_bio, textarea.about, [contenteditable='true']",
    "website_selector": "input[name*='website'], input#website, input[type='url']",
    "save_button": "button:has-text('Save changes'), button[type='submit'], .btn-primary"
  }
];

// Remove existing generic templates if present
dataset = dataset.filter(entry => !entry.domain.includes('_generic'));

// Prepend the new ones
dataset.unshift(...masterTemplates);

fs.writeFileSync(datasetPath, JSON.stringify(dataset, null, 2), 'utf8');
console.log(`Successfully injected 4 Master Templates at the top! Total entries: ${dataset.length}`);
