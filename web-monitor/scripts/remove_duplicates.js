import { queryDb } from '../src/lib/db';

async function removeDuplicates() {
  try {
    const sites = await queryDb('SELECT Id, SiteName, SignupUrl FROM Sites ORDER BY Id ASC');
    console.log(`Total sites in DB: ${sites.length}`);
    
    const seenNames = new Set();
    const duplicates = [];
    
    for (const s of sites) {
      if (seenNames.has(s.SiteName)) {
        duplicates.push(s.Id);
      } else {
        seenNames.add(s.SiteName);
      }
    }
    
    console.log(`Found ${duplicates.length} duplicate domains.`);
    
    if (duplicates.length > 0) {
      // Chunk duplicates deletion
      for (const id of duplicates) {
        await queryDb('DELETE FROM SiteTasks WHERE SiteId = ?', [id]);
        await queryDb('DELETE FROM Sites WHERE Id = ?', [id]);
      }
      console.log('Duplicates removed.');
    } else {
      console.log('No duplicates found.');
    }
    
  } catch (e) {
    console.error('Error removing duplicates', e);
  }
}

removeDuplicates();
