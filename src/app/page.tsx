import Link from "next/link";
import { applyTurn, initialState, ruleTags } from "@/engine";
import { dayKey, dayNumber, getScene, sceneOfTheDay } from "@/engine/scenes";
import { getScenePars } from "@/lib/catalog";
import { readEvaluation } from "@/lib/evaluation";
import type { TurnResponse } from "@/shared/api";
import { ButtonLink, Kicker, Sheet } from "@/components/paper/primitives";
import { PaperStage } from "@/components/stage/paper-stage";
import { TurnSlip } from "@/components/play/turn-slip";
import styles from "./landing.module.css";

export const dynamic = "force-dynamic";

/** One labelled sample reply, scored by the real engine (rules only) on every request. */
const SAMPLE_SCENE = "playground-leave";
const SAMPLE_REPLY =
  "You're sad to leave. It's time to go. Slide or swing for the last turn?";

function publicOf<T extends { limitHints: unknown; giveInHints: unknown }>(
  scene: T,
) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { limitHints, giveInHints, ...rest } = scene;
  return rest;
}

export default function Home() {
  const key = dayKey(new Date());
  const today = sceneOfTheDay(key);
  const number = dayNumber(key);
  const par = getScenePars()[today.id];
  const results = readEvaluation();

  const sample = getScene(SAMPLE_SCENE) ?? today;
  const hits = ruleTags(SAMPLE_REPLY, sample);
  const result = applyTurn(
    sample,
    initialState(sample),
    hits.map((hit) => hit.tag),
  );
  const sampleTurn: TurnResponse = {
    turnIndex: 0,
    text: SAMPLE_REPLY,
    hits,
    result,
    child: null,
    tagging: "rules",
    score: null,
    daily: null,
    usedDoOver: false,
  };
  const todayPublic = publicOf(today);
  const samplePublic = publicOf(sample);

  return (
    <div className={styles.landing}>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroText}>
          <Kicker accent>A rehearsal stage for parents</Kicker>
          <h1 id="hero-title">
            You know what to say. <em>Until they scream.</em>
          </h1>
          <p className={styles.lede}>
            Do-Over is a 3-minute meltdown simulator for parents of 2–7 year
            olds. Practise the moment before it happens. No account needed.
          </p>
          <div className={styles.heroActions}>
            <ButtonLink href="/play" size="large" icon="play">
              Play today&apos;s meltdown
            </ButtonLink>
            <p className={styles.daily}>
              Do-Over #{number} · {today.title} · par {par}
            </p>
          </div>
        </div>
        <div className={styles.heroStage}>
          <PaperStage
            scene={todayPublic}
            state={{
              arousal: today.startArousal,
              connection: 50,
              lastDelta: 0,
              turn: 0,
            }}
            seed={`landing:${key}`}
            bubble={{ line: today.openingLine, action: today.openingAction }}
          />
        </div>
      </section>

      <section className={styles.section} aria-labelledby="how-title">
        <div className={styles.sectionHead}>
          <Kicker>How it works</Kicker>
          <h2 id="how-title">
            A hard minute. <em>Then another take.</em>
          </h2>
        </div>
        <ol className={styles.steps}>
          <li>
            <PaperStage
              scene={samplePublic}
              state={{ arousal: 90, connection: 40, lastDelta: 6, turn: 1 }}
              seed="landing:storm"
              bubble={{
                line: sample.openingLine.toUpperCase(),
                action: sample.openingAction,
              }}
            />
            <h3>They melt down.</h3>
            <p>
              A familiar scene, a child with very big feelings, a limit to hold.
              The weather is the storm inside them.
            </p>
          </li>
          <li>
            <PaperStage
              scene={samplePublic}
              state={result.after}
              seed="landing:stamp"
            />
            <div className={styles.sampleSlip}>
              <TurnSlip turn={sampleTurn} scene={samplePublic} />
            </div>
            <h3>You answer. Your words are stamped.</h3>
            <p>
              Sample reply, scored just now by the engine (rules only): every
              move it found, what each did, and the total.
            </p>
          </li>
          <li>
            <PaperStage
              scene={samplePublic}
              state={{ arousal: 18, connection: 78, lastDelta: -14, turn: 3 }}
              outcome="calm_limit_held"
              seed="landing:calm"
            >
              <div className={styles.clapper} aria-hidden="true">
                <span />
                <strong>Take 2</strong>
              </div>
            </PaperStage>
            <h3>Rewind any turn.</h3>
            <p>
              Do it over from the exact moment it went wrong, and see both takes
              side by side.
            </p>
          </li>
        </ol>
      </section>

      <section className={styles.split} aria-labelledby="truth-title">
        <Sheet lift={2} className={styles.truth}>
          <Kicker>No mystery score</Kicker>
          <h2 id="truth-title">
            The model proposes. <em>The engine decides.</em>
          </h2>
          <p>
            A tested, deterministic engine moves the child&apos;s storm and
            decides every outcome. A language model may only propose tags, each
            backed by an exact quote from your reply, and the game still works
            with the model switched off.
          </p>
          <p className={styles.metric}>
            {results.rules ? (
              <>
                <span className="tabular">
                  {results.rules.test.microF1.toFixed(3)}
                </span>{" "}
                rules-only tagging F1 on {results.rules.test.count} held-out
                replies
                {results.merged
                  ? `; ${results.merged.test.microF1.toFixed(3)} with the model.`
                  : "."}
              </>
            ) : (
              "Measured tagging accuracy is not available in this build."
            )}
          </p>
          <Link href="/how-it-works">See the method and its limits</Link>
        </Sheet>
        <Sheet className={styles.facts}>
          <Kicker>Why rehearse</Kicker>
          <p className={styles.fact}>
            <strong className="tabular">48%</strong> of parents say that most
            days their stress is completely overwhelming, compared to 26% among
            other adults.{" "}
            <a
              href="https://www.hhs.gov/surgeongeneral/reports-and-publications/parents/index.html"
              target="_blank"
              rel="noreferrer"
            >
              U.S. Surgeon General&apos;s Advisory, 2024
            </a>
          </p>
          <p className={styles.fact}>
            A meta-analysis of 77 evaluations of parent training programs found
            larger effects for programs that, among other things, required
            parents to practise new skills with their own child during sessions.{" "}
            <a
              href="https://pubmed.ncbi.nlm.nih.gov/18205039/"
              target="_blank"
              rel="noreferrer"
            >
              Kaminski and colleagues, 2008
            </a>
          </p>
          <p className="muted">
            Do-Over is rehearsal against a simulated child; we have not measured
            whether practice here changes what happens at home.
          </p>
        </Sheet>
      </section>

      <section className={styles.passStrip} aria-labelledby="pass-title">
        <div>
          <Kicker accent>Free and season pass</Kicker>
          <h2 id="pass-title">Today&apos;s meltdown is free, every day.</h2>
          <p>
            The season pass opens all twelve scenes, replays of your own
            meltdowns, coach suggestions, voice and an unlimited playbook. $9.99
            a month or $59.99 a year, with a 7-day free trial.
          </p>
        </div>
        <ButtonLink href="/pricing" variant="secondary" icon="ticket">
          See the season pass
        </ButtonLink>
      </section>
    </div>
  );
}
