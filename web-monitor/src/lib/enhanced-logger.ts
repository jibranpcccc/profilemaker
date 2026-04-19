import fs from 'fs';
import path from 'path';

// Logs stored inside project folder for easy access
const LOG_DIR = path.resolve(__dirname, '..', '..', '..', 'logs');
const DETAILED_LOG = path.join(LOG_DIR, 'Detailed_Debug_Log.jsonl');
const HUMAN_LOG = path.join(LOG_DIR, 'Human_Readable_Log.txt');
const SUMMARY_LOG = path.join(LOG_DIR, 'Campaign_Summary.txt');

// Ensure log directory exists
try { fs.mkdirSync(LOG_DIR, { recursive: true }); } catch {}

export function getLogDir() { return LOG_DIR; }

export interface LogEntry {
  timestamp: string;
  site: string;
  step: string;
  status?: 'SUCCESS' | 'FAILED' | 'RETRY' | 'INFO';
  data?: any;
  durationMs?: number;
  error?: string;
}

export function logDetailed(siteName: string, step: string, data: any = {}) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    site: siteName,
    step: step,
    ...data
  };

  // JSON Lines (perfect for analysis)
  fs.appendFileSync(DETAILED_LOG, JSON.stringify(entry) + '\n');

  // Human readable
  const humanMsg = data.error 
    ? `[${entry.timestamp}] [${siteName}] [${step}] ❌ ${data.error}`
    : `[${entry.timestamp}] [${siteName}] [${step}] ${JSON.stringify(data)}`;
  
  fs.appendFileSync(HUMAN_LOG, humanMsg + '\n');
}

export function logSuccess(siteName: string, profileUrl: string, backlinkStatus: string, duration: number) {
  logDetailed(siteName, 'SUCCESS', {
    status: 'SUCCESS',
    profileUrl,
    backlinkStatus,
    durationMs: duration
  });
}

export function logFailure(siteName: string, error: string, step: string) {
  logDetailed(siteName, 'FAILURE', {
    status: 'FAILED',
    error,
    failedAtStep: step
  });
}

export function logRetry(siteName: string, attempt: number, maxRetries: number) {
  logDetailed(siteName, 'RETRY', {
    status: 'RETRY',
    attempt,
    maxRetries
  });
}

export function exportDebugPackage() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const packagePath = path.join(LOG_DIR, `Debug_Package_${timestamp}`);
  
  console.log(`\n📦 DEBUG PACKAGE CREATED`);
  console.log(`   Location: ${packagePath}`);
  console.log(`   Files:`);
  console.log(`   - Detailed_Debug_Log.jsonl (for me to analyze)`);
  console.log(`   - Human_Readable_Log.txt (easy to read)`);
  console.log(`   - Campaign_Summary.txt`);
  console.log(`   - Screenshots/ folder`);
}
