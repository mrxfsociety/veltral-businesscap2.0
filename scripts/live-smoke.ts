/** Live acceptance evidence; real provider calls, isolated in-memory sessions.
 * Run: node --env-file=.env.local --conditions=react-server --import tsx scripts/live-smoke.ts
 * Voice input is macOS-synthesized test audio, never claimed to be a microphone recording.
 */
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createHash } from "node:crypto";
import { getEnv } from "../src/server/env";
import { Storage } from "../src/server/redis";
import { reserveModelCall } from "../src/server/stats";
import { createSessionStore } from "../src/server/sessionStore";
import { createPlayHandlers } from "../src/server/play";
import { createFeatureHandlers } from "../src/server/features";
import { createVoiceHandlers } from "../src/server/voice";
import {
  createProviderChain,
  type JsonCompleter,
  type JsonProvider,
  type ProviderAttempt,
  type ProviderName,
} from "../src/llm/provider";
import { createOpenAIProvider } from "../src/llm/openai";
import { createAnthropicProvider } from "../src/llm/anthropic";
import { createSpeechProvider } from "../src/llm/speech";
import { TurnModelSchema } from "../src/llm/schemas";
import { SCENES } from "../src/engine/scenes";
import { applyTurn } from "../src/engine/transition";
import type { AgeBand, PublicScene } from "../src/engine/types";
import {
  CoachResponseSchema,
  CustomSceneResponseSchema,
  SessionResponseSchema,
  TranscribeResponseSchema,
  TurnResponseSchema,
  type TurnResponse,
} from "../src/shared/api";

const args = process.argv.slice(2);
const output = resolve(
  args.find((arg) => arg.startsWith("--output="))?.slice(9) ??
    "work/live-smoke/results.json",
);
const selected = new Set(
  (
    args.find((arg) => arg.startsWith("--parts="))?.slice(8) ??
    "custom,coach,children,voice"
  ).split(","),
);
const sceneIds = new Set(
  (args.find((arg) => arg.startsWith("--scene-ids="))?.slice(12) ?? "")
    .split(",")
    .filter(Boolean),
);
const env = getEnv();
const storage = new Storage();
const attempts: ProviderAttempt[] = [];
const providers: Partial<Record<ProviderName, JsonProvider>> = {};
if (env.OPENAI_API_KEY && env.OPENAI_MODEL)
  providers.openai = createOpenAIProvider(
    env.OPENAI_API_KEY,
    env.OPENAI_MODEL,
    undefined,
    env.OPENAI_REASONING_EFFORT,
    env.OPENAI_TEXT_VERBOSITY,
  );
if (env.ANTHROPIC_API_KEY && env.ANTHROPIC_MODEL)
  providers.anthropic = createAnthropicProvider(
    env.ANTHROPIC_API_KEY,
    env.ANTHROPIC_MODEL,
  );
const chain = createProviderChain({
  providers,
  primary: env.LLM_PRIMARY,
  reserveCall: () => reserveModelCall(storage),
  onAttempt: (attempt) => attempts.push(attempt),
});
let lastOutput: unknown = null;
const complete: JsonCompleter = async (request) => {
  const result = await chain(request);
  lastOutput = result;
  return result;
};
const play = createPlayHandlers({ storage, complete });
const features = createFeatureHandlers({ storage, complete });
const sessions = createSessionStore(storage);
const failures: string[] = [];
const report: Record<string, unknown> = {
  testedParts: [...selected],
  selectedSceneIds: [...sceneIds],
  generatedAt: new Date().toISOString(),
  scope:
    "Live handlers with real configured providers, isolated memory storage, no production counters.",
  configuration: {
    primary: env.LLM_PRIMARY,
    openaiModel: env.OPENAI_MODEL ?? null,
    anthropicModel: env.ANTHROPIC_MODEL ?? null,
    reasoningEffort: env.OPENAI_REASONING_EFFORT ?? null,
    textVerbosity: env.OPENAI_TEXT_VERBOSITY ?? null,
    providerTimeoutMs: [4000, 3500],
  },
  voiceFixtureNotice:
    "Synthetic speech generated locally with macOS say. This verifies the real audio API path, not microphone capture or a human recording.",
};
function request(path: string, value: unknown) {
  return new Request(`https://doover.test/api/${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "198.51.100.251",
    },
    body: JSON.stringify(value),
  });
}
function progress(message: string) {
  process.stdout.write(`${message}\n`);
}
async function persist() {
  await mkdir(dirname(output), { recursive: true });
  await writeFile(
    output,
    `${JSON.stringify({ ...report, attempts, failures, passed: failures.length === 0 }, null, 2)}\n`,
  );
}
function parentReply(scene: PublicScene, index: number): string {
  const limit = scene.limit.replace(/[.!?]+$/u, "");
  return (
    [
      `You wanted ${scene.wants}. ${limit}. I'm right here.`,
      "You can have a hug or some quiet space.",
      "That feels disappointing. I'll sit with you.",
      `Thank you for taking a breath. ${limit}.`,
      "You're frustrated. Would you like a hug or some space?",
      `I'm not going anywhere. ${limit}.`,
      `You wanted ${scene.wants}. I love you.`,
      "Would you like me close or a little farther away?",
    ][index] ?? "I'm right here beside you."
  );
}
async function start(kind: "library" | "custom", sceneId: string) {
  const response = await play.session(
    request("session", { kind, sceneId, practice: true }),
  );
  if (!response.ok) throw new Error(`session returned HTTP ${response.status}`);
  return SessionResponseSchema.parse(await response.json());
}
async function takeTurn(sessionId: string, index: number, text: string) {
  const firstAttempt = attempts.length;
  const begun = performance.now();
  lastOutput = null;
  const response = await play.turn(
    request("turn", { sessionId, turnIndex: index, text, inputMode: "text" }),
  );
  const elapsedMs = Math.round(performance.now() - begun);
  if (!response.ok) throw new Error(`turn returned HTTP ${response.status}`);
  const result = TurnResponseSchema.parse(await response.json());
  const model = TurnModelSchema.safeParse(lastOutput);
  const variant =
    result.result.outcome === "calm_gave_in"
      ? "gotIt"
      : result.result.outcome === "calm_limit_held"
        ? "resolved"
        : result.result.delta <= -4
          ? "calmer"
          : result.result.delta >= 4
            ? "angrier"
            : "same";
  const expected = model.success ? model.data.lines[variant] : null;
  const expectedLine =
    result.result.after.arousal >= 80
      ? expected?.line.toUpperCase()
      : expected?.line;
  return {
    result,
    elapsedMs,
    modelSucceeded: attempts
      .slice(firstAttempt)
      .some((attempt) => attempt.success),
    childFromModel: Boolean(
      expected &&
      result.child?.line === expectedLine &&
      result.child?.action === expected.action,
    ),
  };
}
async function runCustom() {
  const descriptions = [
    {
      description:
        "My four-year-old wanted to take the garden watering can inside after we had finished watering. I said the watering can stays outside.",
      ageBand: "4-5" as const,
    },
    {
      description:
        "My six-year-old was upset because the board game ended and wanted another round, but it was time to put the game away for dinner.",
      ageBand: "6-7" as const,
    },
  ];
  const evidence: unknown[] = [];
  report.customScenes = evidence;
  for (const input of descriptions) {
    const begun = performance.now();
    const response = await features.customScene(request("custom-scene", input));
    const body = CustomSceneResponseSchema.parse(await response.json());
    const elapsedMs = Math.round(performance.now() - begun);
    if (!body.ok) {
      failures.push(`Custom scene ${input.ageBand}: ${body.reason}`);
      evidence.push({ input, elapsedMs, response: body, passed: false });
      await persist();
      continue;
    }
    const full = await sessions.getCustomScene(body.sceneId);
    const started = await start("custom", body.sceneId);
    const played = await takeTurn(
      started.sessionId,
      0,
      parentReply(started.scene, 0),
    );
    const passed = Boolean(
      full && played.modelSucceeded && played.childFromModel,
    );
    if (!passed)
      failures.push(
        `Custom scene ${input.ageBand} did not produce a real model-backed playable reply.`,
      );
    evidence.push({
      input,
      elapsedMs,
      title: body.scene.title,
      limit: body.scene.limit,
      limitHints: full?.limitHints,
      giveInHints: full?.giveInHints,
      startArousal: body.scene.startArousal,
      played,
      passed,
    });
    progress(
      `Custom ${input.ageBand}: ${passed ? "PASS" : "FAIL"}, ${elapsedMs} ms`,
    );
    await persist();
  }
}
async function runCoach() {
  const session = await start("library", "store-candy");
  const first = await takeTurn(
    session.sessionId,
    0,
    "Calm down beside this checkout counter.",
  );
  await takeTurn(session.sessionId, 1, "Fine, you can have it.");
  const begun = performance.now();
  const response = await features.coach(
    request("coach", { sessionId: session.sessionId, turnIndex: 0 }),
  );
  const body = CoachResponseSchema.parse(await response.json());
  const full = await sessions.getSession(session.sessionId);
  const checks = body.suggestions.map((suggestion) => ({
    text: suggestion.text,
    declaredDelta: suggestion.delta,
    computedDelta: full
      ? applyTurn(full.scene, first.result.result.before, suggestion.tags).delta
      : null,
    tags: suggestion.tags,
  }));
  const passed =
    body.source === "model" &&
    checks.length > 0 &&
    checks.every(
      (check) =>
        check.declaredDelta < 0 && check.declaredDelta === check.computedDelta,
    );
  if (!passed)
    failures.push("Coach returned no verified real model suggestions.");
  report.coach = {
    elapsedMs: Math.round(performance.now() - begun),
    source: body.source,
    suggestions: checks,
    fallbackTip: body.tip,
    passed,
  };
  progress(`Coach: ${passed ? "PASS" : "FAIL"}`);
  await persist();
}
async function runChildren() {
  const evidence: unknown[] = [];
  report.childLineSessions = evidence;
  for (const ageBand of ["2-3", "4-5", "6-7"] satisfies AgeBand[]) {
    const candidates = SCENES.filter(
      (candidate) => candidate.ageBand === ageBand,
    ).filter((candidate) => sceneIds.size === 0 || sceneIds.has(candidate.id));
    for (const scene of candidates.slice(
      0,
      sceneIds.size ? candidates.length : 3,
    )) {
      const session = await start("library", scene.id);
      const turns: unknown[] = [];
      let outcome: TurnResponse["result"]["outcome"] = "ongoing";
      let passed = true;
      for (let index = 0; index < 8 && outcome === "ongoing"; index++) {
        const played = await takeTurn(
          session.sessionId,
          index,
          parentReply(session.scene, index),
        );
        const words = played.result.child?.line.trim().split(/\s+/).length ?? 0;
        const shortEnough = ageBand !== "2-3" || words <= 6;
        turns.push({
          ...played,
          wordCount: words,
          ageLengthCheck: shortEnough,
        });
        outcome = played.result.result.outcome;
        if (!played.modelSucceeded || !played.childFromModel || !shortEnough) {
          passed = false;
          failures.push(
            `${scene.id} turn ${index + 1}: ${!played.modelSucceeded ? "provider fallback" : !played.childFromModel ? "template fallback" : "age 2–3 line longer than six words"}`,
          );
          if (!played.modelSucceeded) break;
        }
      }
      if (outcome === "calm_gave_in") {
        passed = false;
        failures.push(
          `${scene.id}: limit-holding practice replies were classified as a concession.`,
        );
      }
      evidence.push({
        sceneId: scene.id,
        ageBand,
        title: scene.title,
        outcome,
        completed: outcome !== "ongoing",
        turns,
        passed: passed && outcome !== "ongoing",
      });
      progress(
        `Child quality ${ageBand}/${scene.id}: ${passed && outcome !== "ongoing" ? "PASS" : "FAIL"} (${turns.length} turns, ${outcome})`,
      );
      await persist();
    }
  }
}
function mediaInfo(path: string): unknown {
  return JSON.parse(
    execFileSync(
      "ffprobe",
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration,size:stream=codec_name,sample_rate,channels",
        "-of",
        "json",
        path,
      ],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    ),
  ) as unknown;
}
async function runVoice() {
  const fixtureDirectory = resolve(dirname(output), "synthetic-audio");
  await mkdir(fixtureDirectory, { recursive: true });
  const aiff = resolve(fixtureDirectory, "input.aiff");
  const wav = resolve(fixtureDirectory, "input.wav");
  const mp3 = resolve(fixtureDirectory, "child-opening.mp3");
  const phrase = "I hear you. You wanted another turn. I am here.";
  execFileSync("say", ["-r", "135", "-o", aiff, phrase], { stdio: "ignore" });
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-v",
      "error",
      "-i",
      aiff,
      "-ac",
      "1",
      "-ar",
      "16000",
      "-c:a",
      "pcm_s16le",
      wav,
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  const fixture = await readFile(wav);
  const speech = createSpeechProvider({
    apiKey: env.OPENAI_API_KEY,
    transcribeModel: env.OPENAI_TRANSCRIBE_MODEL,
    ttsModel: env.OPENAI_TTS_MODEL,
    reserveCall: () => reserveModelCall(storage),
  });
  const voice = createVoiceHandlers({
    storage,
    transcribe: speech.transcribeAudio,
    speak: speech.synthesizeSpeech,
  });
  const form = new FormData();
  form.append(
    "audio",
    new File([fixture], "synthetic-input.wav", { type: "audio/wav" }),
  );
  let begun = performance.now();
  const transcribed = await voice.transcribe(
    new Request("https://doover.test/api/transcribe", {
      method: "POST",
      body: form,
    }),
  );
  const sttMs = Math.round(performance.now() - begun);
  if (!transcribed.ok) {
    report.voice = {
      fixture: "Synthetic macOS speech; no microphone capture.",
      input: mediaInfo(wav),
      transcribe: {
        status: transcribed.status,
        elapsedMs: sttMs,
        body: await transcribed.json(),
      },
      passed: false,
    };
    failures.push(`Transcription failed: HTTP ${transcribed.status}`);
    await persist();
    return;
  }
  const transcript = TranscribeResponseSchema.parse(await transcribed.json());
  const normalize = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  const transcriptMatches = normalize(transcript.text) === normalize(phrase);
  const session = await start("library", "bedtime");
  begun = performance.now();
  const spoken = await voice.speak(
    request("speak", { sessionId: session.sessionId, turnIndex: -1 }),
  );
  const ttsMs = Math.round(performance.now() - begun);
  if (!spoken.ok) {
    report.voice = {
      transcript: transcript.text,
      transcriptMatches,
      transcribeMs: sttMs,
      speak: {
        status: spoken.status,
        elapsedMs: ttsMs,
        body: await spoken.json(),
      },
      passed: false,
    };
    failures.push(`Speech synthesis failed: HTTP ${spoken.status}`);
    await persist();
    return;
  }
  const audio = new Uint8Array(await spoken.arrayBuffer());
  await writeFile(mp3, audio);
  execFileSync("ffmpeg", ["-v", "error", "-i", mp3, "-f", "null", "-"], {
    stdio: ["ignore", "ignore", "pipe"],
  });
  begun = performance.now();
  const cached = await voice.speak(
    request("speak", { sessionId: session.sessionId, turnIndex: -1 }),
  );
  const cachedMs = Math.round(performance.now() - begun);
  const cachedAudio = new Uint8Array(await cached.arrayBuffer());
  const hash = (bytes: Uint8Array) =>
    createHash("sha256").update(bytes).digest("hex");
  const cacheMatches = cached.ok && hash(audio) === hash(cachedAudio);
  const passed = transcriptMatches && cacheMatches;
  if (!passed)
    failures.push(
      "Voice transcript or cached audio did not match expected evidence.",
    );
  report.voice = {
    fixture: "Synthetic macOS speech; no microphone capture.",
    fixturePhrase: phrase,
    input: mediaInfo(wav),
    transcript: transcript.text,
    transcriptMatches,
    transcribeModel: env.OPENAI_TRANSCRIBE_MODEL,
    transcribeMs: sttMs,
    childLine: session.scene.openingLine,
    speechModel: env.OPENAI_TTS_MODEL,
    synthesizeMs: ttsMs,
    cachedMs,
    cacheMatches,
    output: mediaInfo(mp3),
    decodePassed: true,
    passed,
  };
  progress(
    `Voice: ${passed ? "PASS" : "FAIL"}; STT ${sttMs} ms, TTS ${ttsMs} ms, cache ${cachedMs} ms`,
  );
  await persist();
}

async function main() {
  try {
    if (!Object.keys(providers).length)
      throw new Error("No model provider configured.");
    if (
      !selected.size ||
      [...selected].some(
        (part) => !["custom", "coach", "children", "voice"].includes(part),
      )
    )
      throw new Error("Choose a valid smoke-test part.");
    if ([...sceneIds].some((id) => !SCENES.some((scene) => scene.id === id)))
      throw new Error("Choose valid scene ids.");
    for (const [part, run] of [
      ["custom", runCustom],
      ["coach", runCoach],
      ["children", runChildren],
      ["voice", runVoice],
    ] as const) {
      if (!selected.has(part)) continue;
      try {
        await run();
      } catch {
        failures.push(
          `${part}: live probe failed; inspect sanitized partial evidence and local tool availability.`,
        );
        progress(`${part}: FAIL`);
        await persist();
      }
    }
    await persist();
    progress(
      `Evidence saved to ${output}; ${failures.length} unresolved check(s).`,
    );
    if (failures.length) process.exitCode = 1;
  } finally {
    storage.close();
  }
}
void main().catch(() => {
  process.stderr.write(
    "Live smoke could not start; check provider configuration and tool availability.\n",
  );
  process.exitCode = 1;
});
