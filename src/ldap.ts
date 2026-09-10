import { createClient } from "ldapjs";
import { getConfig } from "./config";

// Custom error class — always shows a generic message to the user
// to prevent username enumeration via distinct error strings.
export class AuthError extends Error {
  constructor() {
    super("Invalid username or password");
    this.name = "AuthError";
  }
}

interface LdapSearchResult {
  dn: string;
  attributes: Record<string, string | string[]>;
}

function normalizeAttr(attr: any): string | string[] {
  if (attr === undefined || attr === null) return "";
  const v = Array.isArray(attr) ? attr : [attr];
  const strings = v.map((item: any) => String(item));
  return strings.length === 1 ? strings[0] : strings;
}

function searchOnce(client: any, base: string, filter: string, attributes: string[]): Promise<LdapSearchResult[]> {
  return new Promise((resolve, reject) => {
    const results: LdapSearchResult[] = [];
    client.search(base, { filter, scope: "sub", attributes }, (err: Error | null, res: any) => {
      if (err) return reject(err);
      res.on("searchEntry", (entry: any) => {
        const attrs: Record<string, string | string[]> = {};
        for (const a of entry.attributes ?? []) {
          attrs[a.type] = normalizeAttr(a.values ?? a.vals);
        }
        // objectName may be a DN object or a string — normalize to string
        const dnRaw = entry.objectName ?? entry.dn;
        const dn = typeof dnRaw === "string" ? dnRaw : dnRaw?.toString?.() ?? String(dnRaw ?? "");
        results.push({ dn, attributes: attrs });
      });
      res.on("error", (searchErr: Error) => reject(searchErr));
      res.on("end", () => resolve(results));
    });
  });
}

function bind(client: any, dn: string, password: string): Promise<void> {
  return new Promise((resolve, reject) => {
    client.bind(dn, password, (err: Error | null) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

function makeClient(): any {
  const cfg = getConfig();
  return createClient({
    url: cfg.LDAP_URL,
    reconnect: false,
    tlsOptions: { rejectUnauthorized: true },
  });
}

/**
 * Authenticate a user against LDAP.
 * 1. Bind as service account
 * 2. Find the user's DN
 * 3. Re-bind as the user to verify their password
 * 4. Collect the user's group CNs
 *
 * Returns the username + group CNs on success.
 * Throws AuthError on any failure — always the same message
 * to prevent username enumeration.
 */
export async function authenticate(username: string, password: string): Promise<{ username: string; groups: string[] }> {
  const cfg = getConfig();
  const client = makeClient();

  try {
    // 1. Service account bind
    await bind(client, cfg.LDAP_BIND_DN, cfg.LDAP_BIND_PASSWORD);

    // 2. Find user DN
    const userFilter = cfg.LDAP_USER_FILTER.replaceAll("{{username}}", escapeFilterValue(username));
    const userResults = await searchOnce(client, cfg.LDAP_SEARCH_BASE, userFilter, ["dn", cfg.LDAP_GROUP_ATTR]);
    if (userResults.length === 0) {
      throw new AuthError();
    }
    if (userResults.length > 1) {
      // Multiple matches is a config error — log it but tell user nothing
      console.error(`LDAP user filter matched ${userResults.length} entries for user "${username}"`);
      throw new AuthError();
    }
    const userDn = userResults[0].dn;

    // 3. Verify user's password (re-bind as the user)
    try {
      await bind(client, userDn, password);
    } catch {
      // Wrong password — generic error
      throw new AuthError();
    }

    // 4. Group lookup — try memberOf on the user entry first, then group filter search
    // LDAP attribute names are case-insensitive; ldapjs may return them lowercased
    let groupDns: string[] = [];
    const lowerAttrs = Object.fromEntries(
      Object.entries(userResults[0].attributes).map(([k, v]) => [k.toLowerCase(), v])
    );
    const memberOf = lowerAttrs[cfg.LDAP_GROUP_ATTR.toLowerCase()] ?? userResults[0].attributes[cfg.LDAP_GROUP_ATTR];
    if (memberOf) {
      groupDns = Array.isArray(memberOf) ? memberOf : [memberOf];
    }
    if (groupDns.length === 0 && cfg.LDAP_GROUP_FILTER) {
      const groupFilter = cfg.LDAP_GROUP_FILTER.replaceAll("{{user_dn}}", escapeFilterValue(userDn));
      const groupResults = await searchOnce(client, cfg.LDAP_SEARCH_BASE, groupFilter, ["cn"]);
      groupDns = groupResults.map((r) => r.dn);
    }

    const groups = groupDns
      .filter(Boolean)
      .map((dn) => extractCn(dn))
      .filter(Boolean) as string[];

    return { username, groups };
  } finally {
    try {
      client.unbind(() => {});
    } catch {
      // ignore
    }
  }
}

/**
 * Re-verify a user's group memberships WITHOUT requiring their password.
 * Uses the service account bind only. Throws AuthError if the user no
 * longer exists in LDAP. This powers session freshness checks.
 */
export async function getGroupsForUser(username: string): Promise<string[]> {
  const cfg = getConfig();
  const client = makeClient();

  try {
    // Service account bind
    await bind(client, cfg.LDAP_BIND_DN, cfg.LDAP_BIND_PASSWORD);

    // Find user DN
    const userFilter = cfg.LDAP_USER_FILTER.replaceAll("{{username}}", escapeFilterValue(username));
    const userResults = await searchOnce(client, cfg.LDAP_SEARCH_BASE, userFilter, ["dn", cfg.LDAP_GROUP_ATTR]);
    if (userResults.length === 0) {
      throw new AuthError();
    }
    const userDn = userResults[0].dn;

    // Group lookup — memberOf first, then group filter
    let groupDns: string[] = [];
    const memberOf = userResults[0].attributes[cfg.LDAP_GROUP_ATTR];
    if (memberOf) {
      groupDns = Array.isArray(memberOf) ? memberOf : [memberOf];
    }
    if (groupDns.length === 0 && cfg.LDAP_GROUP_FILTER) {
      const groupFilter = cfg.LDAP_GROUP_FILTER.replaceAll("{{user_dn}}", escapeFilterValue(userDn));
      const groupResults = await searchOnce(client, cfg.LDAP_SEARCH_BASE, groupFilter, ["cn"]);
      groupDns = groupResults.map((r) => r.dn);
    }

    return groupDns
      .filter(Boolean)
      .map((dn) => extractCn(dn))
      .filter(Boolean) as string[];
  } finally {
    try {
      client.unbind(() => {});
    } catch {
      // ignore
    }
  }
}

/**
 * Return the CN of every group in the directory. Used to populate the
 * group dropdown for super-group members, who may create entries in ANY group.
 */
export async function getAllGroupNames(): Promise<string[]> {
  const cfg = getConfig();
  const client = makeClient();

  try {
    await bind(client, cfg.LDAP_BIND_DN, cfg.LDAP_BIND_PASSWORD);
    const results = await searchOnce(client, cfg.LDAP_SEARCH_BASE, "(objectClass=groupOfNames)", ["cn"]);
    const names = results
      .map((r) => {
        const cn = r.attributes.cn;
        if (Array.isArray(cn)) return cn[0] ?? null;
        return cn ?? null;
      })
      .filter((n): n is string => typeof n === "string" && n.length > 0);
    // Deduplicate while preserving order
    return [...new Set(names)];
  } finally {
    try {
      client.unbind(() => {});
    } catch {
      // ignore
    }
  }
}

function escapeFilterValue(value: string): string {
  // LDAP filter escaping — prefix every special character with \
  // Special chars: \ * ( ) & | ! = ~ < > : and NUL (\00)
  return value.replace(/[\\*()&|!=~<>:\u0000]/g, (ch) => {
    if (ch === "\u0000") return "\\00";
    return "\\" + ch;
  });
}

function extractCn(dn: string): string | null {
  const parts = dn.split(",");
  for (const part of parts) {
    const trimmed = part.trim();
    if (/^cn=/i.test(trimmed)) {
      let val = trimmed.slice(3);
      // unescape LDAP DN escapes: \2c (comma), \5c (backslash), etc.
      val = val.replace(/\\([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
      return val;
    }
  }
  return null;
}