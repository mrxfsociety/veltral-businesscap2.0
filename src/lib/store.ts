import { z } from "zod";
import { TagSchema } from "@/shared/api";
import { isHelpfulTag } from "./playbook";
import { canSavePlaybook, isPro } from "./pro";

export const STORE_KEY = "doover:v1";
export const HISTORY_LIMIT = 200;
const MAX_STORE_CHARACTERS = 2_000_000;

export function isDayKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

const DayKeySchema = z.string().refine(isDayKey, "Invalid calendar day");
const TimestampSchema = z.string().datetime({ offset: true });
const IdentifierSchema = z.string().min(1).max(160);

export const SettingsSchema = z
  .object({
    timer: z.union([z.literal(8), z.literal(20), z.literal(0)]),
    voice: z.boolean(),
    calmBaselineDb: z.number().finite().min(-160).max(0).nullable(),
  })
  .strict();

export const HistoryEntrySchema = z
  .object({
    id: IdentifierSchema,
    at: TimestampSchema,
    dayKey: DayKeySchema,
    kind: z.enum(["daily", "library", "custom"]),
    sceneId: IdentifierSchema,
    sceneTitle: z.string().min(1).max(300),
    outcome: z.enum(["calm_limit_held", "calm_gave_in", "out_of_turns"]),
    stars: z.number().int().min(1).max(3),
    turns: z.number().int().min(1).max(8),
    par: z.number().int().min(1).max(8),
    helpful: z.number().int().min(0).max(152),
    unhelpful: z.number().int().min(0).max(152),
    tagCounts: z.partialRecord(TagSchema, z.number().int().min(0).max(8)),
  })
  .strict();

export const PlaybookEntrySchema = z
  .object({
    id: IdentifierSchema,
    at: TimestampSchema,
    text: z.string().min(1).max(300),
    tags: z
      .array(TagSchema)
      .min(1)
      .max(7)
      .refine((tags) => tags.every(isHelpfulTag)),
    sceneTitle: z.string().min(1).max(300),
  })
  .strict();

export const BrowserStoreSchema = z
  .object({
    settings: SettingsSchema,
    history: z.array(HistoryEntrySchema).max(HISTORY_LIMIT),
    playbook: z.array(PlaybookEntrySchema),
    dailyDone: z.record(DayKeySchema, z.literal(true)),
    waitlistJoined: z.boolean(),
  })
  .strict();

export type Settings = z.infer<typeof SettingsSchema>;
export type HistoryEntry = z.infer<typeof HistoryEntrySchema>;
export type PlaybookEntry = z.infer<typeof PlaybookEntrySchema>;
export type BrowserStore = z.infer<typeof BrowserStoreSchema>;

function emptyStore(): BrowserStore {
  return {
    settings: { timer: 8, voice: false, calmBaselineDb: null },
    history: [],
    playbook: [],
    dailyDone: {},
    waitlistJoined: false,
  };
}

const serverSnapshot = emptyStore();
let snapshot = emptyStore();
let storedValue: string | null | undefined;
let memoryOnly = false;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

/** A stable snapshot, including when storage is unavailable or malformed. */
export function readStore(): BrowserStore {
  if (typeof window === "undefined") return serverSnapshot;
  if (memoryOnly) return snapshot;
  let value: string | null;
  try {
    value = window.localStorage.getItem(STORE_KEY);
  } catch {
    memoryOnly = true;
    return snapshot;
  }
  try {
    if (value === storedValue) return snapshot;
    storedValue = value;
    if (value === null) {
      snapshot = emptyStore();
      return snapshot;
    }
    // Older builds could persist larger valid stores. Keep them readable so
    // users can copy or remove their lines instead of losing the whole store.
    const parsed = BrowserStoreSchema.safeParse(JSON.parse(value));
    snapshot = parsed.success ? parsed.data : emptyStore();
  } catch {
    // A corrupt JSON value must not stop a practice session.
    snapshot = emptyStore();
  }
  return snapshot;
}

export function getServerSnapshot(): BrowserStore {
  return serverSnapshot;
}

export function subscribeStore(listener: () => void): () => void {
  if (listeners.size === 0 && typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

function onStorage(event: StorageEvent): void {
  if (event.key !== STORE_KEY && event.key !== null) return;
  storedValue = undefined;
  memoryOnly = false;
  readStore();
  notify();
}

/** Invalid changes are rejected; failed persistence retains an in-memory session. */
export function updateStore(
  update: Partial<BrowserStore> | ((current: BrowserStore) => BrowserStore),
): BrowserStore {
  return writeStore(update, false);
}

function writeStore(
  update: Partial<BrowserStore> | ((current: BrowserStore) => BrowserStore),
  requirePersistence: boolean,
): BrowserStore {
  const current = readStore();
  const next =
    typeof update === "function" ? update(current) : { ...current, ...update };
  const parsed = BrowserStoreSchema.safeParse({
    ...next,
    history: next.history.slice(0, HISTORY_LIMIT),
  });
  if (!parsed.success) return current;
  const serialized = JSON.stringify(parsed.data);
  // Bound playbook growth while keeping completed runs and settings usable.
  // Older oversized playbooks remain readable and can still shrink.
  if (
    serialized.length > MAX_STORE_CHARACTERS &&
    JSON.stringify(parsed.data.playbook).length >
      JSON.stringify(current.playbook).length
  ) {
    return current;
  }
  let persisted = false;
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORE_KEY, serialized);
      persisted = true;
    }
  } catch {
    // Play can continue in memory, but a saved line must survive a reload.
  }
  if (requirePersistence && !persisted) return current;
  snapshot = parsed.data;
  storedValue = serialized;
  memoryOnly = !persisted;
  notify();
  return snapshot;
}

/** Clears memory and reports whether this application's persisted data was removed. */
export function clearStore(): boolean {
  snapshot = emptyStore();
  storedValue = null;
  let removed = false;
  try {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORE_KEY);
      removed = true;
    }
    memoryOnly = !removed;
  } catch {
    memoryOnly = true;
  }
  notify();
  return removed;
}

export function saveSettings(settings: Partial<Settings>): void {
  updateStore((current) => ({
    ...current,
    settings: { ...current.settings, ...settings },
  }));
}

/** A run id makes repeated renders idempotent; a completed do-over gets a new run id. */
export function saveHistory(entry: HistoryEntry): boolean {
  const parsed = HistoryEntrySchema.safeParse(entry);
  if (!parsed.success) return false;
  const current = readStore();
  const updated = updateStore((current) => ({
    ...current,
    history: [
      parsed.data,
      ...current.history.filter(({ id }) => id !== entry.id),
    ]
      .sort((left, right) => Date.parse(right.at) - Date.parse(left.at))
      .slice(0, HISTORY_LIMIT),
    dailyDone:
      entry.kind === "daily"
        ? { ...current.dailyDone, [entry.dayKey]: true }
        : current.dailyDone,
  }));
  return updated !== current;
}

export type SavePlaybookResult =
  | { ok: true; entry: PlaybookEntry }
  | { ok: false; reason: "limit" | "invalid" | "storage" };

export function savePlaybook(
  entry: PlaybookEntry,
  pro = isPro(),
): SavePlaybookResult {
  const parsed = PlaybookEntrySchema.safeParse(entry);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  const current = readStore();
  const existing = current.playbook.find(({ id }) => id === entry.id);
  if (!existing && !canSavePlaybook(current.playbook.length, pro)) {
    return { ok: false, reason: "limit" };
  }
  const updated = writeStore(
    {
      playbook: [
        parsed.data,
        ...current.playbook.filter(({ id }) => id !== entry.id),
      ],
    },
    true,
  );
  if (updated === current) return { ok: false, reason: "storage" };
  return { ok: true, entry: parsed.data };
}

export function removePlaybook(id: string): boolean {
  const current = readStore();
  const updated = writeStore(
    {
      playbook: current.playbook.filter((entry) => entry.id !== id),
    },
    true,
  );
  return updated !== current;
}
