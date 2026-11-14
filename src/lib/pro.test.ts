import { afterEach, describe, expect, it, vi } from "vitest";
import { canSavePlaybook, isPro } from "./pro";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Pro preview", () => {
  it("unlocks only the exact public true flag", () => {
    for (const flag of ["false", "TRUE", "1", ""]) {
      vi.stubEnv("NEXT_PUBLIC_PRO_PREVIEW", flag);
      expect(isPro()).toBe(false);
    }
    vi.stubEnv("NEXT_PUBLIC_PRO_PREVIEW", "true");
    expect(isPro()).toBe(true);
  });

  it("keeps five free lines and allows more in preview", () => {
    expect(canSavePlaybook(4, false)).toBe(true);
    expect(canSavePlaybook(5, false)).toBe(false);
    expect(canSavePlaybook(500, true)).toBe(true);
  });
});
