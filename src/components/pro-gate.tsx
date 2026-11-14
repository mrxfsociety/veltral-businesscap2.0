"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { isPro } from "@/lib/pro";

export function ProBadge() {
  return isPro() ? <span className="chip">Pro preview</span> : null;
}

export function ProGate({
  feature,
  children,
  compact = false,
}: {
  feature: string;
  children?: ReactNode;
  compact?: boolean;
}) {
  if (isPro()) {
    return (
      <div className="stack">
        <ProBadge />
        {children}
      </div>
    );
  }
  return (
    <aside
      className={compact ? "stack" : "card stack"}
      aria-label={`${feature} requires Pro`}
    >
      <p>
        <strong>{feature}</strong> is a planned Pro feature.
      </p>
      {!compact && (
        <p className="muted">
          Today&apos;s meltdown, do-overs and your progress are free. Payments
          are not connected yet.
        </p>
      )}
      <Link className="button-secondary" href="/pricing">
        Explore Pro
      </Link>
    </aside>
  );
}
