"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { AgeBand } from "@/engine/types";
import type { CustomSceneResponse } from "@/shared/api";
import { api, ApiError } from "@/lib/api";
import { isPro } from "@/lib/pro";
import { UnsafePause } from "@/components/play/unsafe-pause";

export function ReplayForm() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [ageBand, setAgeBand] = useState<AgeBand>("2-3");
  const [childName, setChildName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [refusal, setRefusal] = useState<Extract<
    CustomSceneResponse,
    { ok: false }
  > | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !isPro()) return;
    setPending(true);
    setError("");
    setRefusal(null);
    try {
      const result = await api.customScene({
        description: description.trim(),
        ageBand,
        ...(childName.trim() ? { childName: childName.trim() } : {}),
      });
      if (result.ok) router.push(`/play/${encodeURIComponent(result.sceneId)}`);
      else {
        setRefusal(result);
        setPending(false);
      }
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "We couldn't create your scene. Please try again.",
      );
      setPending(false);
    }
  }

  if (refusal?.reason === "unsafe")
    return <UnsafePause onRetry={() => setRefusal(null)} />;

  return (
    <form className="card stack" onSubmit={submit}>
      <label htmlFor="description">What happened today?</label>
      <textarea
        id="description"
        name="description"
        minLength={10}
        maxLength={500}
        required
        rows={5}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        aria-describedby="description-help"
        disabled={pending}
      />
      <p id="description-help" className="muted">
        10–500 characters. Describe the moment and the limit you needed to hold.
        Please leave out real names and other identifying details.
      </p>
      <label htmlFor="age-band">Child&apos;s age</label>
      <select
        id="age-band"
        name="ageBand"
        value={ageBand}
        onChange={(event) => setAgeBand(event.target.value as AgeBand)}
        disabled={pending}
      >
        <option value="2-3">2–3 years</option>
        <option value="4-5">4–5 years</option>
        <option value="6-7">6–7 years</option>
      </select>
      <label htmlFor="child-nickname">
        Nickname <span className="muted">(optional)</span>
      </label>
      <input
        id="child-nickname"
        name="childName"
        maxLength={40}
        value={childName}
        onChange={(event) => setChildName(event.target.value)}
        autoComplete="off"
        placeholder="A made-up nickname"
        disabled={pending}
      />
      <p className="muted">
        Your description is sent to an AI provider. Custom scenes are private
        practice and are never ranked.
      </p>
      <button
        className="button"
        type="submit"
        disabled={pending || description.trim().length < 10}
      >
        {pending ? "Creating your scene…" : "Build my practice scene"}
      </button>
      {pending && <p role="status">Turning your moment into a scene…</p>}
      {error && <p role="alert">{error}</p>}
      {refusal && (
        <div className="notice" role="status">
          <p>{refusal.message}</p>
          {refusal.reason === "model_unavailable" && (
            <Link className="button-secondary" href="/scenes">
              Choose a scene from the library
            </Link>
          )}
        </div>
      )}
    </form>
  );
}
