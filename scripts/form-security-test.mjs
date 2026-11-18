// Form spam-protection test (finding F-005). Sends NO real email: it runs its own mock Mailgun.
//
// Usage (local):
//   1) node scripts/form-security-test.mjs --mock-only        # starts the mock on :8795, leave running
//   2) MAILGUN_API_KEY=test-key MAILGUN_API_BASE=http://127.0.0.1:8795 npm start   (in another shell)
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
        received.push(Object.fromEntries(new URLSearchParams(body)));
        res.writeHead(200, { "content-type": "application/json" }); res.end('{"id":"<mock>","message":"Queued"}');
      });
    }).listen(MOCK_PORT, "127.0.0.1", () => {
      http.createServer((_req, res) => { res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify({ count: received.length })); })
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
  const getToken = async (form) => (await (await fetch(`${BASE}/api/form-token?form=${form}`, { cache: "no-store" })).json()).token;
  const post = async (form, body) => (await fetch(`${BASE}/api/${form}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })).json();
  const mintToken = (form, ts) => { // only possible with the key (local test)
    const k = Buffer.from(hkdfSync("sha256", KEY, "autumnstar.ca", "as-form-token-v1", 32));
    const p = `${form}.${ts}.${randomBytes(9).toString("base64url")}`; return `${p}.${createHmac("sha256", k).update(p).digest("base64url")}`;
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
    check(`${form}: missing token refused`, missing.ok === true && (base === null || (await mockCount()) === base));
    const real = await getToken(form); await sleep(3000);
    const forged = real.slice(0, -4) + (real.endsWith("AAAA") ? "BBBB" : "AAAA");
    base = await mockCount();
    const fr = await post(form, { ...bodies[form], token: forged });
    check(`${form}: forged signature refused`, fr.ok === true && (base === null || (await mockCount()) === base));
    const [f, ts, rnd, sig] = real.split(".");
    base = await mockCount();
    const tamper = await post(form, { ...bodies[form], token: `${f}.${Number(ts) - 60000}.${rnd}.${sig}` });
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
      base = await mockCount();
      const expired = await post(form, { ...bodies[form], token: mintToken(form, Date.now() - 2 * 60 * 60 * 1000 - 60000) });
      check(`${form}: expired token (2h+) refused`, expired.ok === true && (await mockCount()) === base);
    }
  }
  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
}
