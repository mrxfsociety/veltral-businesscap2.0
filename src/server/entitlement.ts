import "server-only";
import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import Stripe from "stripe";
import { z } from "zod";
import { dayKey, sceneOfTheDay } from "@/engine/scenes";
import {
  CheckoutRequestSchema,
  CheckoutResponseSchema,
  EntitlementResponseSchema,
  OkResponseSchema,
  RedeemRequestSchema,
  type EntitlementResponse,
} from "@/shared/api";
import { ApiError, enforceRateLimit, json, readJson, route } from "./http";

/*
 * Season pass (REDESIGN section 7). A signed, httpOnly cookie:
 *   doover_pro = base64url(payload) + "." + base64url(HMAC-SHA256(base64url(payload), ENTITLEMENT_SECRET))
 *   payload    = { v: 1, src: "stripe_test" | "code", iat, exp }   (seconds, 30 days)
 * The server enforces it; the client only reads GET /api/entitlement.
 */

export const COOKIE_NAME = "doover_pro";
export const PASS_SECONDS = 30 * 24 * 60 * 60;

const PayloadSchema = z
  .object({
    v: z.literal(1),
    src: z.enum(["stripe_test", "code"]),
    iat: z.number().int().nonnegative(),
    exp: z.number().int().positive(),
  })
  .strict();
export type PassPayload = z.infer<typeof PayloadSchema>;

function b64url(value: Buffer | string) {
  return Buffer.from(value).toString("base64url");
}

function mac(data: string, secret: string) {
  return createHmac("sha256", secret).update(data).digest();
}

export function signPass(payload: PassPayload, secret: string): string {
  const body = b64url(JSON.stringify(payload));
  return `${body}.${b64url(mac(body, secret))}`;
}

/** Returns the payload of a valid, unexpired pass; null for anything else. Constant-time MAC check. */
export function verifyPass(
  token: string | undefined | null,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): PassPayload | null {
  if (!token || token.length > 512) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, signature] = parts;
  let given: Buffer;
  try {
    given = Buffer.from(signature, "base64url");
  } catch {
    return null;
  }
  const expected = mac(body, secret);
  if (given.length !== expected.length || !timingSafeEqual(given, expected))
    return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  const result = PayloadSchema.safeParse(parsed);
  if (!result.success) return null;
  if (result.data.exp <= nowSeconds || result.data.iat > nowSeconds + 300)
    return null;
  return result.data;
}

const production = () => process.env.NODE_ENV === "production";

/** The signing secret. Development gets a per-process random one; production requires the env value. */
export function entitlementSecret(): string | null {
  const configured = process.env.ENTITLEMENT_SECRET?.trim();
  if (configured) return configured;
  if (production()) return null;
  const store = globalThis as typeof globalThis & {
    __dooverDevSecret?: string;
  };
  store.__dooverDevSecret ??= randomBytes(32).toString("hex");
  return store.__dooverDevSecret;
}

export function previewUnlocked(): boolean {
  return process.env.NEXT_PUBLIC_PRO_PREVIEW === "true";
}

export function demoCode(): string | null {
  const configured = process.env.DEMO_CODE?.trim();
  if (configured) return configured;
  return production() ? null : "ENCORE";
}

/** Only test keys are ever used. A real charge is impossible by construction. */
export function stripeTestKey(): string | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  return key && key.startsWith("sk_test_") ? key : null;
}

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

export function codeMatches(given: string, expected: string): boolean {
  return timingSafeEqual(
    digest(given.trim().toUpperCase()),
    digest(expected.trim().toUpperCase()),
  );
}

export function readCookie(request: Request, name = COOKIE_NAME) {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name)
      return decodeURIComponent(part.slice(index + 1).trim());
  }
  return null;
}

export function passFor(request: Request): PassPayload | null {
  const secret = entitlementSecret();
  return secret ? verifyPass(readCookie(request), secret) : null;
}

export function hasPro(request: Request): boolean {
  return previewUnlocked() || passFor(request) !== null;
}

function cookieHeader(value: string, maxAge: number) {
  return [
    `${COOKIE_NAME}=${value}`,
    "Path=/",
    `Max-Age=${maxAge}`,
    "HttpOnly",
    "SameSite=Lax",
    production() ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function issuePassCookie(
  src: PassPayload["src"],
  nowSeconds = Math.floor(Date.now() / 1000),
): string {
  const secret = entitlementSecret();
  if (!secret)
    throw new ApiError(
      503,
      "entitlement_unavailable",
      "The season pass is not configured on this server yet.",
    );
  const token = signPass(
    { v: 1, src, iat: nowSeconds, exp: nowSeconds + PASS_SECONDS },
    secret,
  );
  return cookieHeader(token, PASS_SECONDS);
}

export function clearPassCookie(): string {
  return cookieHeader("", 0);
}

export const PRO_REQUIRED_MESSAGE =
  "This is part of the season pass. Today's meltdown, do-overs and your progress stay free.";

export function requirePro(request: Request) {
  if (!hasPro(request))
    throw new ApiError(402, "pro_required", PRO_REQUIRED_MESSAGE);
}

/** Wrap an existing handler with a season-pass check. `needs` decides per request (default: always). */
export function withPro(
  handler: (request: Request) => Promise<Response>,
  needs: (request: Request) => Promise<boolean> | boolean = () => true,
) {
  return route(async (request) => {
    if (await needs(request)) requirePro(request);
    return handler(request);
  });
}

/** POST /api/session: today's scene is free; other library scenes and custom scenes need the pass. */
export async function sessionNeedsPro(request: Request): Promise<boolean> {
  let body: unknown;
  try {
    body = await request.clone().json();
  } catch {
    return false; // the handler answers malformed requests itself
  }
  if (!body || typeof body !== "object") return false;
  const { kind, sceneId } = body as { kind?: unknown; sceneId?: unknown };
  if (kind === "custom") return true;
  if (kind === "library")
    return sceneId !== sceneOfTheDay(dayKey(new Date())).id;
  return false;
}

export function entitlementFor(request: Request): EntitlementResponse {
  const preview = previewUnlocked();
  const pass = passFor(request);
  return {
    pro: preview || pass !== null,
    source: preview ? "preview" : (pass?.src ?? null),
    checkout: stripeTestKey() ? "stripe_test" : "code_only",
    demoCode: demoCode(),
  };
}

function siteOrigin(request: Request) {
  const configured = process.env.SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return new URL(request.url).origin;
}

const PRICES = {
  monthly: { cents: 999, interval: "month" as const },
  yearly: { cents: 5999, interval: "year" as const },
};

export function createEntitlementHandlers() {
  return {
    entitlement: route(async (request) =>
      json(entitlementFor(request), EntitlementResponseSchema),
    ),

    redeem: route(async (request) => {
      await enforceRateLimit(request, "redeem");
      const { code } = await readJson(request, RedeemRequestSchema);
      const expected = demoCode();
      if (!expected || !codeMatches(code, expected))
        throw new ApiError(
          400,
          "invalid_code",
          "That code didn't work. Check the spelling and try again.",
        );
      const response = json({ ok: true as const }, OkResponseSchema);
      response.headers.append("Set-Cookie", issuePassCookie("code"));
      return response;
    }),

    reset: route(async () => {
      const response = json({ ok: true as const }, OkResponseSchema);
      response.headers.append("Set-Cookie", clearPassCookie());
      return response;
    }),

    checkout: route(async (request) => {
      await enforceRateLimit(request, "checkout");
      const { plan } = await readJson(request, CheckoutRequestSchema);
      const key = stripeTestKey();
      if (!key)
        throw new ApiError(
          503,
          "checkout_unavailable",
          "Test checkout isn't configured here. Use the demo code instead.",
        );
      if (!entitlementSecret())
        throw new ApiError(
          503,
          "entitlement_unavailable",
          "The season pass is not configured on this server yet.",
        );
      const price = PRICES[plan];
      const origin = siteOrigin(request);
      const stripe = new Stripe(key);
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: price.cents,
              recurring: { interval: price.interval },
              product_data: {
                name: `Do-Over season pass (${plan})`,
                description: "Test mode. No real charge.",
              },
            },
          },
        ],
        subscription_data: { trial_period_days: 7 },
        success_url: `${origin}/api/checkout/confirm?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/pricing`,
      });
      if (!session.url)
        throw new ApiError(
          502,
          "checkout_failed",
          "Stripe didn't return a checkout page. Please try again.",
        );
      return json({ url: session.url }, CheckoutResponseSchema);
    }),

    confirm: async (request: Request): Promise<Response> => {
      const origin = siteOrigin(request);
      const fail = () =>
        Response.redirect(`${origin}/pricing?checkout=incomplete`, 303);
      const id = new URL(request.url).searchParams.get("session_id") ?? "";
      const key = stripeTestKey();
      if (!key || !/^cs_test_[A-Za-z0-9]{8,200}$/.test(id)) return fail();
      try {
        const session = await new Stripe(key).checkout.sessions.retrieve(id);
        if (session.status !== "complete" || session.livemode) return fail();
        const response = new Response(null, {
          status: 303,
          headers: {
            Location: `${origin}/pro/welcome`,
            "Cache-Control": "no-store",
          },
        });
        response.headers.append("Set-Cookie", issuePassCookie("stripe_test"));
        return response;
      } catch {
        return fail();
      }
    },
  };
}
