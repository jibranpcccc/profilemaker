const fs = require('fs');

let f = fs.readFileSync('src/lib/deepseek.ts', 'utf8');
const searchString = 'widest variety of cases."';
const ruleToAppend = '\n\n***CRITICAL INSTRUCTION FOR API OUTPUT:*** You sit behind an automated API. You MUST ONLY output the final humanized text! Do not output any of the critique or analysis steps from the "Do a final anti-AI pass" section. You MUST skip printing the reasoning. Do NOT output markdown. Just output the final converted string exactly.';

if (f.includes(searchString)) {
  f = f.replace(searchString, searchString + ruleToAppend);
  fs.writeFileSync('src/lib/deepseek.ts', f);
  console.log('Successfully appended strict output rule.');
} else {
  console.log('Failed to append! String not found.');
}
