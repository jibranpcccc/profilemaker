const fs = require('fs');
let text = fs.readFileSync('src/lib/deepseek.ts', 'utf8');

const oldReplace = "let finalContent = result.replace(/<thinking>[\\s\\S]*?<\\/thinking>/g, '').trim();";
const newReplace = `let finalContent = result.trim();
      
      // Filter out blader/humanizer's multi-step scratchpad logic intelligently
      const splitToken = "Now make it not obviously AI generated.";
      if (finalContent.includes(splitToken)) {
        const parts = finalContent.split(splitToken);
        finalContent = parts[parts.length - 1].trim();
        // Remove trailing or leading markdown bold artifacts if they exist
        finalContent = finalContent.replace(/^\\*\\*/, '').replace(/\\*\\*$/, '').trim();
      }
      
      // Fallback for thinking tags just in case
      finalContent = finalContent.replace(/<thinking>[\\s\\S]*?<\\/thinking>/g, '').trim();`;

if (text.includes(oldReplace)) {
  text = text.replace(oldReplace, newReplace);
  fs.writeFileSync('src/lib/deepseek.ts', text);
  console.log('Successfully updated the response parser for safety.');
} else {
  console.log('Failed to find replace string.');
}
