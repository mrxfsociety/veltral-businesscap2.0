import { expect, type Page } from "@playwright/test";

/**
 * After a reply the turn plays a short sequence on the stage; the reply box is
 * disabled until it ends, and on the last turn the scene ends after it. Wait
 * for whichever comes first.
 */
export async function turnOrDebrief(page: Page): Promise<"debrief" | "input"> {
  const debrief = page.getByTestId("debrief");
  const input = page.getByLabel("What do you say?");
  let state: "debrief" | "input" | null = null;
  await expect
    .poll(
      async () => {
        if (await debrief.isVisible()) state = "debrief";
        else if (
          // A short timeout: the box disappears when the scene ends, and
          // isEditable would otherwise wait for it to come back.
          await input.isEditable({ timeout: 300 }).catch(() => false)
        )
          state = "input";
        return state;
      },
      { timeout: 15000 },
    )
    .not.toBeNull();
  return state ?? "input";
}
