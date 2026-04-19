import { queryDb } from '../src/lib/db';
import { runAutomation } from '../src/lib/automation';
import fs from 'fs';

async function runCampaign(nicheName: string, firstName: string, lastName: string, keywords: string, bio: string) {
  console.log(`\n\n=== RUNNING CAMPAIGN FOR: ${nicheName} ===\n`);

  // Create Persona
  const username = `${firstName.toLowerCase()}${Math.floor(Math.random()*9000+1000)}`;
  const resP = await queryDb<any>(
    "INSERT INTO Personas (Name, FirstName, LastName, Username, Bio, WebsiteUrl) VALUES (?,?,?,?,?,?)",
    [`${firstName} ${lastName}`, firstName, lastName, username, bio, `https://${nicheName.toLowerCase().replace(' ', '')}service.com`]
  );
  const personaId = resP[0]?.lastID;
  console.log(`Persona created: ID=${personaId} | Name=${firstName} ${lastName}`);

  // Create Campaign
  const resC = await queryDb<any>(
    "INSERT INTO Campaigns (Name, PersonaId, Status) VALUES (?,?,?)",
    [`Batch: ${nicheName} ` + new Date().toISOString().slice(0,16), personaId, 'Idle']
  );
  const campaignId = resC[0]?.lastID;
  console.log(`Campaign created: ID=${campaignId}`);

  // Get only 2 active sites for fast demo
  const sites = await queryDb<any>("SELECT Id, SiteName FROM Sites WHERE SiteName IN ('institutocrecer.edu.co', 'blac.edu.pl')");
  console.log(`Found ${sites.length} active sites\n`);

  // Bind sites
  for (const s of sites) {
    await queryDb("INSERT INTO SiteTasks (CampaignId, SiteId, Status, CurrentStep) VALUES (?,?,'New','Queued')", [campaignId, s.Id]);
  }

  // Run automation
  console.log(`\n--- STARTING ENGINE (${nicheName}) ---\n`);

  await runAutomation({
    campaignId,
    threadCount: 10,
    executionMode: 'all',
    apiKeys: {
      twoCaptcha: '234941760330b5686cce13e55d2f60a0',
      deepSeek: 'sk-59b7ae9012b44eba94320f021a07fc5d',
      geezekBaseUrl: 'https://geezek.com/create_email.php'
    }
  });

  // Export Results
  const allProofs = await queryDb<any>(
    `SELECT s.SiteName, p.FinalProfileUrl, p.WebsiteUrlAdded, p.Notes, t.Notes as TaskNotes 
     FROM Proofs p 
     JOIN SiteTasks t ON p.SiteTaskId = t.Id 
     JOIN Sites s ON t.SiteId = s.Id 
     WHERE t.CampaignId = ?
     ORDER BY p.Id`, [campaignId]
  );

  const csvLines = ['Site,ProfileURL,Username,Email,Password,Backlink'];
  for (const p of allProofs) {
    const notes = p.TaskNotes || p.Notes || '';
    const userM = notes.match(/User:\s*(\S+)/);
    const emailM = notes.match(/Email:\s*(\S+)/);
    const passM = notes.match(/Pass:\s*(\S+)/);
    const user = userM ? userM[1] : '';
    const email = emailM ? emailM[1] : '';
    const pass = passM ? passM[1] : '';
    
    csvLines.push(`"${p.SiteName}","${p.FinalProfileUrl}","${user}","${email}","${pass}","${p.WebsiteUrlAdded ? 'YES' : 'NO'}"`);
  }

  const csvPath = `${nicheName.toLowerCase().replace(' ', '_')}_profiles.csv`;
  fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf-8');
  console.log(`\n📁 Results saved to: ${csvPath}\n`);
}

async function main() {
  await runCampaign('Plumbing', 'Mike', 'Stevens', 'Plumbing, Pipe repair', 'Expert plumber with 10 years experience servicing residential areas.');
  await runCampaign('Dentist', 'DrSarah', 'Connor', 'Dentist, Teeth whitening', 'Professional dentist specializing in cosmetic dentistry and pediatric care.');
  console.log('BOTH BATCHES FINISHED');
  process.exit(0);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
