import { createClient } from "ldapjs";

const url = process.env.TEST_LDAP_URL ?? "ldap://100.81.24.17:3890";
const bindDn = process.env.TEST_BIND_DN ?? "uid=admin,ou=people,dc=example,dc=com";
const bindPass = process.env.TEST_BIND_PASS ?? "SecurePassword123";
const base = process.env.TEST_BASE ?? "dc=example,dc=com";

const client = createClient({ url, reconnect: false, timeout: 5000, connectTimeout: 5000 });

function bind(dn: string, password: string): Promise<void> {
  return new Promise((resolve, reject) => {
    client.bind(dn, password, (err: Error | null) => {
      err ? reject(err) : resolve();
    });
  });
}

function search(filter: string, attributes: string[]): Promise<any> {
  return new Promise((resolve, reject) => {
    const entries: any[] = [];
    client.search(base, { filter, scope: "sub", attributes }, (err: Error | null, res: any) => {
      if (err) return reject(err);
      res.on("searchEntry", (entry: any) => {
        const attrs: Record<string, any> = {};
        for (const a of entry.attributes ?? []) {
          attrs[a.type] = a.values ?? a.vals;
        }
        entries.push({ dn: entry.objectName?.toString?.() ?? String(entry.objectName ?? ""), attributes: attrs });
      });
      res.on("error", (e: Error) => reject(e));
      res.on("end", () => resolve(entries));
    });
  });
}

console.log(`Connecting to ${url}`);
try {
  await bind(bindDn, bindPass);
  console.log("Bind OK as", bindDn);

  // Inspect the top-level DIT structure
  const top = await search("(objectClass=*)", ["objectClass", "cn", "ou"]);
  console.log("\n=== Top-level DIT ===");
  console.log(JSON.stringify(top.slice(0, 20), null, 2));

  // Find an inetOrgPerson to see what group attributes exist
  const user = await search("(objectClass=inetOrgPerson)", ["uid", "dn", "memberOf", "cn"]);
  console.log("\n=== Users (first 5) ===");
  console.log(JSON.stringify(user.slice(0, 5), null, 2));

  if (user.length === 0) {
    // Fallback: list groups to understand schema
    const groups = await search("(objectClass=*)", ["objectClass", "cn", "member", "uniqueMember"]);
    console.log("\n=== Entries (first 10) ===");
    console.log(JSON.stringify(groups.slice(0, 10), null, 2));
  }
} catch (err: any) {
  console.error("FAILED:", err.message ?? err);
  process.exitCode = 1;
} finally {
  try { client.unbind(() => {}); } catch {}
}