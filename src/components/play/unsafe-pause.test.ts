import { expect, it } from "vitest";
import { UNSAFE_MESSAGE } from "./safety-copy";

it("uses the complete supportive pause copy from SPEC 12.2", () => {
  expect(UNSAFE_MESSAGE).toBe(
    "Let's pause here. This is a practice space, and that reply described hurting or degrading a child, so the scene stops. If moments like this feel close to real life, you are not alone, and talking to someone helps. National Parent & Youth Helpline: call or text 1-855-427-2736, any time. In a mental health crisis, call or text 988.",
  );
});
