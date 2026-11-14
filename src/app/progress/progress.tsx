"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { useStore } from "@/lib/use-store";
import { currentStreak, newYorkDayKey } from "@/lib/progress";
import { moveCards, topSlips } from "@/lib/moves";
import {
  daysBack,
  levelFor,
  thenAndNow,
  totalPoints,
  weeklyPlan,
  type PlanScene,
} from "@/lib/plan";
import { sampleWeek } from "@/lib/demo-week";
import { tagLabel } from "@/lib/presentation";
import { Icon } from "@/components/paper/icons";
import { ButtonLink, Kicker } from "@/components/paper/primitives";
import styles from "./progress.module.css";

export type Tip = { why: string; tryInstead: string };

function SampleBanner({ on }: { on: boolean }) {
  return on ? (
    <p className={styles.sample} role="note">
      Sample data. Not your results.
    </p>
  ) : null;
}

function percent(value: number | null) {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}

function oneDecimal(value: number | null) {
  return value === null ? "—" : value.toFixed(1);
}

export function Progress({
  tips,
  scenes,
}: {
  tips: Record<string, Tip>;
  scenes: PlanScene[];
}) {
  const store = useStore();
  const [demo, setDemo] = useState(false);
  const [flipped, setFlipped] = useState<string | null>(null);
  const today = newYorkDayKey();
  const data = demo
    ? sampleWeek(today)
    : {
        history: store.history,
        dailyDone: store.dailyDone,
        playbook: store.playbook,
      };
  const streak = currentStreak(Object.keys(data.dailyDone), today);
  const level = levelFor(totalPoints(data.history));
  const plan = weeklyPlan({
    history: data.history,
    dailyDone: data.dailyDone,
    today,
    scenes,
  });
  const moves = moveCards(data.history, data.playbook);
  const slips = topSlips(data.history);
  const compare = thenAndNow(data.history);
  const days = Array.from({ length: 14 }, (_, i) => daysBack(today, 13 - i));

  return (
    <div className={styles.page} data-sample={demo || undefined}>
      <header className="page-heading">
        <Kicker accent>One rehearsal at a time</Kicker>
        <h1>
          Your practice. <em>Your lines.</em>
        </h1>
        <p>
          Everything here is counted from the scenes you have played on this
          device. It is practice data, not a measure of your parenting.
        </p>
        <label className={styles.switch}>
          <input
            type="checkbox"
            role="switch"
            checked={demo}
            onChange={(event) => setDemo(event.target.checked)}
          />
          <span aria-hidden="true" />
          Show a sample week
        </label>
        {demo && (
          <p className="muted small">
            A fixed sample of seven days, so you can see what fills up. It is
            never saved and switches off when you reload.
          </p>
        )}
      </header>

      <div className={styles.top}>
        <section className={styles.card} aria-labelledby="streak-title">
          <SampleBanner on={demo} />
          <Kicker>Daily streak</Kicker>
          <h2 id="streak-title" className={styles.big}>
            <span className="tabular">{streak}</span>{" "}
            {streak === 1 ? "day" : "days"}
          </h2>
          <ol className={styles.calendar} aria-label="The last 14 days">
            {days.map((day, i) => {
              const done = Boolean(data.dailyDone[day]);
              return (
                <li
                  key={day}
                  data-done={done || undefined}
                  data-today={day === today || undefined}
                  style={{ "--i": i } as CSSProperties}
                  aria-label={`${day}: ${done ? "played" : "not played"}`}
                >
                  <span>{Number(day.slice(8))}</span>
                  {done && <Icon name="check" size={12} />}
                </li>
              );
            })}
          </ol>
          <p className="muted small">
            The daily scene changes at midnight in New York.
          </p>
        </section>

        <section className={styles.card} aria-labelledby="level-title">
          <SampleBanner on={demo} />
          <Kicker>Level</Kicker>
          <h2 id="level-title" className={styles.big}>
            Level <span className="tabular">{level.level}</span>
          </h2>
          <p className="tabular">
            {level.points} points
            {level.next !== null &&
              ` · ${level.toNext} to level ${level.level + 1}`}
          </p>
          <span className={styles.bar} aria-hidden="true">
            <span
              style={{
                transform: `scaleX(${
                  level.next === null
                    ? 1
                    : (level.points - level.floor) / (level.next - level.floor)
                })`,
              }}
            />
          </span>
          <p className="muted small">
            Points are the engine&apos;s score for each finished scene.
          </p>
        </section>
      </div>

      <section className={styles.card} aria-labelledby="plan-title">
        <SampleBanner on={demo} />
        <Kicker accent>This week&apos;s plan</Kicker>
        <h2 id="plan-title">Three things to rehearse.</h2>
        <ol className={styles.plan}>
          {plan.map((item) => (
            <li key={item.kind} data-done={item.done || undefined}>
              <span className={styles.tick} aria-hidden="true">
                {item.done && <Icon name="check" size={16} />}
              </span>
              <div>
                {item.kind === "slip" && (
                  <>
                    <p>
                      <strong>Swap your top slip:</strong> {tagLabel(item.tag)}
                    </p>
                    {tips[item.tag] && (
                      <p className="muted small">
                        Try instead: “{tips[item.tag].tryInstead}”
                      </p>
                    )}
                    <p className="small">
                      Done when a scene this week has none of it.
                    </p>
                  </>
                )}
                {item.kind === "move" && (
                  <>
                    <p>
                      <strong>Grow your weakest move:</strong>{" "}
                      {tagLabel(item.tag)}
                    </p>
                    {item.scene && (
                      <p className="muted small">
                        It lands harder with{" "}
                        {item.scene.temperament === "easygoing" ? "an" : "a"}{" "}
                        {item.scene.temperament} child: try{" "}
                        <Link
                          href={`/play/${encodeURIComponent(item.scene.id)}`}
                        >
                          {item.scene.title}
                        </Link>
                        .
                      </p>
                    )}
                    <p className="small">Done when you use it this week.</p>
                  </>
                )}
                {item.kind === "daily" && (
                  <>
                    <p>
                      <strong>Today&apos;s meltdown.</strong>{" "}
                      {item.done ? "Played." : "Three minutes."}
                    </p>
                    {!item.done && (
                      <Link href="/play" className="small">
                        Play today&apos;s scene
                      </Link>
                    )}
                  </>
                )}
              </div>
              <span className="sr-only">{item.done ? "Done" : "Not done"}</span>
            </li>
          ))}
        </ol>
        {data.history.length === 0 && (
          <p className="muted small">
            The other two items appear after your first scene: one slip to swap
            and one move to grow, picked from your own replies.
          </p>
        )}
      </section>

      <section className={styles.section} aria-labelledby="moves-title">
        <div>
          <Kicker>Your moves</Kicker>
          <h2 id="moves-title">
            Seven moves, from rough cut to second nature.
          </h2>
          <p className="muted">
            Tiers at 1, 5, 15 and 30 uses. Turn a card for what the move is and
            your latest saved line that used it.
          </p>
        </div>
        <SampleBanner on={demo} />
        <ul className={styles.moves}>
          {moves.map((move) => {
            const open = flipped === move.tag;
            return (
              <li key={move.tag}>
                <button
                  type="button"
                  className={styles.move}
                  data-open={open || undefined}
                  data-empty={move.uses === 0 || undefined}
                  aria-pressed={open}
                  onClick={() => setFlipped(open ? null : move.tag)}
                >
                  {open ? (
                    <span className={styles.moveBack}>
                      <span>{move.definition}</span>
                      <em>
                        {move.lastLine
                          ? `“${move.lastLine}”`
                          : "No saved line with this move yet."}
                      </em>
                    </span>
                  ) : (
                    <span className={styles.moveFront}>
                      <span className={styles.moveName}>{move.label}</span>
                      <span className={styles.moveUses}>
                        <span className="tabular">{move.uses}</span>{" "}
                        {move.uses === 1 ? "use" : "uses"}
                      </span>
                      <span className={styles.moveTier}>
                        {move.tier ?? "Not yet"}
                        {move.next &&
                          ` · ${move.next.at - move.uses} to ${move.next.name}`}
                      </span>
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <div className={styles.top}>
        <section className={styles.card} aria-labelledby="slips-title">
          <SampleBanner on={demo} />
          <Kicker>Your slips</Kicker>
          <h2 id="slips-title">What to swap.</h2>
          {slips.length === 0 ? (
            <p className="muted">
              Nothing yet. Threats, dismissing and lectures show up here with a
              line to try instead.
            </p>
          ) : (
            <ol className={styles.slips}>
              {slips.map((slip) => (
                <li key={slip.tag}>
                  <p>
                    <strong>{slip.label}</strong>{" "}
                    <span className="muted tabular">× {slip.count}</span>
                  </p>
                  {tips[slip.tag] && (
                    <>
                      <p className="small">{tips[slip.tag].why}</p>
                      <p className="small">
                        Try instead: “{tips[slip.tag].tryInstead}”
                      </p>
                    </>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className={styles.card} aria-labelledby="then-title">
          <SampleBanner on={demo} />
          <Kicker>Then and now</Kicker>
          <h2 id="then-title">Your first three against your latest three.</h2>
          {compare.ready ? (
            <table className={styles.compare}>
              <thead>
                <tr>
                  <th scope="col">Measure</th>
                  <th scope="col">Then</th>
                  <th scope="col">Now</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Helpful stamps</th>
                  <td>{percent(compare.then.helpfulShare)}</td>
                  <td>{percent(compare.now.helpfulShare)}</td>
                </tr>
                <tr>
                  <th scope="row">Turns to calm</th>
                  <td>{oneDecimal(compare.then.turnsToCalm)}</td>
                  <td>{oneDecimal(compare.now.turnsToCalm)}</td>
                </tr>
                <tr>
                  <th scope="row">Stars</th>
                  <td>{oneDecimal(compare.then.stars)}</td>
                  <td>{oneDecimal(compare.now.stars)}</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <p className="muted">
              Appears after your fourth scene.{" "}
              {compare.remaining === 1
                ? "One more to go."
                : `${compare.remaining} more to go.`}
            </p>
          )}
        </section>
      </div>

      <section className={styles.section} aria-labelledby="history-title">
        <h2 id="history-title">Past scenes</h2>
        <SampleBanner on={demo} />
        {data.history.length === 0 ? (
          <div className="empty-state stack">
            <p>Your scenes will hang here, newest first.</p>
            <ButtonLink href="/play" icon="play">
              Play today&apos;s meltdown
            </ButtonLink>
          </div>
        ) : (
          <ol className={styles.sessions}>
            {data.history.map((entry) => (
              <li key={entry.id}>
                <span className={styles.sessionTitle}>{entry.sceneTitle}</span>
                <span className="muted small">
                  <time dateTime={entry.at}>{entry.dayKey}</time> ·{" "}
                  {entry.turns} turns · par {entry.par}
                </span>
                <span
                  className={styles.sessionStars}
                  aria-label={`${entry.stars} of 3 stars`}
                >
                  {[0, 1, 2].map((i) => (
                    <Icon
                      key={i}
                      name="star"
                      size={14}
                      data-on={i < entry.stars || undefined}
                    />
                  ))}
                </span>
                {!demo && entry.kind !== "custom" && (
                  <Link
                    href={`/play/${encodeURIComponent(entry.sceneId)}`}
                    className="small"
                  >
                    Again
                  </Link>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
