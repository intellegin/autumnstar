#!/usr/bin/env bash
# Runs the whole form test suite locally against a MOCK Mailgun (no real email is ever sent).
#   Phase 1: dev server with QUOTE_TO          → full suite (spam checks, retry, mail rules)
#   Phase 2: dev server WITHOUT QUOTE_TO        → forms answer not_configured
#   Phase 3: production build pointed at mock   → mock URL ignored (test hooks off in production)
# Usage: bash scripts/run-form-tests.sh   (needs ports 3100, 8795, 8796 free)
set -u
cd "$(dirname "$0")/.."
PORT=3100; KEY=test-key; MOCK=http://127.0.0.1:8795; LOG=$(mktemp -d)
stop() { local p; p=$(lsof -ti tcp:$PORT 2>/dev/null || ss -ltnp 2>/dev/null | grep "127.0.0.1:$PORT " | grep -o 'pid=[0-9]*' | cut -d= -f2); [ -n "$p" ] && kill $p 2>/dev/null; sleep 2; }
warm() { for p in / /quote /contact "/api/form-token?form=quote" "/api/form-token?form=contact"; do curl -s -o /dev/null "http://127.0.0.1:$PORT$p"; done; }
node scripts/form-security-test.mjs --mock-only > "$LOG/mock.log" 2>&1 & MOCKPID=$!; sleep 1
fail=0
echo "== Phase 1: full suite (dev, QUOTE_TO set)"
MAILGUN_API_KEY=$KEY QUOTE_TO=inbox@example.com MAILGUN_API_BASE=$MOCK npx next dev -p $PORT -H 127.0.0.1 > "$LOG/dev1.log" 2>&1 & sleep 8; warm
BASE=http://127.0.0.1:$PORT TEST_KEY=$KEY node scripts/form-security-test.mjs || fail=1; stop
echo "== Phase 2: QUOTE_TO missing (dev)"
MAILGUN_API_KEY=$KEY MAILGUN_API_BASE=$MOCK npx next dev -p $PORT -H 127.0.0.1 > "$LOG/dev2.log" 2>&1 & sleep 8; warm
MODE=not-configured BASE=http://127.0.0.1:$PORT node scripts/form-security-test.mjs || fail=1; stop
echo "== Phase 3: production build, mock URL must be ignored"
npx next build > "$LOG/build.log" 2>&1 || { echo "build failed"; fail=1; }
MAILGUN_API_KEY=$KEY QUOTE_TO=inbox@example.com MAILGUN_API_BASE=$MOCK npx next start -p $PORT -H 127.0.0.1 > "$LOG/prod.log" 2>&1 & sleep 4
MODE=production BASE=http://127.0.0.1:$PORT node scripts/form-security-test.mjs || fail=1
grep -q "MAILGUN_API_BASE ignored in production" "$LOG/prod.log" && echo "PASS  server log confirms the mock URL was ignored" || { echo "FAIL  no 'ignored in production' log line"; fail=1; }
stop; kill $MOCKPID 2>/dev/null
echo; [ $fail -eq 0 ] && echo "ALL PHASES PASSED" || echo "SOME CHECKS FAILED (logs: $LOG)"; exit $fail
