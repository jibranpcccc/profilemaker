import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tasksCountRow = await queryDb<any>('SELECT COUNT(*) as total FROM SiteTasks');
    const successfulCountRow = await queryDb<any>("SELECT COUNT(*) as total FROM SiteTasks WHERE Status='Completed'");
    const failedCountRow = await queryDb<any>("SELECT COUNT(*) as total FROM SiteTasks WHERE Status='Failed'");
    const runningCountRow = await queryDb<any>("SELECT COUNT(*) as total FROM SiteTasks WHERE Status='Running'");

    const platformBreakdown = await queryDb<any>(`
      SELECT 
        s.SiteName as platform, 
        COUNT(t.Id) as totalAttempts,
        SUM(CASE WHEN t.Status='Completed' THEN 1 ELSE 0 END) as successes,
        SUM(CASE WHEN t.Status='Failed' THEN 1 ELSE 0 END) as failures
      FROM SiteTasks t
      JOIN Sites s ON t.SiteId = s.Id
      GROUP BY s.SiteName
      ORDER BY successes DESC
    `);

    // Clean up platform identifiers based on generic template hints in SiteName or Domain etc.
    // For direct sites, we might just show "Wix Sites" vs "CKAN Sites" by categorizing them
    const categorized = platformBreakdown.reduce((acc: any, row: any) => {
      let category = 'Other Frameworks';
      const pl = row.platform.toLowerCase();
      if (pl.includes('wix') || pl.includes('na') || pl.includes('ar') || pl.includes('br') || pl.includes('mx') || pl.includes('au')) category = 'Wix Framework';
      else if (pl.includes('ckan') || pl.includes('dados') || pl.includes('data') || pl.includes('opendata')) category = 'CKAN Network';
      else if (pl.includes('learndash') || pl.includes('student')) category = 'LearnDash';
      else if (pl.includes('xenforo') || pl.includes('forum')) category = 'XenForo';
      else category = 'Standalone/Custom';

      if (!acc[category]) acc[category] = { attempts: 0, successes: 0, failures: 0 };
      acc[category].attempts += row.totalAttempts;
      acc[category].successes += row.successes;
      acc[category].failures += row.failures;
      return acc;
    }, {});

    const mappedCategories = Object.keys(categorized).map(k => ({
      name: k,
      ...categorized[k]
    })).sort((a, b) => b.successes - a.successes);

    return NextResponse.json({
      global: {
        total: tasksCountRow[0]?.total || 0,
        successful: successfulCountRow[0]?.total || 0,
        failed: failedCountRow[0]?.total || 0,
        running: runningCountRow[0]?.total || 0,
      },
      platforms: mappedCategories,
      rawSites: platformBreakdown.slice(0, 50)
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
