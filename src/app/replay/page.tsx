import type { Metadata } from "next";
import { ProGate } from "@/components/pro-gate";
import { ReplayForm } from "./replay-form";

export const metadata: Metadata = {
  title: "Replay your own meltdown | Do-Over",
};

export default function ReplayPage() {
  return (
    <div className="stack">
      <header className="page-heading">
        <p className="kicker">It happened. You can rehearse it.</p>
        <h1>Replay your own meltdown.</h1>
        <p>
          Describe a moment in a sentence or two. We&apos;ll turn it into a
          scene you can practise.
        </p>
      </header>
      <ProGate feature="Replay your own meltdown">
        <ReplayForm />
      </ProGate>
    </div>
  );
}
