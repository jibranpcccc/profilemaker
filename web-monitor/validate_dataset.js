const data = require('./platform_dataset.json');

const REQUIRED = ['domain', 'signup_url', 'profile_pattern', 'bio_selector', 'website_selector'];
let issues = 0;

data.forEach((entry, i) => {
  const missing = REQUIRED.filter(k => !entry[k]);
  const wrongPattern = entry.profile_pattern && entry.profile_pattern.includes('{username}') === false;
  
  if (missing.length || wrongPattern) {
    console.log(`\n❌ [${i+1}] ${entry.domain}`);
    if (missing.length) console.log(`   Missing fields: ${missing.join(', ')}`);
    if (wrongPattern) console.log(`   profile_pattern has no {username} placeholder`);
    issues++;
  }
});

console.log(`\n${ issues === 0 ? '✅ All good!' : `⚠️  ${issues} entries have issues` } (${data.length} total)`);
