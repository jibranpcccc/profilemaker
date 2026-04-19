const fs = require('fs');
const path = require('path');

const logPath = path.join(process.env.LOCALAPPDATA, 'ProfileSubmissionAssistant', 'Logs', 'Detailed_Debug_Log.jsonl');
const outputPath = path.join(__dirname, 'logs', 'Full_Test_Report.txt');

// Ensure logs dir exists
fs.mkdirSync(path.join(__dirname, 'logs'), { recursive: true });

const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n').filter(l => l.trim());
const entries = lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

// Filter to latest run (last 2 hours)
const cutoff = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
const recent = entries.filter(e => e.timestamp >= cutoff);

const successes = recent.filter(e => e.step === 'SUCCESS');
const failures = recent.filter(e => e.step === 'FAILURE');
const signups = recent.filter(e => e.step === 'SIGNUP_COMPLETED');

let report = '';
report += '=' .repeat(80) + '\n';
report += '  PROFILE MAKER — FULL TEST REPORT\n';
report += '  Generated: ' + new Date().toISOString() + '\n';
report += '=' .repeat(80) + '\n\n';

report += '📊 SUMMARY\n';
report += '-'.repeat(40) + '\n';
report += `  Total SUCCESS:  ${successes.length}\n`;
report += `  Total FAILURES: ${failures.length}\n`;
report += `  Total SIGNUPS:  ${signups.length}\n`;
report += `  Success Rate:   ${successes.length + failures.length > 0 ? Math.round(successes.length / (successes.length + failures.length) * 100) : 0}%\n\n`;

report += '✅ SUCCESSFUL PROFILES\n';
report += '-'.repeat(80) + '\n';
successes.forEach((s, i) => {
  report += `  ${i+1}. ${s.site}\n`;
  report += `     Profile URL: ${s.profileUrl}\n`;
  report += `     Backlink:    ${s.backlinkStatus}\n`;
  report += `     Duration:    ${Math.round((s.durationMs || 0) / 1000)}s\n`;
  report += `     Time:        ${s.timestamp}\n\n`;
});

report += '❌ FAILED SITES\n';
report += '-'.repeat(80) + '\n';
// Deduplicate failures by site (show last failure per site)
const failBySite = {};
failures.forEach(f => { failBySite[f.site] = f; });
Object.values(failBySite).forEach((f, i) => {
  report += `  ${i+1}. ${f.site}\n`;
  report += `     Error: ${(f.error || '').substring(0, 120)}\n`;
  report += `     Step:  ${f.failedAtStep}\n`;
  report += `     Time:  ${f.timestamp}\n\n`;
});

report += '🔄 SIGNUP COMPLETIONS (before profile fill)\n';
report += '-'.repeat(80) + '\n';
signups.forEach((s, i) => {
  report += `  ${i+1}. ${s.site} => ${s.url}\n`;
});

report += '\n\n';
report += '📝 USERNAME DIVERSITY CHECK\n';
report += '-'.repeat(80) + '\n';
const usernames = new Set();
recent.filter(e => e.message && e.message.includes('[EMAIL] Generated')).forEach(e => {
  const match = e.message.match(/endpoint: (\S+)/);
  if (match) usernames.add(match[1]);
});
const prefixCounts = {};
usernames.forEach(u => {
  const prefix = u.split(/[0-9]/)[0];
  prefixCounts[prefix] = (prefixCounts[prefix] || 0) + 1;
});
Object.entries(prefixCounts).sort((a,b) => b[1] - a[1]).forEach(([prefix, count]) => {
  report += `  ${prefix}*: ${count} emails\n`;
});
report += `  Total unique emails: ${usernames.size}\n`;

report += '\n' + '='.repeat(80) + '\n';
report += '  END OF REPORT\n';
report += '='.repeat(80) + '\n';

fs.writeFileSync(outputPath, report);
console.log('Report written to:', outputPath);
console.log('\n' + report);
