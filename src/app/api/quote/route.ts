import { NextResponse } from "next/server";
import { normalizeQuote, quoteRows, validateQuote } from "@/lib/inquiry";
import { clientIp, newReference, rateLimited, sendInquiry, spamCheck } from "@/lib/mail";

export const runtime = "nodejs";

/** POST /api/quote → { ok: true, reference } | { ok: false, code, errors? } */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, code: "invalid" }, { status: 400 });
  }
  const spam = spamCheck(body, "quote");
  if (spam === "bot") return NextResponse.json({ ok: true, reference: newReference("Q") }); // same as a success
  if (spam === "retry") return NextResponse.json({ ok: false, code: "token_expired" }, { status: 409 }); // client refreshes + retries
  if (spam === "not_configured") return NextResponse.json({ ok: false, code: "not_configured" }, { status: 503 });

  const ip = clientIp(request);
  if (rateLimited(ip)) return NextResponse.json({ ok: false, code: "rate_limited" }, { status: 429 });

  const q = normalizeQuote(body);
  const errors = validateQuote(q);
  if (Object.keys(errors).length) return NextResponse.json({ ok: false, code: "invalid", errors }, { status: 422 });

  const reference = newReference("Q");
  const { result } = await sendInquiry({
    reference,
    subject: `[${reference}] New quote request`, // fixed: no visitor text in the subject
    heading: "New quote request from autumnstar.ca",
    rows: quoteRows(q),
    replyTo: q.email,
  });
  if (result !== "sent") return NextResponse.json({ ok: false, code: result }, { status: result === "not_configured" ? 503 : 502 });
  return NextResponse.json({ ok: true, reference });
}
