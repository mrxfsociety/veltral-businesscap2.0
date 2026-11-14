import { expect, test } from "@playwright/test";

const proPreview = process.env.NEXT_PUBLIC_PRO_PREVIEW !== "false";

test("library keeps today's scene free and gates other scenes", async ({
  page,
}) => {
  await page.goto("/scenes");
  await expect(page.getByText("Today", { exact: true })).toBeVisible();
  const cards = page.getByRole("article");
  await expect(cards).toHaveCount(12);
  const dailyCard = cards.filter({
    has: page.getByText("Today", { exact: true }),
  });
  await expect(
    dailyCard.getByRole("link", { name: /^Practise / }),
  ).toHaveAttribute("href", "/play");
  const otherCard = cards
    .filter({ hasNot: page.getByText("Today", { exact: true }) })
    .first();
  if (proPreview) {
    await otherCard.getByRole("link", { name: /^Practise / }).click();
    await expect(page).toHaveURL(/\/play\/.+/);
  } else {
    await expect(
      otherCard.getByRole("link", { name: "Explore Pro" }),
    ).toBeVisible();
    await expect(
      otherCard.getByRole("link", { name: /^Practise / }),
    ).toHaveCount(0);
  }
});

test("saved lines share through a fragment into a read-only fresh context", async ({
  page,
  browser,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "doover:v1",
      JSON.stringify({
        settings: { timer: 0, voice: false, calmBaselineDb: null },
        history: [],
        dailyDone: {},
        waitlistJoined: false,
        playbook: [
          {
            id: "retention-test-line",
            at: "2026-11-14T10:00:00.000Z",
            text: "I'm here with you.",
            tags: ["CONNECT"],
            sceneTitle: "Test practice scene",
          },
        ],
      }),
    );
  });
  await page.goto("/playbook");
  await expect(
    page.getByText("I'm here with you.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Share with a co-parent" }).click();
  const shareUrl = await page.getByLabel("Shared playbook link").inputValue();
  expect(new URL(shareUrl).search).toBe("");
  expect(new URL(shareUrl).hash).toMatch(/^#d=[A-Za-z0-9_-]+$/);
  const context = await browser.newContext();
  try {
    const shared = await context.newPage();
    await shared.goto(shareUrl);
    await expect(
      shared.getByText("I'm here with you.", { exact: true }),
    ).toBeVisible();
    await expect(
      shared.getByText("This is a read-only snapshot", { exact: false }),
    ).toBeVisible();
    await expect(
      shared.getByRole("button", { name: /Delete line/ }),
    ).toHaveCount(0);
    expect(
      await shared.evaluate(() => localStorage.getItem("doover:v1")),
    ).toBeNull();
  } finally {
    await context.close();
  }
  await page
    .getByRole("button", { name: "Delete line: I'm here with you." })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your words will go here." }),
  ).toBeVisible();
});

test("malformed shared playbook has a useful empty state", async ({ page }) => {
  await page.goto("/playbook/shared#d=not-valid-json");
  await expect(
    page.getByRole("heading", { name: "This link can't be read." }),
  ).toBeVisible();
});

test("empty progress invites practice without invented sessions", async ({
  page,
}) => {
  await page.goto("/progress");
  await expect(
    page.getByRole("heading", { name: "Start with one moment." }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Play today's meltdown" }),
  ).toBeVisible();
});

test("replay obeys the build's Pro gate", async ({ page }) => {
  await page.goto("/replay");
  if (!proPreview) {
    await expect(page.getByLabel("What happened today?")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Explore Pro" })).toBeVisible();
    return;
  }
  await expect(page.getByText("Pro preview", { exact: true })).toBeVisible();
  await page
    .getByLabel("What happened today?")
    .fill("My child was upset when we had to leave the park to go home.");
  const resultPromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/custom-scene") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Build my practice scene" }).click();
  const response = await resultPromise;
  expect(response.ok()).toBe(true);
  const body: unknown = await response.json();
  if (
    typeof body === "object" &&
    body !== null &&
    "ok" in body &&
    body.ok === true
  ) {
    await expect(page).toHaveURL(/\/play\/custom-/);
  } else {
    await expect(
      page.getByRole("link", { name: "Choose a scene from the library" }),
    ).toBeVisible();
  }
});

test("waitlist submission is confirmed by the actual API", async ({ page }) => {
  await page.goto("/pricing");
  await expect(
    page.getByText("Payments are not connected yet.", { exact: false }),
  ).toBeVisible();
  await page
    .getByLabel("Email address")
    .fill(`doover-e2e-${Date.now()}@example.com`);
  await page.getByLabel("Which plan interests you?").selectOption("yearly");
  const resultPromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/waitlist") &&
      response.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Join waitlist", exact: true })
    .click();
  const response = await resultPromise;
  expect(response.ok()).toBe(true);
  await expect(page.getByRole("status")).toHaveText(
    "You're on the waitlist. Thank you for your interest.",
  );
  await page.reload();
  await expect(page.getByRole("status")).toHaveText(
    "You're on the waitlist. Thank you for your interest.",
  );
});

test("coach access follows the preview flag after an escalating turn", async ({
  page,
}) => {
  await page.goto("/play");
  await page.getByLabel("Timer off", { exact: true }).check();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  for (let n = 0; n < 8; n++) {
    if (await page.getByTestId("debrief").isVisible()) break;
    const input = page.getByLabel("What do you say?");
    await expect(input).toBeEditable();
    await input.fill(
      n === 0
        ? "If you don't stand up, no TV tonight. Stop screaming!"
        : "You're sad. The answer is still no. Do you want to hold my hand or walk with me?",
    );
    await page.getByRole("button", { name: "Send reply" }).click();
    await expect(page.getByTestId(`reply-${n}`)).toBeVisible();
  }
  await expect(page.getByTestId("debrief")).toBeVisible();
  if (proPreview)
    await expect(
      page.getByRole("button", { name: "What could I have said?" }),
    ).toBeVisible();
  else {
    await expect(
      page.getByRole("complementary", {
        name: "Coach suggestions requires Pro",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "What could I have said?" }),
    ).toHaveCount(0);
  }
});

test("the sixth saved line is gated only outside Pro preview", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "doover:v1",
      JSON.stringify({
        settings: { timer: 0, voice: false, calmBaselineDb: null },
        history: [],
        dailyDone: {},
        waitlistJoined: false,
        playbook: Array.from({ length: 5 }, (_, index) => ({
          id: `existing-${index}`,
          at: "2026-11-14T12:00:00.000Z",
          text: `I'm right here. ${index}`,
          tags: ["CONNECT"],
          sceneTitle: "A practice scene",
        })),
      }),
    ),
  );
  await page.goto("/play");
  await page.getByRole("button", { name: "Start", exact: true }).click();
  for (let n = 0; n < 8; n++) {
    if (await page.getByTestId("debrief").isVisible()) break;
    const input = page.getByLabel("What do you say?");
    await expect(input).toBeEditable();
    await input.fill(
      n % 2 === 0
        ? "You're sad. The answer is still no. Do you want to hold my hand or walk with me?"
        : "I'm right here. Thank you for using a quiet voice.",
    );
    await page.getByRole("button", { name: "Send reply" }).click();
    await expect(page.getByTestId(`reply-${n}`)).toBeVisible();
  }
  await expect(page.getByTestId("debrief")).toBeVisible();
  await page
    .getByRole("button", { name: "Save to playbook", exact: true })
    .first()
    .click();
  if (proPreview)
    await expect(
      page.getByRole("button", { name: "Saved to playbook ✓" }),
    ).toBeVisible();
  else
    await expect(
      page.getByRole("complementary", {
        name: "Unlimited playbook requires Pro",
      }),
    ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("doover:v1") || "{}").playbook.length,
    ),
  ).toBe(proPreview ? 6 : 5);
});

test("a blocked playbook save explains the failure and preserves existing data", async ({
  page,
}) => {
  await page.goto("/play");
  await page.getByLabel("Timer off", { exact: true }).check();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  for (let n = 0; n < 8; n++) {
    if (await page.getByTestId("debrief").isVisible()) break;
    const input = page.getByLabel("What do you say?");
    await expect(input).toBeEditable();
    await input.fill(
      n % 2 === 0
        ? "You're sad. The answer is still no. Do you want to hold my hand or walk with me?"
        : "I'm right here. Thank you for using a quiet voice.",
    );
    await page.getByRole("button", { name: "Send reply" }).click();
    await expect(page.getByTestId(`reply-${n}`)).toBeVisible();
  }
  await expect(page.getByTestId("debrief")).toBeVisible();
  const persisted = await page.evaluate(() =>
    localStorage.getItem("doover:v1"),
  );
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Storage quota exceeded", "QuotaExceededError");
    };
  });
  await page
    .getByRole("button", { name: "Save to playbook", exact: true })
    .first()
    .click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "browser storage is full or unavailable" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Saved to playbook ✓" }),
  ).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("doover:v1"))).toBe(
    persisted,
  );
});
