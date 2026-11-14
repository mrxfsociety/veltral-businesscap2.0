import type { Metadata } from "next";
import Link from "next/link";
import { readEvaluation } from "@/lib/evaluation";
import { SCENES } from "@/engine/scenes";
import { TAG_DEFINITIONS } from "@/engine/tags";
import type { ChildState } from "@/engine/types";
import {
  CALM_AT,
  DELTA_MIN,
  DELTA_MAX,
  GIVE_IN_AROUSAL,
  MAX_CALMING_TAGS,
  MAX_TURNS,
  REPEAT_FACTOR,
  START_CONNECTION,
  initialState,
} from "@/engine/transition";
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
        Rules identify moves in your reply. When a model is configured, it can
        propose additional tags and child dialogue. Each model tag must quote
        your words exactly before the engine can accept it. The deterministic
        engine controls arousal, connection, limits and the outcome. Without a
        working model, rules and written child lines keep the scene playable.
      </p>
      <div className="notice">
        This is a simplified teaching model, not a validated parenting
        assessment. A score describes this simulation, not your child or you.
      </div>
      <h2>Connect, then direct</h2>
      <p>
        The teaching model gives space to connection, clear limits and choices.
        It makes repeated moves less effective and harsh words work against
        otherwise kind language. Use the debrief to try a different response,
        rather than treating a score as a judgment about your parenting.
      </p>
      <h2>What the engine keeps track of</h2>
      <p>
        Each reply updates arousal and connection while keeping track of the
        limit, earlier bribes and previous helpful moves. Starting arousal comes
        from the scene. This example uses the same starting-state function as
        the simulation.
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
          <caption>Current engine settings</caption>
          <tbody>
            <tr>
              <th scope="row">Calm threshold</th>
              <td>
                Arousal at or below {CALM_AT} out of 100, with the limit held
              </td>
            </tr>
            <tr>
              <th scope="row">Scene length</th>
              <td>Up to {MAX_TURNS} turns</td>
            </tr>
            <tr>
              <th scope="row">Starting connection</th>
              <td>{START_CONNECTION} out of 100</td>
            </tr>
            <tr>
              <th scope="row">Arousal change on an ordinary turn</th>
              <td>
                From {DELTA_MIN} to +{DELTA_MAX}, bounded by 0 and 100
              </td>
            </tr>
            <tr>
              <th scope="row">Calming moves counted</th>
              <td>The {MAX_CALMING_TAGS} strongest helpful calming effects</td>
            </tr>
            <tr>
              <th scope="row">Repeated helpful calming move</th>
              <td>
                {REPEAT_FACTOR * 100}% of its usual effect on the next turn
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Age, temperament, connection and previous replies also modify effects.
        Giving in overrides the usual change limits, reducing arousal to at most{" "}
        {GIVE_IN_AROUSAL} and ending the scene with a lost limit. Unsafe replies
        stop it without a score.
      </p>
      <h2>The moves you can see</h2>
      <div className="table-wrap">
        <table className="tag-table">
          <caption>The engine’s reply tags and definitions</caption>
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
        examples used to tune the rules. These are tagging results on a small,
        purpose-built dataset, not evidence that the game improves parenting.
      </p>
      {(["rules", "merged"] as const).map((mode) => {
        const block = results[mode];
        const weakest = block
          ? Object.entries(block.test.perTag)
              .filter(([, metric]) => metric.support > 0 && metric.f1 < 1)
              .sort((left, right) => left[1].f1 - right[1].f1)
              .slice(0, 3)
          : [];
        return (
          <section key={mode}>
            <h3>{mode === "rules" ? "Rules only" : "Rules + model"}</h3>
            {block ? (
              <>
                <p>
                  {block.date.slice(0, 10)} · {block.test.count} test replies
                  {block.provider ? ` · ${block.provider}` : ""}
                  {block.model ? ` / ${block.model}` : ""}
                </p>
                <p>
                  Micro F1: {block.test.microF1.toFixed(3)} · Exact set match:{" "}
                  {(block.test.exactSetMatch * 100).toFixed(1)}%
                </p>
                <p>
                  Unhelpful-tag precision:{" "}
                  {(block.test.unhelpfulPrecision * 100).toFixed(1)}%.
                  {block.test.medianLatencyMs !== null
                    ? ` Median tagging latency: ${(block.test.medianLatencyMs / 1000).toFixed(2)} seconds.`
                    : " Tagging latency was not recorded for this test run."}
                </p>
                {block.requestTimeoutMs !== undefined && (
                  <p className="small muted">
                    This evaluation allowed up to{" "}
                    {block.requestTimeoutMs / 1000} seconds per model request.
                    These are benchmark results, not a promise of live response
                    time.
                  </p>
                )}
                {weakest.length > 0 && (
                  <p className="small">
                    Lowest test F1 among tags with examples:{" "}
                    {weakest
                      .map(
                        ([tag, metric]) =>
                          `${tag} ${metric.f1.toFixed(3)} (${metric.support} examples)`,
                      )
                      .join("; ")}
                    . Small per-tag samples limit what these scores establish.
                  </p>
                )}
                <div
                  className="table-wrap"
                  role="region"
                  aria-labelledby={`${mode}-metrics-caption`}
                  tabIndex={0}
                >
                  <table>
                    <caption id={`${mode}-metrics-caption`}>
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
        The labelled examples were drafted with an AI assistant.{" "}
        {results.dataset?.labelsReviewedByHuman
          ? "The dataset records that its labels have been reviewed by a human."
          : "The dataset does not record completed human review of all labels."}{" "}
        {results.dataset
          ? `The dataset contains ${results.dataset.count} replies: ${results.dataset.dev} development examples and ${results.dataset.test} held-out test examples.`
          : "Dataset provenance is not available in this build."}
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
