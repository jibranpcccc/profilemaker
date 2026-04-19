import { queryDb } from '../src/lib/db';
import { runAutomation } from '../src/lib/automation';
import fs from 'fs';

async function main() {
  console.log("=== FRESH CAMPAIGN TEST ===\n");

  // Create Persona via raw INSERT then get lastID
  const resP = await queryDb<any>(
    "INSERT INTO Personas (Name, FirstName, LastName, Username, Bio, WebsiteUrl) VALUES (?,?,?,?,?,?)",
    ['SEO Test', 'Alex', 'Walker', 'alexwalker', 'SEO Professional & Digital Marketer', 'https://google.com']
  );
  const personaId = resP[0]?.lastID;
  console.log(`Persona created: ID=${personaId}`);

  // Create Campaign
  const resC = await queryDb<any>(
    "INSERT INTO Campaigns (Name, PersonaId, Status) VALUES (?,?,?)",
    ['Test Run ' + new Date().toISOString().slice(0,16), personaId, 'Idle']
  );
  const campaignId = resC[0]?.lastID;
  console.log(`Campaign created: ID=${campaignId}`);

  if (!campaignId) {
    console.error("FATAL: Campaign ID is undefined. DB write failed.");
    process.exit(1);
  }

  // Get active sites
  const sites = await queryDb<any>("SELECT Id, SiteName FROM Sites WHERE IsActive = 1");
  console.log(`Found ${sites.length} active sites\n`);

  // Bind sites to this campaign
  for (const s of sites) {
    await queryDb("INSERT INTO SiteTasks (CampaignId, SiteId, Status, CurrentStep) VALUES (?,?,'New','Queued')", [campaignId, s.Id]);
  }
  console.log(`Bound ${sites.length} tasks to Campaign ${campaignId}`);

  // Run automation
  console.log(`\n--- STARTING ENGINE (5 threads, all sites) ---\n`);

  await runAutomation({
    campaignId,
    threadCount: 5,
    executionMode: 'all',
    apiKeys: {
      twoCaptcha: '234941760330b5686cce13e55d2f60a0',
      deepSeek: 'sk-59b7ae9012b44eba94320f021a07fc5d',
      geezekBaseUrl: 'https://geezek.com/create_email.php'
    }
  });

  // Dump ALL proofs for this campaign (not just WebsiteUrlAdded=1)
  console.log(`\n\n===== RESULTS =====`);
  
  const allProofs = await queryDb<any>(
    `SELECT s.SiteName, p.FinalProfileUrl, p.WebsiteUrlAdded, p.Notes, t.Notes as TaskNotes 
     FROM Proofs p 
     JOIN SiteTasks t ON p.SiteTaskId = t.Id 
     JOIN Sites s ON t.SiteId = s.Id 
     WHERE t.CampaignId = ?
     ORDER BY p.Id`, [campaignId]
  );

  const taskStatuses = await queryDb<any>(
    `SELECT s.SiteName, t.Status, t.CurrentStep, t.Notes 
     FROM SiteTasks t 
     JOIN Sites s ON t.SiteId = s.Id 
     WHERE t.CampaignId = ?
     ORDER BY t.Id`, [campaignId]
  );

  console.log(`\n--- Task Results (${taskStatuses.length} tasks) ---`);
  for (const t of taskStatuses) {
    const icon = t.Status === 'Completed' ? '✅' : '❌';
    console.log(`${icon} [${t.Status}] ${t.SiteName} — ${t.CurrentStep} | ${(t.Notes || '').substring(0, 120)}`);
  }

  console.log(`\n--- Profile URLs (${allProofs.length} proofs) ---`);
  const csvLines = ['Site,ProfileURL,Username,Email,Password,Backlink'];
  for (const p of allProofs) {
    const bl = p.WebsiteUrlAdded ? '🔗 BACKLINK' : '⚠️ NO-BACKLINK';
    // Extract credentials from Notes
    const notes = p.TaskNotes || p.Notes || '';
    const userM = notes.match(/User:\s*(\S+)/);
    const emailM = notes.match(/Email:\s*(\S+)/);
    const passM = notes.match(/Pass:\s*(\S+)/);
    const user = userM ? userM[1] : '';
    const email = emailM ? emailM[1] : '';
    const pass = passM ? passM[1] : '';
    console.log(`${bl} ${p.SiteName}: ${p.FinalProfileUrl} | User: ${user} | Pass: ${pass}`);
    csvLines.push(`"${p.SiteName}","${p.FinalProfileUrl}","${user}","${email}","${pass}","${p.WebsiteUrlAdded ? 'YES' : 'NO'}"`);
  }

  // Save CSV file
  const csvPath = `profiles_campaign_${campaignId}.csv`;
  fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf-8');
  console.log(`\n📁 Results saved to: ${csvPath}`);

  console.log(`\n===== DONE =====`);
  process.exit(0);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
