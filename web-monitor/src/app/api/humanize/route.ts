import { NextResponse } from 'next/server';
import { humanizeSingleVersion, HUMANIZER_NAMES } from '@/lib/deepseek';
import { loadSettings } from '@/lib/settings';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { apiKey, content, versionIndex, voiceSample } = body;

    if (!apiKey) {
      const settings = loadSettings();
      apiKey = settings.DeepSeekApiKey;
    }

    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'DeepSeek API Key is required. Set it in settings.' }, { status: 400 });
    }

    if (!content) {
      return NextResponse.json({ success: false, error: 'Content is required.' }, { status: 400 });
    }
    
    if (versionIndex === undefined || versionIndex < 0 || versionIndex > 4) {
      return NextResponse.json({ success: false, error: 'Invalid version index.' }, { status: 400 });
    }

    const result = await humanizeSingleVersion(apiKey, content, versionIndex, voiceSample);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      version: {
        name: HUMANIZER_NAMES[versionIndex],
        success: true,
        content: result.content
      } 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Force hot reload
// Force hot reload
// Trigger Reload Chunker