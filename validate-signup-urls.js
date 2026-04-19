const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Path to your dataset
const DATASET_PATH = path.join(__dirname, 'platform_dataset.json');

console.log('🔍 Starting signup URL validation...\n');

async function checkUrl(url, timeout = 8000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.request(url, {
      method: 'HEAD',
      timeout: timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    }, (res) => {
      const duration = Date.now() - startTime;
      const status = res.statusCode;
      
      // Consider 200-399 as reachable (handles redirects)
      const isReachable = status >= 200 && status < 400;
      
      resolve({
        url,
        status,
        reachable: isReachable,
        duration: `${duration}ms`,
        redirect: res.headers.location || null
      });
    });

    req.on('error', (err) => {
      resolve({
        url,
        status: 'ERROR',
        reachable: false,
        error: err.message,
        duration: `${Date.now() - startTime}ms`
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        url,
        status: 'TIMEOUT',
        reachable: false,
        duration: `${timeout}ms`
      });
    });

    req.end();
  });
}

async function validateAll() {
  try {
    const rawData = fs.readFileSync(DATASET_PATH, 'utf8');
    const data = JSON.parse(rawData);
    
    const results = {
      total: 0,
      reachable: 0,
      dead: 0,
      deadList: []
    };
    
    console.log(`Checking ${data.length} sites...\n`);
    
    for (let i = 0; i < data.length; i++) {
      const entry = data[i];
      const url = entry.signup_url || entry.register_url; // fallback for old format
      
      if (!url) {
        console.log(`[${i}] ${entry.domain} → No URL found (skipping)`);
        continue;
      }
      
      results.total++;
      process.stdout.write(`[${i}] Checking ${entry.domain}... `);
      
      const result = await checkUrl(url);
      
      if (result.reachable) {
        console.log(`✅ ${result.status} (${result.duration})`);
        results.reachable++;
      } else {
        console.log(`❌ ${result.status} (${result.duration})`);
        results.dead++;
        results.deadList.push({
          domain: entry.domain,
          url: url,
          status: result.status,
          error: result.error || null
        });
      }
      
      // Small delay to avoid hammering servers
      await new Promise(r => setTimeout(r, 150));
    }
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 VALIDATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total checked     : ${results.total}`);
    console.log(`Reachable (✅)    : ${results.reachable}`);
    console.log(`Dead/Broken (❌)  : ${results.dead}`);
    console.log(`Success rate      : ${Math.round((results.reachable / results.total) * 100)}%`);
    
    if (results.deadList.length > 0) {
      console.log('\n❌ DEAD / BROKEN URLs:');
      results.deadList.forEach(item => {
        console.log(`   ${item.domain}`);
        console.log(`   → ${item.url}`);
        console.log(`   Status: ${item.status}\n`);
      });
    }
    
    console.log('='.repeat(60));
    console.log('\n✅ Validation complete!');
    
  } catch (error) {
    console.error('❌ Error during validation:', error.message);
  }
}

// Run it
validateAll();
