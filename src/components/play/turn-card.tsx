import type { PublicScene } from "@/engine/types";
import type { TurnResponse } from "@/shared/api";
import {
  isHelpfulTag,
  noteText,
  prioritizeNotes,
  tagLabel,
} from "@/lib/presentation";
import styles from "./play.module.css";
import { quoteSegments } from "./quotes";

export function TurnCard({
  turn,
  scene,
  expanded = false,
}: {
  turn: TurnResponse;
  scene: PublicScene;
  expanded?: boolean;
}) {
  const notes = expanded
    ? turn.result.notes
    : prioritizeNotes(turn.result.notes).slice(0, 2);
  const delta = `${turn.result.delta > 0 ? "+" : ""}${turn.result.delta}`;
  return (
    <div className={styles.turnCard}>
      <div className={styles.turnHeading}>
        <span className="kicker">Your reply · turn {turn.turnIndex + 1}</span>
        <span
          className={styles.delta}
          data-direction={
            turn.result.delta < 0
              ? "down"
              : turn.result.delta > 0
                ? "up"
                : "same"
          }
        >
          {delta} <span className={styles.small}>arousal</span>
        </span>
      </div>
      <p className={styles.replyText} data-testid={`reply-${turn.turnIndex}`}>
        {turn.text ? (
          quoteSegments(turn.text, turn.hits).map((part, i) =>
            part.marked ? (
              <u key={i}>{part.text}</u>
            ) : (
              <span key={i}>{part.text}</span>
            ),
          )
        ) : (
          <em>No reply</em>
        )}
      </p>
      <div className={styles.chips}>
        {turn.hits.length ? (
          turn.hits.map((hit) => (
            <span
              className={styles.chip}
              data-helpful={isHelpfulTag(hit.tag)}
              key={hit.tag}
              title={hit.quote || undefined}
            >
              <span aria-hidden="true">
                {isHelpfulTag(hit.tag) ? "✓" : "×"}
              </span>{" "}
              {tagLabel(hit.tag)}
            </span>
          ))
        ) : (
          <span className={styles.chip}>○ No clear move</span>
        )}
      </div>
      {notes.length > 0 && (
        <ul className={styles.notes}>
          {notes.map((note) => (
            <li key={note}>{noteText(note, scene)}</li>
          ))}
        </ul>
      )}
      {turn.tagging === "rules" && (
        <p className={styles.provenance}>Tagged by rules only</p>
      )}
      {expanded && turn.child && (
        <blockquote className={styles.childReply}>
          <p>{turn.child.line}</p>
          {turn.child.action && <em>{turn.child.action}</em>}
        </blockquote>
      )}
    </div>
  );
}
