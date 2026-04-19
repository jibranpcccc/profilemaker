const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(process.env.LOCALAPPDATA, 'ProfileSubmissionAssistant', 'data.db');
const db = new sqlite3.Database(dbPath);

const siteIds = [1320, 1321, 1322, 1323, 1324, 1325, 1326, 1327, 1328, 1329];

db.serialize(() => {
  db.run(`DELETE FROM Proofs WHERE SiteTaskId IN (SELECT Id FROM SiteTasks WHERE SiteId IN (${siteIds.join(',')}))`);
  db.run(`UPDATE SiteTasks SET Status='Pending', CurrentStep='' WHERE SiteId IN (${siteIds.join(',')})`, () => {
    console.log("DB Reset complete for IDs", siteIds);
    db.close();
  });
});
