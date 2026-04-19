import { queryDb } from '../src/lib/db';
import fs from 'fs';

async function main() {
  const campaignId = 29;
  
  const allProofs = await queryDb<any>(
    `SELECT s.SiteName, p.FinalProfileUrl, p.WebsiteUrlAdded, p.Notes, t.Notes as TaskNotes 
     FROM Proofs p 
     JOIN SiteTasks t ON p.SiteTaskId = t.Id 
     JOIN Sites s ON t.SiteId = s.Id 
     WHERE t.CampaignId = ?
     ORDER BY p.Id`, [campaignId]
  );

  const csvLines = ['Site,ProfileURL,Username,Email,Password,Backlink'];
  
  console.log(`\n--- Profile Results (${allProofs.length} profiles) ---\n`);
  
  for (const p of allProofs) {
    const bl = p.WebsiteUrlAdded ? 'YES' : 'NO';
    const notes = p.TaskNotes || p.Notes || '';
    const userM = notes.match(/User:\s*(\S+)/);
    const emailM = notes.match(/Email:\s*(\S+)/);
    const passM = notes.match(/Pass:\s*(\S+)/);
    const user = userM ? userM[1] : '';
    const email = emailM ? emailM[1] : '';
    const pass = passM ? passM[1] : '';
    
    console.log(`${p.SiteName} | ${p.FinalProfileUrl} | User: ${user} | Pass: ${pass} | Backlink: ${bl}`);
    csvLines.push(`"${p.SiteName}","${p.FinalProfileUrl}","${user}","${email}","${pass}","${bl}"`);
  }

  const csvPath = `profiles_campaign_${campaignId}_final.csv`;
  fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf-8');
  console.log(`\n📁 Saved: ${csvPath}`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
