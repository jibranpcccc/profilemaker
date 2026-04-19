import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { loadSettings } from '@/lib/settings';
import { generateFullProfile } from '@/lib/deepseek';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const personas = await queryDb('SELECT * FROM Personas ORDER BY Id DESC');
    return NextResponse.json({ personas });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action;

    if (action === 'generate') {
      const settings = loadSettings();
      if (!settings.DeepSeekApiKey) {
        throw new Error('DeepSeek API Key is required to auto-generate personas.');
      }

      // Generate a new persona via DeepSeek
      const profile = await generateFullProfile(
        settings.DeepSeekApiKey,
        body.brandName || 'Random Profile',
        body.niche || 'Business',
        body.websiteUrl || 'https://google.com',
        body.description || ''
      );

      if (!profile.success || !profile.persona) {
        throw new Error('AI generation failed.');
      }

      // Generate credentials
      const { generateUsername, createEmail } = await import('@/lib/geezek');
      const username = generateUsername(profile.persona.FirstName.toLowerCase());
      
      let emailObj = { email: username + '@geezek.com', password: Math.random().toString(36).slice(-10) + 'A1!' };
      try {
        emailObj = await createEmail(username);
      } catch (e) {
        console.warn("Failed to generate geezek email, using fallback");
      }

      const generated = {
        Name: `${profile.persona.FirstName} ${profile.persona.LastName}`,
        FirstName: profile.persona.FirstName,
        LastName: profile.persona.LastName,
        Username: username,
        Bio: profile.shortBio,
        WebsiteUrl: body.websiteUrl || 'https://google.com',
        Email: emailObj.email,
        Password: emailObj.password
      };

      return NextResponse.json({ generated });
    } else if (action === 'save') {
      const { Name, FirstName, LastName, Username, Bio, WebsiteUrl, Email, Password } = body.persona;
      
      const result = await queryDb<any>(`
        INSERT INTO Personas (Name, FirstName, LastName, Username, Bio, WebsiteUrl, Email, Password)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [Name, FirstName, LastName, Username, Bio, WebsiteUrl, Email, Password]);

      return NextResponse.json({ success: true, id: result[0]?.lastID });
    } else if (action === 'delete') {
      await queryDb('DELETE FROM Personas WHERE Id = ?', [body.id]);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
