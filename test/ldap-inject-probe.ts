/**
 * Dedicated LDAP filter-injection probe.
 * Runs in its own login rate-limit window (5/min/IP), separate from the main
 * probe harness, so the payloads actually reach the LDAP code path.
 *
 * Usage: bun run test/ldap-inject-probe.ts
 */

const BASE = "http://localhost:3000";

let pass = 0;
let fail = 0;

function check(name: string, cond: boolean, detail: string) {
  if (cond) {
    pass++;
    console.log(`  ✔ ${name} — ${detail}`);
  } else {
    fail++;
    console.log(`  ✘ ${name} — ${detail}`);
  }
}

// Payloads aimed at the LDAP user filter:
//   (&(objectClass=inetOrgPerson)(uid={{username}}))
// Each must be filter-escaped so the query stays a single, harmless
// (uid=<escaped>) clause and never matches extra users or bypasses auth.
// 5 payloads spaced 13s apart fit inside the 5/min login rate window.
const payloads: [string, string][] = [
  ["wildcard", "*"],
  ["filter-injection", ")(uid=*))(|(uid="],
  ["paren-close-uid-star", "aweeri)(|(uid=*"],
  ["null-byte", "aweeri\u0000"],
  ["ampersand", "aweeri&"],
];

console.log("=== LDAP filter injection probes ===");
let i = 0;
for (const [label, username] of payloads) {
  const res = await fetch(BASE + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password: "WRONGPASSWORD" }),
    redirect: "manual",
  });
  const body = await res.text();
  const ok = res.status === 401 && /Invalid username or password/.test(body);
  check(`[${label}] username=${JSON.stringify(username)} -> generic 401`, ok, `status=${res.status} body=${body.slice(0, 80)}`);
  i++;
  if (i < payloads.length) await new Promise((r) => setTimeout(r, 13000));
}

console.log(`\n===== LDAP INJECTION RESULTS: ${pass} passed, ${fail} failed =====`);
if (fail > 0) process.exitCode = 1;
else console.log("No LDAP filter injection bypass found.");