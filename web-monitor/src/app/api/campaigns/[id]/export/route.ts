import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rawParams = await params;
    const campaignId = parseInt(rawParams.id);
    if (!campaignId) {
      return NextResponse.json({ error: 'Valid Campaign ID required' }, { status: 400 });
    }

    // Query successful tasks and join with Personas to get credentials + Proofs to get Live URLs
    const data = await queryDb<any[]>(`
      SELECT 
        s.SiteName as TargetDomain,
        t.Status,
        t.Notes as Result,
        p.Username,
        p.Email,
        p.Password,
        pr.FinalProfileUrl as ResultUrl
      FROM SiteTasks t
      JOIN Sites s ON t.SiteId = s.Id
      JOIN Campaigns c ON t.CampaignId = c.Id
      JOIN Personas p ON c.PersonaId = p.Id
      LEFT JOIN Proofs pr ON pr.SiteTaskId = t.Id
      WHERE t.CampaignId = ? AND t.Status = 'Completed'
    `, [campaignId]);

    if (!data.length) {
      return new NextResponse('No completed records found for this campaign.', { status: 404 });
    }

    // Generate CSV string
    const headers = ['TargetDomain', 'Status', 'Username', 'Email', 'Password', 'Live Profile URL', 'Execution Notes'];
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const notesLine = ((row as any).Result || '').replace(/\n/g, ' - ').replace(/,/g, ';');
      const liveUrl = (row as any).ResultUrl || 'Registration Only (No URL Captured)';
      
      const csvRow = [
        `"${(row as any).TargetDomain}"`,
        `"${(row as any).Status}"`,
        `"${(row as any).Username}"`,
        `"${(row as any).Email}"`,
        `"${(row as any).Password}"`,
        `"${liveUrl}"`,
        `"${notesLine}"`
      ];
      csvRows.push(csvRow.join(','));
    }

    const csvContent = csvRows.join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="Campaign_${campaignId}_Export_With_Links.csv"`,
      },
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
