"use client";
import { useState } from "react";
import type { PublicScene } from "@/engine/types";
import { PlayExperience } from "@/components/play/play-experience";
export function LiveDemo({
  scenes,
  scenePars,
}: {
  scenes: PublicScene[];
  scenePars: Record<string, number>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <details
      className="live-demo"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        Try the actual scene here <span aria-hidden="true">↘</span>
      </summary>
      {open && (
        <div style={{ paddingTop: 24 }}>
          <PlayExperience scenes={scenes} scenePars={scenePars} />
        </div>
      )}
    </details>
  );
}
