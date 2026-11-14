import { describe, expect, it } from "vitest";
import { SessionResponseSchema, TurnResponseSchema } from "@/shared/api";
import { POST as start } from "@/app/api/session/route";
import { POST as turn } from "@/app/api/turn/route";

function post(path: string, body: unknown): Request {
  return new Request(`http://localhost/api/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("T0 scaffold route wiring", () => {
  it("creates a public session, reaches an ending, and replays from an earlier turn", async () => {
    const session = SessionResponseSchema.parse(
      await (await start(post("session", { kind: "daily" }))).json(),
    );
    expect(session.state.arousal).toBe(session.scene.startArousal);
    expect(session.scene).not.toHaveProperty("giveInHints");
    const first = TurnResponseSchema.parse(
      await (
        await turn(
          post("turn", {
            sessionId: session.sessionId,
            turnIndex: 0,
            text: "you",
            inputMode: "text",
          }),
        )
      ).json(),
    );
    let current = first;
    for (let index = 1; current.result.outcome === "ongoing"; index += 1) {
      current = TurnResponseSchema.parse(
        await (
          await turn(
            post("turn", {
              sessionId: session.sessionId,
              turnIndex: index,
              text: "you",
              inputMode: "text",
            }),
          )
        ).json(),
      );
    }
    expect(current.result.outcome).toBe("calm_limit_held");
    expect(current.score).not.toBeNull();
    const replay = TurnResponseSchema.parse(
      await (
        await turn(
          post("turn", {
            sessionId: session.sessionId,
            turnIndex: 1,
            text: "if",
            inputMode: "text",
          }),
        )
      ).json(),
    );
    expect(replay.usedDoOver).toBe(true);
    expect(replay.result.before).toEqual(first.result.after);
    expect(replay.result.delta).toBe(10);
  });
  it("normalizes and truncates a raw reply before returning it", async () => {
    const session = SessionResponseSchema.parse(
      await (await start(post("session", { kind: "daily" }))).json(),
    );
    const raw = "  you  ".repeat(100);
    const response = await turn(
      post("turn", {
        sessionId: session.sessionId,
        turnIndex: 0,
        text: raw,
        inputMode: "text",
      }),
    );
    expect(response.status).toBe(200);
    const parsed = TurnResponseSchema.parse(await response.json());
    expect(parsed.text).toBe(raw.trim().replace(/\s+/g, " ").slice(0, 300));
    expect(parsed.text).toHaveLength(300);
  });
  it("returns typed errors for invalid and expired sessions", async () => {
    expect((await start(post("session", { kind: "library" }))).status).toBe(
      400,
    );
    const missing = await turn(
      post("turn", {
        sessionId: "missing",
        turnIndex: 0,
        text: "",
        inputMode: "text",
      }),
    );
    expect(missing.status).toBe(404);
    expect(await missing.json()).toMatchObject({ error: "session_expired" });
  });
});
