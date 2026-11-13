"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Icon } from "./Icon";
import { QUOTE_STEPS, normalizeQuote, quoteRows, validateQuote, type Errors, type Quote, type QuoteField } from "@/lib/inquiry";

type Mode = { value: string; label: string; icon: string; types: string[] };

type Props = {
  modes: Mode[];
  directions: string[];
  packaging: string[];
  weightUnits: string[];
  successText: string;
  errorText: string;
};

type Status = "idle" | "sending" | "sent" | "error";

/** Four-step quote request: Shipment → Route → Cargo → Contact. Validates per step; the API assigns a reference number. */
export function QuoteForm({ modes, directions, packaging, weightUnits, successText, errorText }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const startedAt = useRef(Date.now());
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors<QuoteField>>({});
  const [result, setResult] = useState<{ reference: string; rows: [string, string][] } | null>(null);

  // Prefill from the quick-quote bar or a service page: /quote?mode=Ocean&origin=…&destination=…
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const m = q.get("mode");
    if (m && modes.some((x) => x.value === m)) setMode(m);
    const form = formRef.current;
    if (!form) return;
    for (const k of ["origin", "destination"]) {
      const v = q.get(k);
      if (v) (form.elements.namedItem(k) as HTMLInputElement).value = v.slice(0, 120);
    }
  }, [modes]);

  const types = modes.find((m) => m.value === mode)?.types ?? [];
  const read = () => {
    const raw = Object.fromEntries(new FormData(formRef.current!).entries()) as Record<string, string>;
    return { quote: normalizeQuote({ ...raw, mode }) as Quote, honey: raw.website ?? "" };
  };

  const goTo = (n: number) => {
    setStep(n);
    requestAnimationFrame(() => { titleRef.current?.focus(); formRef.current?.scrollIntoView({ block: "start", behavior: "smooth" }); });
  };

  const focusFirst = (errs: Errors<QuoteField>) => {
    const first = Object.keys(errs)[0];
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus());
  };

  function stepErrors(all: Errors<QuoteField>, s: number) {
    const keys: string[] = QUOTE_STEPS[s].fields;
    return Object.fromEntries(Object.entries(all).filter(([k]) => keys.includes(k))) as Errors<QuoteField>;
  }

  function next() {
    const errs = stepErrors(validateQuote(read().quote), step);
    setErrors(errs);
    if (Object.keys(errs).length) return focusFirst(errs);
    goTo(step + 1);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (step < QUOTE_STEPS.length - 1) return next();
    const { quote, honey } = read();
    const errs = validateQuote(quote);
    setErrors(errs);
    if (Object.keys(errs).length) {
      const s = QUOTE_STEPS.findIndex((st) => st.fields.some((f) => f in errs));
      if (s !== step) goTo(s);
      return focusFirst(errs);
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...quote, website: honey, startedAt: startedAt.current }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok && data.reference) {
        setResult({ reference: data.reference, rows: quoteRows(quote) });
        setStatus("sent");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (data.code === "invalid" && data.errors) {
        setErrors(data.errors);
        setStatus("idle");
      } else setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent" && result) {
    return (
      <div className="form-card notch success" role="status">
        <h2>Quote request received</h2>
        <p>{successText}</p>
        <div className="success-ref"><small>REFERENCE</small><strong>{result.reference}</strong></div>
        <dl>{result.rows.map(([k, v]) => <div key={k} style={{ display: "contents" }}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
        <div className="hero-actions">
          <Link className="btn btn-navy" href="/services">Explore services</Link>
          <Link className="btn btn-outline" href="/">Back to home</Link>
        </div>
      </div>
    );
  }

  const err = (n: QuoteField) => (errors[n] ? <p className="field-error" id={`${n}-err`}>{errors[n]}</p> : null);
  const aria = (n: QuoteField) => (errors[n] ? { "aria-invalid": true as const, "aria-describedby": `${n}-err` } : {});
  const head = (i: number, title: string, text: string) => (
    <div className="step-head"><h2 tabIndex={-1} ref={step === i ? titleRef : undefined}>{title}</h2><p>{text}</p></div>
  );

  return (
    <form ref={formRef} className="form-card notch" onSubmit={submit} noValidate>
      <ol className="stepper" aria-label="Progress">
        {QUOTE_STEPS.map((s, i) => (
          <li key={s.title} data-state={i < step ? "done" : i === step ? "current" : "todo"} aria-current={i === step ? "step" : undefined}>
            <span><span className="visually-hidden">Step {i + 1} of {QUOTE_STEPS.length}: </span>{s.title}</span>
          </li>
        ))}
      </ol>

      {status === "error" && <div className="alert" role="alert">{errorText}</div>}

      {/* Step 1: Shipment */}
      <div hidden={step !== 0}>
        {head(0, "What are you shipping?", "Choose a mode. Not sure? Pick “Not sure yet” and we'll recommend one.")}
        <fieldset className="field">
          <legend>Mode</legend>
          <div className="mode-grid">
            {modes.map((m) => (
              <label key={m.value} className="mode-card">
                <input type="radio" name="modeChoice" value={m.value} checked={mode === m.value} onChange={() => setMode(m.value)} {...(errors.mode && { "aria-describedby": "mode-err" })} />
                <Icon name={m.icon} size={28} />{m.label}
              </label>
            ))}
          </div>
          <input type="hidden" name="mode" value={mode} />
          {err("mode")}
        </fieldset>
        {types.length > 0 && (
          <fieldset className="field">
            <legend>Service type <span className="opt">(optional)</span></legend>
            <div className="choices">
              {types.map((t) => <label key={t} className="choice"><input type="radio" name="serviceType" value={t} />{t}</label>)}
            </div>
          </fieldset>
        )}
        <fieldset className="field">
          <legend>Direction <span className="opt">(optional)</span></legend>
          <div className="choices">
            {directions.map((d) => <label key={d} className="choice"><input type="radio" name="direction" value={d} />{d}</label>)}
          </div>
        </fieldset>
      </div>

      {/* Step 2: Route */}
      <div hidden={step !== 1}>
        {head(1, "Where is it going?", "City or postal code plus country for each end.")}
        <div className="row-2">
          <div className="field"><label htmlFor="q-origin">Origin (city or postal code)</label><input id="q-origin" name="origin" autoComplete="off" {...aria("origin")} />{err("origin")}</div>
          <div className="field"><label htmlFor="q-origin-country">Origin country</label><input id="q-origin-country" name="originCountry" autoComplete="country-name" {...aria("originCountry")} />{err("originCountry")}</div>
        </div>
        <div className="row-2">
          <div className="field"><label htmlFor="q-destination">Destination (city or postal code)</label><input id="q-destination" name="destination" autoComplete="off" {...aria("destination")} />{err("destination")}</div>
          <div className="field"><label htmlFor="q-destination-country">Destination country</label><input id="q-destination-country" name="destinationCountry" autoComplete="off" {...aria("destinationCountry")} />{err("destinationCountry")}</div>
        </div>
        <div className="field" style={{ maxWidth: 280 }}>
          <label htmlFor="q-ready">Cargo ready date <span className="opt">(optional)</span></label>
          <input id="q-ready" name="readyDate" type="date" />
        </div>
      </div>

      {/* Step 3: Cargo */}
      <div hidden={step !== 2}>
        {head(2, "Cargo details", "Approximate figures are fine. We'll confirm the details with you.")}
        <div className="field"><label htmlFor="q-commodity">What are you shipping?</label><input id="q-commodity" name="commodity" placeholder="e.g. furniture, auto parts, packaged food" {...aria("commodity")} />{err("commodity")}</div>
        <div className="row-2">
          <div className="field">
            <label htmlFor="q-packaging">Packaging <span className="opt">(optional)</span></label>
            <select id="q-packaging" name="packaging" defaultValue=""><option value="">Select</option>{packaging.map((p) => <option key={p}>{p}</option>)}</select>
          </div>
          <div className="field"><label htmlFor="q-pieces">Pieces / units <span className="opt">(optional)</span></label><input id="q-pieces" name="pieces" inputMode="numeric" placeholder="e.g. 12 pallets" /></div>
        </div>
        <div className="row-3">
          <div className="field"><label htmlFor="q-weight">Total weight <span className="opt">(optional)</span></label><input id="q-weight" name="weight" inputMode="decimal" {...aria("weight")} />{err("weight")}</div>
          <div className="field">
            <label htmlFor="q-unit">Unit</label>
            <select id="q-unit" name="weightUnit" defaultValue={weightUnits[0]}>{weightUnits.map((u) => <option key={u}>{u}</option>)}</select>
          </div>
          <div className="field">
            <label htmlFor="q-haz">Dangerous goods?</label>
            <select id="q-haz" name="hazardous" defaultValue="No"><option>No</option><option>Yes</option><option>Not sure</option></select>
          </div>
        </div>
        <div className="field"><label htmlFor="q-dims">Dimensions, volume or containers <span className="opt">(optional)</span></label><input id="q-dims" name="dimensions" placeholder="e.g. 120×100×150 cm each, or 2 × 40ft" /></div>
      </div>

      {/* Step 4: Contact */}
      <div hidden={step !== 3}>
        {head(3, "Your details", "So we can send the quote.")}
        <div className="row-2">
          <div className="field"><label htmlFor="q-name">Name</label><input id="q-name" name="name" autoComplete="name" {...aria("name")} />{err("name")}</div>
          <div className="field"><label htmlFor="q-company">Company <span className="opt">(optional)</span></label><input id="q-company" name="company" autoComplete="organization" /></div>
        </div>
        <div className="row-2">
          <div className="field"><label htmlFor="q-email">Email</label><input id="q-email" name="email" type="email" autoComplete="email" {...aria("email")} />{err("email")}</div>
          <div className="field"><label htmlFor="q-phone">Phone <span className="opt">(optional)</span></label><input id="q-phone" name="phone" type="tel" autoComplete="tel" {...aria("phone")} />{err("phone")}</div>
        </div>
        <div className="field"><label htmlFor="q-message">Anything else? <span className="opt">(optional)</span></label><textarea id="q-message" name="message" rows={4} {...aria("message")} />{err("message")}</div>
      </div>

      <div className="hp" aria-hidden="true"><label htmlFor="q-website">Website</label><input id="q-website" name="website" tabIndex={-1} autoComplete="off" /></div>

      <div className="step-nav">
        {step > 0 && <button type="button" className="btn btn-outline" onClick={() => goTo(step - 1)}><Icon name="arrowLeft" size={18} /> Back</button>}
        {step < QUOTE_STEPS.length - 1 ? (
          <button type="button" className="btn btn-orange btn-lg" onClick={next}>Next: {QUOTE_STEPS[step + 1].title} <Icon name="arrow" size={18} /></button>
        ) : (
          <button type="submit" className="btn btn-orange btn-lg" disabled={status === "sending"}>{status === "sending" ? "Sending…" : "Send quote request"}</button>
        )}
      </div>
    </form>
  );
}
