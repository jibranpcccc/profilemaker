import { automateSite } from './src/lib/automation';
import { loadSettings } from './src/lib/settings';

async function generateTestBatch() {
  const settings = loadSettings();
  const apiKeys = {
    twoCaptcha: settings.TwoCaptchaApiKey,
    deepSeek: settings.DeepSeekApiKey,
    geezekBaseUrl: settings.GeezekBaseUrl
  };

  const targets = [
    'nazaret.edu.ec',
    'ictae.edu.mx',
    'news.lafontana.edu.co',
    'divinagracia.edu.ec',
    'democracy-edu.or.kr'
  ];

  console.log(`Starting isolated batch of 5 targets: \n${targets.join(', ')}\n`);
  
  const promises = targets.map(async (domain, idx) => {
     try {
       const signup = `https://${domain}/register`;
       const siteTask = {
          Id: 90000 + idx, SiteName: domain, TargetDomain: domain, Status: 'Pending',
          SignupUrl: signup, ProfileEditUrl: `https://${domain}/account`, DomainUrl: `https://${domain}`,
          Username: '', Password: '', Email: '', CurrentStep: '', ExecutionLog: ''
       };
       const identity = { 
          username: 'vanavob' + Math.floor(Math.random()*100000), 
          password: 'Pass' + Math.floor(Math.random()*1000) + '!Mx', 
          email: 'vanavob' + Math.floor(Math.random()*100000) + '@geezek.com',
          profile_content: { description: 'Megawin188 is best', website_url: 'https://megawin188.id/' }
       };
       const res = await automateSite(siteTask, identity, apiKeys);
       return { domain, user: identity.username, url: res.FinalProfileUrl || res.ResultUrl, status: res.Status };
     } catch (e: any) {
       return { domain, error: e.message };
     }
  });

  const results = await Promise.all(promises);
  
  console.log('=== FINAL 5 BATCH URLs ===');
  results.forEach(r => {
      console.log(`DOMAIN: ${r.domain} | USERNAME: ${r.user || 'N/A'} | STATUS: ${r.status || 'ERR'} | URL: ${r.url || 'None'} | ERR: ${r.error || ''}`);
  });
}

generateTestBatch().catch(console.error);
