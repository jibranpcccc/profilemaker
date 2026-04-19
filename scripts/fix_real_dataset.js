import fs from 'fs';
import path from 'path';

const datasetPath = path.join(process.cwd(), 'web-monitor', 'platform_dataset.json');
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
    let shouldInsert = true;
    
    if (domainMap.has(entry.domain)) {
        if (entry.signup_url && !entry.signup_url.includes('student-registration')) {
            domainMap.set(entry.domain, entry);
        }
        continue;
    }
    
    for (const [key, val] of domainMap.entries()) {
        if (('' + entry.domain).endsWith('.' + key)) {
            domainMap.delete(key);
            domainMap.set(entry.domain, entry);
            shouldInsert = false;
            break;
        } else if (('' + key).endsWith('.' + entry.domain)) {
            shouldInsert = false;
            break;
        }
    }
    
    if (shouldInsert) {
        domainMap.set(entry.domain, entry);
    }
}

data = Array.from(domainMap.values());

const wixDomains = [
  'haphong.edu.vn', 'holycrossconvent.edu.na', 'rosewood.edu.na', 'woorips.vic.edu.au',
  'orkhonschool.edu.mn', 'lasallesancristobal.edu.mx', 'lanubedocente.21.edu.ar', 
  'tarauaca.ac.gov.br', 'centrotecnologico.edu.mx', 'ictae.edu.mx', 
  'news.lafontana.edu.co', 'divinagracia.edu.ec', 'democracy-edu.or.kr',
  'discoveryschool.edu.hn', 'nazaret.edu.ec', 'aac.edu.sg', 'altamira.edu.ec'
];

const ckanDomains = [
  'dados.unifei.edu.br', 'opendata.klaten.go.id', 'opendata.ternopilcity.gov.ua',
  'dados.justica.gov.pt', 'data.lutskrada.gov.ua', 'dados.ifac.edu.br',
  'data.dniprorada.gov.ua', 'datos.estadisticas.pr', 'csdlcntmgialai.gov.vn'
];

let enspCount = 0;
data = data.filter(entry => {
  if (entry.domain === 'ensp.edu.mx') {
    enspCount++;
    if (enspCount > 1) return false;
  }
  return true;
});

data = data.map((entry) => {
  if (wixDomains.includes(entry.domain)) {
    entry.signup_url = `https://www.${entry.domain}`;
    entry.register_url = `https://www.${entry.domain}/profile/{username}/profile`;
    entry.profile_edit_url = `https://www.${entry.domain}/profile/{username}/profile`;
    entry.profile_pattern = `https://www.${entry.domain}/profile/{username}/profile`;
    entry.bioSelector = "[data-testid='bio-input'], textarea[name='bio'], [aria-label*='bio' i], [placeholder*='bio' i]";
    entry.websiteSelector = "[data-testid='customLink-url'], input[placeholder*='URL' i], input[placeholder*='website' i]";
    entry.saveButton = "[data-testid='save-button'], button:has-text('Save'), button:has-text('Update')";
    entry.fields = {
      "displayname": "[data-testid='display-name-input'], input[aria-label*='name' i]",
      "email": "input[type='email']",
      "password": "input[type='password']"
    };
  }

  if (ckanDomains.includes(entry.domain)) {
    entry.fields = {
      "username": "input#field-username",
      "email": "input#field-email",
      "password": "input#field-password1",
      "passwordconfirm": "input#field-password2",
      "displayname": "input#field-fullname"
    };
    if (!entry.signup_url) entry.signup_url = `https://${entry.domain}/user/register`;
    entry.bioSelector = entry.bioSelector || "#field-about";
    entry.websiteSelector = entry.websiteSelector || "input[name='url'], input#field-url";
    entry.saveButton = entry.saveButton || "button[name='save'][type='submit']";
  }

  if (entry.domain === 'pibelearning.gov.bd') {
    entry.signup_url = "https://pibelearning.gov.bd/wp-login.php?action=register";
    entry.profile_edit_url = "https://pibelearning.gov.bd/wp-admin/profile.php";
    entry.profile_pattern = "https://pibelearning.gov.bd/author/{username}/";
    entry.bioSelector = "#description, textarea[name='description'], #your-profile textarea";
    entry.websiteSelector = "input#url, input[name='url']";
    entry.saveButton = "input[type='submit'][name='submit'], #submit";
    entry.fields = {
      "username": "input#user_login",
      "email": "input#user_email",
      "password": "input#pass1"
    };
  }

  return entry;
});

fs.writeFileSync(datasetPath, JSON.stringify(data, null, 2));
console.log(`Successfully patched CORRECT web-monitor dataset data. Total entries left: ${data.length}`);
