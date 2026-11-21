"use client";

import { useCallback, useEffect, useRef } from "react";

const REFRESH_AFTER_MS = 90 * 60 * 1000; // server tokens expire 2h after issue; refresh well before

type TokenState = { token: string; receivedAt: number; readyAt: number };

/**
 * Signed form time token (security finding F-005).
 * A token is fetched when the form loads. `ensureToken()` refreshes it when it is older than 90 min,
 * measured by wall-clock age (not a timer, so laptop sleep can't leave it stale), or when `force` is set
 * after the server answered "token_expired". The previous token is sent along so the page's original
 * start time carries over, and the server says how long to wait (minimum fill time), so a refresh +
 * retry is never mistaken for a too-fast bot.
 */
export function useFormToken(form: "quote" | "contact") {
  const state = useRef<TokenState | null>(null);

  const fetchToken = useCallback(async () => {
    try {
      const prev = state.current?.token;
      const qs = new URLSearchParams({ form, ...(prev ? { prev } : {}) });
      const res = await fetch(`/api/form-token?${qs}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (data.ok && typeof data.token === "string") {
        const now = Date.now();
        state.current = { token: data.token, receivedAt: now, readyAt: now + (Number(data.minWaitMs) || 0) };
      }
    } catch {
      /* offline or not configured: the submit reports the error */
    }
  }, [form]);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  return useCallback(
    async ({ force = false }: { force?: boolean } = {}): Promise<string> => {
      const s = state.current;
      if (force || !s || Date.now() - s.receivedAt > REFRESH_AFTER_MS) await fetchToken();
      const t = state.current;
      if (!t) return "";
      const wait = t.readyAt + 300 - Date.now();
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      return t.token;
    },
    [fetchToken],
  );
}
