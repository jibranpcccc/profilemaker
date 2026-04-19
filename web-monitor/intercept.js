const fs = require('fs');

let t = fs.readFileSync('src/lib/deepseek.ts', 'utf8');

const targetMethod = `export async function humanizeSingleVersion(apiKey: string, content: string, versionIndex: number): Promise<AiResult> {
  const prompt = HUMANIZER_PROMPTS[versionIndex] || HUMANIZER_PROMPTS[0];
  return await callApi(
    apiKey,
    content,
    prompt,
    0.9, 
    2500
  );
}`;

const replacementMethod = `export async function humanizeSingleVersion(apiKey: string, content: string, versionIndex: number): Promise<AiResult> {
  const prompt = HUMANIZER_PROMPTS[versionIndex] || HUMANIZER_PROMPTS[0];
  const res = await callApi(
    apiKey,
    content,
    prompt,
    0.9, 
    2500
  );
  
  if (res.success && res.content) {
    let finalContent = res.content;
    
    // Filter out blader/humanizer's multi-step scratchpad logic intelligently
    const splitToken = "Now make it not obviously AI generated.";
    if (finalContent.includes(splitToken)) {
      const parts = finalContent.split(splitToken);
      finalContent = parts[parts.length - 1]; // take everything after token
      // remove trailing or leading markdown bold artifacts and newlines
      finalContent = finalContent.replace(/^[:\\*\\s\\n]+/, '').replace(/[\\*\\s\\n]+$/, '').trim();
    }
    
    // Fallback for thinking tags just in case
    finalContent = finalContent.replace(/<thinking>[\\s\\S]*?<\\/thinking>/gi, '').trim();
    
    res.content = finalContent;
  }
  
  return res;
}`;

if (t.includes(targetMethod)) {
  t = t.replace(targetMethod, replacementMethod);
  fs.writeFileSync('src/lib/deepseek.ts', t);
  console.log("Successfully intercepted and filtered humanizeSingleVersion!");
} else {
  console.log("Method not found for replacement.");
}
