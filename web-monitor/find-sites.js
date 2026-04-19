const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(process.env.LOCALAPPDATA, 'ProfileSubmissionAssistant', 'data.db');
const db = new sqlite3.Database(dbPath);

const domains = ['haphong.edu.vn', 'nazaret.edu.ec', 'rosewood.edu.na', 'ictae.edu.mx', 'news.lafontana.edu.co', 'divinagracia.edu.ec', 'democracy-edu.or.kr', 'discoveryschool.edu.hn', 'altamira.edu.ec', 'aac.edu.sg', 'dlsjbc.edu.ph'];

db.all('SELECT Id, Name, DomainUrl FROM Sites', [], (err, rows) => {
  if (err) throw err;
  const targets = rows.filter(r => domains.some(d => (r.DomainUrl || '').includes(d) || (r.Name || '').includes(d))).slice(0, 10);
  const siteIds = targets.map(t => t.Id);
  console.log('Site IDs found:', siteIds);
  db.close();
});
