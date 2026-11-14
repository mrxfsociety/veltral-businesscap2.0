import { expect, test } from "@playwright/test";
import { TurnRequestSchema, TurnResponseSchema } from "../src/shared/api";

const proPreview = (process.env.NEXT_PUBLIC_PRO_PREVIEW || "true") === "true";

test("denied microphone permission falls back to a real text turn", async ({
  page,
}) => {
  test.skip(!proPreview, "The microphone UI is available only in Pro preview.");
  // Simulate a permission denial only: no audio, transcript, or API result is fabricated.
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      configurable: true,
      value: async () => {
        throw new DOMException("Permission denied", "NotAllowedError");
      },
    });
  });
  const voiceRequests: string[] = [];
  page.on("request", (request) => {
    if (/\/api\/(transcribe|speak)(?:\?|$)/.test(request.url())) {
      voiceRequests.push(request.url());
    }
  });

  await page.goto("/play");
  await page.getByLabel("Timer off", { exact: true }).check();
  const toggle = page.getByRole("checkbox", {
    name: "Speak your replies",
    exact: true,
  });
  // The setting becomes checked only after calibration succeeds.
  await toggle.click();
  const calibration = page.getByRole("dialog", {
    name: "Find your normal voice.",
    exact: true,
  });
  await expect(calibration).toBeVisible();
  await calibration
    .getByRole("button", { name: "Start sound check", exact: true })
    .click();
  await expect(calibration).toHaveCount(0);
  await expect(
    page.getByText("Microphone access wasn't allowed.", { exact: false }),
  ).toBeVisible();
  await expect(toggle).not.toBeChecked();

  await page.getByRole("button", { name: "Start", exact: true }).click();
  const reply = page.getByLabel("What do you say?");
  await expect(reply).toBeEditable();
  await expect(
    page.getByRole("button", { name: "Tap to talk", exact: true }),
  ).toHaveCount(0);
  await reply.fill("I'm right here.");
  const completed = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/turn") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  const response = await completed;
  expect(response.status()).toBe(200);
  const request = TurnRequestSchema.parse(response.request().postDataJSON());
  expect(request.inputMode).toBe("text");
  expect(request.loud).not.toBe(true);
  const turn = TurnResponseSchema.parse(await response.json());
  expect(turn.text).toBe("I'm right here.");
  await expect(page.getByTestId("reply-0")).toHaveText("I'm right here.");
  await expect(reply).toBeEditable();
  expect(voiceRequests).toEqual([]);
});

test("Free mode gates voice without hiding the daily Start button", async ({
  page,
}) => {
  test.skip(
    proPreview,
    "Run with NEXT_PUBLIC_PRO_PREVIEW=false to check the Free gate.",
  );
  await page.goto("/play");
  const gate = page.getByRole("complementary", {
    name: "Voice mode requires Pro",
    exact: true,
  });
  await expect(gate).toBeVisible();
  await expect(
    gate.getByRole("link", { name: "Explore Pro", exact: true }),
  ).toHaveAttribute("href", "/pricing");
  await expect(
    page.getByRole("checkbox", { name: "Speak your replies", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Start", exact: true }),
  ).toBeEnabled();
});
