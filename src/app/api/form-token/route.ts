import { NextResponse } from "next/server";
import { FORMS, issueToken, type FormName } from "@/lib/formToken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/form-token?form=quote|contact → { token } (never cached). */
export async function GET(request: Request) {
  const form = new URL(request.url).searchParams.get("form") as FormName | null;
  if (!form || !FORMS.includes(form)) return NextResponse.json({ ok: false, code: "invalid" }, { status: 400 });
  const token = issueToken(form);
  const headers = { "Cache-Control": "no-store" };
  if (!token) return NextResponse.json({ ok: false, code: "not_configured" }, { status: 503, headers });
  return NextResponse.json({ ok: true, token }, { headers });
}
