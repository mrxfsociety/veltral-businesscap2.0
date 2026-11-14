import { useEffect, useSyncExternalStore } from "react";
import type { EntitlementResponse } from "@/shared/api";

export const FREE_PLAYBOOK_LIMIT = 5;

/*
 * The season pass on the client. The server decides (signed httpOnly cookie);
 * the client reads GET /api/entitlement once and caches it. `usePro()` is the
 * reactive way in; `isPro()` stays as a thin synchronous helper.
 */

let cached: EntitlementResponse | null = null;
let inflight: Promise<EntitlementResponse | null> | null = null;
const listeners = new Set<() => void>();

function previewFlag() {
  return process.env.NEXT_PUBLIC_PRO_PREVIEW === "true";
}

export function isPro(): boolean {
  return previewFlag() || cached?.pro === true;
}

export function canSavePlaybook(count: number, pro = isPro()): boolean {
  return pro || count < FREE_PLAYBOOK_LIMIT;
}

function notify() {
  listeners.forEach((listener) => listener());
}

export function loadEntitlement(
  force = false,
): Promise<EntitlementResponse | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (cached && !force) return Promise.resolve(cached);
  if (inflight && !force) return inflight;
  inflight = (async () => {
    try {
      const { api } = await import("./api");
      cached = await api.entitlement();
    } catch {
      // Offline or misconfigured: stay Free (or preview) rather than guess.
      cached ??= {
        pro: previewFlag(),
        source: previewFlag() ? "preview" : null,
        checkout: "code_only",
        demoCode: null,
      };
    } finally {
      inflight = null;
      notify();
    }
    return cached;
  })();
  return inflight;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePro() {
  const entitlement = useSyncExternalStore(
    subscribe,
    () => cached,
    () => null,
  );
  useEffect(() => {
    void loadEntitlement();
  }, []);
  return {
    pro: previewFlag() || entitlement?.pro === true,
    entitlement,
    loading: entitlement === null && !previewFlag(),
    refresh: () => loadEntitlement(true),
  };
}

/** Open the season-pass paywall from anywhere (the host lives in the root layout). */
export function openPaywall(feature: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("doover:paywall", { detail: { feature } }),
  );
}
