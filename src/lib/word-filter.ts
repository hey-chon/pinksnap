import {
  RegExpMatcher,
  TextCensor,
  DataSet,
  englishDataset,
  englishRecommendedTransformers,
  parseRawPattern,
  type MatchPayload,
} from 'obscenity';
import type { ContentValidationResult } from '@/types/chat';

const CUSTOM_BLOCKED_PHRASES = [
  'kys', 'kill yourself', 'kill urself', 'go die',
  'rape', 'rapist',
  'pedophile', 'pedo', 'paedo'
];

const customDataset = new DataSet<{ originalWord: string }>()
  .addAll(englishDataset);

for (const phrase of CUSTOM_BLOCKED_PHRASES) {
  customDataset.addPhrase((p) =>
    p.setMetadata({ originalWord: phrase })
     .addPattern(parseRawPattern(phrase))
  );
}

const matcher = new RegExpMatcher({
  ...customDataset.build(),
  ...englishRecommendedTransformers,
});

const censor = new TextCensor().setStrategy(keepFirstAndLast);

function keepFirstAndLast(ctx: { input: string; startIndex: number; endIndex: number }) {
  const word = ctx.input.slice(ctx.startIndex, ctx.endIndex + 1);
  if (word.length <= 2) return '*'.repeat(word.length);
  return word[0] + '*'.repeat(word.length - 2) + word[word.length - 1];
}

/** Check whether a match comes from one of our custom blocked phrases. */
function isCustomBlocked(match: MatchPayload): boolean {
  const meta = customDataset.getPayloadWithPhraseMetadata(match);
  return meta?.phraseMetadata?.originalWord !== undefined;
}

/**
 * Returns the matched prohibited slur/hate-speech phrase, or null if none found.
 * Used for live-typing warnings in the chat input.
 */
export function findProhibitedSlur(text: string): string | null {
  const matches = matcher.getAllMatches(text);
  for (const match of matches) {
    if (isCustomBlocked(match)) {
      const meta = customDataset.getPayloadWithPhraseMetadata(match);
      return meta.phraseMetadata?.originalWord ?? null;
    }
  }
  return null;
}

export function validateMessageContent(text: string): ContentValidationResult {
  const trimmed = text.trim();

  if (!trimmed) {
    return {
      isValid: false,
      error: 'Message cannot be empty.',
    };
  }

  if (trimmed.length > 300) {
    return {
      isValid: false,
      error: 'Message is too long (maximum 300 characters).',
    };
  }

  const matches = matcher.getAllMatches(trimmed);

  for (const match of matches) {
    if (isCustomBlocked(match)) {
      return {
        isValid: false,
        error:
          'Message contains prohibited slurs or hate speech. Please keep the chat clean and respectful.',
      };
    }
  }

  const censoredText =
    matches.length > 0 ? censor.applyTo(trimmed, matches) : trimmed;

  return {
    isValid: true,
    censoredText,
  };
}
