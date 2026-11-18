"use client";

import { useCallback, useEffect, useRef } from "react";
import { LIMITS } from "@/lib/inquiry";

const REFRESH_MS = 30 * 60 * 1000; // server tokens expire after 2h; refresh well before

/**
 * Fetches a signed time token for a form when the page loads and keeps it fresh.
 * `ensureToken()` returns a token that is old enough for the server's minimum fill time,
 * waiting briefly if one had to be fetched just now, so real people never hit the bot path.
 */
export function useFormToken(form: "quote" | "contact") {
  const state = useRef<{ token: string; receivedAt: number } | null>(null);

  const fetchToken = useCallback(async () => {
    try {
      const res = await fetch(`/api/form-token?form=${form}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (data.ok && typeof data.token === "string") state.current = { token: data.token, receivedAt: Date.now() };
    } catch {
      /* offline or not configured: the submit will report the error */
    }
  }, [form]);

  useEffect(() => {
    fetchToken();
    const id = window.setInterval(fetchToken, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [fetchToken]);

  return useCallback(async (): Promise<string> => {
    if (!state.current) await fetchToken();
    if (!state.current) return "";
    const wait = state.current.receivedAt + LIMITS.minFillMs + 400 - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    return state.current.token;
  }, [fetchToken]);
}
