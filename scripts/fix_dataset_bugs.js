import fs from 'fs';
import path from 'path';

const datasetPath = path.join(process.cwd(), 'platform_dataset.json');
let data = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

// Convert all bio_selector, etc to camelCase across entire dataset
data = data.map((entry) => {
    // BUG 10
    if (entry.bio_selector && !entry.bioSelector) {
        entry.bioSelector = entry.bio_selector;
        delete entry.bio_selector;
    }
    if (entry.website_selector && !entry.websiteSelector) {
        entry.websiteSelector = entry.website_selector;
        delete entry.website_selector;
    }
    if (entry.save_button && !entry.saveButton) {
        entry.saveButton = entry.save_button;
        delete entry.save_button;
    }
    
    // BUG 4 FIXES
    if (entry.domain === 'pibelearning.gov.bd') {
        entry.signup_url = 'https://pibelearning.gov.bd/wp-login.php?action=register';
    }
    if (entry.domain === 'learndash.aula.edu.pe') {
        entry.signup_url = 'https://learndash.aula.edu.pe/register/';
    }
    if (entry.domain === 'dados.ifac.edu.br') {
        entry.disabled = true;
    }
    if (entry.domain === 'stes.tyc.edu.tw') {
        entry.profile_pattern = 'http://www.stes.tyc.edu.tw/xoops/userinfo.php?uid={uid}';
    }
    
    return entry;
});

// Remove bad sites completely
data = data.filter(e => e.domain !== 'pandora.nla.gov.au' && e.domain !== 'wiki.ling.washington.edu');

// BUG 9 FIXES - Deduplicate keeping the most specific subdomain
const domainMap = new Map();
for (const entry of data) {
    // If we already have a more specific version, skip inserting this one
    // e.g. if we have learndash.aula.edu.pe, skip aula.edu.pe
    let shouldInsert = true;
    
    const isWix = entry.platform && entry.platform.toLowerCase().includes('wix');
    
    // Special handling for identical duplicates in the array
    if (domainMap.has(entry.domain)) {
        // Keep the one that doesn't have 404 URLs if possible, or just skip
        if (entry.signup_url && !entry.signup_url.includes('student-registration')) {
            domainMap.set(entry.domain, entry);
        }
        continue; // handled identical duplicate
    }
    
    // Subdomain checking
    for (const [key, val] of domainMap.entries()) {
        if (`${entry.domain}`.endsWith(`.${key}`)) {
            // New entry is a subdomain of existing (e.g. learndash.aula.edu.pe vs aula.edu.pe)
            // Replace existing with New!
            domainMap.delete(key);
            domainMap.set(entry.domain, entry);
            shouldInsert = false;
            break;
        } else if (`${key}`.endsWith(`.${entry.domain}`)) {
            // Existing is already a subdomain of New, so keep existing and discard New
            shouldInsert = false;
            break;
        }
    }
    
    if (shouldInsert) {
        domainMap.set(entry.domain, entry);
    }
}

// Convert Map back to Array
const newData = Array.from(domainMap.values());

fs.writeFileSync(datasetPath, JSON.stringify(newData, null, 2));
console.log(`Updated platform_dataset.json. Total entries: ${newData.length}`);
