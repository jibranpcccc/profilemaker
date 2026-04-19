import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const profiles = await queryDb<any>(`
      SELECT s.SiteName, p.FinalProfileUrl, p.WebsiteUrlAdded, p.Notes, p.CapturedAt,
             t.Notes as TaskNotes, t.CampaignId
      FROM Proofs p
      JOIN SiteTasks t ON p.SiteTaskId = t.Id
      JOIN Sites s ON t.SiteId = s.Id
      WHERE p.FinalProfileUrl IS NOT NULL AND p.FinalProfileUrl != ''
      ORDER BY p.Id DESC
      LIMIT 100
    `);

    // Parse username/email/password from TaskNotes
    const enriched = profiles.map((p: any) => {
      let username = '', email = '', password = '';
      const notes = p.TaskNotes || p.Notes || '';
      
      const userMatch = notes.match(/User:\s*(\S+)/);
      const emailMatch = notes.match(/Email:\s*(\S+)/);
      const passMatch = notes.match(/Pass:\s*(\S+)/);
      
      if (userMatch) username = userMatch[1];
      if (emailMatch) email = emailMatch[1];
      if (passMatch) password = passMatch[1];
      
      return {
        SiteName: p.SiteName,
        FinalProfileUrl: p.FinalProfileUrl,
        WebsiteUrlAdded: p.WebsiteUrlAdded,
        Username: username,
        Email: email,
        Password: password,
        CapturedAt: p.CapturedAt,
        CampaignId: p.CampaignId
      };
    });

    return NextResponse.json(enriched);
  } catch (e: any) {
    return NextResponse.json([], { status: 200 });
  }
}
