

async function createTestCampaign() {
  try {
    const res = await fetch('http://localhost:3001/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_with_auto_persona',
        name: 'Full Platform Test Campaign',
        targetUrl: 'https://seotester.com',
        keywords: 'marketing, full test',
        targetSites: [1271, 1272, 1273, 1274, 1275, 1276, 1277, 1278, 1279, 1280, 1281, 1282, 1283, 1284, 1285, 1286, 1287, 1288, 1289, 1290, 1291, 1292, 1293, 1294]
      })
    });
    const data = await res.json();
    console.log('Created campaign:', data);
    return data.campaignId;
  } catch (e) {
    console.error('Error creating campaign', e);
  }
}

async function startAutomation(campaignId) {
  try {
    const res = await fetch('http://localhost:3001/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', campaignId })
    });
    const data = await res.json();
    console.log('Automation started:', data);
  } catch (e) {
    console.error('Error starting automation', e);
  }
}

async function exportCampaign(campaignId) {
  try {
    const res = await fetch(`http://localhost:3001/api/campaigns/${campaignId}/export`);
    const csv = await res.text();
    console.log('Export CSV:\n', csv);
  } catch (e) {
    console.error('Error exporting campaign', e);
  }
}

(async () => {
  const campaignId = await createTestCampaign();
  if (!campaignId) return;
  await startAutomation(campaignId);
  // Wait a bit for the test run to finish (approx 4 mins)
  console.log('Waiting for automation to finish...');
  await new Promise(r => setTimeout(r, 240000));
  await exportCampaign(campaignId);
})();
