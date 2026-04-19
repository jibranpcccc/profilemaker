const { getSiteEntry } = require('./src/lib/dataset');
const { automateSite } = require('./src/lib/automation');
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

async function runTest() {
  console.log("Loading blac.edu.pl from dataset...");
  const siteEntry = getSiteEntry('blac.edu.pl');
  if(!siteEntry) {
    console.log("Failed to load site entry.");
    return;
  }
  
  const siteTask = {
    Id: 9999,
    TargetDomain: 'blac.edu.pl',
    Status: 'Pending',
    Username: '',
    Password: '',
    Email: '',
    CurrentStep: 'Initializing test...',
    ExecutionLog: ''
  };
  
  console.log("Running automateSite...");
  
  // Fake API keys
  const apiKeys = {
    twocaptcha: 'fake',
    deepseek: 'fake'
  };
  
  try {
     const result = await automateSite('blac.edu.pl', apiKeys, siteTask);
     console.log("RESULT:", result);
  } catch (e) {
     console.error("FATAL ERROR:", e);
  }
}

runTest();
