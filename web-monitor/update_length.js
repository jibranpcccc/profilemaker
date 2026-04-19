const fs = require('fs');

let t = fs.readFileSync('src/lib/deepseek.ts', 'utf8');

// 1. Update the AI Call limit from 2500 to 8000
const oldCallApi = `  const res = await callApi(
    apiKey,
    userMessage,
    prompt,
    0.9,
    2500
  );`;
const newCallApi = `  // Append global constraints to preserve length and headings for 5000+ word articles
  userMessage += \`\\n\\n=== CRITICAL CONTENT CONSTRAINTS ===\\n1. NEVER Summarize. You must rewrite the ENTIRE article and maintain the exact same word count and paragraph count.\\n2. PRESERVE ALL HEADINGS. You must keep every single heading (###, ##, etc.) exactly where it belongs. Do not merge or delete them.\\n3. Process the full text and do not leave out the bottom half.\`;

  const res = await callApi(
    apiKey,
    userMessage,
    prompt,
    0.9,
    8000 // Increased from 2500 to allow massive articles
  );`;

if (t.includes(oldCallApi)) {
  t = t.replace(oldCallApi, newCallApi);
}

// 2. Fix the fallback parser so if it gets truncated mid-way, it doesn't fail
// In the fallback parses, the <final_text> match fails if there is no closing tag.
// If there is an opening tag but no closing tag, it means it hit the token limit.
const oldMatch = `const finalMatch = finalContent.match(/<final_text>([\\s\\S]*?)<\\/final_text>/i);`;
const newMatch = `const finalMatch = finalContent.match(/<final_text>([\\s\\S]*?)(?:<\\/final_text>|$)/i);`;

if (t.includes(oldMatch)) {
  t = t.replace(oldMatch, newMatch);
}

fs.writeFileSync('src/lib/deepseek.ts', t);
console.log("Updated length and heading preservation rules!");
