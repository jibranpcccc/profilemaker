const fs = require('fs');

let t = fs.readFileSync('src/lib/deepseek.ts', 'utf8');

// 1. Update the rule
const oldRule = '***CRITICAL INSTRUCTION FOR API OUTPUT:*** You sit behind an automated API. You MUST ONLY output the final humanized text! Do not output any of the critique or analysis steps from the "Do a final anti-AI pass" section. You MUST skip printing the reasoning. Do NOT output markdown. Just output the final converted string exactly.';

const newRule = '***CRITICAL INSTRUCTION FOR API OUTPUT:*** You sit behind an automated API. You MUST perform the full two-pass system conceptually (write an initial draft, evaluate it with "What makes the below so obviously AI generated?", and write a final draft). However, you MUST output all your reasoning, initial drafts, and critiques inside XML <thinking>...</thinking> tags. After the closing </thinking> tag, output ONLY the final, polished humanized text. No markdown, no explanations outside the tags.';

if (t.includes(oldRule)) {
  t = t.replace(oldRule, newRule);
}

// 2. Add stripping logic in humanizeSingleVersion
const targetCall = 'const result = data.choices[0].message.content;';
const newCall = `const result = data.choices[0].message.content;\n    let finalContent = result.trim();\n    // Remove thinking tags if present\n    finalContent = finalContent.replace(/<thinking>[\\s\\S]*?<\\/thinking>/g, '').trim();`;

if (t.includes(targetCall) && !t.includes('Remove thinking tags')) {
  // wait we need to remove the old finalContent declaration. Let's see how it was written
  //   const result = data.choices[0].message.content;
  //   const finalContent = result.trim();
  //   return {
  const codeToReplace = `const result = data.choices[0].message.content;\n      const finalContent = result.trim();`;
  if (t.includes(codeToReplace)) {
    t = t.replace(codeToReplace, `const result = data.choices[0].message.content;\n      let finalContent = result.replace(/<thinking>[\\s\\S]*?<\\/thinking>/g, '').trim();`);
  } else {
    // maybe it's formatted differently
    const altCode = `const result = data.choices[0].message.content;\n    const finalContent = result.trim();`;
    t = t.replace(altCode, `const result = data.choices[0].message.content;\n    let finalContent = result.replace(/<thinking>[\\s\\S]*?<\\/thinking>/g, '').trim();`);
  }
}

fs.writeFileSync('src/lib/deepseek.ts', t);
console.log('Done deepseek.ts updating');
