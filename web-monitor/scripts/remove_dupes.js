const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.LOCALAPPDATA + '\\ProfileSubmissionAssistant\\data.db');

// Find and remove duplicate Sites (keep lowest Id)
db.all("SELECT SiteName, MIN(Id) as keepId, COUNT(*) as cnt FROM Sites WHERE IsActive=1 GROUP BY SiteName HAVING cnt > 1", (err, rows) => {
  if (!rows || rows.length === 0) {
    console.log("No duplicates found.");
    return;
  }
  rows.forEach(r => {
    console.log(`Deactivating duplicates for: ${r.SiteName} (keeping Id=${r.keepId})`);
    db.run("UPDATE Sites SET IsActive=0 WHERE SiteName=? AND Id != ?", [r.SiteName, r.keepId], function(e) {
      if (e) console.log("Error:", e.message);
      else console.log(`  -> Deactivated ${this.changes} duplicate(s)`);
    });
  });
  
  setTimeout(() => {
    db.all("SELECT COUNT(*) as c FROM Sites WHERE IsActive=1", (e, r) => {
      console.log(`\nRemaining active sites: ${r[0].c}`);
    });
  }, 1000);
});
