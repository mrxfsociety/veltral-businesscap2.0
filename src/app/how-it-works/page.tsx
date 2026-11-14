import type { Metadata } from "next";
import Link from "next/link";
import { readEvaluation } from "@/lib/evaluation";
import { SCENES } from "@/engine/scenes";
import { TAG_DEFINITIONS } from "@/engine/tags";
import {
  CALM_AT,
  DELTA_MAX,
  DELTA_MIN,
  GIVE_IN_AROUSAL,
  MAX_CALMING_TAGS,
  MAX_TURNS,
  REPEAT_FACTOR,
  START_CONNECTION,
  initialState,
} from "@/engine/transition";
import type { ChildState } from "@/engine/types";
export const metadata: Metadata = {
  title: "How it works",
  description:
    "The simulation, its tagging system, measured accuracy and what we have not measured.",
};
export const dynamic = "force-dynamic";
const stateLabels: Record<keyof ChildState, string> = {
  arousal: "Arousal",
  connection: "Connection",
  limitIntact: "Limit still held",
  turn: "Turns played",
  bribed: "Earlier bribe",
  lastHelpfulTags: "Previous helpful moves",
  lastDelta: "Previous arousal change",
};
const engineSettings = [
  ["Maximum turns", MAX_TURNS],
  ["Calm at or below", CALM_AT],
  ["Starting connection", START_CONNECTION],
  ["Largest calming change per turn", DELTA_MIN],
  ["Largest rising change per turn", `+${DELTA_MAX}`],
  ["Strongest calming moves counted", MAX_CALMING_TAGS],
  ["Repeated helpful move multiplier", REPEAT_FACTOR],
  ["Arousal ceiling after giving in", GIVE_IN_AROUSAL],
] as const;
export default function HowItWorks() {
  const results = readEvaluation();
  const exampleScene = SCENES[0];
  const startingState = initialState(exampleScene);
  return (
    <article className="prose">
      <header className="page-heading">
        <p className="kicker">Open the hood</p>
        <h1>
          A practice space.
          <br />
          <em>Not a prediction.</em>
        </h1>
        <p>
          The child is simulated. The numbers are design choices for a training
          game, not measurements of real children.
        </p>
      </header>
      <h2>Words in. A visible effect out.</h2>
      <p>
        The simulation uses rules and, when available, AI to identify moves in
        your reply. Every model tag must include an exact quote from your words.
        A deterministic engine applies the moves and selects the child’s
        response. The model never decides whether you have calmed the scene.
      </p>
      <p>
        If AI is unavailable, rules identify the moves and template dialogue
        keeps the scene playable. The debrief marks these replies as tagged by
        rules only. This is not a validated parenting assessment.
      </p>
      <h2>Connect, then direct</h2>
      <p>
        The teaching model gives space to connection, clear limits and choices.
        It makes repeated moves less effective and harsh words work against
        otherwise kind language. Use the debrief to try a different response,
        rather than treating a score as a judgment about your parenting.
      </p>
      <h2>What the engine keeps track of</h2>
      <p>
        Each reply updates arousal and connection, while keeping track of the
        limit, earlier bribes and the previous helpful moves. The starting
        arousal comes from the scene. The example below is produced by the same
        starting-state function used during play.
      </p>
      <div className="table-wrap">
        <table>
          <caption>Starting state: {exampleScene.title}</caption>
          <thead>
            <tr>
              <th scope="col">State</th>
              <th scope="col">Starting value</th>
            </tr>
          </thead>
          <tbody>
            {(Object.keys(startingState) as (keyof ChildState)[]).map((key) => {
              const value = startingState[key];
              return (
                <tr key={key}>
                  <th scope="row">{stateLabels[key]}</th>
                  <td>
                    {Array.isArray(value)
                      ? value.join(", ") || "None"
                      : typeof value === "boolean"
                        ? value
                          ? "Yes"
                          : "No"
                        : value}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="table-wrap">
        <table>
          <caption>Settings read directly from the engine</caption>
          <thead>
            <tr>
              <th scope="col">Setting</th>
              <th scope="col">Value</th>
            </tr>
          </thead>
          <tbody>
            {engineSettings.map(([label, value]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Holding the limit and reaching calm ends the scene successfully. Giving
        in ends it with a separate outcome. Unsafe language pauses the scene
        without a score. Age, temperament, connection and earlier moves also
        affect the change; these settings describe this simulation, not real
        children.
      </p>
      <h2>The moves you can see</h2>
      <div className="table-wrap">
        <table className="tag-table">
          <caption>Reply tags from the engine’s definitions</caption>
          <thead>
            <tr>
              <th scope="col">Move</th>
              <th scope="col">Type</th>
              <th scope="col">Meaning and examples</th>
            </tr>
          </thead>
          <tbody>
            {TAG_DEFINITIONS.map(
              ({ tag, label, kind, definition, examples }) => (
                <tr key={tag}>
                  <th scope="row">{label}</th>
                  <td>
                    {kind === "helpful"
                      ? "✓ Helpful"
                      : tag === "UNSAFE"
                        ? "Pause for safety"
                        : "× Unhelpful"}
                  </td>
                  <td>
                    <p>{definition}</p>
                    {examples.map((example) => (
                      <p className="small" key={example}>
                        “{example}”
                      </p>
                    ))}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
      <h2>Measured tagging accuracy</h2>
      <p>
        Evaluation is reported on held-out test replies, separately from the
        examples used to tune the rules. A goal is not a result.
      </p>
      {(["rules", "merged"] as const).map((mode) => {
        const block = results[mode];
        return (
          <section key={mode}>
            <h3>{mode === "rules" ? "Rules only" : "Rules + model"}</h3>
            {block ? (
              <>
                <p>
                  {block.date} · {block.test.n} test replies
                  {block.provider ? ` · ${block.provider}` : ""}
                  {block.model ? ` / ${block.model}` : ""}
                </p>
                <p>
                  Micro F1: {block.test.microF1.toFixed(3)} · Exact set match:{" "}
                  {(block.test.exactMatch * 100).toFixed(1)}%
                </p>
                <div className="table-wrap">
                  <table>
                    <caption>
                      {mode === "rules" ? "Rules" : "Combined"} test metrics
                    </caption>
                    <thead>
                      <tr>
                        <th>Tag</th>
                        <th>Precision</th>
                        <th>Recall</th>
                        <th>F1</th>
                        <th>Examples</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(block.test.perTag).map(([tag, m]) => (
                        <tr key={tag}>
                          <th scope="row">{tag}</th>
                          <td>{m.precision.toFixed(3)}</td>
                          <td>{m.recall.toFixed(3)}</td>
                          <td>{m.f1.toFixed(3)}</td>
                          <td>{m.support}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="notice">
                No measured {mode === "rules" ? "rules-only" : "combined model"}{" "}
                results are available in this build.
              </p>
            )}
          </section>
        );
      })}
      <h2>What we can honestly claim</h2>
      <p>
        The labelled examples were drafted with an AI assistant. Human review of
        all labels has not yet been confirmed. The scoring is a simplified
        teaching model.
      </p>
      <p>
        We have not measured whether practice here changes what happens at home.
        It is a place to rehearse. We have not measured retention or willingness
        to pay; Pro prices are a hypothesis.
      </p>
      <p>
        <Link href="/privacy">Read how your data is handled</Link> or{" "}
        <Link href="/play">try a scene</Link>.
      </p>
    </article>
  );
}
