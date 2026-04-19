import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    const LOG_PATH = path.join(localAppData, 'ProfileSubmissionAssistant', 'Logs', 'ProfileMaker_DebugLog.txt');

    if (!fs.existsSync(LOG_PATH)) {
      return NextResponse.json({ logs: ['Log file not found... waiting for profile maker to start.'] });
    }

    const stats = fs.statSync(LOG_PATH);
    const maxReadSize = 32 * 1024; // Read last 32 KB
    
    let startPosition = stats.size - maxReadSize;
    if (startPosition < 0) startPosition = 0;

    const buffer = Buffer.alloc(Math.min(maxReadSize, stats.size));
    const fd = fs.openSync(LOG_PATH, 'r');
    fs.readSync(fd, buffer, 0, buffer.length, startPosition);
    fs.closeSync(fd);

    const logContent = buffer.toString('utf-8');
    const lines = logContent.split(/\r?\n/);
    
    // Drop the first line as it might be cut off
    if (startPosition > 0) {
      lines.shift();
    }

    // Filter important lines (like live_monitor.py does) but take more
    const filteredLines = lines
      .filter(l => l.trim().length > 0)
      .slice(-100); // Send the last 100 recent entries

    return NextResponse.json({ logs: filteredLines });
  } catch (error: any) {
    console.error('Error fetching logs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
