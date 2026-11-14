import type { Metadata } from "next";
import Link from "next/link";
import { readEvaluation } from "@/lib/evaluation";
import { TAG_LABELS } from "@/lib/presentation";
import { isHelpfulTag } from "@/lib/playbook";
import type { Tag } from "@/engine/types";
export const metadata: Metadata = {
  title: "How it works",
  description:
    "The simulation, its tagging system, measured accuracy and what we have not measured.",
};
export const dynamic = "force-dynamic";
export default function HowItWorks() {
  const results = readEvaluation();
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
        The finished simulation uses rules and a model to identify moves in your
        reply. Every model tag must include an exact quote from your words. A
        deterministic engine applies the moves and selects the child’s response.
        The model never decides whether you have calmed the scene.
      </p>
      <div className="notice">
        The simulation is still being connected. Its responses currently use
        development placeholders. Evaluation has not been completed; this is not
        a validated parenting assessment.
      </div>
      <h2>Connect, then direct</h2>
      <p>
        The teaching model gives space to connection, clear limits and choices.
        It makes repeated moves less effective and harsh words work against
        otherwise kind language. Use the debrief to try a different response,
        rather than treating a score as a judgment about your parenting.
      </p>
      <h2>The moves you can see</h2>
      <div className="table-wrap">
        <table className="tag-table">
          <caption>Reply tags in the shared contract</caption>
          <thead>
            <tr>
              <th scope="col">Move</th>
              <th scope="col">Type</th>
            </tr>
          </thead>
          <tbody>
            {(Object.keys(TAG_LABELS) as Tag[]).map((tag) => (
              <tr key={tag}>
                <th scope="row">{TAG_LABELS[tag]}</th>
                <td>
                  {isHelpfulTag(tag)
                    ? "✓ Helpful"
                    : tag === "UNSAFE"
                      ? "Pause for safety"
                      : "× Unhelpful"}
                </td>
              </tr>
            ))}
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
