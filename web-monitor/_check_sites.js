const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(process.env.LOCALAPPDATA, 'ProfileSubmissionAssistant', 'data.db');
const db = new sqlite3.Database(dbPath);

db.all(
  `SELECT s.Id, s.SiteName, s.SignupUrl, s.IsActive, t.Status, t.Id as TaskId 
   FROM SiteTasks t JOIN Sites s ON s.Id = t.SiteId 
   WHERE t.Status NOT IN ('Completed') AND s.IsActive = 1 AND t.CampaignId IS NULL 
   ORDER BY s.ReliabilityScore DESC LIMIT 10`,
  (err, rows) => {
    if (err) { console.error(err); }
    else { rows.forEach((r, i) => console.log(`${i + 1}. [${r.Status}] ${r.SiteName} | ${r.SignupUrl}`)); }
    db.close();
  }
);
