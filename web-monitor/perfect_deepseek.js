const fs = require('fs');
let t = fs.readFileSync('src/lib/deepseek.ts', 'utf8');

// 1. Update the prompt to ENFORCE <final_text>
const oldOutputRule = 'tags. After the closing </thinking> tag, output ONLY the final, polished humanized text. No markdown, no explanations outside the tags.';
const newOutputRule = 'tags. CRITICAL INSTRUCTION: You MUST wrap your final, polished humanized text (the final draft) inside <final_text>...</final_text> tags. DO NOT output any conversational text like "Here is the final draft". Your output must rely completely on these XML tags.';

if (t.includes(oldOutputRule)) {
  t = t.replace(oldOutputRule, newOutputRule);
}

// 2. Update the parser
const oldFunction = t.substring(t.indexOf('export async function humanizeSingleVersion'), t.indexOf('return res;\n}') + 14);

const newFunction = `export async function humanizeSingleVersion(apiKey: string, content: string, versionIndex: number, voiceSample: string = ''): Promise<AiResult> {
  const prompt = HUMANIZER_PROMPTS[versionIndex] || HUMANIZER_PROMPTS[0];
  
  let userMessage = \`Please humanize the following text:\\n\\n\${content}\`;
  if (voiceSample && voiceSample.trim().length > 0) {
    userMessage += \`\\n\\n=== VOICE CALIBRATION SAMPLE ===\\nPlease deeply analyze the writing style, vocabulary, sentence length, and paragraph structure of the following sample. You MUST match this exact writing style in your final output:\\n\\n\${voiceSample}\`;
  }

  const res = await callApi(
    apiKey,
    userMessage,
    prompt,
    0.9,
    2500
  );

  if (res.success && res.content) {
    let finalContent = res.content;

    // 1. Exact extraction from <final_text> tags (Highest priority and most resilient)
    const finalMatch = finalContent.match(/<final_text>([\\s\\S]*?)<\\/final_text>/i);
    if (finalMatch && finalMatch[1]) {
      finalContent = finalMatch[1].trim();
    } else {
      // 2. Fallbacks if the LLM forgot the tag
      finalContent = finalContent.replace(/<?\\/?thinking>[\\s\\S]*?<\\/thinking>/gi, '').trim();
      finalContent = finalContent.replace(/<thinking>[\\s\\S]*?(<\\/thinking>|$)/gi, '').trim();
      
      const splitTokenGuesses = ["Now make it not obviously AI generated:", "Now make it not obviously AI generated.", "Let me revise with more personality", "Final rewrite:", "Revised text:"];
      for (const token of splitTokenGuesses) {
        const splitIndex = finalContent.lastIndexOf(token);
        if (splitIndex !== -1) {
          let afterToken = finalContent.slice(splitIndex);
          let nextNewline = afterToken.indexOf('\\n');
          if (nextNewline !== -1) {
            finalContent = afterToken.slice(nextNewline).trim();
          }
          break;
        }
      }
      if (finalContent.includes("</thinking>")) {
        const parts = finalContent.split("</thinking>");
        finalContent = parts[parts.length - 1].trim();
      }
    }

    // Clean edge artifacts safely (never strip structural punctuation)
    finalContent = finalContent.replace(/^[:\\* \\n]+/, '').replace(/[\\* \\n]+$/, '').trim();

    res.content = finalContent;
  }

  return res;
}`;

t = t.replace(oldFunction, newFunction);
fs.writeFileSync('src/lib/deepseek.ts', t);
console.log("Updated deepseek.ts perfectly.");
