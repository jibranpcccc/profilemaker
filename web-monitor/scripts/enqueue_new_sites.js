const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');
const http = require('http');

const dbPath = path.join(process.env.LOCALAPPDATA, 'ProfileSubmissionAssistant', 'data.db');
const db = new sqlite3.Database(dbPath);

async function addTasksAndRun() {
  db.all('SELECT Id FROM Sites WHERE Id >= 1271', async (err, rows) => {
    if (err) throw err;
    console.log(`Found ${rows.length} sites to enqueue.`);
    
    for (const row of rows) {
      await new Promise((resolve) => {
        db.run(`INSERT OR IGNORE INTO SiteTasks (SiteId, ProjectId, Status, CurrentStep) VALUES (?, 1, 'New', 'Pending loop')`, [row.Id], resolve);
      });
    }

    console.log('Tasks inserted. Triggering API run...');
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/run',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => console.log('API Response:', data));
    });
    
    req.write(JSON.stringify({ threadCount: 5, executionMode: 'all', projectId: 1 }));
    req.end();
  });
}

addTasksAndRun();
