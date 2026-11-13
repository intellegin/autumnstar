import { NextResponse } from "next/server";
import { contactRows, normalizeContact, validateContact } from "@/lib/inquiry";
import { isBot, newReference, rateLimited, sendInquiry } from "@/lib/mail";

export const runtime = "nodejs";

/** POST /api/contact → { ok: true, reference } | { ok: false, code, errors? } */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, code: "invalid" }, { status: 400 });
  }
  if (isBot(body)) return NextResponse.json({ ok: true, reference: newReference("C") });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) return NextResponse.json({ ok: false, code: "rate_limited" }, { status: 429 });

  const c = normalizeContact(body);
  const errors = validateContact(c);
  if (Object.keys(errors).length) return NextResponse.json({ ok: false, code: "invalid", errors }, { status: 422 });

  const reference = newReference("C");
  const { result, status } = await sendInquiry({
    reference,
    subject: `[${reference}] Contact: ${c.topic || "General question"} · ${c.name}`.slice(0, 200),
    heading: "New contact message from autumnstar.ca",
    rows: contactRows(c),
    replyTo: c.email,
  });
  if (result !== "sent") return NextResponse.json({ ok: false, code: result, ...(status ? { providerStatus: status } : {}) }, { status: result === "not_configured" ? 503 : 502 });
  return NextResponse.json({ ok: true, reference });
}
