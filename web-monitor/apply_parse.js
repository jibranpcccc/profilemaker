const fs = require('fs');

let t = fs.readFileSync('src/lib/deepseek.ts', 'utf8');

const targetFunction = t.substring(t.indexOf('export async function humanizeSingleVersion'), t.indexOf('return res;\n}') + 14);

const newFunction = `export async function humanizeSingleVersion(apiKey: string, content: string, versionIndex: number): Promise<AiResult> {
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

    // 1. Completely strip all <thinking> tags and everything inside them
    finalContent = finalContent.replace(/<?\\/?thinking>[\\s\\S]*?<\\/thinking>/gi, '').trim();
    finalContent = finalContent.replace(/<thinking>[\\s\\S]*?(<\\/thinking>|$)/gi, '').trim();

    // 2. Identify the common "Now make it not obviously AI generated" indicator
    const splitIndex = finalContent.lastIndexOf("Now make it not obviously AI generated");
    if (splitIndex !== -1) {
      let afterToken = finalContent.slice(splitIndex);
      let nextNewline = afterToken.indexOf('\\n');
      if (nextNewline !== -1) {
        afterToken = afterToken.slice(nextNewline).trim();
      } else {
        // fallback if there's no newline
        afterToken = afterToken.replace(/Now make it not obviously AI generated[:\\.]?/i, '').trim();
      }
      if (afterToken.length > 5) {
        finalContent = afterToken;
      }
    }

    // 3. Fallback for dangling </thinking> tags
    if (finalContent.includes("</thinking>")) {
      const parts = finalContent.split("</thinking>");
      finalContent = parts[parts.length - 1].trim();
    }

    // 4. Strip leftover artifacts like **Revised:** or dangling backticks
    finalContent = finalContent.replace(/^[:\\*\\s\\n]+/, '').replace(/[\\*\\s\\n]+$/, '').trim();

    res.content = finalContent;
  }

  return res;
}`;

t = t.replace(targetFunction, newFunction);
fs.writeFileSync('src/lib/deepseek.ts', t);
console.log("Updated deeply!");
