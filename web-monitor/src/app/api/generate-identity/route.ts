import { NextResponse } from 'next/server';
import { loadSettings } from '@/lib/settings';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { keywords, url } = await req.json();
    const settings = loadSettings();
    const apiKey = settings.DeepSeekApiKey;

    // Random name generation
    const firsts = ['Alex', 'Jordan', 'Sam', 'Morgan', 'Taylor', 'Casey', 'Riley', 'Jamie', 'Quinn', 'Avery', 'Blake', 'Drew', 'Skyler', 'Rowan', 'Finley'];
    const lasts = ['Walker', 'Bennett', 'Collins', 'Foster', 'Hayes', 'Morgan', 'Parker', 'Reed', 'Shaw', 'Turner', 'Brooks', 'Ellis', 'Grant', 'Stone', 'Price'];
    const firstName = firsts[Math.floor(Math.random() * firsts.length)];
    const lastName = lasts[Math.floor(Math.random() * lasts.length)];

    // Generate unique email via Geezek
    let email = '';
    let emailPassword = '';
    try {
      const playwright = require('playwright');
      const browser = await playwright.chromium.launch({ headless: true, args: ['--no-sandbox'] });
      const page = await browser.newPage();
      await page.goto('https://geezek.com/create_email.php', { waitUntil: 'networkidle', timeout: 30000 });
      
      const username = `${firstName.toLowerCase()}${Math.floor(10000 + Math.random() * 90000)}`;
      await page.fill('input[name="username"]', username);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3500);

      const successText = await page.evaluate(() => {
        const el = document.querySelector('div[style*="color:green"]') || document.querySelector('div[style*="color: green"]');
        return el ? (el as HTMLElement).innerText : '';
      });

      const emailMatch = successText.match(/Email:\s*([^\s<]+)/i);
      const passMatch = successText.match(/Password:\s*([^\s<]+)/i);
      
      if (emailMatch) email = emailMatch[1].trim();
      if (passMatch) emailPassword = passMatch[1].trim();
      
      await browser.close();
    } catch (e: any) {
      console.log('[GENERATE] Email creation failed:', e.message);
      email = `${firstName.toLowerCase()}${Math.floor(10000 + Math.random() * 90000)}@geezek.com`;
    }

    // Generate password for site signups
    const sitePassword = `Pass${Math.floor(Math.random() * 9000) + 1000}!Mx`;

    // Generate bio
    let bio = '';
    if (apiKey) {
      try {
        const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: 'deepseek-chat',
            temperature: 0.8,
            max_tokens: 150,
            messages: [{
              role: 'user',
              content: `Generate a short professional bio (2-3 sentences, 40-60 words) for ${firstName} ${lastName} who works in: ${keywords}. Mention website ${url} naturally. Write ONLY the bio text.`
            }]
          })
        });
        const data = await res.json();
        bio = data.choices?.[0]?.message?.content?.trim() || '';
      } catch {}
    }

    if (!bio) {
      const kws = keywords.split(',').map((k: string) => k.trim()).filter(Boolean);
      bio = `${firstName} ${lastName} is a dedicated ${kws[0] || 'professional'} with expertise in ${kws.slice(0, 2).join(' and ') || 'the industry'}. Visit ${url} for more.`;
    }

    return NextResponse.json({ firstName, lastName, email, emailPassword, sitePassword, bio });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
