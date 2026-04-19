const sqlite3 = require('sqlite3');
const path = require('path');
const dbPath = path.join(process.env.LOCALAPPDATA, 'ProfileSubmissionAssistant', 'data.db');
const db = new sqlite3.Database(dbPath);

db.all("SELECT s.SiteName, t.Status, t.CurrentStep, t.Notes FROM SiteTasks t JOIN Sites s ON s.Id = t.SiteId WHERE s.Id >= 1271 AND t.Status IN ('Completed', 'Failed', 'Running')", [], (err, rows) => {
  if (err) console.error(err);
  else console.table(rows);
});
