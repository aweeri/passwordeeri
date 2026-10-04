// Mock LDAP server for local testing.

import ldap from "ldapjs";

const USERS: Record<string, { dn: string; password: string; groups: string[] }> = {
  alice: {
    dn: "uid=alice,ou=people,dc=test,dc=local",
    password: "alicepass",
    groups: [
      "cn=engineering,ou=groups,dc=test,dc=local",
      "cn=devops,ou=groups,dc=test,dc=local",
    ],
  },
  bob: {
    dn: "uid=bob,ou=people,dc=test,dc=local",
    password: "bobpass",
    groups: ["cn=devops,ou=groups,dc=test,dc=local"],
  },
};

const server = ldap.createServer();

// ── Global bind handler ──
server.bind("dc=test,dc=local", (req: any, res: any, next: any) => {
  const dn = req.dn.toString();
  console.log("[MOCK] Bind attempt:", JSON.stringify({ dn, creds: req.credentials }));

  if (dn.toLowerCase() === "cn=admin,dc=test,dc=local") {
    if (req.credentials !== "adminpass") {
      return next(new ldap.InvalidCredentialsError());
    }
    res.end();
    return next();
  }

  const user = Object.values(USERS).find((u) => u.dn.toLowerCase() === dn.toLowerCase());
  if (!user || req.credentials !== user.password) {
    console.log("[MOCK] Bind rejected for:", dn);
    return next(new ldap.InvalidCredentialsError());
  }

  res.end();
  return next();
});

// ── Search handler ──
server.search("dc=test,dc=local", (req: any, res: any, next: any) => {
  const filterStr = req.filter.toString();
  const uidMatch = filterStr.match(/uid=([^)]+)/i);

  if (!uidMatch) {
    res.end();
    return next();
  }

  const username = uidMatch[1].toLowerCase();
  const user = USERS[username];

  if (!user) {
    res.end();
    return next();
  }

  // createSearchEntry stamps the request messageId; plain-object send() lowercases keys and strips camelCase attrs like memberOf.
  const entry = res.createSearchEntry({
    objectName: user.dn,
    attributes: [
      new ldap.Attribute({ type: "objectclass", values: ["inetOrgPerson", "top"] }),
      new ldap.Attribute({ type: "uid", values: [username] }),
      new ldap.Attribute({ type: "cn", values: [username.charAt(0).toUpperCase() + username.slice(1)] }),
      new ldap.Attribute({ type: "sn", values: ["User"] }),
      new ldap.Attribute({ type: "memberOf", values: user.groups }),
    ],
  });
  res.send(entry);

  res.end();
  return next();
});

const PORT = 1389;

server.listen(PORT, () => {
  console.log(`  Mock LDAP running on ldap://localhost:${PORT}`);
  console.log("  alice / alicepass  → engineering + devops");
  console.log("  bob   / bobpass    → devops only");
  console.log("  SC: cn=admin,dc=test,dc=local / adminpass");
});