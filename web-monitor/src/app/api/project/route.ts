import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const projects = await queryDb<any>('SELECT * FROM Projects ORDER BY Id DESC');
    return NextResponse.json({ projects });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const now = new Date().toISOString();

    if (body.id) {
      // Update
      await queryDb(
        'UPDATE Projects SET Name=?, BrandName=?, Niche=?, WebsiteUrl=?, Description=?, ContactEmail=?, ContactName=?, UpdatedAt=? WHERE Id=?',
        [body.name, body.brandName, body.niche, body.websiteUrl, body.description, body.contactEmail, body.contactName, now, body.id]
      );
      return NextResponse.json({ success: true, id: body.id });
    } else {
      // Create
      await queryDb(
        'INSERT INTO Projects (Name, BrandName, Niche, WebsiteUrl, Description, ContactEmail, ContactName, CreatedAt, UpdatedAt) VALUES (?,?,?,?,?,?,?,?,?)',
        [body.name || 'New Project', body.brandName || '', body.niche || '', body.websiteUrl || '', body.description || '', body.contactEmail || '', body.contactName || '', now, now]
      );
      const rows = await queryDb<any>('SELECT last_insert_rowid() as id');
      return NextResponse.json({ success: true, id: rows[0]?.id });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
