import fs from 'fs';
import { automateSite } from './src/lib/automation';
import { loadSettings } from './src/lib/settings';

async function generateTestBatch() {
  const settings = loadSettings();
  const apiKeys = {
    twoCaptcha: settings.TwoCaptchaApiKey,
    deepSeek: settings.DeepSeekApiKey,
    geezekBaseUrl: settings.GeezekBaseUrl
  };

  const rawDataStr = fs.readFileSync('./platform_dataset.json', 'utf8');
  const rawData = JSON.parse(rawDataStr);
  const highSuccessData = rawData.filter((d: any) => 
    ['WordPress', 'Moodle', 'CKAN'].includes(d.platform) || 
    (!d.platform && d.signup_url && d.signup_url.includes('wp-login'))
  );
  
  const targetDataset = highSuccessData.sort(() => 0.5 - Math.random()).slice(0, 10);
  const targets = targetDataset.map((d: any) => d.domain);

  console.log(`Starting isolated batch of 10 HIGH-SUCCESS targets: \n${targets.join(', ')}\n`);
  
  const promises = targetDataset.map(async (entry: any, idx: number) => {
     try {
       const domain = entry.domain;
       const signup = entry.signup_url || `https://${domain}/register`;
       const siteTask = {
          Id: 90000 + idx, SiteName: domain, TargetDomain: domain, Status: 'Pending',
          SignupUrl: signup, ProfileEditUrl: `https://${domain}/account`, DomainUrl: `https://${domain}`,
          Username: '', Password: '', Email: '', CurrentStep: '', ExecutionLog: ''
       };
       const identId = Math.floor(Math.random()*100000);
       const identity = { 
          displayName: 'Anna Smith',
          firstName: 'Anna' + identId,
          lastName: 'Smith' + identId,
          username: 'anna' + identId, 
          password: 'Pass' + Math.floor(Math.random()*1000) + '!Mx', 
          email: 'anna' + identId + '@geezek.com',
          bio: 'I love reviewing top web platforms like megawin.',
          websiteUrl: 'https://megawin188.id/',
          backlink: '<a href="https://megawin188.id/">megawin188</a>'
       };
       const res = await automateSite(siteTask, identity, apiKeys);
       return { domain, user: identity.username, url: res.profileUrl, status: res.backlinkStatus };
     } catch (e: any) {
       return { domain: entry.domain, error: e.message };
     }
  });

  const results = await Promise.all(promises);
  
  console.log('\n=== FINAL 10 HIGH-SUCCESS BATCH URLs ===');
  results.forEach(r => {
      console.log(`DOMAIN: ${r.domain} | USERNAME: ${r.user || 'N/A'} | STATUS: ${r.status || 'ERR'} | URL: ${r.url || 'None'} | ERR: ${r.error || ''}`);
  });
}

generateTestBatch().catch(console.error);
