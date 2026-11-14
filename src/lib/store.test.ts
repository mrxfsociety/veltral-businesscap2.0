import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  STORE_KEY,
  clearStore,
  readStore,
  removePlaybook,
  saveHistory,
  savePlaybook,
  saveSettings,
  subscribeStore,
  updateStore,
  type HistoryEntry,
  type PlaybookEntry,
} from "./store";

const historyEntry: HistoryEntry = {
  id: "run-1",
  at: "2026-11-14T14:00:00.000Z",
  dayKey: "2026-11-14",
  kind: "daily",
  sceneId: "bedtime",
  sceneTitle: "Bedtime",
  outcome: "calm_limit_held",
  stars: 3,
  turns: 4,
  par: 3,
  helpful: 2,
  unhelpful: 0,
  tagCounts: { CONNECT: 2 },
};

const playbookEntry: PlaybookEntry = {
  id: "line-1",
  at: "2026-11-14T14:00:00.000Z",
  text: "I can stay close while we take a breath.",
  tags: ["CONNECT"],
  sceneTitle: "Bedtime",
};

let storage: Map<string, string>;
let local: Pick<Storage, "getItem" | "setItem" | "removeItem">;

beforeEach(() => {
  storage = new Map();
  local = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => {
      storage.set(key, value);
    },
    removeItem: (key) => {
      storage.delete(key);
    },
  };
  vi.stubGlobal(
    "window",
    Object.assign(new EventTarget(), { localStorage: local }),
  );
  clearStore();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("browser store", () => {
  it("keeps a stable snapshot and validates corrupt or future data", () => {
    expect(readStore()).toBe(readStore());
    storage.set(STORE_KEY, "{broken");
    expect(readStore().history).toEqual([]);
    expect(readStore()).toBe(readStore());
    storage.set(
      STORE_KEY,
      JSON.stringify({ ...readStore(), unknownField: true }),
    );
    expect(readStore().settings.timer).toBe(8);
    expect(readStore().waitlistJoined).toBe(false);
  });

  it("persists settings and notifies subscribers", () => {
    const changed = vi.fn();
    const unsubscribe = subscribeStore(changed);
    saveSettings({ timer: 20 });
    expect(readStore().settings.timer).toBe(20);
    expect(JSON.parse(storage.get(STORE_KEY) ?? "{}").settings.timer).toBe(20);
    expect(changed).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("continues in memory when private mode rejects access or quota is exhausted", () => {
    local.getItem = () => {
      throw new Error("denied");
    };
    local.setItem = () => {
      throw new Error("quota");
    };
    expect(() => saveSettings({ timer: 0 })).not.toThrow();
    expect(saveHistory(historyEntry)).toBe(true);
    expect(readStore().settings.timer).toBe(0);
    expect(readStore().history).toHaveLength(1);
    expect(readStore().dailyDone["2026-11-14"]).toBe(true);
  });

  it("uses separate ids for finished runs, ignores duplicate renders, and bounds history", () => {
    saveHistory(historyEntry);
    saveHistory(historyEntry);
    saveHistory({ ...historyEntry, id: "run-1-redo" });
    expect(readStore().history).toHaveLength(2);
    for (let index = 0; index < 205; index += 1) {
      saveHistory({
        ...historyEntry,
        id: `run-${index + 2}`,
        at: new Date(Date.UTC(2026, 10, 14, 15, 0, index)).toISOString(),
      });
    }
    expect(readStore().history).toHaveLength(200);
    expect(readStore().history[0]?.id).toBe("run-206");
  });

  it("does not store unsafe or unfinished sessions, or mark library sessions daily", () => {
    for (const outcome of ["stopped_unsafe", "ongoing"]) {
      expect(
        saveHistory({ ...historyEntry, outcome } as unknown as HistoryEntry),
      ).toBe(false);
    }
    expect(readStore().history).toEqual([]);
    saveHistory({ ...historyEntry, kind: "library" });
    expect(readStore().dailyDone).toEqual({});
  });

  it("enforces the free five-line boundary and allows updating an existing line", () => {
    for (let index = 0; index < 5; index += 1) {
      expect(
        savePlaybook({ ...playbookEntry, id: `line-${index}` }, false).ok,
      ).toBe(true);
    }
    expect(savePlaybook({ ...playbookEntry, id: "sixth" }, false)).toEqual({
      ok: false,
      reason: "limit",
    });
    expect(
      savePlaybook({ ...playbookEntry, text: "A revised saved line." }, false)
        .ok,
    ).toBe(true);
    expect(savePlaybook({ ...playbookEntry, id: "sixth" }, true).ok).toBe(true);
    expect(savePlaybook({ ...playbookEntry, tags: ["THREAT"] }, true)).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("rejects oversized growth without replacing existing saved data", () => {
    saveHistory(historyEntry);
    expect(savePlaybook(playbookEntry, true).ok).toBe(true);
    const current = readStore();
    const persisted = storage.get(STORE_KEY);
    const oversized = Array.from({ length: 5_000 }, (_, index) => ({
      ...playbookEntry,
      id: `line-${index}`,
      text: "A".repeat(300),
    }));
    expect(
      JSON.stringify({ ...current, playbook: oversized }).length,
    ).toBeGreaterThan(2_000_000);
    expect(updateStore({ playbook: oversized })).toBe(current);
    expect(storage.get(STORE_KEY)).toBe(persisted);
    expect(readStore().history).toEqual([historyEntry]);
    expect(readStore().playbook).toEqual([playbookEntry]);
  });

  it("preserves and can shrink a valid oversized playbook from an older build", async () => {
    const legacyStore = {
      ...readStore(),
      history: [historyEntry],
      playbook: Array.from({ length: 5_000 }, (_, index) => ({
        ...playbookEntry,
        id: `legacy-${index}`,
        text: "A".repeat(300),
      })),
    };
    const persisted = JSON.stringify(legacyStore);
    expect(persisted.length).toBeGreaterThan(2_000_000);
    storage.set(STORE_KEY, persisted);
    expect(readStore().playbook).toHaveLength(5_000);
    expect(savePlaybook({ ...playbookEntry, id: "new-line" }, true)).toEqual({
      ok: false,
      reason: "storage",
    });
    expect(storage.get(STORE_KEY)).toBe(persisted);
    expect(readStore().history).toEqual([historyEntry]);
    const nextRun = { ...historyEntry, id: "another-completed-run" };
    expect(saveHistory(nextRun)).toBe(true);
    expect(readStore().history).toEqual([nextRun, historyEntry]);
    expect(readStore().dailyDone[historyEntry.dayKey]).toBe(true);
    saveSettings({ timer: 0 });
    expect(readStore().settings.timer).toBe(0);
    const beforeRemoval = storage.get(STORE_KEY) ?? "";
    removePlaybook("legacy-0");
    expect(readStore().playbook).toHaveLength(4_999);
    expect((storage.get(STORE_KEY) ?? "").length).toBeLessThan(
      beforeRemoval.length,
    );

    vi.resetModules();
    const reloaded = await import("./store");
    expect(reloaded.readStore().playbook).toHaveLength(4_999);
    expect(reloaded.readStore().history).toEqual([nextRun, historyEntry]);
    expect(reloaded.readStore().dailyDone[historyEntry.dayKey]).toBe(true);
  });

  it("reports a failed playbook save and preserves saved lines when storage rejects writes", () => {
    expect(savePlaybook(playbookEntry, true).ok).toBe(true);
    const persisted = storage.get(STORE_KEY);
    local.setItem = () => {
      throw new Error("quota");
    };
    expect(savePlaybook({ ...playbookEntry, id: "unsaved" }, true)).toEqual({
      ok: false,
      reason: "storage",
    });
    expect(storage.get(STORE_KEY)).toBe(persisted);
    expect(readStore().playbook).toEqual([playbookEntry]);
  });

  it("refreshes once for a change from another tab", () => {
    const first = vi.fn();
    const second = vi.fn();
    const unsubscribeFirst = subscribeStore(first);
    const unsubscribeSecond = subscribeStore(second);
    storage.set(
      STORE_KEY,
      JSON.stringify({ ...readStore(), waitlistJoined: true }),
    );
    window.dispatchEvent(
      Object.assign(new Event("storage"), { key: STORE_KEY }),
    );
    expect(readStore().waitlistJoined).toBe(true);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    unsubscribeFirst();
    unsubscribeSecond();
  });

  it("clears only Do-Over data", () => {
    storage.set("another-app", "keep");
    updateStore({ waitlistJoined: true });
    saveHistory(historyEntry);
    expect(clearStore()).toBe(true);
    expect(storage.get(STORE_KEY)).toBeUndefined();
    expect(storage.get("another-app")).toBe("keep");
    expect(readStore().history).toEqual([]);
    expect(readStore().waitlistJoined).toBe(false);
  });

  it("reports blocked deletion while clearing memory and notifying subscribers", () => {
    saveHistory(historyEntry);
    const persisted = storage.get(STORE_KEY);
    const changed = vi.fn();
    const unsubscribe = subscribeStore(changed);
    local.removeItem = () => {
      throw new Error("denied");
    };

    expect(clearStore()).toBe(false);
    expect(storage.get(STORE_KEY)).toBe(persisted);
    expect(readStore().history).toEqual([]);
    expect(readStore().dailyDone).toEqual({});
    expect(changed).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});
