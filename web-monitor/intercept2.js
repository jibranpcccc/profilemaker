const fs = require('fs');

let t = fs.readFileSync('src/lib/deepseek.ts', 'utf8');

const targetMethod = `    // Fallback for thinking tags just in case
    finalContent = finalContent.replace(/<thinking>[\\s\\S]*?<\\/thinking>/gi, '').trim();`;

const replacementMethod = `    // Fallback for thinking tags just in case
    finalContent = finalContent.replace(/<thinking>[\\s\\S]*?<\\/thinking>/gi, '').trim();
    
    // Safely remove any dangling closing </thinking> tags and everything before them
    if (finalContent.includes("</thinking>")) {
      const parts = finalContent.split("</thinking>");
      finalContent = parts[parts.length - 1].trim();
    }`;

if (t.includes(targetMethod)) {
  t = t.replace(targetMethod, replacementMethod);
  fs.writeFileSync('src/lib/deepseek.ts', t);
  console.log("Successfully refined the filter logic for dangling tags!");
} else {
  console.log("Method not found for replacement.");
}
