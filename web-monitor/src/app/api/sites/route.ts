import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 50;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (s.SiteName LIKE ? OR s.SignupUrl LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status) {
      whereClause += ' AND t.Status = ?';
      params.push(status);
    }

    const sites = await queryDb<any>(`
      SELECT s.Id, s.SiteName, s.SignupUrl, s.ReliabilityScore, s.SpeedScore, s.CaptchaPresent, s.IsActive,
             t.Id as TaskId, t.Status, t.CurrentStep, t.Notes
      FROM Sites s
      LEFT JOIN SiteTasks t ON t.SiteId = s.Id
      ${whereClause}
      ORDER BY s.ReliabilityScore DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    const countResult = await queryDb<any>(`SELECT COUNT(*) as total FROM Sites s LEFT JOIN SiteTasks t ON t.SiteId = s.Id ${whereClause}`, params);

    return NextResponse.json({ sites, total: countResult[0]?.total || 0, page, limit });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Reset site task status
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    await queryDb('UPDATE SiteTasks SET Status=?, CurrentStep=?, Notes=? WHERE Id=?', ['New', 'Ready to Start', '', body.taskId]);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Bulk Upload Sites
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const urls: string[] = body.urls || [];
    
    let addedCount = 0;
    let duplicateCount = 0;
    
    for (let u of urls) {
      const trimmed = u.trim();
      if (!trimmed) continue;
      
      let realUrl = trimmed;
      if (!realUrl.startsWith('http://') && !realUrl.startsWith('https://')) {
        realUrl = 'https://' + realUrl;
      }
      
      let siteName = realUrl.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0];
      
      const exists = await queryDb<any[]>('SELECT Id FROM Sites WHERE SiteName = ?', [siteName]);
      if (exists.length > 0) {
        duplicateCount++;
        continue;
      }
      
      await queryDb('INSERT INTO Sites (SiteName, SignupUrl, ReliabilityScore, SpeedScore) VALUES (?, ?, ?, ?)', [siteName, realUrl, 100, 100]);
      addedCount++;
    }
    
    return NextResponse.json({ success: true, added: addedCount, duplicates: duplicateCount });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
