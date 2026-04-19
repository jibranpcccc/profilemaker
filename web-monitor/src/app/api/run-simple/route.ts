import { NextResponse } from 'next/server';
import { runAutomation, getWorkerState } from '@/lib/automation';
import { loadSettings } from '@/lib/settings';
import { queryDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url, keywords, firstName, lastName, bio } = body;

    const workerState = getWorkerState();
    if (workerState.status === 'running') {
      return NextResponse.json({ error: 'Engine already running.' }, { status: 400 });
    }

    const settings = loadSettings();

    // Create persona
    const resP = await queryDb<any>(
      "INSERT INTO Personas (Name, FirstName, LastName, Username, Bio, WebsiteUrl) VALUES (?,?,?,?,?,?)",
      [`${firstName} ${lastName}`, firstName, lastName, `${firstName.toLowerCase()}${Math.floor(Math.random()*9000+1000)}`, bio, url]
    );
    const personaId = resP[0]?.lastID;

    // Create campaign
    const resC = await queryDb<any>(
      "INSERT INTO Campaigns (Name, PersonaId, Status) VALUES (?,?,?)",
      [`Run ${new Date().toISOString().slice(0,16)}`, personaId, 'Running']
    );
    const campaignId = resC[0]?.lastID;

    // Bind all active sites
    const sites = await queryDb<any>("SELECT Id FROM Sites WHERE IsActive = 1");
    for (const s of sites) {
      await queryDb("INSERT INTO SiteTasks (CampaignId, SiteId, Status, CurrentStep) VALUES (?,?,'New','Queued')", [campaignId, s.Id]);
    }

    // Fire automation in background
    runAutomation({
      campaignId,
      threadCount: settings.MaxThreads || 30, // Dramatically increased from 10
      executionMode: 'all',
      apiKeys: {
        twoCaptcha: settings.TwoCaptchaApiKey,
        deepSeek: settings.DeepSeekApiKey,
        geezekBaseUrl: settings.GeezekBaseUrl,
      }
    }).catch(e => console.error('Run error:', e));

    return NextResponse.json({
      message: `Started! Creating profiles for ${firstName} ${lastName} across ${sites.length} sites.`,
      campaignId,
      totalSites: sites.length
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
