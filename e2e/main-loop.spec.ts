import { expect, test, type Page } from "@playwright/test";
import type { SessionResponse, TurnRequest } from "../src/shared/api";

async function begin(page: Page, timer = "Timer off") {
  await page.goto("/play");
  await page.getByLabel(timer, { exact: true }).check();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.getByLabel("What do you say?")).toBeEditable();
}

const practiceReplies = [
  "You're sad. The answer is still no. Do you want to hold my hand or walk with me?",
  "I'm right here. Thank you for using a quiet voice.",
  "You really wanted it. You can sit with me or hold my hand.",
];

async function finish(page: Page) {
  for (let i = 0; i < 8; i += 1) {
    if (await page.getByTestId("debrief").isVisible()) return;
    const reply = page.getByLabel("What do you say?");
    await expect(reply).toBeEditable();
    await reply.fill(practiceReplies[i % practiceReplies.length]);
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/turn") &&
          response.request().method() === "POST",
      ),
      reply.press("Enter"),
    ]);
    await expect(
      page.getByRole("button", { name: "Listening…", exact: true }),
    ).toHaveCount(0);
  }
  await expect(page.getByTestId("debrief")).toBeVisible();
}

for (const width of [375, 1280]) {
  test(`complete scene, do-over and browser history at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await begin(page);
    await finish(page);
    const firstReply = await page
      .getByTestId("review-turn-0")
      .getByTestId("reply-0")
      .innerText();
    const countBefore = await page.evaluate(
      () =>
        (JSON.parse(localStorage.getItem("doover:v1") || "{}").history ?? [])
          .length as number,
    );
    await page
      .getByTestId("review-turn-1")
      .getByRole("button", { name: "Do-over from here", exact: false })
      .click();
    await expect(page.getByLabel("What do you say?")).toBeFocused();
    await finish(page);
    await expect(
      page.getByTestId("review-turn-0").getByTestId("reply-0"),
    ).toHaveText(firstReply);
    const countAfter = await page.evaluate(
      () =>
        (JSON.parse(localStorage.getItem("doover:v1") || "{}").history ?? [])
          .length as number,
    );
    expect(countAfter).toBe(countBefore + 1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.reload();
    expect(
      await page.evaluate(
        () =>
          (JSON.parse(localStorage.getItem("doover:v1") || "{}").history ?? [])
            .length as number,
      ),
    ).toBe(countAfter);
  });
}

test("a helpful reply changes the meter and exposes its evidence", async ({
  page,
}) => {
  await begin(page);
  const before = Number(
    (await page.getByTestId("arousal-value").innerText()).split(" · ")[0],
  );
  await page.getByLabel("What do you say?").fill(practiceReplies[0]);
  await page.getByRole("button", { name: "Send reply" }).click();
  await expect(page.getByTestId("reply-0")).toBeVisible();
  const after = Number(
    (await page.getByTestId("arousal-value").innerText()).split(" · ")[0],
  );
  expect(after).toBeLessThan(before);
  await expect(page.getByTestId("reply-0").locator("u").first()).toBeVisible();
  await expect(page.getByLabel("What do you say?")).toBeFocused();
});

test("eight-second countdown sends one empty timed-out turn", async ({
  page,
}) => {
  const requests: TurnRequest[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/api/turn") && request.method() === "POST")
      requests.push(request.postDataJSON() as TurnRequest);
  });
  await begin(page, "8 seconds");
  await expect.poll(() => requests.length, { timeout: 12000 }).toBe(1);
  expect(requests[0]).toMatchObject({
    turnIndex: 0,
    text: "",
    timedOut: true,
    inputMode: "text",
  });
});

test("timer off never sends a turn automatically", async ({ page }) => {
  let requests = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/api/turn") && request.method() === "POST")
      requests += 1;
  });
  await begin(page);
  await page.waitForTimeout(9000);
  expect(requests).toBe(0);
});

test("typing replaces the initial countdown with the 25-second window", async ({
  page,
}) => {
  test.setTimeout(45000);
  const requests: TurnRequest[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/api/turn") && request.method() === "POST")
      requests.push(request.postDataJSON() as TurnRequest);
  });
  await begin(page, "8 seconds");
  await page.getByLabel("What do you say?").fill("I'm here.");
  await page.waitForTimeout(9000);
  expect(requests).toHaveLength(0);
  await expect.poll(() => requests.length, { timeout: 19000 }).toBe(1);
  expect(requests[0]).toMatchObject({ text: "I'm here.", timedOut: true });
});

test("unsafe response has support and redo, without score, share or history", async ({
  page,
}) => {
  const responsePromise = page.waitForResponse((response) =>
    response.url().endsWith("/api/session"),
  );
  await begin(page);
  const session = (await (await responsePromise).json()) as SessionResponse;
  await page.route("**/api/turn", (route) =>
    route.fulfill({
      json: {
        turnIndex: 0,
        text: "test reply",
        hits: [{ tag: "UNSAFE", source: "rule", quote: "test reply" }],
        result: {
          tags: ["UNSAFE"],
          before: session.state,
          after: {
            ...session.state,
            turn: 1,
            lastHelpfulTags: [],
            lastDelta: 0,
          },
          delta: 0,
          outcome: "stopped_unsafe",
          effects: [],
          notes: ["UNSAFE_STOP"],
        },
        child: null,
        tagging: "rules",
        score: null,
        daily: null,
        usedDoOver: false,
      },
    }),
  );
  await page.getByLabel("What do you say?").fill("test reply");
  await page.getByRole("button", { name: "Send reply" }).click();
  await expect(
    page.getByRole("heading", { name: "Let's pause here." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Try this turn again" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Share result" })).toHaveCount(
    0,
  );
  expect(
    await page.evaluate(
      () =>
        (JSON.parse(localStorage.getItem("doover:v1") || "{}").history ?? [])
          .length as number,
    ),
  ).toBe(0);
});

test("lost sessions give a clear restart path", async ({ page }) => {
  await begin(page);
  await page.route("**/api/turn", (route) =>
    route.fulfill({
      status: 404,
      json: { error: "session_expired", message: "Session expired." },
    }),
  );
  await page.getByLabel("What do you say?").fill("A reply");
  await page.getByRole("button", { name: "Send reply" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "This session has expired" }),
  ).toContainText("This session has expired");
  await page.getByRole("button", { name: "Restart scene" }).click();
  await expect(
    page.getByRole("button", { name: "Start", exact: true }),
  ).toBeVisible();
});
