import { queryDb } from '../src/lib/db';

async function main() {
  console.log(`Gathering Recent Profile URLs...`);
  
  const proofs = await queryDb("SELECT s.SiteName, p.FinalProfileUrl FROM Proofs p JOIN SiteTasks t ON p.SiteTaskId = t.Id JOIN Sites s ON t.SiteId = s.Id WHERE p.FinalProfileUrl IS NOT NULL ORDER BY p.Id DESC LIMIT 20");

  console.log(`\n==== LIVE PROFILE URLs ====`);
  for (const p of proofs as any[]) {
    if (p.FinalProfileUrl && !p.FinalProfileUrl.includes('geezek')) {
      console.log(`▶ ${p.SiteName}: ${p.FinalProfileUrl}`);
    }
  }
  console.log(`===========================`);
  process.exit(0);
}

main().catch(console.error);
