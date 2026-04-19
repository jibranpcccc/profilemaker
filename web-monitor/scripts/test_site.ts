import { queryDb } from '../src/lib/db';
import { runAutomation } from '../src/lib/automation';

async function main() {
  const nicheName = 'Test';
  const firstName = 'Fixer';
  const lastName = 'Test';
  const bio = 'Testing if TinyMCE bio and website URL are correctly populated.';

  const resP = await queryDb<any>("INSERT INTO Personas (Name, FirstName, LastName, Username, Bio, WebsiteUrl) VALUES (?,?,?,?,?,?)", [`${firstName} ${lastName}`, firstName, lastName, 'fixer21437', bio, 'https://testfixer.com']);
  const personaId = resP[0]?.lastID;
  const resC = await queryDb<any>("INSERT INTO Campaigns (Name, PersonaId, Status) VALUES (?,?,?)", ['TestRun', personaId, 'Idle']);
  const campaignId = resC[0]?.lastID;
  
  const sites = await queryDb<any>("SELECT Id FROM Sites WHERE SiteName = 'institutocrecer.edu.co'");
  for (const s of sites) await queryDb("INSERT INTO SiteTasks (CampaignId, SiteId, Status, CurrentStep) VALUES (?,?,'New','Queued')", [campaignId, s.Id]);

  await runAutomation({ campaignId, threadCount: 1, executionMode: 'all', apiKeys: { twoCaptcha: '234941760330b5686cce13e55d2f60a0', deepSeek: 'sk-59b7ae9012b44eba94320f021a07fc5d', geezekBaseUrl: 'https://geezek.com/create_email.php' }});
  
  const p = await queryDb<any>('SELECT FinalProfileUrl FROM Proofs WHERE SiteTaskId IN (SELECT Id FROM SiteTasks WHERE CampaignId=?)', [campaignId]);
  console.log('Result URL:', p[0]?.FinalProfileUrl);
  process.exit(0);
}
main();
