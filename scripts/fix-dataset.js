const fs = require('fs');
const path = require('path');

// Path to your dataset (adjust if needed)
const DATASET_PATH = path.join(__dirname, 'platform_dataset.json');

console.log('🔧 Starting dataset auto-fix...\n');

try {
  // Read current dataset
  const rawData = fs.readFileSync(DATASET_PATH, 'utf8');
  const data = JSON.parse(rawData);
  
  let fixedCount = 0;
  let alreadyGoodCount = 0;
  
  data.forEach((entry, index) => {
    // Check if this entry uses the old broken "register_url" format
    if (entry.register_url && !entry.signup_url) {
      console.log(`[${index}] Fixing: ${entry.domain}`);
      
      // 1. Convert register_url → signup_url and fix the path
      let signupUrl = entry.register_url;
      
      // Fix common broken patterns
      if (signupUrl.includes('/profile/{username}/profile')) {
        signupUrl = signupUrl.replace('/profile/{username}/profile', '/register');
      } else if (signupUrl.includes('/profile/')) {
        // Generic fallback - change profile URL to register
        signupUrl = `https://${entry.domain}/register`;
      }
      
      entry.signup_url = signupUrl;
      
      // 2. Ensure profile_edit_url exists
      if (!entry.profile_edit_url) {
        entry.profile_edit_url = `https://${entry.domain}/account`;
      }
      
      // 3. Ensure profile_pattern exists
      if (!entry.profile_pattern) {
        entry.profile_pattern = `https://${entry.domain}/profile/{username}`;
      }
      
      // 4. Add proper selectors (Wix-friendly defaults)
      if (!entry.bio_selector) {
        entry.bio_selector = 'textarea, [contenteditable="true"], [data-testid*="bio"], .bio-textarea, [name*="bio"]';
      }
      
      if (!entry.website_selector) {
        entry.website_selector = 'input[type="url"], input[name*="url"], input[name*="website"], input[placeholder*="website"], input[placeholder*="site"]';
      }
      
      if (!entry.save_button) {
        entry.save_button = 'button:has-text("Save"), button:has-text("Update"), button[type="submit"], .save-button, [data-testid*="save"], button.primary';
      }
      
      // 5. Remove the old broken key
      delete entry.register_url;
      
      fixedCount++;
      
    } else if (entry.signup_url) {
      alreadyGoodCount++;
    }
  });
  
  // Save the fixed dataset
  fs.writeFileSync(DATASET_PATH, JSON.stringify(data, null, 2), 'utf8');
  
  console.log('\n✅ Dataset fix complete!');
  console.log(`   Fixed entries: ${fixedCount}`);
  console.log(`   Already correct: ${alreadyGoodCount}`);
  console.log(`   Total entries: ${data.length}`);
  console.log(`\n📁 Saved to: ${DATASET_PATH}`);
  
} catch (error) {
  console.error('❌ Error fixing dataset:', error.message);
  process.exit(1);
}
