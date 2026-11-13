import { NextResponse } from "next/server";
import { normalizeQuote, quoteRows, validateQuote } from "@/lib/inquiry";
import { isBot, newReference, rateLimited, sendInquiry } from "@/lib/mail";

export const runtime = "nodejs";

/** POST /api/quote → { ok: true, reference } | { ok: false, code, errors? } */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, code: "invalid" }, { status: 400 });
  }
  if (isBot(body)) return NextResponse.json({ ok: true, reference: newReference("Q") });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) return NextResponse.json({ ok: false, code: "rate_limited" }, { status: 429 });

  const q = normalizeQuote(body);
  const errors = validateQuote(q);
  if (Object.keys(errors).length) return NextResponse.json({ ok: false, code: "invalid", errors }, { status: 422 });

  const reference = newReference("Q");
  const route = `${q.origin}, ${q.originCountry} → ${q.destination}, ${q.destinationCountry}`;
  const { result, status } = await sendInquiry({
    reference,
    subject: `[${reference}] Quote request: ${q.mode} · ${route}`.slice(0, 200),
    heading: "New quote request from autumnstar.ca",
    rows: quoteRows(q),
    replyTo: q.email,
  });
  if (result !== "sent") return NextResponse.json({ ok: false, code: result, ...(status ? { providerStatus: status } : {}) }, { status: result === "not_configured" ? 503 : 502 });
  return NextResponse.json({ ok: true, reference });
}
