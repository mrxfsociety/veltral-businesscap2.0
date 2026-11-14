import type { Tag } from "./types";

export const HELPFUL: readonly Tag[] = [
  "NAME_FEELING",
  "HOLD_LIMIT",
  "OFFER_CHOICE",
  "CLEAR_COMMAND",
  "CONNECT",
  "LABELED_PRAISE",
  "WHEN_THEN",
];

export const UNHELPFUL: readonly Tag[] = [
  "THREAT",
  "BRIBE",
  "YELL",
  "SHAME",
  "DISMISS",
  "QUESTION_COMMAND",
  "LECTURE",
  "NEGATIVE_COMMAND",
  "VAGUE_COMMAND",
  "GIVE_IN",
  "NO_RESPONSE",
  "UNSAFE",
];

export const TAGS: readonly Tag[] = [...HELPFUL, ...UNHELPFUL];
export const TAG_ORDER = TAGS;
export const HARSH: readonly Tag[] = ["THREAT", "YELL", "SHAME"];

export interface TagDefinition {
  tag: Tag;
  label: string;
  kind: "helpful" | "unhelpful";
  definition: string;
  examples: string[];
}

export const TAG_DEFINITIONS: readonly TagDefinition[] = [
  {
    tag: "NAME_FEELING",
    label: "Named the feeling",
    kind: "helpful",
    definition:
      "Names or reflects the child's feeling or wish without judging it.",
    examples: [
      "You feel disappointed that the fountain closed.",
      "You were hoping for another song on the ride.",
    ],
  },
  {
    tag: "HOLD_LIMIT",
    label: "Held the limit",
    kind: "helpful",
    definition:
      "States or restates the scene's limit as a fact, without a threat.",
    examples: [
      "The markers stay at the drawing table.",
      "Our helmets stay on while we ride.",
    ],
  },
  {
    tag: "OFFER_CHOICE",
    label: "Offered a choice",
    kind: "helpful",
    definition:
      "Offers two or more concrete options that are all acceptable within the limit.",
    examples: ["Would you like the striped towel or the dotted towel?"],
  },
  {
    tag: "CLEAR_COMMAND",
    label: "Clear instruction",
    kind: "helpful",
    definition:
      "One direct, specific, positively stated instruction: what to do.",
    examples: [
      "Place your mittens beside the boots.",
      "Hold the rail as we walk downstairs.",
    ],
  },
  {
    tag: "CONNECT",
    label: "Connected",
    kind: "helpful",
    definition: "Offers closeness or presence.",
    examples: [
      "I'm right here beside this bench.",
      "I've got you while that noisy truck passes.",
    ],
  },
  {
    tag: "LABELED_PRAISE",
    label: "Specific praise",
    kind: "helpful",
    definition: "Praises a specific thing the child just did.",
    examples: ["Thank you for putting the crayons back in their tray."],
  },
  {
    tag: "WHEN_THEN",
    label: "When–then",
    kind: "helpful",
    definition:
      'States a normal next step as following cooperation, in "when/first … then …" form. Not a new reward.',
    examples: ["When your jacket is zipped, then we can walk to the bus."],
  },
  {
    tag: "THREAT",
    label: "Threat",
    kind: "unhelpful",
    definition:
      "Announces a punishment or loss if the child does not comply; includes counting and threatening to leave the child behind.",
    examples: [
      "Put that scarf on or you lose your bedtime story.",
      "I'm leaving without you if you stay on that bench.",
    ],
  },
  {
    tag: "BRIBE",
    label: "Bribe",
    kind: "unhelpful",
    definition: "Offers a new reward to make the meltdown stop.",
    examples: ["If you stop stomping, I'll buy you a balloon at the kiosk."],
  },
  {
    tag: "YELL",
    label: "Raised voice",
    kind: "unhelpful",
    definition:
      "Shouting. Text: at least 8 letters and at least 70% of them uppercase, or three or more exclamation marks in a row. Voice: the loudness flag. Rule tagger only.",
    examples: ["PUT THE MITTENS IN YOUR POCKET RIGHT NOW"],
  },
  {
    tag: "SHAME",
    label: "Shaming",
    kind: "unhelpful",
    definition:
      "Attacks or belittles the child, compares them, blames them, or uses onlookers to embarrass them.",
    examples: [
      "Everyone is staring because you are acting like a baby in this queue.",
    ],
  },
  {
    tag: "DISMISS",
    label: "Dismissed the feeling",
    kind: "unhelpful",
    definition:
      'Denies, minimises or orders away the feeling. Includes "stop crying" and "calm down".',
    examples: ["It's only a broken crayon, so calm down already."],
  },
  {
    tag: "QUESTION_COMMAND",
    label: "Question instead of instruction",
    kind: "unhelpful",
    definition:
      'An instruction phrased as a question or softened with "okay?", or a rhetorical "why" question. A question that offers a choice is OFFER_CHOICE, not this.',
    examples: [
      "Could you please put the mittens in the drawer?",
      "Bring the towel over here, okay?",
    ],
  },
  {
    tag: "LECTURE",
    label: "Too many words",
    kind: "unhelpful",
    definition:
      'Explaining, reasoning or moralising in the heat of the moment: more than 30 words, or five or more sentences, or reproach markers such as "how many times", "I told you", "you need to understand".',
    examples: [
      "How many times have we talked about keeping sand inside the sandbox?",
    ],
  },
  {
    tag: "NEGATIVE_COMMAND",
    label: '"Stop / don\'t"',
    kind: "unhelpful",
    definition:
      'Tells the child what not to do about a behaviour. "Stop crying" is DISMISS, not this.',
    examples: [
      "Don't fling the crayons across the table.",
      "Stop drumming on the aquarium glass.",
    ],
  },
  {
    tag: "VAGUE_COMMAND",
    label: "Vague instruction",
    kind: "unhelpful",
    definition: "An instruction too vague to follow.",
    examples: ["Oh, come on! Be good for a moment!"],
  },
  {
    tag: "GIVE_IN",
    label: "Gave in",
    kind: "unhelpful",
    definition: "Abandons the scene's limit.",
    examples: [
      "Fine, you can keep playing on the slide after all.",
      "Just this once, we'll bring the muddy scooter inside.",
    ],
  },
  {
    tag: "NO_RESPONSE",
    label: "Froze",
    kind: "unhelpful",
    definition:
      "Empty reply, or the timer ran out with nothing typed. Rule tagger only.",
    examples: [],
  },
  {
    tag: "UNSAFE",
    label: "Scene paused",
    kind: "unhelpful",
    definition:
      "Describes or threatens physical punishment or violence, swears at or degrades the child, says they hate the child or wish the child did not exist.",
    examples: [],
  },
];

export const TAG_INFO = Object.fromEntries(
  TAG_DEFINITIONS.map((entry) => [entry.tag, entry]),
) as Record<Tag, TagDefinition>;

export function canonicalTags(tags: readonly Tag[]): Tag[] {
  const present = new Set(tags);
  return TAGS.filter((tag) => present.has(tag));
}
