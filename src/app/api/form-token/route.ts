import { NextResponse } from "next/server";
import { FORMS, issueToken, type FormName } from "@/lib/formToken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/form-token?form=quote|contact[&prev=<token>] → { ok, token, minWaitMs } (never cached).
 * Passing the previous token keeps the page's original start time on a refresh.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const form = params.get("form") as FormName | null;
  if (!form || !FORMS.includes(form)) return NextResponse.json({ ok: false, code: "invalid" }, { status: 400 });
  const issued = issueToken(form, params.get("prev"));
  const headers = { "Cache-Control": "no-store" };
  if (!issued) return NextResponse.json({ ok: false, code: "not_configured" }, { status: 503, headers });
  return NextResponse.json({ ok: true, ...issued }, { headers });
}
