import type { CSSProperties } from "react";
import type { PublicScene } from "@/engine/types";
import type { TurnResponse } from "@/shared/api";
import { Stamp } from "@/components/paper/primitives";
import {
  isHelpfulTag,
  noteText,
  prioritizeNotes,
  tagLabel,
} from "@/lib/presentation";
import { quoteSegments } from "./quotes";
import { formatDelta, ledgerFor } from "./takes";
import styles from "./play.module.css";

/*
 * The paper slip a reply becomes on the stage. `beat` drives the sequence:
 * 0 slip in · 1 underlines · 2 stamps and ledger rows · 3 total ·
 * 4 storm moves (on the stage) · 5 notes · 6 done. Every number is the engine's.
 */
export const BEAT_DONE = 6;

export const FROZE_LINE = "You froze. It happens. That is why we rehearse.";

export function isFrozen(turn: TurnResponse) {
  return !turn.text && turn.hits.some((hit) => hit.tag === "NO_RESPONSE");
}

export function TurnSlip({
  turn,
  scene,
  beat = BEAT_DONE,
  live = false,
  allNotes = false,
  take,
}: {
  turn: TurnResponse;
  scene: Pick<PublicScene, "childName">;
  beat?: number;
  /** Animate the beats (false for cards in the script). */
  live?: boolean;
  /** The script shows every note; play shows at most two. */
  allNotes?: boolean;
  take?: number;
}) {
  const ledger = ledgerFor(turn.result);
  // Notes already written into the ledger are not repeated as strips.
  const strips = prioritizeNotes(turn.result.notes).filter(
    (note) => !ledger.sumNotes.includes(note),
  );
  const notes = allNotes ? strips : strips.slice(0, 2);
  const frozen = isFrozen(turn);
  const stampHits = frozen
    ? turn.hits.filter((hit) => hit.tag !== "NO_RESPONSE")
    : turn.hits;
  return (
    <div
      className={styles.slip}
      data-live={live || undefined}
      data-beat={beat}
      data-underline={beat >= 1 || undefined}
      data-stamps={beat >= 2 || undefined}
      data-total={beat >= 3 || undefined}
      data-notes={beat >= 5 || undefined}
    >
      <p className={styles.slipKicker}>
        {take !== undefined && <span>Take {take} · </span>}
        <span>Your line · turn {turn.turnIndex + 1}</span>
      </p>
      <p className={styles.slipReply} data-testid={`reply-${turn.turnIndex}`}>
        {turn.text ? (
          quoteSegments(turn.text, turn.hits).map((part, i) =>
            part.marked ? (
              <u key={i} style={{ "--i": i } as CSSProperties}>
                {part.text}
              </u>
            ) : (
              <span key={i}>{part.text}</span>
            ),
          )
        ) : (
          <em>{frozen ? "(nothing said)" : "No reply"}</em>
        )}
      </p>
      <div className={styles.slipStamps}>
        {frozen && (
          <Stamp
            kind="unhelpful"
            solid
            className={styles.stampIn}
            style={{ "--i": 0 } as CSSProperties}
          >
            Froze
          </Stamp>
        )}
        {stampHits.map((hit, i) => (
          <Stamp
            key={hit.tag}
            kind={isHelpfulTag(hit.tag) ? "helpful" : "unhelpful"}
            className={styles.stampIn}
            style={{ "--i": i + (frozen ? 1 : 0) } as CSSProperties}
            title={hit.quote ? `“${hit.quote}”` : undefined}
          >
            {tagLabel(hit.tag)}
          </Stamp>
        ))}
        {!frozen && stampHits.length === 0 && (
          <Stamp kind="neutral" icon="cloud" className={styles.stampIn}>
            No clear move
          </Stamp>
        )}
      </div>
      {frozen && <p className={styles.froze}>{FROZE_LINE}</p>}
      <div className={styles.ledger}>
        {ledger.rows.length > 0 && (
          <ul className={styles.ledgerRows}>
            {ledger.rows.map((row, i) => (
              <li
                key={row.tag}
                className={styles.ledgerRow}
                style={{ "--i": i } as CSSProperties}
              >
                <span>{tagLabel(row.tag)}</span>
                <span className="tabular" data-sign={Math.sign(row.value)}>
                  {formatDelta(row.value)}
                </span>
              </li>
            ))}
          </ul>
        )}
        {ledger.sumNotes.length > 0 && (
          <ul className={styles.ledgerNotes}>
            {ledger.sumNotes.map((note) => (
              <li key={note}>{noteText(note, scene)}</li>
            ))}
          </ul>
        )}
        <p className={styles.ledgerTotal}>
          <span>
            Storm{" "}
            {ledger.total < 0 ? "settled" : ledger.total > 0 ? "rose" : "held"}
            {ledger.adjusted && (
              <span className={styles.ledgerAdjusted}>
                {" "}
                after bonuses and caps
              </span>
            )}
          </span>
          <span
            className="tabular"
            data-direction={
              ledger.total < 0 ? "down" : ledger.total > 0 ? "up" : "same"
            }
          >
            {formatDelta(ledger.total)}
          </span>
        </p>
      </div>
      {notes.length > 0 && (
        <ul className={styles.notes}>
          {notes.map((note, i) => (
            <li key={note} style={{ "--i": i } as CSSProperties}>
              {noteText(note, scene)}
            </li>
          ))}
        </ul>
      )}
      <p className={styles.provenance}>
        {turn.tagging === "rules"
          ? "Tagged by rules only"
          : "Tagged with the model"}
      </p>
    </div>
  );
}
