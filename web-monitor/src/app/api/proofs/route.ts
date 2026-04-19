import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import fs from 'fs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const proofs = await queryDb<any>(`
      SELECT p.*, t.Id as TaskId, s.SiteName, s.SignupUrl
      FROM Proofs p
      JOIN SiteTasks t ON t.Id = p.SiteTaskId
      JOIN Sites s ON s.Id = t.SiteId
      ORDER BY p.CapturedAt DESC
      LIMIT 200
    `);

    const result = proofs.map((p: any) => ({
      ...p,
      hasScreenshot: p.ScreenshotPath ? fs.existsSync(p.ScreenshotPath) : false,
    }));

    return NextResponse.json({ proofs: result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
