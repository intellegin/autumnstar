"use client";

import { useRef, useState, type FormEvent } from "react";
import { normalizeContact, validateContact, type ContactField, type Errors } from "@/lib/inquiry";

type Status = "idle" | "sending" | "sent" | "error";

/** General contact form. The API assigns a reference number shown on success. */
export function ContactForm({ topics, successText, errorText }: { topics: string[]; successText: string; errorText: string }) {
  const startedAt = useRef(Date.now());
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors<ContactField>>({});
  const [reference, setReference] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const raw = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const c = normalizeContact(raw);
    const errs = validateContact(c);
    setErrors(errs);
    if (Object.keys(errs).length) {
      form.querySelector<HTMLElement>(`[name="${Object.keys(errs)[0]}"]`)?.focus();
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...c, website: raw.website ?? "", startedAt: startedAt.current }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok && data.reference) {
        setReference(data.reference);
        setStatus("sent");
      } else if (data.code === "invalid" && data.errors) {
        setErrors(data.errors);
        setStatus("idle");
      } else setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="form-card notch success" role="status">
        <h2>Message received</h2>
        <p>{successText}</p>
        <div className="success-ref"><small>REFERENCE</small><strong>{reference}</strong></div>
      </div>
    );
  }

  const err = (n: ContactField) => (errors[n] ? <p className="field-error" id={`c-${n}-err`}>{errors[n]}</p> : null);
  const aria = (n: ContactField) => (errors[n] ? { "aria-invalid": true as const, "aria-describedby": `c-${n}-err` } : {});

  return (
    <form className="form-card notch" onSubmit={submit} noValidate>
      <div className="step-head"><h2>Send a message</h2><p>We&rsquo;ll reply by email.</p></div>
      {status === "error" && <div className="alert" role="alert">{errorText}</div>}
      <div className="field">
        <label htmlFor="c-topic">Topic</label>
        <select id="c-topic" name="topic" defaultValue={topics[0]}>{topics.map((t) => <option key={t}>{t}</option>)}</select>
      </div>
      <div className="row-2">
        <div className="field"><label htmlFor="c-name">Name</label><input id="c-name" name="name" autoComplete="name" {...aria("name")} />{err("name")}</div>
        <div className="field"><label htmlFor="c-company">Company <span className="opt">(optional)</span></label><input id="c-company" name="company" autoComplete="organization" /></div>
      </div>
      <div className="row-2">
        <div className="field"><label htmlFor="c-email">Email</label><input id="c-email" name="email" type="email" autoComplete="email" {...aria("email")} />{err("email")}</div>
        <div className="field"><label htmlFor="c-phone">Phone <span className="opt">(optional)</span></label><input id="c-phone" name="phone" type="tel" autoComplete="tel" {...aria("phone")} />{err("phone")}</div>
      </div>
      <div className="field"><label htmlFor="c-message">Message</label><textarea id="c-message" name="message" rows={6} {...aria("message")} />{err("message")}</div>
      <div className="hp" aria-hidden="true"><label htmlFor="c-website">Website</label><input id="c-website" name="website" tabIndex={-1} autoComplete="off" /></div>
      <button type="submit" className="btn btn-orange btn-lg" disabled={status === "sending"}>{status === "sending" ? "Sending…" : "Send message"}</button>
    </form>
  );
}
