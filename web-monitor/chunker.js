const fs = require('fs');
let t = fs.readFileSync('src/lib/deepseek.ts', 'utf8');

const targetStr = t.substring(t.indexOf('export async function humanizeSingleVersion'), t.length);

const newLogic = `export async function humanizeSingleVersion(apiKey: string, content: string, versionIndex: number, voiceSample: string = ''): Promise<AiResult> {
  const CHUNK_SIZE = 3000; 

  if (content.length <= CHUNK_SIZE) {
    return await processSingleChunk(apiKey, content, versionIndex, voiceSample);
  }

  // Split by double newline to preserve paragraph/heading integrity
  const paragraphs = content.split(/\\n\\s*\\n/);
  let chunks = [];
  let currentChunk = '';

  for (const p of paragraphs) {
    if ((currentChunk.length + p.length) > CHUNK_SIZE && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = p;
    } else {
      currentChunk += (currentChunk ? '\\n\\n' : '') + p;
    }
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  // Process chunks sequentially to prevent context-loss and API timeouts
  let finalCombinedText = '';
  for (let i = 0; i < chunks.length; i++) {
    const res = await processSingleChunk(apiKey, chunks[i], versionIndex, voiceSample);
    if (!res.success) {
      return res; 
    }
    finalCombinedText += (finalCombinedText ? '\\n\\n' : '') + res.content;
  }
  
  return { success: true, content: finalCombinedText, error: '' };
}

async function processSingleChunk(apiKey: string, content: string, versionIndex: number, voiceSample: string = ''): Promise<AiResult> {
  const prompt = HUMANIZER_PROMPTS[versionIndex] || HUMANIZER_PROMPTS[0];
  
  let userMessage = \\\`Please humanize the following text:\\\\n\\\\n\\\${content}\\\`;
  if (voiceSample && voiceSample.trim().length > 0) {
    userMessage += \\\`\\\\n\\\\n=== VOICE CALIBRATION SAMPLE ===\\\\nPlease deeply analyze the writing style, vocabulary, sentence length, and paragraph structure of the following sample. You MUST match this exact writing style in your final output:\\\\n\\\\n\\\${voiceSample}\\\`;
  }

  userMessage += \\\`\\\\n\\\\n=== CRITICAL PRESERVATION RULES ===\\\\n1. NEVER Summarize. You must rewrite the chunk exactly line-by-line.\\\\n2. PRESERVE ALL ORIGINAL HEADINGS (###, ##, etc) and bullet points perfectly. DO NOT let any "anti-pattern" rules persuade you to delete a heading or convert it to prose. If you delete a heading, it is a catastrophic failure.\\\`;

  const res = await callApi(
    apiKey,
    userMessage,
    prompt,
    0.9,
    4000 
  );

  if (res.success && res.content) {
    let finalContent = res.content;

    const finalMatch = finalContent.match(/<final_text>([\\\\s\\\\S]*?)(?:<\\\\/final_text>|$)/i);
    if (finalMatch && finalMatch[1]) {
      finalContent = finalMatch[1].trim();
    } else {
      finalContent = finalContent.replace(/<?\\\\/?thinking>[\\\\s\\\\S]*?<\\\\/thinking>/gi, '').trim();
      finalContent = finalContent.replace(/<thinking>[\\\\s\\\\S]*?(<\\\\/thinking>|$)/gi, '').trim();
      
      const splitTokenGuesses = ["Now make it not obviously AI generated:", "Now make it not obviously AI generated.", "Let me revise with more personality", "Final rewrite:", "Revised text:"];
      for (const token of splitTokenGuesses) {
        const splitIndex = finalContent.lastIndexOf(token);
        if (splitIndex !== -1) {
          let afterToken = finalContent.slice(splitIndex);
          let nextNewline = afterToken.indexOf('\\\\n');
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

    finalContent = finalContent.replace(/^[:\\\\* \\\\n]+/, '').replace(/[\\\\* \\\\n]+$/, '').trim();
    res.content = finalContent;
  }

  return res;
}`;

t = t.replace(targetStr, newLogic);
fs.writeFileSync('src/lib/deepseek.ts', t);
console.log('Chunker Applied via Substring Search!');
