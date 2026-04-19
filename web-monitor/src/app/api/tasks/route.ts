import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tasks = await queryDb<{
      Id: number;
      SiteName: string;
      SignupUrl: string;
      Status: string;
      CurrentStep: string;
      Notes: string;
    }>(`
      SELECT 
        t.Id, 
        s.SiteName, 
        s.SignupUrl,
        t.Status, 
        t.CurrentStep,
        t.Notes
      FROM SiteTasks t 
      JOIN Sites s ON s.Id = t.SiteId
      ORDER BY 
        CASE 
          WHEN t.Status NOT IN ('Completed', 'Failed', 'New', 'Ready to Start') THEN 0
          WHEN t.Status = 'Failed' THEN 1
          WHEN t.Status IN ('New', 'Ready to Start') THEN 2
          ELSE 3
        END,
        t.Id DESC
      LIMIT 100
    `);

    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
