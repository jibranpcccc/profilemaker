const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(process.env.LOCALAPPDATA, 'ProfileSubmissionAssistant', 'data.db');
const db = new sqlite3.Database(dbPath);

const siteIds = [1320, 1321, 1322, 1323, 1324, 1325, 1326, 1327, 1328, 1329];

db.all(`SELECT s.Id, s.SiteId, s.Status, s.CurrentStep FROM SiteTasks s WHERE s.SiteId IN (${siteIds.join(',')})`, (err, rows) => {
  if (err) throw err;
  console.log("----- SiteTasks -----");
  console.table(rows);
  
  db.all(`SELECT * FROM Proofs WHERE SiteTaskId IN (${rows.map(r => r.Id).join(',')})`, (err2, proofs) => {
      console.log("----- Proofs -----");
      console.table(proofs);
      db.close();
  });
});
