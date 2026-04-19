const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(process.env.LOCALAPPDATA, 'ProfileSubmissionAssistant', 'data.db');
const db = new sqlite3.Database(dbPath);

console.log("DB Path:", dbPath);

db.all('SELECT * FROM SiteTasks ORDER BY Id DESC LIMIT 15', [], (err, rows) => {
  if (err) {
    console.error("DB Error:", err.message);
  } else {
    console.log(JSON.stringify(rows.map(r => ({ id: r.Id, siteId: r.SiteId, name: r.SiteName || r.DomainUrl || r.TargetUrl })), null, 2));
  }
  db.close();
});
