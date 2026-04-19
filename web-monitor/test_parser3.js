const fs = require('fs');

const rawText = \`<thinking>
I need to humanize this text. Let me first identify all the AI patterns.

**Patterns in the original text:**

1. **Undue Emphasis on Significance:** "serves as an enduring testament", "marking a pivotal moment", "rapidly evolving technological landscape", "groundbreaking tools", "underscoring their vital role"

**Draft rewrite:**
AI coding assistants can speed up some programming tasks.

**What makes the below so obviously AI generated?**
Looking at my draft:
- The structure is still a bit formulaic

**Now make it not obviously AI generated:**

I need to add more voice, make it less balanced, and be more specific about real experiences.
</thinking>
AI coding assistants are good at the boring parts. I use one to write boilerplate - configuration files, repetitive test cases, documentation templates. It saves me maybe an hour a week on chores.\`;

let finalContent = rawText;

// Safely remove any thinking tags
finalContent = finalContent.replace(/<thinking>[\\s\\S]*?<\\/thinking>/gi, '');

// Also fallback split if the tag was broken
const splitIdx = finalContent.lastIndexOf("Now make it not obviously AI generated");
if (splitIdx !== -1) {
  const afterToken = finalContent.slice(splitIdx);
  const endOfLine = afterToken.indexOf('\\n');
  if (endOfLine !== -1) {
    const fallbackContent = afterToken.slice(endOfLine).trim();
    // Only use fallback if it's vastly shorter, meaning we correctly chopped it
    if (fallbackContent.length < finalContent.length) {
       finalContent = fallbackContent;
    }
  }
}

// Clean any leftover newlines or bold
finalContent = finalContent.replace(/^[:\\*\\s\\n]+/, '').replace(/[\\*\\s\\n]+$/, '').trim();

// Dangling tags
if (finalContent.includes('</thinking>')) {
  const parts = finalContent.split('</thinking>');
  finalContent = parts[parts.length - 1].trim();
}

console.log("=== FINAL OUTPUT ===");
console.log(finalContent);
