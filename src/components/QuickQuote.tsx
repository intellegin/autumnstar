"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Icon } from "./Icon";

type Mode = { value: string; label: string; icon: string };

/** Hero quick-quote bar: pick a mode, origin and destination, then continue to the full form pre-filled. */
export function QuickQuote({ modes }: { modes: Mode[] }) {
  const router = useRouter();
  const [mode, setMode] = useState(modes[0]?.value ?? "");
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const q = new URLSearchParams({ mode });
    for (const k of ["origin", "destination"]) { const v = String(f.get(k) ?? "").trim(); if (v) q.set(k, v); }
    router.push(`/quote?${q.toString()}`);
  }
  return (
    <form className="quick-quote notch" onSubmit={submit} aria-label="Start a quote">
      <div className="modes" role="radiogroup" aria-label="Shipping mode">
        {modes.map((m) => (
          <label key={m.value}>
            <input type="radio" name="mode" value={m.value} checked={mode === m.value} onChange={() => setMode(m.value)} />
            <Icon name={m.icon} size={20} />{m.label}
          </label>
        ))}
      </div>
      <div className="qq-field">
        <label htmlFor="qq-origin">From</label>
        <input id="qq-origin" name="origin" className="input" placeholder="City or country" autoComplete="off" />
      </div>
      <div className="qq-field">
        <label htmlFor="qq-destination">To</label>
        <input id="qq-destination" name="destination" className="input" placeholder="City or country" autoComplete="off" />
      </div>
      <button type="submit" className="btn btn-orange btn-lg">Get a quote <Icon name="arrow" size={20} /></button>
    </form>
  );
}
