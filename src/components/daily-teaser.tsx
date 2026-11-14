"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { DailyResponse } from "@/shared/api";
export function DailyTeaser() {
  const [daily, setDaily] = useState<DailyResponse | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    api
      .daily(controller.signal)
      .then(setDaily)
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError"))
          setFailed(true);
      });
    return () => controller.abort();
  }, []);
  return (
    <p className="daily-line" aria-live="polite">
      {daily
        ? `Do-Over #${daily.dayNumber} · ${daily.title} · par ${daily.par}`
        : failed
          ? "Today’s scene will load when you open play."
          : "Finding today’s scene…"}
    </p>
  );
}
