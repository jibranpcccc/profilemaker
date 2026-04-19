const fs = require('fs');

async function update() {
  const url = 'https://raw.githubusercontent.com/blader/humanizer/main/SKILL.md';
  const res = await fetch(url);
  const text = await res.text();
  
  // Clean up the text by escaping backticks and dollars so it can be put in a template string
  const safeText = text.replace(/`/g, '\\`').replace(/\$/g, '\\$');
  
  let file = fs.readFileSync('src/lib/deepseek.ts', 'utf8');
  
  // Find the HUMANIZER_PROMPTS array and replace the first element
  const newPrompt = `\`You are the ultimate text humanizer, strictly following this comprehensive set of 29 anti-patterns to remove all AI footprints.\\n\\n${safeText}\``;
  
  // A regex or string replacement to swap out the first prompt in the array
  // Wait, I can just split by HUMANIZER_PROMPTS = [
  const parts = file.split('const HUMANIZER_PROMPTS = [');
  const innerParts = parts[1].split('];');
  
  // The first element is between the first [ and the first comma that isn't inside quotes.
  // Since I know my current code looks like:
  /*
const HUMANIZER_PROMPTS = [
  'You are an elite text humanizer specializing...',
  'You are an elite text humanizer. Your task...',
  */
  // I can just replace the first string using a simpler replace
  const currentPrompt0 = `  'You are an elite text humanizer specializing in anti-pattern removal. You MUST completely rewrite the text to eliminate ALL AI footprints. CRITICAL RULES: 1. Maximize "burstiness" by aggressively mixing extremely short, punchy sentences (2-5 words) with longer, winding ones. 2. Maximize "perplexity" by avoiding predictable word pairings. 3. STRICTLY FORBIDDEN WORDS: delve, crucial, pivotal, landscape, tapestry, testament, beacon, realm, embark, multifaceted, inherently, comprehensive, moreover, furthermore, thus, hence, foster. 4. Eliminate all signposting ("firstly", "in conclusion"). 5. Use active voice exclusively. 6. Introduce mild imperfections like starting sentences with "And" or "But". Return ONLY the final text.',`;
  
  if (file.includes(currentPrompt0)) {
    file = file.replace(currentPrompt0, `  ${newPrompt},`);
    fs.writeFileSync('src/lib/deepseek.ts', file);
    console.log("Successfully injected FULL blader/humanizer SKILL.md prompt into deepseek.ts");
  } else {
    console.log("Could not find the exact current prompt string to replace.");
  }
}

update();
