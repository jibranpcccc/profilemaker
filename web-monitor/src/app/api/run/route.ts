import { NextResponse } from 'next/server';
import { runAutomation, getWorkerState, requestStop } from '@/lib/automation';
import { loadSettings } from '@/lib/settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getWorkerState());
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action || 'start';

    if (action === 'stop') {
      requestStop();
      return NextResponse.json({ message: 'Stop signal sent.' });
    }

    const workerState = getWorkerState();
    if (workerState.status === 'running') {
      return NextResponse.json({ message: 'Engine already running.', state: workerState }, { status: 400 });
    }

    const settings = loadSettings();
    const projectId = Number(body.projectId) || 1;
    const campaignId = body.campaignId ? Number(body.campaignId) : undefined;
    const threadCount = Number(body.threadCount) || settings.ThreadCount || 5;
    const executionMode = body.executionMode || 'all';
    const limitSites = body.limitSites ? Number(body.limitSites) : undefined;
    const siteIds = body.siteIds ? (body.siteIds as number[]) : undefined;
    const isTest = body.test === true;

    // Fire and forget in background
    runAutomation({
      projectId,
      campaignId,
      threadCount: isTest ? 4 : threadCount,
      apiKeys: {
        twoCaptcha: settings.TwoCaptchaApiKey,
        deepSeek: settings.DeepSeekApiKey,
        geezekBaseUrl: settings.GeezekBaseUrl,
      },
      executionMode: isTest ? 'pending' : executionMode,
      limitSites,
      siteIds
    }).catch(e => console.error('Automation run error:', e));

    return NextResponse.json({
      message: 'Automation engine started!',
      projectId, threadCount, executionMode
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

