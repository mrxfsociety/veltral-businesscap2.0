import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  codeMatches,
  COOKIE_NAME,
  createEntitlementHandlers,
  entitlementFor,
  hasPro,
  PASS_SECONDS,
  sessionNeedsPro,
  signPass,
  stripeTestKey,
  verifyPass,
} from "./entitlement";
import { dayKey, sceneOfTheDay } from "@/engine/scenes";

const SECRET = "test-secret-0123456789abcdef";
const now = 1_800_000_000;
const pass = {
  v: 1 as const,
  src: "code" as const,
  iat: now,
  exp: now + PASS_SECONDS,
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("signed pass", () => {
  it("verifies a pass it signed", () => {
    expect(verifyPass(signPass(pass, SECRET), SECRET, now + 10)).toEqual(pass);
  });

  it("rejects a tampered payload", () => {
    const token = signPass(pass, SECRET);
    const [, signature] = token.split(".");
    const forged = Buffer.from(
      JSON.stringify({ ...pass, exp: now + 10 * PASS_SECONDS }),
    ).toString("base64url");
    expect(verifyPass(`${forged}.${signature}`, SECRET, now)).toBeNull();
  });

  it("rejects a tampered signature and a different secret", () => {
    const token = signPass(pass, SECRET);
    expect(verifyPass(`${token.slice(0, -2)}AA`, SECRET, now)).toBeNull();
    expect(verifyPass(token, "another-secret", now)).toBeNull();
  });

  it("rejects an expired pass", () => {
    const token = signPass(pass, SECRET);
    expect(verifyPass(token, SECRET, now + PASS_SECONDS)).toBeNull();
    expect(verifyPass(token, SECRET, now + PASS_SECONDS + 1)).toBeNull();
  });

  it("rejects garbage and oversized values", () => {
    for (const value of ["", "abc", "a.b.c", "x".repeat(600), null, undefined])
      expect(verifyPass(value, SECRET, now)).toBeNull();
  });

  it("rejects a well-signed payload of the wrong shape", () => {
    const body = Buffer.from(
      JSON.stringify({ v: 2, src: "admin", iat: now, exp: now + 99 }),
    ).toString("base64url");
    const sig = createHmac("sha256", SECRET).update(body).digest("base64url");
    expect(verifyPass(`${body}.${sig}`, SECRET, now)).toBeNull();
  });
});

describe("demo code and keys", () => {
  it("compares codes case-insensitively", () => {
    expect(codeMatches("encore", "ENCORE")).toBe(true);
    expect(codeMatches(" ENCORE ", "ENCORE")).toBe(true);
    expect(codeMatches("ENCORES", "ENCORE")).toBe(false);
  });

  it("accepts only Stripe test keys", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_abc");
    expect(stripeTestKey()).toBeNull();
    vi.stubEnv("STRIPE_SECRET_KEY", "rk_test_abc");
    expect(stripeTestKey()).toBeNull();
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_abc");
    expect(stripeTestKey()).toBe("sk_test_abc");
  });
});

function request(cookie?: string, body?: unknown) {
  return new Request("http://localhost/api/x", {
    method: body === undefined ? "GET" : "POST",
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("server enforcement", () => {
  it("grants the pass only with a valid cookie or the preview flag", () => {
    vi.stubEnv("ENTITLEMENT_SECRET", SECRET);
    vi.stubEnv("NEXT_PUBLIC_PRO_PREVIEW", "false");
    expect(hasPro(request())).toBe(false);
    const token = signPass(
      {
        ...pass,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60,
      },
      SECRET,
    );
    expect(hasPro(request(`${COOKIE_NAME}=${token}`))).toBe(true);
    expect(hasPro(request(`${COOKIE_NAME}=${token}x`))).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_PRO_PREVIEW", "true");
    expect(hasPro(request())).toBe(true);
    expect(entitlementFor(request()).source).toBe("preview");
  });

  it("keeps today's scene free and gates other scenes", async () => {
    const today = sceneOfTheDay(dayKey(new Date())).id;
    expect(await sessionNeedsPro(request(undefined, { kind: "daily" }))).toBe(
      false,
    );
    expect(
      await sessionNeedsPro(
        request(undefined, { kind: "library", sceneId: today }),
      ),
    ).toBe(false);
    const other = today === "bedtime" ? "wrong-cup" : "bedtime";
    expect(
      await sessionNeedsPro(
        request(undefined, { kind: "library", sceneId: other }),
      ),
    ).toBe(true);
    expect(
      await sessionNeedsPro(
        request(undefined, { kind: "custom", sceneId: "custom-x" }),
      ),
    ).toBe(true);
  });

  it("redeems the demo code into a signed, httpOnly cookie", async () => {
    vi.stubEnv("ENTITLEMENT_SECRET", SECRET);
    vi.stubEnv("DEMO_CODE", "ENCORE");
    const handlers = createEntitlementHandlers();
    const wrong = await handlers.redeem(request(undefined, { code: "nope" }));
    expect(wrong.status).toBe(400);
    expect((await wrong.json()).error).toBe("invalid_code");
    const right = await handlers.redeem(request(undefined, { code: "encore" }));
    expect(right.status).toBe(200);
    const cookie = right.headers.get("set-cookie") ?? "";
    expect(cookie).toContain(`${COOKIE_NAME}=`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    const token = cookie.split(";")[0].split("=")[1];
    expect(verifyPass(token, SECRET)?.src).toBe("code");
    const reset = await handlers.reset(request(undefined, {}));
    expect(reset.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("treats a malformed cookie as no pass, not a server error", async () => {
    vi.stubEnv("ENTITLEMENT_SECRET", SECRET);
    vi.stubEnv("NEXT_PUBLIC_PRO_PREVIEW", "false");
    const broken = request(`other=1; ${COOKIE_NAME}=%E0%A4%A`);
    expect(hasPro(broken)).toBe(false);
    const response = await createEntitlementHandlers().entitlement(broken);
    expect(response.status).toBe(200);
    expect((await response.json()).pro).toBe(false);
  });

  it("never puts a secret in a response", async () => {
    const stripeKey = "sk_test_never_in_a_response_0123456789";
    vi.stubEnv("ENTITLEMENT_SECRET", SECRET);
    vi.stubEnv("STRIPE_SECRET_KEY", stripeKey);
    vi.stubEnv("DEMO_CODE", "ENCORE");
    const handlers = createEntitlementHandlers();
    const responses = [
      await handlers.entitlement(request()),
      await handlers.redeem(request(undefined, { code: "ENCORE" })),
      await handlers.redeem(request(undefined, { code: "wrong" })),
      await handlers.reset(request(undefined, {})),
    ];
    for (const response of responses) {
      const text = `${[...response.headers].join("\n")}\n${await response.text()}`;
      expect(text).not.toContain(SECRET);
      expect(text).not.toContain(stripeKey);
    }
    expect(entitlementFor(request()).checkout).toBe("stripe_test");
  });

  it("confirm refuses a malformed session id without calling Stripe", async () => {
    vi.stubEnv("ENTITLEMENT_SECRET", SECRET);
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_abc");
    const confirm = createEntitlementHandlers().confirm;
    for (const id of ["", "cs_live_abcdefghij", "cs_test_<script>", "x"]) {
      const response = await confirm(
        new Request(
          `http://localhost/api/checkout/confirm?session_id=${encodeURIComponent(id)}`,
        ),
      );
      expect(response.status).toBe(303);
      expect(response.headers.get("location")).toContain(
        "/pricing?checkout=incomplete",
      );
      expect(response.headers.get("set-cookie")).toBeNull();
    }
  });

  it("refuses checkout without a test key", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_should_never_be_used");
    const response = await createEntitlementHandlers().checkout(
      request(undefined, { plan: "monthly" }),
    );
    expect(response.status).toBe(503);
    expect((await response.json()).error).toBe("checkout_unavailable");
  });
});
