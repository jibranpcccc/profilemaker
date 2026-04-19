const fs = require('fs');

let f = fs.readFileSync('src/lib/deepseek.ts', 'utf8');

const targetString = 'likelihood that applies to the widest variety of cases."';
const rule = '\n\n***CRITICAL RULE FOR OUTPUT:*** You MUST ONLY return the final humanized text. Do NOT include ANY of your thinking, do NOT include the "What makes the below so obviously AI generated?" section, and do NOT include any markdown formatting or explanations. Output ONLY the raw final humanized string.';

if (f.includes(targetString)) {
  f = f.replace(targetString, targetString + rule);
  fs.writeFileSync('src/lib/deepseek.ts', f);
  console.log('Appended rule successfully.');
} else {
  console.log('Target string not found.');
}
