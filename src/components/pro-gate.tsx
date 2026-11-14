"use client";

import type { ReactNode } from "react";
import { openPaywall, usePro } from "@/lib/pro";
import { Icon } from "@/components/paper/icons";
import { Button } from "@/components/paper/primitives";

/** A small mark on unlocked season-pass features (preview or pass). */
export function ProBadge() {
  const { pro, entitlement } = usePro();
  if (!pro) return null;
  return (
    <span className="badge">
      <Icon name="ticket" size={14} />
      {entitlement?.source === "preview" ? "Pro preview" : "Season pass"}
    </span>
  );
}

/**
 * Shows its children with the season pass, and a locked ticket that opens
 * the paywall without it. The server enforces the same rule.
 */
export function ProGate({
  feature,
  children,
  compact = false,
}: {
  feature: string;
  children?: ReactNode;
  compact?: boolean;
}) {
  const { pro, loading } = usePro();
  if (pro)
    return (
      <div className="stack">
        <ProBadge />
        {children}
      </div>
    );
  if (loading)
    return (
      <p className="muted small" aria-busy="true">
        Checking your season pass…
      </p>
    );
  return (
    <aside
      className={compact ? "pro-lock" : "pro-lock sheet"}
      aria-label={`${feature} needs the season pass`}
    >
      <p>
        <Icon name="lock" size={16} /> <strong>{feature}</strong> is part of the
        season pass.
      </p>
      {!compact && (
        <p className="muted">
          Today&apos;s meltdown, do-overs and your progress stay free.
        </p>
      )}
      <Button
        variant="secondary"
        size="small"
        icon="ticket"
        onClick={() => openPaywall(feature)}
      >
        See the season pass
      </Button>
    </aside>
  );
}
