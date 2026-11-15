import { expect, test } from "@playwright/test";

// Free → locked scene → paywall → demo code → the scene plays → Return to Free.
// Runs only when the server is started with NEXT_PUBLIC_PRO_PREVIEW=false.
const proPreview = process.env.NEXT_PUBLIC_PRO_PREVIEW !== "false";

test("the demo code opens a locked scene and Return to Free locks it again", async ({
  page,
}) => {
  test.skip(proPreview, "Needs NEXT_PUBLIC_PRO_PREVIEW=false.");
  const daily = await (await page.request.get("/api/daily")).json();
  const locked = daily.sceneId === "car-seat" ? "bedtime" : "car-seat";

  // The server refuses the locked scene without the pass.
  const refused = await page.request.post("/api/session", {
    data: { kind: "library", sceneId: locked },
  });
  expect(refused.status()).toBe(402);

  await page.goto(`/play/${locked}`);
  await expect(page.getByText("is part of the season pass.")).toBeVisible();
  await expect(page.getByText("Reviewing Veltral?")).toBeVisible();
  await page.getByLabel("Demo code").fill("encore");
  await page.getByRole("button", { name: "Open the pass" }).click();

  await expect(
    page.getByRole("button", { name: "Start", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.getByLabel("What do you say?")).toBeVisible();

  await page.goto("/pricing");
  await expect(page.getByText("Season pass active")).toBeVisible();
  await page.getByRole("button", { name: "Return to Free" }).click();
  await expect(page.getByText("You're on Free.")).toBeVisible();

  await page.goto(`/play/${locked}`);
  await expect(page.getByText("is part of the season pass.")).toBeVisible();
});

test("a wrong code is refused and nothing opens", async ({ page }) => {
  test.skip(proPreview, "Needs NEXT_PUBLIC_PRO_PREVIEW=false.");
  await page.goto("/pricing");
  await page.getByLabel("Demo code").fill("WRONG");
  await page.getByRole("button", { name: "Open the pass" }).click();
  await expect(page.getByText("That code didn't work")).toBeVisible();
  const entitlement = await (await page.request.get("/api/entitlement")).json();
  expect(entitlement.pro).toBe(false);
});
