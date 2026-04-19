import { NextResponse } from 'next/server';
import { loadSettings, saveSettings } from '@/lib/settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const s = loadSettings();
  return NextResponse.json({
    twoCaptchaApiKey: s.TwoCaptchaApiKey ? '***set***' : '',
    deepSeekApiKey: s.DeepSeekApiKey ? '***set***' : '',
    geezekBaseUrl: s.GeezekBaseUrl,
    defaultUsernamePrefix: s.DefaultUsernamePrefix,
    proxyAddress: s.ProxyAddress,
    threadCount: s.ThreadCount,
    hasTwoCaptcha: !!s.TwoCaptchaApiKey,
    hasDeepSeek: !!s.DeepSeekApiKey,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    saveSettings({
      TwoCaptchaApiKey: body.twoCaptchaApiKey ?? undefined,
      DeepSeekApiKey: body.deepSeekApiKey ?? undefined,
      GeezekBaseUrl: body.geezekBaseUrl ?? undefined,
      DefaultUsernamePrefix: body.defaultUsernamePrefix ?? undefined,
      ProxyAddress: body.proxyAddress ?? undefined,
      ThreadCount: body.threadCount ?? undefined,
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
