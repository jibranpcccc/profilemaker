import { getSiteEntry } from './src/lib/dataset';
import { automateSite } from './src/lib/automation';
import { loadSettings } from './src/lib/settings';

async function runBatch() {
  const domains = [
    'aiti.edu.vn',       // XenForo (Needs dynamic ID logic)
    'blac.edu.pl',       // Tutor LMS
    'sanpablo.edu.ec',   // WordPress
    'bbiny.edu'          // WordPress
  ];
  
  const settings = loadSettings();
  const apiKeys = {
    twoCaptcha: settings.TwoCaptchaApiKey,
    deepSeek: settings.DeepSeekApiKey,
    geezekBaseUrl: settings.GeezekBaseUrl
  };
  
  const results = [];
  
  for (const domain of domains) {
    console.log(`\n============================`);
    console.log(`Starting ${domain}...`);
    
    const siteTask = {
      Id: Math.floor(Math.random() * 10000),
      TargetDomain: domain,
      Status: 'Pending',
      Username: '', Email: '', Password: '',
      CurrentStep: 'Initializing...',
      ExecutionLog: ''
    };
    
    try {
      const res = await automateSite(domain, apiKeys, siteTask);
      results.push({ domain, status: res.Status, url: res.ResultUrl, user: res.Username, pass: res.Password });
      console.log(`[x] Completed ${domain}: ${res.Status} | ${res.ResultUrl}`);
    } catch (e: any) {
      console.log(`[!] Failed ${domain}: ${e.message}`);
    }
  }
  
  console.log(`\n\n=== FINAL RESULTS ===`);
  results.forEach(r => {
    console.log(`${r.domain} | ${r.url} | ${r.user} | ${r.pass} | ${r.status}`);
  });
}

runBatch().catch(console.error);
