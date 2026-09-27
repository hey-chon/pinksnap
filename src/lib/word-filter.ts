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
  // Self-harm / violence threats
  'kys', 'kill yourself', 'kill urself', 'go die', 'go kill yourself',
  'end yourself', 'end your life', 'hang yourself', 'kill urself',
  'slit your wrist', 'drink bleach', 'jump off a bridge', 'neck yourself',
  'rope yourself', 'off yourself',

  // Sexual / explicit
  'rape', 'rapist', 'raping', 'raped', 'gang rape', 'gang bang',
  'child porn', 'cp', 'loli', 'shota', 'nsfw', 'nude', 'nudes',
  'send nudes', 'naked pic', 'dick pic', 'cock', 'pussy', 'cunt',
  'cum', 'cumshot', 'jizz', 'blowjob', 'handjob', 'fingering',
  'masturbate', 'masturbation', 'fap', 'fapping', 'horny', 'sex',
  'sexting', 'onlyfans', 'pornhub', 'porn', 'xxx', 'boobs', 'tits',
  'titties', 'ass', 'asshole', 'anus', 'vagina', 'penis',
  'erection', 'orgasm', 'squirt', 'dildo', 'vibrator',

  // Pedophilia
  'pedophile', 'pedo', 'paedo', 'pedophilia', 'paedophile',
  'minor attraction', 'map community', 'nambla',

  // Racial / ethnic slurs (common variations covered by obscenity lib + extras)
  'nigger', 'nigga', 'niga', 'negro', 'spic', 'spick', 'wetback',
  'chink', 'gook', 'kike', 'heeb', 'towelhead', 'raghead',
  'sandnigger', 'camel jockey', 'cracker', 'honky', 'redneck slur',
  'beaner', 'zipperhead', 'slope', 'jap', 'nip', 'wop', 'dago',
  'kraut', 'fritz', 'boche', 'polock', 'polack', 'redskin',
  'injun', 'squaw', 'coon', 'darkie', 'sambo', 'porch monkey',
  'cotton picker', 'uncle tom', 'oreo',

  // Homophobic / transphobic slurs
  'faggot', 'fag', 'dyke', 'tranny', 'shemale', 'he-she',
  'it pronoun slur', 'queer slur', 'homo',

  // General profanity (extra)
  'motherfucker', 'motherfucking', 'fucker', 'fucking', 'fucked',
  'fuckhead', 'fucktard', 'dumbfuck', 'dipshit', 'shitstain',
  'shithead', 'shitbag', 'bastard', 'bitch', 'bitches',
  'son of a bitch', 'whore', 'slut', 'skank', 'hoe', 'thot',
  'trash', 'scum', 'lowlife', 'pathetic loser', 'retard', 'retarded',
  'spastic', 'moron', 'imbecile', 'idiot', 'stupid bitch',

  // Harassment / cyberbullying
  'i will find you', 'i know where you live', 'doxx', 'dox',
  'doxing', 'swat you', 'swatting', 'hack you', 'hack your account',
  'ddos', 'i will hack', 'stalk', 'stalker', 'stalking',
  'expose you', 'leak your info', 'leak your nudes',

  // Terrorism / extremism
  'allahu akbar slur', 'isis', 'isil', 'jihad attack', 'mass shooting',
  'school shooter', 'bomb threat', 'terrorize', 'white supremacy',
  'white power', 'heil hitler', '1488', '88 meaning', 'nazi',
  'kkk', 'ku klux klan', 'final solution',

  // Drug references (harmful promotion)
  'buy drugs', 'sell drugs', 'drug dealer', 'meth', 'heroin',
  'fentanyl', 'crack cocaine', 'drug plug',

  // Reputation / defamation
  'is a predator', 'is a rapist', 'is a pedophile', 'is a terrorist',
  'is a thief', 'is a scammer', 'is fake', 'doxxed',
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
 * Now catches ALL obscenity matches (built-in English + custom list).
 */
export function findProhibitedSlur(text: string): string | null {
  const matches = matcher.getAllMatches(text);
  if (matches.length > 0) {
    // Try to return the matched word for a useful message
    const first = matches[0];
    const meta = customDataset.getPayloadWithPhraseMetadata(first);
    return meta?.phraseMetadata?.originalWord ?? text.slice(first.startIndex, first.endIndex + 1);
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

  // Block ALL matches (both built-in english profanity and custom phrases)
  if (matches.length > 0) {
    return {
      isValid: false,
      error:
        'Message contains prohibited words or slurs. Please keep the chat clean and respectful.',
    };
  }

  return {
    isValid: true,
    censoredText: trimmed,
  };
}
