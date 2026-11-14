import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const route of ["/", "/play", "/pricing", "/how-it-works"]) {
  test(`${route} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      ),
    ).toEqual([]);
  });
}
test("clearing data removes this app store only", async ({ page }) => {
  await page.goto("/privacy");
  await page.evaluate(() => {
    localStorage.setItem(
      "doover:v1",
      JSON.stringify({
        settings: { timer: 20, voice: false, calmBaselineDb: null },
        history: [],
        playbook: [],
        dailyDone: {},
        waitlistJoined: true,
      }),
    );
    localStorage.setItem("unrelated-test", "keep");
  });
  await page.getByRole("button", { name: "Clear my data" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Your local data has been cleared.",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("doover:v1")),
  ).toBeNull();
  expect(
    await page.evaluate(() => localStorage.getItem("unrelated-test")),
  ).toBe("keep");
});
for (const width of [375, 768, 1280])
  test(`routes fit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "/",
      "/play",
      "/scenes",
      "/replay",
      "/playbook",
      "/progress",
      "/pricing",
      "/privacy",
      "/how-it-works",
    ]) {
      await page.goto(route);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        route,
      ).toBe(true);
    }
  });
