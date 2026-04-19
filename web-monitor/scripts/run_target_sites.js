const sqlite3 = require('sqlite3');
const path = require('path');
const dbPath = path.join(process.env.LOCALAPPDATA, 'ProfileSubmissionAssistant', 'data.db');
const db = new sqlite3.Database(dbPath);

console.log('Nulling out CampaignId and setting New for 25 sites...');
db.run("UPDATE SiteTasks SET CampaignId = NULL, Status = 'New' WHERE SiteId >= 1271", (err) => {
  if (err) console.error(err);
  else console.log('Update done.');
  
  fetch('http://localhost:3001/api/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ threadCount: 5, executionMode: "all", projectId: 1 })
  })
  .then(res => res.json())
  .then(data => console.log('API Response:', data))
  .catch(err => console.error(err));
});
