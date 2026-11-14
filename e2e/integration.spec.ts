import { expect, test, type Page } from "@playwright/test";
import {
  SessionResponseSchema,
  TurnResponseSchema,
  type SessionResponse,
  type TurnResponse,
} from "../src/shared/api";
import { BrowserStoreSchema } from "../src/lib/store";

// These tests exercise the real HTTP routes and rule tagger. Start the target
// with both model keys unset; do not intercept routes or override client IPs.
test.describe.configure({ mode: "serial" });

const helpfulReplies = [
  "You're upset. The answer is still no. Do you want to sit with me or hold my hand?",
  "I'm right here. Thank you for using a quiet voice.",
  "You really wanted it. Do you want to take my hand or sit beside me?",
  "I've got you. The answer is still no.",
] as const;

async function startDaily(page: Page): Promise<SessionResponse> {
  await page.goto("/play");
  await page.getByLabel("Timer off", { exact: true }).check();
  const started = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/session") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Start", exact: true }).click();
  const response = await started;
  expect(response.status()).toBe(200);
  const session = SessionResponseSchema.parse(await response.json());
  await expect(page.getByLabel("What do you say?")).toBeEditable();
  return session;
}

async function sendReply(page: Page, text: string): Promise<TurnResponse> {
  const input = page.getByLabel("What do you say?");
  await expect(input).toBeEditable();
  await input.fill(text);
  const completed = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/turn") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Send reply" }).click();
  const response = await completed;
  expect(
    response.status(),
    "Real /api/turn must succeed without fixture responses",
  ).toBe(200);
  const turn = TurnResponseSchema.parse(await response.json());
  expect(turn.tagging, "Run this suite with model keys unset").toBe("rules");
  expect(turn.hits.every((hit) => hit.source === "rule")).toBe(true);
  if (turn.result.outcome !== "stopped_unsafe") {
    await expect(page.getByTestId(`reply-${turn.turnIndex}`)).toBeVisible();
    await expect(
      page.getByText("Tagged by rules only", { exact: true }).first(),
    ).toBeVisible();
  }
  if (turn.result.outcome === "ongoing") {
    await expect(page.getByTestId("arousal-value")).toHaveText(
      new RegExp(`^${turn.result.after.arousal} · `),
    );
    await expect(input).toBeEditable();
  }
  return turn;
}

async function localHistory(page: Page) {
  const raw = await page.evaluate(() => localStorage.getItem("doover:v1"));
  expect(raw).not.toBeNull();
  return BrowserStoreSchema.parse(JSON.parse(raw ?? "{}")).history;
}

test("real rules distinguish empathy, threats and giving in", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const session = await startDaily(page);
  const first = await sendReply(page, helpfulReplies[0]);
  expect(first.hits.map((hit) => hit.tag)).toEqual(
    expect.arrayContaining(["NAME_FEELING", "HOLD_LIMIT", "OFFER_CHOICE"]),
  );
  expect(first.result.delta).toBeLessThan(0);
  expect(first.result.after.arousal).toBeLessThan(session.state.arousal);
  for (const label of [
    "Named the feeling",
    "Held the limit",
    "Offered a choice",
  ]) {
    await expect(
      page.locator("[data-helpful]").filter({ hasText: label }),
    ).toBeVisible();
  }
  await expect(page.getByTestId("reply-0").locator("u").first()).toBeVisible();

  let calm = first;
  for (
    let index = 1;
    index < session.maxTurns && calm.result.outcome === "ongoing";
    index += 1
  ) {
    calm = await sendReply(
      page,
      helpfulReplies[index % helpfulReplies.length] ?? helpfulReplies[0],
    );
  }
  expect(calm.result.outcome).toBe("calm_limit_held");
  expect(calm.result.after.limitIntact).toBe(true);
  expect(calm.result.after.arousal).toBeLessThanOrEqual(25);
  await expect(
    page.getByRole("heading", {
      name: "Calm, and the limit held.",
      exact: true,
    }),
  ).toBeVisible();
  expect((await localHistory(page)).map((entry) => entry.outcome)).toEqual([
    "calm_limit_held",
  ]);

  await startDaily(page);
  let threatened: TurnResponse | undefined;
  for (let index = 0; index < session.maxTurns; index += 1) {
    threatened = await sendReply(
      page,
      "If you don't listen, no TV tonight. Stop screaming!",
    );
    expect(threatened.hits.map((hit) => hit.tag)).toContain("THREAT");
    expect(threatened.result.delta).toBeGreaterThanOrEqual(0);
    if (index === 0) {
      expect(threatened.result.delta).toBeGreaterThan(0);
      await expect(
        page.locator("[data-helpful]").filter({ hasText: "Threat" }),
      ).toBeVisible();
    }
    if (threatened.result.outcome !== "ongoing") break;
  }
  expect(threatened?.result.outcome).toBe("out_of_turns");
  expect(threatened?.result.after.turn).toBe(8);
  await expect(
    page.getByRole("heading", { name: "Still melting down.", exact: true }),
  ).toBeVisible();

  await startDaily(page);
  const gaveIn = await sendReply(page, "Fine, you can have it.");
  expect(gaveIn.hits.map((hit) => hit.tag)).toContain("GIVE_IN");
  expect(gaveIn.result.outcome).toBe("calm_gave_in");
  expect(gaveIn.result.after.limitIntact).toBe(false);
  await expect(
    page.locator("[data-helpful]").filter({ hasText: "Gave in" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Quiet, but the limit is gone.",
      exact: true,
    }),
  ).toBeVisible();
  const history = await localHistory(page);
  expect(history).toHaveLength(3);
  expect(new Set(history.map((entry) => entry.outcome))).toEqual(
    new Set(["calm_limit_held", "out_of_turns", "calm_gave_in"]),
  );
});

test("an explicit unsafe reply reaches the actual pause screen without a score", async ({
  page,
}) => {
  await startDaily(page);
  const turn = await sendReply(page, "I will slap your face.");
  expect(turn.hits.map((hit) => hit.tag)).toEqual(["UNSAFE"]);
  expect(turn.result.outcome).toBe("stopped_unsafe");
  expect(turn.result.delta).toBe(0);
  expect(turn.score).toBeNull();
  expect(turn.daily).toBeNull();
  expect(turn.child).toBeNull();
  await expect(
    page.getByRole("heading", { name: "Let's pause here.", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Try this turn again", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Share result", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByTestId("debrief")).toHaveCount(0);
  await expect(page.getByLabel(/out of 3 stars/)).toHaveCount(0);
  expect(await localHistory(page)).toEqual([]);
});
