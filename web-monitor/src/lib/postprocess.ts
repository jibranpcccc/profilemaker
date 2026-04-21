// StealthHumanizer - Non-LLM Post-Processing Engine (Layer 2)
// Pure deterministic transformations that break AI statistical fingerprints

import { applyCollocations, applyRandomCollocation } from './collocations';

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function chance(probability: number): boolean {
  return Math.random() < probability;
}

function splitSentences(text: string): string[] {
  return text.match(/[^.!?]*[.!?]+[\s]*/g)?.map(s => s.trim()).filter(s => s.length > 0) || [text.trim()];
}

function splitParagraphs(text: string): string[] {
  return text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
}

function joinParagraphs(paragraphs: string[]): string {
  return paragraphs.join('\n\n');
}

// ==================== AGGRESSIVE AI VOCABULARY REMOVAL ====================

function aggressiveSynonymSwap(text: string): string {
  const replacements: [RegExp, string[]][] = [
    [/\bdemonstrates?\b/gi, ['shows', 'makes clear', 'reveals', 'tells us']],
    [/\bfurthermore\b/gi, ['also', 'and', 'on top of that', 'plus']],
    [/\bmoreover\b/gi, ['also', 'and', 'besides', "what's more"]],
    [/\badditionally\b/gi, ['also', 'and', 'plus', 'on top of that']],
    [/\bconsequently\b/gi, ['so', 'which means', 'as a result', 'because of that']],
    [/\bsignificantly\b/gi, ['a lot', 'noticeably', 'quite a bit', 'really']],
    [/\bsubstantially\b/gi, ['a lot', 'quite a bit', 'in a big way']],
    [/\bnotably\b/gi, ['especially', 'worth pointing out', 'interestingly']],
    [/\bremarkably\b/gi, ['surprisingly', 'pretty amazing', 'kind of wild']],
    [/\bparticularly\b/gi, ['especially', 'mainly', 'mostly']],
    [/\bessentially\b/gi, ['basically', 'at its core', 'when you get down to it']],
    [/\bfundamentally\b/gi, ['basically', 'at its core', 'really']],
    [/\bultimately\b/gi, ['in the end', 'at the end of the day', 'when all is said and done']],
    [/\binherently\b/gi, ['naturally', 'by its nature', 'built into it']],
    [/\butilize\b/gi, ['use', 'work with', 'make use of']],
    [/\bfacilitate\b/gi, ['help with', 'make easier', 'enable']],
    [/\bleverage\b/gi, ['use', 'take advantage of', 'build on']],
    [/\boptimize\b/gi, ['improve', 'make better', 'fine-tune']],
    [/\bimplement\b/gi, ['set up', 'put in place', 'start using']],
    [/\bcomprehensive\b/gi, ['thorough', 'complete', 'full']],
    [/\binnovative\b/gi, ['new', 'fresh', 'creative', 'different']],
    [/\btransformative\b/gi, ['game-changing', 'really big', 'major']],
    [/\bunprecedented\b/gi, ['never seen before', 'completely new', 'totally unusual']],
    [/\bstreamline\b/gi, ['simplify', 'make smoother', 'speed up']],
    [/\bcrucial\b/gi, ['key', 'important', 'really matters']],
    [/\bpivotal\b/gi, ['key', 'important', 'central']],
    [/\bit is evident that\b/gi, ['clearly', 'obviously', 'you can see that']],
    [/\bit is clear that\b/gi, ['clearly', 'obviously']],
    [/\bplays? a crucial role\b/gi, ['matters a lot', 'is really important', 'makes a big difference']],
    [/\bplays? an important role\b/gi, ['matters', 'is important', 'makes a difference']],
    [/\bhas the potential to\b/gi, ['could', 'might', 'stands to']],
    [/\bin today's world\b/gi, ['now', 'these days', 'right now']],
    [/\bin the modern era\b/gi, ['now', 'these days']],
    [/\bin conclusion\b/gi, ['']],
    [/\bin summary\b/gi, ['']],
    [/\bto summarize\b/gi, ['']],
    [/\bit is important to note\b/gi, ['']],
    [/\bit is worth noting\b/gi, ['']],
    [/\bit is worth mentioning\b/gi, ['']],
    [/\bdelves? into\b/gi, ['looks at', 'digs into', 'explores']],
    [/\blandscape\b/gi, ['space', 'area', 'world', 'field']],
    [/\bmultifaceted\b/gi, ['complex', 'complicated', 'many-sided']],
    [/\bembark on a journey\b/gi, ['start', 'begin', 'get into']],
    [/\bseamless(ly)?\b/gi, ['smooth', 'easy', 'natural']],
    [/\bnumerous\b/gi, ['many', 'a lot of', 'tons of']],
    [/\ba variety of\b/gi, ['different', 'various', 'all kinds of']],
    [/\ba multitude of\b/gi, ['many', 'a lot of', 'tons of']],
    [/\ba significant number of\b/gi, ['many', 'a lot of']],
  ];

  let result = text;
  for (const [pattern, alternatives] of replacements) {
    result = result.replace(pattern, () => randomPick(alternatives));
  }
  return result;
}

// ==================== SENTENCE LENGTH MANIPULATION ====================

function manipulateSentenceLengths(text: string): string {
  const paragraphs = splitParagraphs(text);
  
  return paragraphs.map(p => {
    if (p.startsWith('#') || p.startsWith('-') || p.startsWith('*') || p.startsWith('>')) {
      return p;
    }

    const sentences = splitSentences(p);
    const result: string[] = [];

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const words = sentence.trim().split(/\s+/);
      const wc = words.length;

      // Merge two consecutive short sentences (both < 8 words) with 15% chance
      if (
        wc < 8 && i < sentences.length - 1 &&
        sentences[i + 1].trim().split(/\s+/).length < 8 &&
        chance(0.15)
      ) {
        const next = sentences[i + 1].trim();
        const conjunction = randomPick(['and', 'but', 'while', 'whereas']);
        const merged = sentence.trim().replace(/[.!?]+$/, '') + ', ' + conjunction + ' ' +
          next.charAt(0).toLowerCase() + next.slice(1);
        result.push(merged);
        i++;
        continue;
      }

      // Split long sentences (>30 words) at a natural break point with 25% chance
      if (wc > 30 && chance(0.25)) {
        const breakPatterns = [
          /,\s+(?:and|but|or|while)\s+/gi,
          /,\s+(?:which|that|where|when|who)\s+/gi,
        ];

        let found = false;
        for (const pattern of breakPatterns) {
          const match = sentence.match(pattern);
          if (match && match.index !== undefined && match.index > 10 && match.index < sentence.length - 10) {
            const first = sentence.slice(0, match.index).replace(/[,:]$/, '');
            const second = sentence.slice(match.index).replace(/^,?\s*/, '');
            const secondCapitalized = second.charAt(0).toUpperCase() + second.slice(1);
            result.push(first + '. ' + secondCapitalized);
            found = true;
            break;
          }
        }
        if (found) continue;
      }

      result.push(sentence);
    }

    return result.join(' ');
  }).join('\n\n');
}

// ==================== FLOW DISRUPTION ====================

function disruptFlow(text: string): string {
  const paragraphs = splitParagraphs(text);
  return paragraphs.map(p => {
    if (p.startsWith('#') || p.startsWith('-') || p.startsWith('*') || p.startsWith('>')) {
      return p;
    }

    const sentences = splitSentences(p);
    if (sentences.length < 2) return p;

    const result = [...sentences];

    // 15% chance: add a short emphasis sentence
    if (chance(0.15) && result.length >= 3) {
      const insertions = ['Right.', 'Exactly.', 'Makes sense.', 'Think about that.'];
      const idx = 1 + Math.floor(Math.random() * (result.length - 1));
      result.splice(idx, 0, randomPick(insertions));
    }

    // 10% chance: start with a conjunction
    if (chance(0.10)) {
      const conjunctions = ['And ', 'But ', 'So ', 'Plus '];
      result[0] = randomPick(conjunctions) + result[0].charAt(0).toLowerCase() + result[0].slice(1);
    }

    return result.join(' ');
  }).join('\n\n');
}

// ==================== PUNCTUATION NOISE ====================

function addPunctuationNoise(text: string): string {
  let result = text;

  // 5% chance: em-dash instead of comma
  if (chance(0.05)) {
    const commas = Array.from(result.matchAll(/,\s/g));
    if (commas.length > 0) {
      const c = randomPick(commas);
      if (c.index !== undefined) {
        const before = result.slice(0, c.index);
        const after = result.slice(c.index + c[0].length);
        result = before + '—' + after;
      }
    }
  }

  // 5% chance: semicolon between related sentences
  if (chance(0.05)) {
    const periodSpaces = Array.from(result.matchAll(/\.\s+(?=[A-Z])/g));
    if (periodSpaces.length > 0) {
      const p = randomPick(periodSpaces);
      if (p.index !== undefined && p.index > 0) {
        const before = result.slice(0, p.index);
        const after = result.slice(p.index + p[0].length);
        result = before + '; ' + after.charAt(0).toLowerCase() + after.slice(1);
      }
    }
  }

  return result;
}

// ==================== PARAGRAPH STRUCTURE RANDOMIZATION ====================

function randomizeParagraphs(text: string): string {
  const paragraphs = splitParagraphs(text);
  if (paragraphs.length <= 1) return text;

  const result: string[] = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    
    if (p.startsWith('#') || p.startsWith('-') || p.startsWith('*') || p.startsWith('>')) {
      result.push(p);
      continue;
    }

    const sentences = splitSentences(p);

    // 15% chance to split a paragraph into two
    if (sentences.length >= 4 && chance(0.15)) {
      const splitPoint = 1 + Math.floor(Math.random() * (sentences.length - 2));
      const first = sentences.slice(0, splitPoint).join(' ');
      const second = sentences.slice(splitPoint).join(' ');
      result.push(first);
      result.push(second);
      continue;
    }

    result.push(p);
  }

  return joinParagraphs(result);
}

// ==================== MAIN POST-PROCESS FUNCTION ====================

/**
 * Apply all non-LLM post-processing transformations to humanized text.
 * This runs AFTER the AI rewrite to further break statistical fingerprints.
 */
export function postprocess(text: string): string {
  let result = text;

  // 1. Aggressive AI vocabulary removal
  result = aggressiveSynonymSwap(result);

  // 2. Collocation replacements (150+ AI phrase → human phrase)
  result = applyCollocations(result);

  // 3. Sentence length manipulation
  result = manipulateSentenceLengths(result);

  // 4. Flow disruption
  result = disruptFlow(result);

  // 5. Punctuation noise
  result = addPunctuationNoise(result);

  // 6. Paragraph randomization
  result = randomizeParagraphs(result);

  // 7. Additional random collocation passes
  for (let i = 0; i < 3; i++) {
    result = applyRandomCollocation(result);
  }

  // 8. Clean up
  result = result
    .replace(/  +/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\.+\./g, '.')
    .trim();

  return result;
}
