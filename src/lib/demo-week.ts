import { daysBack } from "./plan";
import type { HistoryEntry, PlaybookEntry } from "./store";

/*
 * The sample week (REDESIGN 8.6): a fixed set of sample sessions, dated
 * relative to today, so a reviewer sees a streak, a plan and a then-and-now
 * without playing for seven days. Labelled on every card while it is shown.
 * Never written to storage.
 */

type Seed = Omit<HistoryEntry, "id" | "at" | "dayKey"> & { daysAgo: number };

const SEEDS: Seed[] = [
  {
    daysAgo: 6,
    kind: "daily",
    sceneId: "store-candy",
    sceneTitle: "The candy aisle",
    outcome: "out_of_turns",
    stars: 1,
    turns: 8,
    par: 3,
    helpful: 3,
    unhelpful: 7,
    tagCounts: {
      THREAT: 2,
      DISMISS: 3,
      QUESTION_COMMAND: 2,
      HOLD_LIMIT: 2,
      NAME_FEELING: 1,
    },
    points: 40,
  },
  {
    daysAgo: 5,
    kind: "daily",
    sceneId: "playground-leave",
    sceneTitle: "Leaving the playground",
    outcome: "calm_gave_in",
    stars: 1,
    turns: 5,
    par: 3,
    helpful: 4,
    unhelpful: 4,
    tagCounts: {
      DISMISS: 2,
      BRIBE: 1,
      GIVE_IN: 1,
      NAME_FEELING: 2,
      HOLD_LIMIT: 2,
    },
    points: 100,
  },
  {
    daysAgo: 4,
    kind: "daily",
    sceneId: "bedtime",
    sceneTitle: "Lights out",
    outcome: "calm_limit_held",
    stars: 2,
    turns: 6,
    par: 3,
    helpful: 8,
    unhelpful: 3,
    tagCounts: {
      DISMISS: 2,
      LECTURE: 1,
      NAME_FEELING: 3,
      HOLD_LIMIT: 3,
      CONNECT: 2,
    },
    points: 410,
  },
  {
    daysAgo: 3,
    kind: "daily",
    sceneId: "wrong-cup",
    sceneTitle: "The wrong cup",
    outcome: "calm_limit_held",
    stars: 2,
    turns: 5,
    par: 3,
    helpful: 9,
    unhelpful: 1,
    tagCounts: {
      DISMISS: 1,
      NAME_FEELING: 3,
      HOLD_LIMIT: 3,
      OFFER_CHOICE: 2,
      CONNECT: 1,
    },
    points: 570,
  },
  {
    daysAgo: 2,
    kind: "daily",
    sceneId: "tablet-off",
    sceneTitle: "Tablet off",
    outcome: "calm_limit_held",
    stars: 3,
    turns: 5,
    par: 4,
    helpful: 10,
    unhelpful: 0,
    tagCounts: { NAME_FEELING: 3, HOLD_LIMIT: 3, OFFER_CHOICE: 2, CONNECT: 2 },
    points: 600,
  },
  {
    daysAgo: 1,
    kind: "daily",
    sceneId: "dinner-refusal",
    sceneTitle: "Not eating that",
    outcome: "calm_limit_held",
    stars: 3,
    turns: 4,
    par: 3,
    helpful: 9,
    unhelpful: 1,
    tagCounts: {
      QUESTION_COMMAND: 1,
      NAME_FEELING: 3,
      HOLD_LIMIT: 3,
      OFFER_CHOICE: 2,
      CLEAR_COMMAND: 1,
    },
    points: 670,
  },
  {
    daysAgo: 0,
    kind: "daily",
    sceneId: "car-seat",
    sceneTitle: "The car seat",
    outcome: "calm_limit_held",
    stars: 3,
    turns: 4,
    par: 4,
    helpful: 10,
    unhelpful: 0,
    tagCounts: {
      NAME_FEELING: 3,
      HOLD_LIMIT: 3,
      OFFER_CHOICE: 2,
      CONNECT: 1,
      WHEN_THEN: 1,
    },
    points: 700,
  },
];

export function sampleWeek(today: string): {
  history: HistoryEntry[];
  dailyDone: Record<string, true>;
  playbook: PlaybookEntry[];
} {
  const history = SEEDS.map(({ daysAgo, ...entry }) => {
    const dayKey = daysBack(today, daysAgo);
    return {
      ...entry,
      id: `sample-${dayKey}`,
      at: `${dayKey}T23:00:00.000Z`,
      dayKey,
    };
  }).reverse();
  const dailyDone = Object.fromEntries(
    history.map((entry) => [entry.dayKey, true as const]),
  );
  const playbook: PlaybookEntry[] = [
    {
      id: "sample-line-1",
      at: `${daysBack(today, 2)}T23:10:00.000Z`,
      text: "You really wanted more time. Tablet goes off now. Do you want to press the button or should I?",
      tags: ["NAME_FEELING", "HOLD_LIMIT", "OFFER_CHOICE"],
      sceneTitle: "Tablet off",
    },
    {
      id: "sample-line-2",
      at: `${daysBack(today, 0)}T23:10:00.000Z`,
      text: "I'm right here. You hate the straps. We buckle, then you pick the song.",
      tags: ["CONNECT", "NAME_FEELING", "HOLD_LIMIT", "WHEN_THEN"],
      sceneTitle: "The car seat",
    },
  ];
  return { history, dailyDone, playbook };
}
