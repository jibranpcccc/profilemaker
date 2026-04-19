import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const campaigns = await queryDb(`
      SELECT 
        c.Id, 
        c.Name, 
        c.Status,
        (SELECT COUNT(*) FROM SiteTasks WHERE CampaignId = c.Id) as TotalSites,
        (SELECT COUNT(*) FROM SiteTasks WHERE CampaignId = c.Id AND Status = 'Completed') as CompletedSites
      FROM Campaigns c 
      ORDER BY c.CreatedAt DESC
    `);
    
    return NextResponse.json({ success: true, campaigns });
  } catch (e: any) {
    if (e.message.includes('no such table')) {
      return NextResponse.json({ success: true, campaigns: [] });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
