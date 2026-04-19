import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sitesResult = await queryDb<{ totalSites: number }>('SELECT COUNT(*) as totalSites FROM Sites');
    
    // Status counts
    const statusResult = await queryDb<{ Status: string, count: number }>(`
      SELECT Status, COUNT(*) as count 
      FROM SiteTasks 
      GROUP BY Status
    `);

    let completed = 0;
    let failed = 0;
    let pending = 0;
    let running = 0;

    for (const row of statusResult) {
      if (row.Status === 'Completed') completed += row.count;
      else if (row.Status === 'Failed') failed += row.count;
      else if (row.Status === 'New' || row.Status === 'Ready to Start') pending += row.count;
      else running += row.count;
    }

    return NextResponse.json({
      totalSites: sitesResult[0]?.totalSites || 0,
      completed,
      failed,
      pending,
      running
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
