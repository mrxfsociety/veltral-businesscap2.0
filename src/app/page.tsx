import type { ReactNode } from "react";
import { Geist } from "next/font/google";
import { cookies } from "next/headers";
import Link from "next/link";
import { applyTurn, initialState, ruleTags } from "@/engine";
import {
  SCENES,
  dayKey,
  dayNumber,
  getScene,
  sceneOfTheDay,
} from "@/engine/scenes";
import { HELPFUL } from "@/engine/tags";
import type { AgeBand } from "@/engine/types";
import { getScenePars } from "@/lib/catalog";
import { readEvaluation } from "@/lib/evaluation";
import { isHelpfulTag, tagLabel } from "@/lib/presentation";
import { formatDelta, ledgerFor } from "@/components/play/takes";
import { quoteSegments } from "@/components/play/quotes";
import { Icon, type IconName } from "@/components/paper/icons";
import { PaperStage } from "@/components/stage/paper-stage";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingMotion } from "@/components/landing/motion";
import { Plans } from "@/components/landing/plans";
import { parseTheme, THEME_COOKIE } from "@/components/landing/theme";
import { VeltralLogo, VeltralMark } from "@/components/landing/veltral-logo";
import styles from "./landing.module.css";

export const dynamic = "force-dynamic";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

/** One sample reply, scored by the real engine (rules only) on every request. */
const SAMPLE_SCENE = "playground-leave";
const SAMPLE_REPLY =
  "You're sad to leave. It's time to go. Slide or swing for the last turn?";

/** Move ranks from REDESIGN 8.2: the number of uses each one needs. */
const RANKS: { label: string; uses: number }[] = [
  { label: "Rough cut", uses: 1 },
  { label: "Rehearsed", uses: 5 },
  { label: "Stage-ready", uses: 15 },
  { label: "Second nature", uses: 30 },
];

const AGE_BANDS: AgeBand[] = ["2-3", "4-5", "6-7"];

const FAQ: { q: string; a: string }[] = [
  {
    q: "Is Do-Over therapy or advice?",
    a: "No. It is a practice tool, not therapy, medical advice or a diagnosis. The child is simulated and the scoring is a simplified model.",
  },
  {
    q: "Do I need an account?",
    a: "No. Today's scene is free and needs no account. Your history, streak and saved lines stay in this browser.",
  },
  {
    q: "What happens to what I type?",
    a: "Your replies go to our server to run the scene, and to an AI model to tag them. Leave out real names and anything that identifies your family.",
  },
  {
    q: "Does an AI decide my score?",
    a: "No. A tested, deterministic engine decides every outcome. A language model may only suggest tags, each tied to an exact quote from your reply, and the game still works with the model switched off.",
  },
  {
    q: "Which ages is it for?",
    a: "Parents of children aged 2 to 7. There are four scenes each for ages 2–3, 4–5 and 6–7, with easygoing, sensitive and spirited children.",
  },
  {
    q: "Can I rehearse something that really happened?",
    a: "Yes, with the season pass. Describe what happened today and it becomes a scene you can replay.",
  },
];

function publicOf<T extends { limitHints: unknown; giveInHints: unknown }>(
  scene: T,
) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { limitHints, giveInHints, ...rest } = scene;
  return rest;
}

const ages = (band: string) => band.replace("-", "–");

function Pill({ children }: { children: ReactNode }) {
  return (
    <p className={styles.pill}>
      <span className={styles.pillDot} aria-hidden="true" />
      {children}
    </p>
  );
}

function IconBox({ name }: { name: IconName }) {
  return (
    <span className={styles.iconBox} aria-hidden="true">
      <Icon name={name} size={22} />
    </span>
  );
}

function Head({
  pill,
  id,
  title,
  sub,
}: {
  pill: string;
  id: string;
  title: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <header className={styles.head} data-reveal="">
      <Pill>{pill}</Pill>
      <h2 id={id}>{title}</h2>
      {sub && <p>{sub}</p>}
    </header>
  );
}

export default async function Home() {
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  const key = dayKey(new Date());
  const today = sceneOfTheDay(key);
  const number = dayNumber(key);
  const pars = getScenePars();
  const par = pars[today.id];
  const results = readEvaluation();

  const sample = getScene(SAMPLE_SCENE) ?? today;
  const hits = ruleTags(SAMPLE_REPLY, sample);
  const result = applyTurn(
    sample,
    initialState(sample),
    hits.map((hit) => hit.tag),
  );
  const ledger = ledgerFor(result);
  const firstMove = ledger.rows.find((row) => row.kind === "tag");
  const segments = quoteSegments(SAMPLE_REPLY, hits);
  const sampleHelpful = result.tags.filter((tag) => isHelpfulTag(tag));
  const year = new Date().getFullYear();

  return (
    <div
      className={`${styles.landing} ${geist.variable}`}
      data-landing=""
      data-theme={theme ?? undefined}
    >
      <LandingHeader theme={theme} />
      <LandingMotion />

      {/* ─── hero ───────────────────────────────────────────────── */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroCopy}>
          <Link href="/play" className={styles.heroPill}>
            <span className={styles.heroPillTag}>Today</span>
            Do-Over #{number}: {today.title}
          </Link>
          <h1 id="hero-title">
            You know what to say.{" "}
            <span className={styles.muted}>Until they scream.</span>
          </h1>
          <p className={styles.lede}>
            Do-Over is a 3-minute meltdown simulator for parents of 2–7 year
            olds. Practise the moment before it happens. No account needed.
          </p>
          <div className={styles.actions}>
            <Link href="/play" className={styles.primary}>
              Play today&apos;s meltdown
            </Link>
            <Link href="#how" className={styles.secondary}>
              How it works
            </Link>
          </div>
          <ul className={styles.proof}>
            <li>
              <Icon name="check" size={16} aria-hidden="true" />
              Free every day
            </li>
            <li>
              <Icon name="check" size={16} aria-hidden="true" />
              No account
            </li>
            <li>
              <Icon name="check" size={16} aria-hidden="true" />
              About 3 minutes
            </li>
          </ul>
          <p className={styles.daily}>
            Do-Over #{number} · {today.title} · par {par}
          </p>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.gradient}>
            <div className={styles.stageWrap}>
              <PaperStage
                scene={publicOf(today)}
                state={initialState(today)}
                seed={`landing:${key}`}
                bubble={{
                  line: today.openingLine,
                  action: today.openingAction,
                }}
              />
            </div>
            <div className={`${styles.float} ${styles.floatA}`}>
              <p className={styles.floatLabel}>Storm at the start</p>
              <p className={styles.floatValue}>{today.startArousal}</p>
              <span className={styles.floatBar} aria-hidden="true">
                <span style={{ width: `${today.startArousal}%` }} />
              </span>
            </div>
            {firstMove && firstMove.kind === "tag" && (
              <div className={`${styles.float} ${styles.floatB}`}>
                <span className={styles.floatCheck} aria-hidden="true">
                  <Icon name="check" size={14} />
                </span>
                <div>
                  <p className={styles.floatLabel}>Sample reply</p>
                  <p className={styles.floatMove}>
                    {tagLabel(firstMove.tag)}{" "}
                    <strong>{formatDelta(firstMove.value)}</strong>
                  </p>
                </div>
              </div>
            )}
          </div>
          <p className={styles.caption}>
            Today&apos;s scene, live: {today.childName}, {ages(today.ageBand)},{" "}
            {today.temperament}.
          </p>
        </div>
      </section>

      {/* ─── scenes strip ──────────────────────────────────────── */}
      <section className={styles.strip} aria-labelledby="strip-title">
        <p id="strip-title" className={styles.stripTitle}>
          {SCENES.length} scenes to rehearse, one free every day
        </p>
        <div className={styles.marquee}>
          {[0, 1].map((copy) => (
            <ul
              key={copy}
              className={styles.track}
              aria-hidden={copy === 1 || undefined}
            >
              {SCENES.map((scene) => (
                <li key={scene.id}>
                  <VeltralMark className={styles.trackMark} />
                  {scene.title}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </section>

      {/* ─── why ───────────────────────────────────────────────── */}
      <section className={styles.section} aria-labelledby="why-title">
        <Head
          pill="Why Do-Over"
          id="why-title"
          title="Built for the hardest minute of parenting"
          sub="Three things make it a rehearsal, not a quiz."
        />
        <div className={styles.three}>
          <article className={styles.card} data-reveal="">
            <IconBox name="cloud" />
            <h3>A child with real weather</h3>
            <p>
              The storm is a number the engine moves with every reply. Clouds,
              rain and the child&apos;s pose follow it.
            </p>
            <div className={styles.widget}>
              <p className={styles.widgetTitle}>One reply, before and after</p>
              <div className={styles.bars}>
                <div>
                  <span
                    className={styles.barCol}
                    style={{ height: `${result.before.arousal}%` }}
                  />
                  <span>{result.before.arousal}</span>
                </div>
                <div>
                  <span
                    className={`${styles.barCol} ${styles.barCalm}`}
                    style={{ height: `${result.after.arousal}%` }}
                  />
                  <span>{result.after.arousal}</span>
                </div>
              </div>
            </div>
          </article>

          <article className={styles.card} data-reveal="">
            <IconBox name="check" />
            <h3>Every word is scored</h3>
            <p>
              Each move in your reply is named, with the exact words that made
              it and what it did to the storm.
            </p>
            <div className={styles.widget}>
              <p className={styles.widgetTitle}>Sample reply</p>
              <ul className={styles.miniLedger}>
                {ledger.rows
                  .filter((row) => row.kind === "tag")
                  .slice(0, 2)
                  .map((row) =>
                    row.kind === "tag" ? (
                      <li key={row.key}>
                        <span className={styles.good} aria-hidden="true">
                          <Icon name="check" size={12} />
                        </span>
                        {tagLabel(row.tag)}
                        <strong>{formatDelta(row.value)}</strong>
                      </li>
                    ) : null,
                  )}
                <li className={styles.miniTotal}>
                  This reply
                  <strong>{formatDelta(ledger.total)}</strong>
                </li>
              </ul>
            </div>
          </article>

          <article className={styles.card} data-reveal="">
            <IconBox name="rewind" />
            <h3>Rewind any turn</h3>
            <p>
              Go back to the moment it went wrong and try other words. Both
              takes sit side by side.
            </p>
            <div className={styles.widget}>
              <p className={styles.widgetTitle}>Do-over from turn 3</p>
              <ol className={styles.turns} aria-hidden="true">
                <li>1</li>
                <li>2</li>
                <li data-picked="">3</li>
                <li data-gone="">4</li>
                <li data-gone="">5</li>
              </ol>
              <span className={styles.take}>Take 2</span>
            </div>
          </article>
        </div>
      </section>

      {/* ─── what's inside ─────────────────────────────────────── */}
      <section className={styles.section} aria-labelledby="inside-title">
        <Head
          pill="Inside"
          id="inside-title"
          title="Everything you need to practise"
          sub="Progress stays in your browser and grows with every scene."
        />
        <div className={styles.bento}>
          <article className={styles.tile} data-reveal="">
            <div className={styles.widget}>
              <p className={styles.widgetTitle}>
                {HELPFUL.length} moves, four ranks
              </p>
              <ul className={styles.ranks}>
                {RANKS.map((rank) => (
                  <li key={rank.label}>
                    <span>{rank.label}</span>
                    <span className={styles.rankBar} aria-hidden="true">
                      <span style={{ width: `${(rank.uses / 30) * 100}%` }} />
                    </span>
                    <span className={styles.rankUses}>{rank.uses}</span>
                  </li>
                ))}
              </ul>
            </div>
            <h3>Moves that grow</h3>
            <p>Every helpful move counts toward its rank.</p>
          </article>

          <article className={styles.tile} data-reveal="">
            <div className={styles.widget}>
              <p className={styles.widgetTitle}>Saved line</p>
              <p className={styles.savedLine}>&ldquo;{SAMPLE_REPLY}&rdquo;</p>
              <p className={styles.savedTags}>
                {sampleHelpful.map((tag) => tagLabel(tag)).join(" · ")}
              </p>
            </div>
            <h3>Your own playbook</h3>
            <p>Keep the lines that worked and share them with a co-parent.</p>
          </article>

          <article className={styles.tile} data-reveal="">
            <div className={styles.widget}>
              <p className={styles.widgetTitle}>This week</p>
              <ul className={styles.plan}>
                <li>Swap your top slip</li>
                <li>Grow your weakest move</li>
                <li>Play today&apos;s meltdown</li>
              </ul>
            </div>
            <h3>A plan for the week</h3>
            <p>Three things to rehearse, ticked off as you do them.</p>
          </article>

          <article className={styles.tile} data-reveal="">
            <div className={styles.widget}>
              <p className={styles.widgetTitle}>Scenes by age</p>
              <ul className={styles.agesList}>
                {AGE_BANDS.map((band) => (
                  <li key={band}>
                    <span>Ages {ages(band)}</span>
                    <strong>
                      {SCENES.filter((scene) => scene.ageBand === band).length}
                    </strong>
                  </li>
                ))}
              </ul>
            </div>
            <h3>Twelve scenes</h3>
            <p>Candy aisles, car seats, bedtime and more, ages 2 to 7.</p>
          </article>

          <article className={styles.tile} data-reveal="">
            <div className={`${styles.widget} ${styles.voice}`}>
              <span className={styles.mic} aria-hidden="true">
                <Icon name="microphone" size={22} />
              </span>
              <span className={styles.wave} aria-hidden="true">
                {[8, 18, 12, 26, 16, 30, 14, 22, 10, 20, 12, 6].map((h, i) => (
                  <i key={i} style={{ height: `${h}px` }} />
                ))}
              </span>
            </div>
            <h3>Say it out loud</h3>
            <p>Voice mode with the season pass: speak, and hear the child.</p>
          </article>

          <article className={styles.tile} data-reveal="">
            <div className={styles.widget}>
              <p className={styles.widgetTitle}>Tagging accuracy</p>
              <p className={styles.bigStat}>
                {results.rules ? results.rules.test.microF1.toFixed(3) : "—"}
              </p>
              <p className={styles.statNote}>
                {results.rules
                  ? `F1, rules only, ${results.rules.test.count} held-out replies`
                  : "Not available in this build"}
              </p>
            </div>
            <h3>A score you can check</h3>
            <p>
              The engine decides.{" "}
              <Link href="/how-it-works">See the method</Link>.
            </p>
          </article>
        </div>
      </section>

      {/* ─── one reply, scored live ────────────────────────────── */}
      <section className={styles.section} aria-labelledby="sample-title">
        <Head
          pill="Scored live"
          id="sample-title"
          title="See what one reply actually did"
          sub={`A sample reply from ${sample.title.toLowerCase()}, scored by the engine when this page loaded.`}
        />
        <div className={styles.sample} data-reveal="">
          <div className={styles.dialogue}>
            <div className={styles.bubbleChild}>
              <p className={styles.who}>
                {sample.childName}, {ages(sample.ageBand)}
              </p>
              <p className={styles.said}>{sample.openingLine}</p>
              <p className={styles.action}>{sample.openingAction}</p>
            </div>
            <div className={styles.bubbleYou}>
              <p className={styles.who}>You</p>
              <p className={styles.said}>
                {segments.map((segment, index) =>
                  segment.marked ? (
                    <mark key={index}>{segment.text}</mark>
                  ) : (
                    <span key={index}>{segment.text}</span>
                  ),
                )}
              </p>
            </div>
            <p className={styles.note}>
              Underlined: the words the engine matched to a move.
            </p>
          </div>

          <div className={styles.ledgerCard}>
            <table className={styles.ledger}>
              <caption>The ledger</caption>
              <tbody>
                {ledger.rows.map((row) => {
                  const helpful = row.kind === "tag" && isHelpfulTag(row.tag);
                  return (
                    <tr key={row.key}>
                      <th scope="row">
                        {row.kind === "tag" ? (
                          <>
                            <span
                              className={helpful ? styles.good : styles.bad}
                              aria-hidden="true"
                            >
                              <Icon
                                name={helpful ? "check" : "cross"}
                                size={12}
                              />
                            </span>
                            {tagLabel(row.tag)}
                            <span className="sr-only">
                              {helpful ? ", helpful" : ", unhelpful"}
                            </span>
                          </>
                        ) : (
                          <span className={styles.ruleRow}>{row.label}</span>
                        )}
                      </th>
                      <td>{formatDelta(row.value)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">This reply</th>
                  <td>{formatDelta(ledger.total)}</td>
                </tr>
              </tfoot>
            </table>
            <div
              className={styles.meter}
              role="img"
              aria-label={`Storm went from ${result.before.arousal} to ${result.after.arousal}`}
            >
              <div className={styles.meterRow}>
                <span>Storm</span>
                <strong>
                  {result.before.arousal} → {result.after.arousal}
                </strong>
              </div>
              <span className={styles.meterTrack}>
                <span
                  className={styles.meterBefore}
                  style={{ width: `${result.before.arousal}%` }}
                />
                <span
                  className={styles.meterAfter}
                  style={{ width: `${result.after.arousal}%` }}
                />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── how it works ──────────────────────────────────────── */}
      <section id="how" className={styles.section} aria-labelledby="how-title">
        <Head
          pill="How it works"
          id="how-title"
          title="Three steps, three minutes"
          sub="No setup and no sign-up. Open the scene and answer."
        />
        <ol className={styles.steps}>
          <li data-reveal="">
            <IconBox name="play" />
            <h3>Open today&apos;s scene</h3>
            <p>
              A familiar moment and a child with very big feelings. Read the
              limit you need to hold, then press Start.
            </p>
          </li>
          <li data-reveal="">
            <IconBox name="script" />
            <h3>Answer in your own words</h3>
            <p>
              Type what you would say. The child answers back, and the storm
              rises or settles.
            </p>
          </li>
          <li data-reveal="">
            <IconBox name="rewind" />
            <h3>Take it again</h3>
            <p>
              See what each reply did, rewind to the turn that went wrong, and
              try other words.
            </p>
          </li>
        </ol>
      </section>

      {/* ─── why rehearse ──────────────────────────────────────── */}
      <section className={styles.section} aria-labelledby="facts-title">
        <Head
          pill="Why rehearse"
          id="facts-title"
          title="Why practise the hard minute"
          sub="Two findings we rely on, with their sources."
        />
        <div className={styles.facts}>
          <article className={styles.fact} data-reveal="">
            <p className={styles.factNumber}>48%</p>
            <p>
              of parents say that most days their stress is completely
              overwhelming, compared to 26% among other adults.
            </p>
            <a
              href="https://www.hhs.gov/surgeongeneral/reports-and-publications/parents/index.html"
              target="_blank"
              rel="noreferrer"
            >
              U.S. Surgeon General&apos;s Advisory, 2024
            </a>
          </article>
          <article className={styles.fact} data-reveal="">
            <p className={styles.factNumber}>77</p>
            <p>
              evaluations of parent training programs in one meta-analysis:
              larger effects for programs that, among other things, required
              parents to practise new skills with their own child during
              sessions.
            </p>
            <a
              href="https://pubmed.ncbi.nlm.nih.gov/18205039/"
              target="_blank"
              rel="noreferrer"
            >
              Kaminski and colleagues, 2008
            </a>
          </article>
          <article
            className={`${styles.fact} ${styles.factDark}`}
            data-reveal=""
          >
            <p className={styles.factNumber}>
              {results.rules ? results.rules.test.microF1.toFixed(3) : "—"}
            </p>
            <p>
              {results.rules
                ? `tagging F1 with rules alone, on ${results.rules.test.count} replies held out from tuning${results.merged ? `; ${results.merged.test.microF1.toFixed(3)} with the model` : ""}. A language model may only suggest tags; the engine decides.`
                : "Measured tagging accuracy is not available in this build."}
            </p>
            <Link href="/how-it-works">The method and its limits</Link>
          </article>
        </div>
        <p className={styles.honest}>
          Do-Over is rehearsal against a simulated child; we have not measured
          whether practice here changes what happens at home.
        </p>
      </section>

      {/* ─── pricing ───────────────────────────────────────────── */}
      <section
        id="pricing"
        className={styles.section}
        aria-labelledby="pass-title"
      >
        <Head
          pill="Pricing"
          id="pass-title"
          title="Today's meltdown is free, every day"
          sub="The season pass opens every scene, your own replays, the coach and voice."
        />
        <Plans />
      </section>

      {/* ─── questions ─────────────────────────────────────────── */}
      <section className={styles.section} aria-labelledby="faq-title">
        <Head pill="FAQ" id="faq-title" title="Questions, answered" />
        <div className={styles.faq} data-reveal="">
          {FAQ.map((item, i) => (
            <details key={item.q} name="faq" open={i === 0}>
              <summary>
                {item.q}
                <span className={styles.plus} aria-hidden="true" />
              </summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ─── closing ───────────────────────────────────────────── */}
      <section className={styles.section} aria-labelledby="cta-title">
        <div className={styles.cta} data-reveal="">
          <div
            className={`${styles.ctaCard} ${styles.ctaLeft}`}
            aria-hidden="true"
          >
            <p className={styles.floatLabel}>Storm</p>
            <p className={styles.floatValue}>
              {result.before.arousal} → {result.after.arousal}
            </p>
          </div>
          <div
            className={`${styles.ctaCard} ${styles.ctaRight}`}
            aria-hidden="true"
          >
            <p className={styles.floatLabel}>This reply</p>
            <p className={styles.floatValue}>{formatDelta(ledger.total)}</p>
          </div>
          <VeltralMark className={styles.ctaMark} />
          <h2 id="cta-title">Rehearse it once, before it happens</h2>
          <p>
            Today: {today.title}, with {today.childName}, {ages(today.ageBand)}.
            About three minutes, no account.
          </p>
          <Link href="/play" className={styles.primary}>
            Play today&apos;s meltdown
          </Link>
        </div>
      </section>

      {/* ─── footer ────────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className={styles.footTop}>
          <div className={styles.footBrand}>
            <Link
              href="/"
              className={styles.footLogo}
              aria-label="Do-Over by Veltral, home"
            >
              <VeltralLogo />
            </Link>
            <p>Rehearse the hardest minute of parenting before it happens.</p>
          </div>
          <nav aria-label="Rehearse" className={styles.footCol}>
            <p>Rehearse</p>
            <Link href="/play">Today&apos;s scene</Link>
            <Link href="/scenes">Scenes</Link>
            <Link href="/progress">Progress</Link>
            <Link href="/playbook">Your lines</Link>
          </nav>
          <nav aria-label="Learn" className={styles.footCol}>
            <p>Learn</p>
            <Link href="/how-it-works">How it works</Link>
            <Link href="/pricing">Season pass</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/jury">Jury guide</Link>
          </nav>
        </div>
        <div className={styles.footBottom}>
          <p>
            Do-Over is a practice tool. It is not therapy, medical advice or a
            diagnosis. The child is simulated and the scoring is a simplified
            model.
          </p>
          <p>© {year} Veltral</p>
        </div>
      </footer>
    </div>
  );
}
