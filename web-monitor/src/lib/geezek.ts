// Creates disposable emails via geezek.com API (legacy)

export interface EmailCredential {
  email: string;
  password: string;
  webmailUrl: string;
  success: boolean;
  rawResponse?: string;
}

export function generateUsername(base: string): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let rand = '';
    for (let i = 0; i < 4; i++) rand += chars[Math.floor(Math.random() * chars.length)];
    return `${base.toLowerCase().replace(/[^a-z0-9]/g, '')}${rand}`;
}

// Simple global throttle: 1 request per 2.5 seconds
let lastGeezekCall = 0;

async function geezekThrottle() {
  const now = Date.now();
  const wait = 2500 - (now - lastGeezekCall);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastGeezekCall = Date.now();
}

export async function createEmail(
  username: string,
  baseUrl: string = 'https://geezek.com/create_email.php'
): Promise<EmailCredential> {
  await geezekThrottle();

  try {
    const body = new URLSearchParams({ username });
    const res = await fetch(baseUrl, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(15000),
    });

    const html = await res.text();
    return parseGeezekResponse(html, username);
  } catch (e: any) {
    // Construct fallback email
    const cleaned = username.replace(/[^a-zA-Z0-9]/g, '');
    return {
      email: `${cleaned}@geezek.com`,
      password: '',
      webmailUrl: 'https://geezek.com/webmail',
      success: false,
      rawResponse: e.message,
    };
  }
}

function parseGeezekResponse(html: string, requestedUsername: string): EmailCredential {
  let email = '';
  let password = '';

  // Extract email
  const emailMatch = html.match(/(?:Email|email)\s*[:\s]+\s*([a-zA-Z0-9._-]+@geezek\.com)/i);
  if (emailMatch) {
    email = emailMatch[1].trim();
  } else {
    const cleaned = requestedUsername.replace(/[^a-zA-Z0-9]/g, '');
    email = `${cleaned}@geezek.com`;
  }

  // Extract password (match up to next tag, to support spaces in generated passwords)
  const pwdMatch = html.match(/Password[:\s]+(.+?)(?:\s*Email|$|<)/i);
  if (pwdMatch) {
    password = pwdMatch[1].trim();
  }

  const success = html.toLowerCase().includes('success') || password.length > 0;

  return {
    email,
    password,
    webmailUrl: 'https://geezek.com/webmail',
    success,
    rawResponse: html.substring(0, 500),
  };
}
