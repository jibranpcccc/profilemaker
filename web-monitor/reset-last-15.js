const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(process.env.LOCALAPPDATA, 'ProfileSubmissionAssistant', 'data.db');
const db = new sqlite3.Database(dbPath);

console.log("Resetting last 15 SiteTasks...");

db.all('SELECT Id, SiteId FROM SiteTasks ORDER BY Id DESC LIMIT 15', [], (err, rows) => {
  if (err) throw err;
  const ids = rows.map(r => r.Id);
  const siteIds = rows.map(r => r.SiteId);
  
  if (ids.length === 0) {
    console.log("No tasks found");
    return db.close();
  }

  db.run(`DELETE FROM Proofs WHERE SiteTaskId IN (${ids.join(',')})`, () => {
    db.run(`UPDATE SiteTasks SET Status='Pending', CurrentStep='', EmailPassword='' WHERE Id IN (${ids.join(',')})`, () => {
      console.log('Reset complete for SiteTask IDs:', ids);
      
      // Save for API trigger
      const fs = require('fs');
      fs.writeFileSync('test_targets_last15.json', JSON.stringify(siteIds));
      console.log('Site IDs saved to run:', siteIds);
      db.close();
    });
  });
});
