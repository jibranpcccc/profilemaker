const rawText = \`<thinking>
I need to humanize this text. Let me first identify all the AI patterns.

**Patterns in the original text:**

1. **Undue Emphasis on Significance:** "serves as an enduring testament", "marking a pivotal moment", "rapidly evolving technological landscape", "groundbreaking tools", "underscoring their vital role"
2. **Superficial -ing Analyses:** "underscoring their vital role", "highlighting the intricate interplay"
3. **Promotional Language:** "groundbreaking", "seamless, intuitive, and powerful", "exciting times"
4. **Vague Attributions:** "Industry observers have noted"
5. **Negative Parallelisms:** "It's not just about autocomplete; it's about unlocking creativity"
6. **Rule of Three Overuse:** "streamlining processes, enhancing collaboration, and fostering alignment", "hallucinations, bias, and accountability"
7. **Copula Avoidance:** "serves as a catalyst", "functions as a partner", "stands as a foundation"
8. **False Ranges:** "from hobbyist experiments to enterprise-wide rollouts, from solo developers to cross-functional teams"
9. **Em Dash Overuse:** "these groundbreaking tools—nestled at the intersection of research and practice—are reshaping"
10. **Emojis and Inline-Header Lists:** The entire section with 💡, 🚀, ✅
11. **Knowledge-Cutoff Disclaimers:** "While specific details are limited based on available information"
12. **Excessive Hedging:** "it could potentially be argued that these tools might have some positive effect"
13. **Filler Phrases:** "In order to fully realize this potential"
14. **Generic Positive Conclusions:** "the future looks bright", "Exciting times lie ahead"
15. **Collaborative Communication Artifacts:** "Let me know if you'd like me to expand on any section!"
16. **Persuasive Authority Tropes:** "At its core"
17. **Signposting:** "In conclusion"
18. **AI Vocabulary:** "transformative", "evolving landscape", "showcases", "intricate interplay", "align with"

Let me create a draft rewrite:

**Draft rewrite:**

AI coding assistants can speed up some programming tasks. A 2023 study from GitHub found developers using Copilot completed coding tasks about 55% faster on average, though the quality of the code varied.

The tools are good at writing boilerplate code, generating documentation, and creating test cases. They're less reliable for complex logic or architectural decisions. Many developers use them as advanced autocomplete but still review every suggestion carefully.

Adoption has grown quickly. What started with individual programmers trying GitHub Copilot has expanded to teams at companies like Microsoft and Google integrating these tools into their workflows. Articles in The New York Times and Wired have covered this shift.

The main benefits seem to be:
- Speed: Writing code faster
- Consistency: Following established patterns
- Reducing tedium: Automating repetitive tasks

But there are real problems. The AI sometimes "hallucinates" - making up libraries or functions that don't exist. It can introduce security vulnerabilities or biases from its training data. Teams need good testing practices to catch these issues.

The tools aren't magic, but they're becoming a standard part of many developers' toolkits.

**What makes the below so obviously AI generated?**

Looking at my draft:
- The structure is still a bit formulaic (benefits, then problems, then conclusion)
- The statistics and company names feel like placeholders unless they're specifically real
- The tone is still fairly neutral and report-like without much personality
- The transition from benefits to problems is very clean and balanced
- The final sentence is a bit of a bland summary

**Now make it not obviously AI generated:**

I need to add more voice, make it less balanced, and be more specific about real experiences.
</thinking>
AI coding assistants are good at the boring parts. I use one to write boilerplate - configuration files, repetitive test cases, documentation templates. It saves me maybe an hour a week on chores.

But it's terrible at knowing when it's wrong. Last month, it suggested using a deprecated API method with perfect confidence. The code compiled fine but would have broken in production. I only caught it because I still read every line.

The hype says these tools are "transforming software development." The reality is messier. At my company, about half the engineering team uses Copilot daily. The other half turned it off after it kept suggesting patterns we'd explicitly decided against. Both sides are probably right.

The studies I've seen show mixed results. Yes, developers complete simple tasks faster. No, they don't necessarily write better code. The AI doesn't understand what your application is supposed to *do* - it just predicts the next token.

The real risk isn't that the AI writes bad code. It's that we stop paying attention. If you don't have solid tests and code reviews, you're trusting a statistical model with your product.\`;

let finalContent = rawText;

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

// Safely remove any dangling closing </thinking> tags and everything before them
if (finalContent.includes("</thinking>")) {
  const parts = finalContent.split("</thinking>");
  finalContent = parts[parts.length - 1].trim();
}

console.log("---------------");
console.log(finalContent);
console.log("---------------");
