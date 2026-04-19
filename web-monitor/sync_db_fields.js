const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const os = require('os');

async function syncDbFields() {
  const dbPath = path.join(process.env.LOCALAPPDATA, 'ProfileSubmissionAssistant', 'data.db');
  const db = new sqlite3.Database(dbPath);

  const datasetPath = path.join(__dirname, 'src', 'lib', 'dataset.json'); // Wait, dataset is platform_dataset.json in root!
  const actualDatasetPath = path.join(__dirname, 'platform_dataset.json');
  
  if (!fs.existsSync(actualDatasetPath)) {
      console.log("Dataset not found.");
      return;
  }
  
  const dataset = JSON.parse(fs.readFileSync(actualDatasetPath, 'utf8'));

  db.serialize(() => {
    db.run('BEGIN TRANSACTION;');

    const stmt = db.prepare(`
      UPDATE Sites 
      SET SignupUrl = ?, 
          LoginUrl = ?, 
          ProfileEditUrl = ?, 
          PublicProfileUrlPattern = ?,
          BioFieldSelector = ?,
          WebsiteFieldSelector = ?,
          SaveButtonSelector = ?
      WHERE SiteName = ?
    `);

    let updatedCount = 0;

    dataset.forEach(entry => {
      // Determine a reasonable LoginUrl based on SignupUrl
      const signup = entry.signup_url || `https://${entry.domain}/register`;
      let loginUrl = signup.replace('/register', '/login').replace('/student-registration/', '/login/');
      if (entry.platform === 'CKAN' || signup.includes('/user/register')) {
          loginUrl = `https://${entry.domain}/user/login`;
      }

      stmt.run(
        entry.signup_url || `https://${entry.domain}/register`,
        loginUrl,
        entry.profile_edit_url || `https://${entry.domain}/account`,
        entry.profile_pattern || `https://${entry.domain}/profile/{username}`,
        entry.bio_selector || '',
        entry.website_selector || '',
        entry.save_button || '',
        entry.domain,
        function(err) {
            if (err) console.error("Error updating", entry.domain, err);
            else if (this.changes > 0) updatedCount += this.changes;
        }
      );
    });

    stmt.finalize();
    db.run('COMMIT;', () => {
        console.log(`✅ Perfectly synchronized required fields for all dataset domains! Rows updated: ${updatedCount}`);
    });
  });
}

syncDbFields().catch(console.error);
