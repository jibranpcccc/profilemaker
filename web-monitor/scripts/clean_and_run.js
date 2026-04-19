const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');
const http = require('http');

const dbPath = path.join(process.env.LOCALAPPDATA, 'ProfileSubmissionAssistant', 'data.db');
const db = new sqlite3.Database(dbPath);
const dataset = JSON.parse(fs.readFileSync('platform_dataset.json', 'utf8'));

// Helper for promise
const dbRun = (query, params = []) => new Promise((resolve, reject) => {
  db.run(query, params, function(err) {
    if (err) reject(err);
    else resolve(this);
  });
});
const dbGet = (query, params = []) => new Promise((resolve, reject) => {
  db.get(query, params, (err, row) => err ? reject(err) : resolve(row));
});

async function main() {
  console.log('Stopping engine...');
  await fetch('http://localhost:3001/api/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'stop' })
  }).catch(() => {});
  
  console.log('Waiting 8 seconds for workers to halt...');
  await new Promise(r => setTimeout(r, 8000));
  
  // Mark all sites inactive
  await dbRun(`UPDATE Sites SET IsActive = 0`);
  console.log('All existing sites marked inactive.');
  
  // Sync the exactly 25 sites
  console.log('Syncing 25 dataset target sites...');
  for (const entry of dataset) {
    const signupUrl = entry.register_url;
    const row = await dbGet('SELECT Id FROM Sites WHERE SignupUrl = ?', [signupUrl]);
    if (!row) {
      await dbRun(`INSERT INTO Sites (SiteName, SignupUrl, VerificationType, IsActive, ReliabilityScore, SpeedScore, ProjectId) VALUES (?, ?, 'email', 1, 100, 100, 1)`, [entry.domain, signupUrl]);
    } else {
      await dbRun(`UPDATE Sites SET IsActive = 1 WHERE Id = ?`, [row.Id]);
    }
  }
  
  // Clear SiteTasks completely because user just wants a fresh run
  await dbRun(`DELETE FROM SiteTasks`);
  await dbRun(`DELETE FROM Proofs`); // Optional: clearing proofs so dashboard is fresh for these 25!
  console.log('Tasks and old proofs cleared.');
  
  // Select active 25 sites and make tasks
  const sites = await new Promise((resolve, reject) => {
    db.all('SELECT Id FROM Sites WHERE IsActive = 1', (err, rows) => err ? reject(err) : resolve(rows));
  });
  
  console.log(`Verified ${sites.length} active sites.`);
  
  const siteIds = [];
  for (const site of sites) {
    siteIds.push(site.Id);
    await dbRun(`INSERT INTO SiteTasks (SiteId, Status, CurrentStep) VALUES (?, 'New', 'Pending validation')`, [site.Id]);
  }
  
  // Start engine
  console.log(`Triggering POST /api/run for EXACTLY ${siteIds.length} sites...`);
  const res = await fetch('http://localhost:3001/api/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ threadCount: 5, executionMode: "all", projectId: 1, siteIds: siteIds })
  });
  
  console.log('API Response:', await res.json());
}

main();
