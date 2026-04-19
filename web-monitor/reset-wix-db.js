const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(process.env.LOCALAPPDATA, 'ProfileSubmissionAssistant', 'data.db');
const db = new sqlite3.Database(dbPath);

const domains = ['aiti.edu.vn', 'sanpablo.edu.ec', 'blac.edu.pl', 'pibelearning.gov.bd', 'bbiny.edu', 'ensp.edu.mx', 'edutic.id', 'aula.edu.pe', 'centrotecnologico.edu.mx', 'lifewest.edu'];

db.all('SELECT * FROM SiteTasks', [], (err, rows) => {
  if (err) throw err;
  const targets = rows.filter(r => domains.some(d => (r.DomainUrl || '').includes(d) || (r.TargetUrl || '').includes(d))).slice(0, 10);
  const ids = targets.map(t => t.Id);
  console.log('Target IDs:', ids);
  if (ids.length === 0) return db.close();

  db.run(`DELETE FROM Proofs WHERE SiteTaskId IN (${ids.join(',')})`, () => {
    db.run(`UPDATE SiteTasks SET Status='Pending', CurrentStep='', EmailPassword='' WHERE Id IN (${ids.join(',')})`, () => {
      console.log('DB Reset Complete');
      
      require('fs').writeFileSync('test_targets.json', JSON.stringify(ids));
      db.close();
    });
  });
});
