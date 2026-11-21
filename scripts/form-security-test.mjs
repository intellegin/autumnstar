// Form spam-protection test (finding F-005). Sends NO real email: it runs its own mock Mailgun.
//
// Usage (local):
//   1) node scripts/form-security-test.mjs --mock-only        # starts the mock on :8795, leave running
//   2) MAILGUN_API_KEY=test-key MAILGUN_API_BASE=http://127.0.0.1:8795 npm run dev   (in another shell)
//      Must be dev mode: in production (NODE_ENV=production, e.g. `npm start` or Vercel) a non-Mailgun
//      MAILGUN_API_BASE is ignored by design, so the mock would not be used.
//   3) BASE=http://127.0.0.1:3000 TEST_KEY=test-key node scripts/form-security-test.mjs
// Or point BASE at a preview URL without TEST_KEY: the checks that need the key (expired token,
// and counting delivered mails) are skipped, and only refusals are tested, so nothing is sent.
import http from "node:http";
import { createHmac, hkdfSync, randomBytes } from "node:crypto";

const MOCK_PORT = 8795;
const received = [];
function startMock() {
  return new Promise((resolve) => {
    http.createServer((req, res) => {
      let body = ""; req.on("data", (d) => (body += d)).on("end", () => {
        received.push(Object.fromEntries(new URLSearchParams(body))); // from, to, subject, text, html, h:Reply-To
        res.writeHead(200, { "content-type": "application/json" }); res.end('{"id":"<mock>","message":"Queued"}');
      });
    }).listen(MOCK_PORT, "127.0.0.1", () => {
      http.createServer((req, res) => {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify(req.url.startsWith("/last") ? received.at(-1) ?? null : { count: received.length }));
      })
        .listen(MOCK_PORT + 1, "127.0.0.1", resolve);
    });
  });
}

if (process.argv.includes("--mock-only")) { await startMock(); console.log(`mock Mailgun on :${MOCK_PORT}`); }
else {
  const BASE = (process.env.BASE || "http://127.0.0.1:3000").replace(/\/$/, "");
  const KEY = process.env.TEST_KEY || "";
  const local = Boolean(KEY);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const getTokenFull = async (form, prev) => (await fetch(`${BASE}/api/form-token?form=${form}${prev ? `&prev=${encodeURIComponent(prev)}` : ""}`, { cache: "no-store" })).json();
  const getToken = async (form) => (await getTokenFull(form)).token;
  // Each form's checks use their own documentation-range test IP so the per-IP limit (5 sends / 10 min)
  // doesn't trip across the suite. (On Vercel, x-real-ip is set by the platform and can't be spoofed.)
  const TEST_IP = { quote: "198.51.100.10", contact: "198.51.100.20" };
  const post = async (form, body, ip = TEST_IP[form]) => (await fetch(`${BASE}/api/${form}`, { method: "POST", headers: { "content-type": "application/json", "x-real-ip": ip }, body: JSON.stringify(body) })).json();
  const lastMail = async () => { try { return await (await fetch(`http://127.0.0.1:${MOCK_PORT + 1}/last`)).json(); } catch { return null; } };
  const MODE = process.env.MODE || "full"; // full | not-configured | production
  // Mint a token the way the server does (only possible with the key, i.e. the local test).
  const mintToken = (form, iat, start, keyMaterial = KEY) => {
    const k = Buffer.from(hkdfSync("sha256", keyMaterial, "autumnstar.ca", "as-form-token-v1", 32));
    const kid = createHmac("sha256", k).update("kid").digest("base64url").slice(0, 8);
    const p = `${form}.${iat}.${start}.${randomBytes(9).toString("base64url")}.${kid}`;
    return `${p}.${createHmac("sha256", k).update(p).digest("base64url")}`;
  };
  const bodies = {
    quote: { mode: "Ocean", origin: "Vancouver", originCountry: "Canada", destination: "Rotterdam", destinationCountry: "Netherlands", commodity: "TEST cargo", name: "TEST", email: "test@example.com", website: "" },
    contact: { topic: "General question", name: "TEST", email: "test@example.com", message: "TEST message", website: "" },
  };
  // Mailgun receives mail only when the mock runs in another process; count through a status probe instead:
  // a refused (bot) submission returns ok:true like a success but sends nothing, so locally we check the mock log file.
  const results = [];
  const check = (name, pass, detail = "") => { results.push({ name, pass }); console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? "  (" + detail + ")" : ""}`); };
  const mockCount = async () => { try { return (await (await fetch(`http://127.0.0.1:${MOCK_PORT + 1}/count`)).json()).count; } catch { return null; } };

  if (MODE === "not-configured" || MODE === "production") {
    // Server started WITHOUT QUOTE_TO (not-configured) or as a production build pointed at the mock (production).
    for (const form of ["quote", "contact"]) {
      const t = await getToken(form); await sleep(3000);
      const base = await mockCount();
      const r = await post(form, { ...bodies[form], token: t }, `198.51.100.${form === "quote" ? 90 : 91}`);
      if (MODE === "not-configured") check(`${form}: missing QUOTE_TO → not_configured (no fake success), nothing sent`, r.ok === false && r.code === "not_configured" && (base === null || (await mockCount()) === base));
      else check(`${form}: production ignores the test mock URL (mock received nothing, no fake success)`, r.ok === false && (base === null || (await mockCount()) === base), `code ${r.code}`);
    }
    const failed = results.filter((r) => !r.pass).length;
    console.log(`\n${results.length - failed}/${results.length} passed`);
    process.exit(failed ? 1 : 0);
  }

  for (const form of ["quote", "contact"]) {
    const before = await mockCount();
    if (local) {
      const t = await getToken(form); await sleep(3000);
      const r = await post(form, { ...bodies[form], token: t });
      const after = await mockCount();
      check(`${form}: human fill (token aged 3s) succeeds and sends 1 mail`, r.ok === true && (after === null || after === before + 1), `ref ${r.reference}`);
    }
    let base = await mockCount();
    const fast = await post(form, { ...bodies[form], token: await getToken(form) });
    check(`${form}: too-fast submission refused (bot response, nothing sent)`, fast.ok === true && (base === null || (await mockCount()) === base));
    base = await mockCount();
    const missing = await post(form, { ...bodies[form] });
    check(`${form}: missing token → retryable token_expired (not a fake OK), nothing sent`, missing.ok === false && missing.code === "token_expired" && (base === null || (await mockCount()) === base));
    const real = await getToken(form); await sleep(3000);
    const forged = real.slice(0, -4) + (real.endsWith("AAAA") ? "BBBB" : "AAAA");
    base = await mockCount();
    const fr = await post(form, { ...bodies[form], token: forged });
    check(`${form}: forged signature refused`, fr.ok === true && (base === null || (await mockCount()) === base));
    const [f, iat, st, rnd, kid, sig] = real.split(".");
    base = await mockCount();
    const tamper = await post(form, { ...bodies[form], token: `${f}.${iat}.${Number(st) - 60000}.${rnd}.${kid}.${sig}` });
    check(`${form}: tampered timestamp refused`, tamper.ok === true && (base === null || (await mockCount()) === base));
    base = await mockCount();
    const other = form === "quote" ? "contact" : "quote";
    const otherTok = await getToken(other); await sleep(3000);
    const wrong = await post(form, { ...bodies[form], token: otherTok });
    check(`${form}: token from the other form refused`, wrong.ok === true && (base === null || (await mockCount()) === base));
    base = await mockCount();
    const honey = await post(form, { ...bodies[form], website: "http://spam.example", token: real });
    check(`${form}: filled honeypot refused`, honey.ok === true && (base === null || (await mockCount()) === base));
    if (local) {
      // Page left open > 2h: expired token → token_expired; the client refreshes (passing the old token,
      // so the original start time carries over) and retries at once → delivered, not too_fast.
      const old = Date.now() - 2 * 60 * 60 * 1000 - 60000;
      const expiredTok = mintToken(form, old, old);
      base = await mockCount();
      const expired = await post(form, { ...bodies[form], token: expiredTok });
      check(`${form}: expired token (2h+) → token_expired, nothing sent`, expired.ok === false && expired.code === "token_expired" && (await mockCount()) === base);
      const fresh = await getTokenFull(form, expiredTok);
      const retry = await post(form, { ...bodies[form], token: fresh.token });
      check(`${form}: expired → refresh → immediate retry delivered (start time carried, minWait ${fresh.minWaitMs}ms)`, retry.ok === true && fresh.minWaitMs === 0 && (await mockCount()) === base + 1, `ref ${retry.reference}`);
      // MAILGUN_API_KEY rotated while the page was open: old-key token → token_expired (not "forged");
      // the fresh token can't vouch for the old start time, so the client waits minWaitMs, then delivers.
      const rotated = mintToken(form, Date.now() - 60000, Date.now() - 60000, "previous-key");
      base = await mockCount();
      const rot = await post(form, { ...bodies[form], token: rotated });
      check(`${form}: token from a rotated key → token_expired, nothing sent`, rot.ok === false && rot.code === "token_expired" && (await mockCount()) === base);
      const fresh2 = await getTokenFull(form, rotated);
      await sleep(fresh2.minWaitMs + 300);
      const retry2 = await post(form, { ...bodies[form], token: fresh2.token });
      check(`${form}: rotated key → refresh → retry after ${fresh2.minWaitMs}ms delivered`, retry2.ok === true && (await mockCount()) === base + 1, `ref ${retry2.reference}`);
    }
  }
  // Standard v1.2 mail rules (local only: needs the mock to inspect what was sent)
  if (local) {
    let ipn = 40;
    for (const form of ["quote", "contact"]) {
      const marker = "ZZVISITOR" + form.toUpperCase();
      const send = async (extra) => { const t = await getToken(form); await sleep(3000); return post(form, { ...bodies[form], ...extra, token: t }, `198.51.100.${ipn++}`); };
      // 1) subject carries no visitor text
      const r1 = await send({ name: marker, origin: marker, message: marker, commodity: marker, topic: "General question" });
      const m1 = await lastMail();
      const re = form === "quote" ? /^\[AS-Q-\d{6}-[A-Z0-9]{4}\] New quote request$/ : /^\[AS-C-\d{6}-[A-Z0-9]{4}\] New contact message$/;
      check(`${form}: subject is fixed and has no visitor text`, r1.ok === true && m1 && re.test(m1.subject) && !m1.subject.includes(marker) && m1.text.includes(marker), m1 && m1.subject);
      // 2) valid address → Reply-To set exactly
      const r2 = await send({ email: "buyer@example.com" }); const m2 = await lastMail();
      check(`${form}: valid email → Reply-To set`, r2.ok === true && m2["h:Reply-To"] === "buyer@example.com");
      // 3) addresses that pass the form check but are not strictly valid → delivered, Reply-To dropped, email kept in body
      for (const bad of ["a,b@example.com", "x@-bad-.com", "user@localhost.x1"]) {
        const r = await send({ email: bad }); const m = await lastMail();
        check(`${form}: Reply-To dropped for ${JSON.stringify(bad)} (email kept in body)`, r.ok === true && !("h:Reply-To" in m) && m.text.includes(bad));
      }
      // 4) header injection / multiple addresses → refused by validation or sent without Reply-To; never CR/LF in Reply-To
      for (const evil of ["ok@example.com\r\nBcc: evil@example.com", "a@example.com,b@example.com", "a@example.com b@example.com"]) {
        const base = await mockCount();
        const r = await send({ email: evil }); const m = await lastMail();
        const sent = (await mockCount()) !== base;
        check(`${form}: malicious Reply-To ${JSON.stringify(evil)} not used`, (r.ok === false && r.code === "invalid" && !sent) || (sent && !("h:Reply-To" in m)), sent ? "sent without Reply-To" : "refused");
      }
    }
  }

  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
}
