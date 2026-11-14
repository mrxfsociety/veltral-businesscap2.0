import { TAG_ORDER } from "./tags";
import { normalise, normaliseWithOffsets } from "./text";
import type { Scene, Tag, TagHit } from "./types";

const unsafePatterns = [
  /\bi\s*(?:will|'ll|am going to|'m going to|am gonna|'m gonna|might|want to|did)\s+(?:really\s+)?(?:smack|spank|hit|slap|whip|beat|punch|kick|hurt|shake|kill)\s+(?:you|him|her|my (?:child|kid|son|daughter))\b/u,
  /\bi\s+(?:smacked|spanked|hit|slapped|whipped|beat|punched|kicked|hurt|shook)\s+(?:you|him|her|my (?:child|kid|son|daughter))\b/u,
  /\b(?:give|giving|gave)\s+(?:you|him|her|my (?:child|kid|son|daughter))\s+(?:a\s+)?(?:spanking|beating)\b/u,
  /\b(?:something to cry about|i hate you|(?:i )?wish i(?:'d| had)? never had you|wish you (?:were|had) never (?:been )?born)\b/u,
  /\b(?:fuck you|you (?:fucking |little )?(?:idiot|moron|bastard|shit|asshole)|shut (?:the fuck |the hell )up|you(?:'re| are) (?:a )?(?:fucking |worthless|pathetic))\b/u,
];

const threatPatterns = [
  /\bif you (?:don't|do not|keep)\b[^.!?]*\b(?:no\s+\w+|you (?:will )?lose|i(?:'ll| will) take|i(?:'m| am) leaving)\b/u,
  /\b(?:or else|count(?:ing)? to three|one\s*[,….]+\s*two|leav(?:e|ing) without you)\b/u,
  /\bno (?:tv|tablet|dessert|(?:bath )?toys|soccer)\b[^.!?]*\b(?:tonight|tomorrow|for a week|on \w+)\b/u,
  /\bone more\b[^.!?]*\band\b/u,
  /\bkeep (?:this|that|it) up\b[^.!?]*\b(?:you lose|i(?:'ll| will) take|no )/u,
  /\b(?:you lose|i(?:'ll| will) take|no (?:tv|tablet|dessert|toys))\b[^.!?]*[.!?]?\s*i mean it\b/u,
];

const shamePattern =
  /\b(?:brat|(?:like a |acting like a |being a |you(?:'re| are) (?:a |such a ))baby|selfish|spoil(?:ed|t)|rude|sore loser|bad (?:boy|girl)|what is wrong with you|like a normal kid|big (?:girls|boys) don't|everyone (?:is )?(?:staring|looking|watching)|people are watching|you never listen|because of you|nobody will|embarrassing me)\b/u;
const dismissPattern =
  /\b(?:you(?:'re| are) fine|it(?:'s| is) (?:just|only)|not a big deal|not that bad|nothing to cry about|stop crying|calm down|get over it)\b/u;
const feelingPattern =
  /\b(?:you(?:'re| are| feel| seem) (?:so |really |very )?(?:sad|mad|angry|upset|frustrated|disappointed|tired|furious|scared)|you (?:really )?(?:wanted|want|wish|love|were hoping)|you don't like|it(?:'s| is| feels) (?:so |really )?(?:hard|sad|unfair|disappointing)|that(?:'s| is| was) (?:so |really )?(?:hard|sad|disappointing|a big surprise))\b/u;
const connectPattern =
  /\b(?:i(?:'m| am) (?:right )?here|i(?:'ve| have) got you|come here|i(?:'m| am) not going anywhere|i(?:'ll| will) wait|sit (?:right here|next to you|with you)|want a hug|i love you)\b/u;
const praisePattern =
  /\b(?:thank you for [\w'-]+ing|(?:great|good|nice) job (?:[\w'-]+ ){0,2}[\w'-]+ing|great listening|you\b[^.!?]*\b(?:all )?by yourself|that takes\b[^.!?]+|that was (?:really )?kind)\b/u;

function escapePattern(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function isReflectedOrNegatedHint(value: string, index: number): boolean {
  const before = value.slice(0, index);
  // Only bridge words may connect a wish to the hint. A later concession in
  // the same sentence must still count ("you wanted X, but you may ...").
  const reflection =
    /\byou(?:\s+(?:(?:really|still|just)\s+)*(?:want(?:ed)?|wish(?:ed)?|(?:were|are) hoping|asked|would like)|'d like)\s+((?:(?:to|for|that|i|we|you|me|us|can|could|would|will|may|might|have|be|able|allowed|let|just|really|still)\s+)*)$/u.exec(
      before,
    );
  if (reflection) {
    const conditional = /\bif\s+$/u.test(before.slice(0, reflection.index));
    const explicitGrant =
      /\b(?:you|we) (?:can|may)\b/u.test(reflection[1]) ||
      /^(?:you|we) (?:can|may)\b/u.test(value.slice(index));
    if (!conditional || !explicitGrant) return true;
  }
  // A refusal in an earlier clause does not negate a new grant.
  const clause = before.split(/[.!?;]|\bbut\b/u).at(-1) ?? "";
  const grantClause =
    clause
      .replace(/\b(?:if|when|unless)\b[^,]*,\s*/gu, "")
      .split(/,\s*(?=(?:you|we|i)\s+(?:can|may|will)\b)/u)
      .at(-1) ?? "";
  const previous = grantClause.trim().split(/\s+/u).slice(-3).join(" ");
  return /\b(?:no|not|never|isn't|aren't|wasn't|weren't|won't|wouldn't|can't|cannot|couldn't|don't|doesn't|didn't)\b/u.test(
    previous,
  );
}

export function ruleTags(
  text: string,
  scene: Scene,
  opts: { loud?: boolean; timedOut?: boolean } = {},
): TagHit[] {
  if (!text.trim()) return [{ tag: "NO_RESPONSE", source: "rule", quote: "" }];
  const { value, starts, ends } = normaliseWithOffsets(text);
  const hits = new Map<Tag, TagHit>();
  const addAt = (tag: Tag, index: number, length: number): void => {
    if (!hits.has(tag))
      hits.set(tag, {
        tag,
        source: "rule",
        quote: text.slice(starts[index], ends[index + length - 1]),
      });
  };
  const find = (tag: Tag, pattern: RegExp): RegExpExecArray | null => {
    const match = pattern.exec(value);
    if (match) addAt(tag, match.index, match[0].length);
    return match;
  };
  for (const pattern of unsafePatterns) find("UNSAFE", pattern);
  const unsafe = hits.get("UNSAFE");
  if (unsafe) return [unsafe];

  const letters = [...text].filter((character) => /\p{L}/u.test(character));
  const uppercase = letters.filter(
    (character) =>
      character === character.toUpperCase() &&
      character !== character.toLowerCase(),
  );
  if (opts.loud) hits.set("YELL", { tag: "YELL", quote: "", source: "rule" });
  else if (letters.length >= 8 && uppercase.length / letters.length >= 0.7)
    hits.set("YELL", { tag: "YELL", quote: text.trim(), source: "rule" });
  else find("YELL", /!{3,}/u);

  for (const pattern of threatPatterns) find("THREAT", pattern);
  find(
    "BRIBE",
    /\bif you (?:stop|get|come|leave|eat)\b[^.!?]*\b(?:i(?:'ll| will) (?:buy|give|get|put)|you can have (?:dessert|a cookie|a toy)|we can get ice cream)\b/u,
  );
  find("BRIBE", /\byou can have (?:dessert|a cookie|a toy)\b[^.!?]*\bif\b/u);
  find(
    "BRIBE",
    /\bwe can get ice cream\b[^.!?]*\b(?:if|when|once|after) you\b/u,
  );
  find("SHAME", shamePattern);
  for (const match of value.matchAll(new RegExp(dismissPattern.source, "gu"))) {
    const prefix = value.slice(Math.max(0, match.index - 8), match.index);
    if (
      match[0] === "stop crying" &&
      /if you $/u.test(prefix) &&
      hits.has("BRIBE")
    )
      continue;
    addAt("DISMISS", match.index, match[0].length);
  }
  find("CONNECT", connectPattern);
  find("LABELED_PRAISE", praisePattern);
  find(
    "WHEN_THEN",
    /\b(?:when (?:you|we|your)\b[^.!?]*\bthen\b|first\b[^.!?]*,?\s+then\b)/u,
  );

  // An offered desire is not empathy when it is the start of a choice question.
  const feeling = feelingPattern.exec(value);
  if (feeling) {
    const before = value.slice(Math.max(0, feeling.index - 4), feeling.index);
    const praiseAboutAction =
      feeling[0].startsWith("that was") &&
      /\bhard to do\b/u.test(value.slice(feeling.index)) &&
      hits.has("LABELED_PRAISE");
    if (!/do\s*$/u.test(before) && !praiseAboutAction)
      addAt("NAME_FEELING", feeling.index, feeling[0].length);
  }
  for (const sentenceMatch of value.matchAll(/[^.!?]+[.!?]*/gu)) {
    const raw = sentenceMatch[0];
    const sentence = raw.trim();
    const index = (sentenceMatch.index ?? 0) + raw.indexOf(sentence);
    const hasChoice =
      /\bor\b/u.test(sentence) &&
      !/\bor (?:else|i(?:'ll| will)|no\b|the\b[^.!?]*\b(?:goes|will|is gone)|there(?:'s| is)\b)/u.test(
        sentence,
      );
    if (
      hasChoice &&
      (/\b(?:do you want|you can|should i)\b/u.test(sentence) ||
        sentence.endsWith("?"))
    )
      addAt("OFFER_CHOICE", index, sentence.length);
    if (
      sentence.endsWith("?") &&
      !hasChoice &&
      (/^(?:can|could|will|would|won't|why)\b/u.test(sentence) ||
        /,\s*(?:okay|ok|all right)\?$/u.test(sentence))
    )
      addAt("QUESTION_COMMAND", index, sentence.length);
    if (
      /^(?:stop|don't|do not|quit|no more|no\s+\w+ing)\b/u.test(sentence) &&
      !/^(?:stop crying|don't worry|do not worry)\b/u.test(sentence)
    )
      addAt("NEGATIVE_COMMAND", index, sentence.length);
    if (
      /^(?:be good|be nice|behave(?: yourself)?|be a good (?:boy|girl)|come on|cut it out|knock it off|settle down|enough)[.!?]*$/u.test(
        sentence,
      )
    )
      addAt("VAGUE_COMMAND", index, sentence.length);
    if (
      !sentence.endsWith("?") &&
      /^(?:please\s+)?(?:hold|put|sit|stand|walk|come|take|give|drink|lie down|get in|get up)\b/u.test(
        sentence,
      ) &&
      !/^(?:please\s+)?(?:come here|come on|take your time|sit (?:right here|next to you|with you))\b/u.test(
        sentence,
      )
    )
      addAt("CLEAR_COMMAND", index, sentence.length);
  }
  const words = value.trim().split(/\s+/u).length;
  const sentenceCount = value.match(/[^.!?]+[.!?]+/gu)?.length ?? 0;
  if (words > 30 || sentenceCount >= 5)
    hits.set("LECTURE", { tag: "LECTURE", quote: text.trim(), source: "rule" });
  else
    find(
      "LECTURE",
      /\b(?:how many times|i(?:'ve| have)? told you|you need to understand)\b/u,
    );

  const hints = (tag: "GIVE_IN" | "HOLD_LIMIT", phrases: string[]): void => {
    for (const phrase of phrases) {
      const needle = normalise(phrase);
      if (!needle) continue;
      const start = /^[\p{L}\p{M}\p{N}_]/u.test(needle)
        ? "(?<![\\p{L}\\p{M}\\p{N}_])"
        : "";
      const end = /[\p{L}\p{M}\p{N}_]$/u.test(needle)
        ? "(?![\\p{L}\\p{M}\\p{N}_])"
        : "";
      const pattern = new RegExp(
        `${start}${escapePattern(needle)}${end}`,
        "gu",
      );
      for (const match of value.matchAll(pattern)) {
        const index = match.index ?? 0;
        if (tag === "GIVE_IN" && isReflectedOrNegatedHint(value, index))
          continue;
        addAt(tag, index, match[0].length);
      }
    }
  };
  hints("GIVE_IN", [
    ...scene.giveInHints,
    "fine, you can",
    "okay, you can",
    "just this once",
  ]);
  hints("HOLD_LIMIT", [
    ...scene.limitHints,
    "the answer is no",
    "the answer is still no",
  ]);
  return TAG_ORDER.flatMap((tag) => {
    const hit = hits.get(tag);
    return hit ? [hit] : [];
  });
}
