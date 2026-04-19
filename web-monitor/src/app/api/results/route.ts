import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const proofs = await queryDb(`
      SELECT 
        p.Id as ID, 
        s.SiteName as Domain, 
        COALESCE(
          substr(
            st.Notes, 
            instr(st.Notes, 'User: ') + 6, 
            instr(substr(st.Notes, instr(st.Notes, 'User: ') + 6), ' |') - 1
          ), 
          ''
        ) as Username,
        p.FinalProfileUrl as LiveProfileURL, 
        p.ScreenshotPath, 
        p.CapturedAt as Timestamp,
        p.Notes as BacklinkStatus,
        p.WebsiteUrlAdded
      FROM Proofs p
      JOIN SiteTasks st ON p.SiteTaskId = st.Id
      JOIN Sites s ON st.SiteId = s.Id
      ORDER BY p.CapturedAt DESC
    `);
    return NextResponse.json({ success: true, proofs });
  } catch (e: any) {
    if (e.message.includes('no such table')) {
      return NextResponse.json({ success: true, proofs: [] });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
