import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
test("capture real application screens", async ({ page }, testInfo) => {
  const base = "docs/build/shots";
  await mkdir(base, { recursive: true });
  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.screenshot({
      path: `${base}/landing-${width}-${testInfo.project.name}.png`,
      fullPage: true,
    });
    await page.goto("/play");
    await expect(
      page.getByRole("button", { name: "Start", exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: `${base}/intro-${width}-${testInfo.project.name}.png`,
      fullPage: true,
    });
    await page.getByLabel("Timer off", { exact: true }).check();
    await page.getByRole("button", { name: "Start", exact: true }).click();
    for (let n = 0; n < 8; n++) {
      if (await page.getByTestId("debrief").count()) break;
      const input = page.getByRole("textbox", { name: "What do you say?" });
      await expect(input).toBeEnabled();
      await input.fill(
        n % 2 === 0
          ? "You really wanted that. We're not buying candy today. Do you want to carry the apples or the bananas?"
          : "I'm right here. Thank you for using a quiet voice.",
      );
      await page
        .getByRole("button", { name: "Send reply", exact: true })
        .click();
      await expect(page.getByTestId("reply-" + n)).toBeVisible();
      if (n === 0)
        await page.screenshot({
          path: `${base}/playing-${width}-${testInfo.project.name}.png`,
          fullPage: true,
        });
    }
    await expect(page.getByTestId("debrief")).toBeVisible();
    await page.screenshot({
      path: `${base}/debrief-${width}-${testInfo.project.name}.png`,
      fullPage: true,
    });
  }
});
