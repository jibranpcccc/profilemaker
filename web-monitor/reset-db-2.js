const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(process.env.LOCALAPPDATA, 'ProfileSubmissionAssistant', 'data.db');
const db = new sqlite3.Database(dbPath);

const domainsToTest = [
  "haphong.edu.vn", "holycrossconvent.edu.na", "rosewood.edu.na", "woorips.vic.edu.au", 
  "orkhonschool.edu.mn", "lasallesancristobal.edu.mx", "lanubedocente.21.edu.ar", 
  "tarauaca.ac.gov.br", "centrotecnologico.edu.mx", "institutocrecer.edu.co", 
  "aiti.edu.vn", "learningsuite.id", "aula.edu.pe", "edutic.id", "lifewest.edu", 
  "bbiny.edu", "pibelearning.gov.bd", "blac.edu.pl", "sanpablo.edu.ec"
];

// Query all Sites and find the Site Ids
db.all('SELECT Id, Name, Url FROM Sites', [], (err, rows) => {
  if (err && err.message.includes('no such table')) {
     console.log("No Sites table found skipping DB lookup");
     db.close();
     return;
  }
  
  // If Name/Url don't exist, we just catch the error.
  if (err) throw err;
  
  const siteIds = rows
    .filter(r => domainsToTest.some(d => (r.Name||'').includes(d) || (r.Url||'').includes(d)))
    .map(r => r.Id);
    
  if (siteIds.length === 0) {
    console.log("No matching sites found in DB.");
    return db.close();
  }

  console.log("Matching Site IDs:", siteIds);
  db.all(`SELECT Id, SiteId FROM SiteTasks WHERE SiteId IN (${siteIds.join(',')})`, (err, taskRows) => {
    if (err) throw err;
    const taskIds = taskRows.map(t => t.Id);
    console.log("Matching SiteTask IDs:", taskIds);
    if(taskIds.length === 0) return db.close();

    db.run(`DELETE FROM Proofs WHERE SiteTaskId IN (${taskIds.join(',')})`, () => {
      db.run(`UPDATE SiteTasks SET Status='Pending', CurrentStep='', EmailPassword='' WHERE Id IN (${taskIds.join(',')})`, () => {
        console.log('DB Reset Complete');
        fs.writeFileSync('test_targets_fixed.json', JSON.stringify(siteIds));
        db.close();
      });
    });
  });
});
