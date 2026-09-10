import { randomBytes } from "node:crypto";
import { loadConfig, getConfig } from "./config";

const APP_NAME = () => getConfig().APP_NAME;
import { getDb, getSession, getDistinctGroupNames } from "./db";
import { Router } from "./router";
import { requireSession, requireSessionJson } from "./middleware";
import { getAllGroupNames } from "./ldap";
import { getLoginPage, handleLogin, handleLogout } from "./routes/auth";
import { listPasswordsJson, createPasswordJson, deletePasswordJson, decryptPasswordJson, updatePasswordJson } from "./routes/passwords";

// Load config and init DB at startup
loadConfig();
getDb();

const router = new Router();

// Security headers applied to all HTML responses
function securityHeaders(contentType: string): Record<string, string> {
  return {
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "same-origin",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  };
}

// -- Auth routes --
router.get("/", (ctx) => {
  const cookie = ctx.request.headers.get("Cookie");
  // Token must be exactly 64 hex characters (32 bytes) — matches randomBytes(32).toString("hex")
  const match = cookie?.match(/\bsession=([a-f0-9]{64})\b/i);
  if (match) {
    return new Response(null, { status: 302, headers: { Location: "/dashboard" } });
  }
  // If a session cookie exists but the token is malformed, reject with 401
  if (cookie?.match(/\bsession=/)) {
    return new Response("Unauthorized", { status: 401 });
  }
  return new Response(null, { status: 302, headers: { Location: "/login" } });
});

router.get("/login", getLoginPage);
router.post("/login", handleLogin);
router.post("/logout", handleLogout);

// -- Dashboard (session required) --
router.get("/dashboard", requireSession(async (ctx) => {
  // Per-request CSP nonce so the inline groups bootstrap + external script
  // are allowed while everything else is blocked (script-src 'self' 'strict-dynamic')
  const nonce = randomBytes(16).toString("base64");

  // Super users see all groups in the dropdown so they can create/edit in any
  // group. Merge LDAP group names with existing DB groups for safety.
  let availableGroups = ctx.userGroups;
  if (ctx.isSuper) {
    const ldapGroups = await getAllGroupNames();
    const dbGroups = getDistinctGroupNames();
    const merged = [...new Set([...ldapGroups, ...dbGroups, ...ctx.userGroups])].filter(Boolean) as string[];
    availableGroups = merged.length > 0 ? merged : ctx.userGroups;
  }

  // Inject groups as JSON for the external script
  const groupsJson = JSON.stringify(availableGroups)
    .replace(/</g, "\\u003c") // neutralize any </script> breakout
    .replace(/>/g, "\\u003e");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(APP_NAME())}</title>
<link rel="stylesheet" href="/fonts/material-icons.css">
<link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div class="topbar">
    <span class="app-name">${escapeHtml(APP_NAME())}</span>
    <span class="user-info">${escapeHtml(ctx.username)}</span>
    <form method="post" action="/logout" class="logout-form">
      <button type="submit" class="btn-logout">Log out</button>
    </form>
  </div>
  <div class="container">
    <h2>Passwords</h2>

    <button id="btn-toggle-add" class="btn-toggle">+ Add password</button>

    <div class="add-form" id="add-form" style="display:none">
      <h3>Add password</h3>
      <div class="form-row">
        <input type="text" id="f-title" placeholder="Title" autocomplete="off" required>
        <input type="text" id="f-username" placeholder="Username" autocomplete="off" required>
        <input type="text" id="f-url" placeholder="URL (optional)" autocomplete="off">
        <input type="password" id="f-password" placeholder="Password" autocomplete="new-password" required>
        <select id="f-group"></select>
        <button id="btn-add">Add</button>
      </div>
    </div>

    <table id="pw-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Username</th>
          <th>URL</th>
          <th>Group</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="pw-body"></tbody>
    </table>
  </div>

  <script nonce="${nonce}">window.__GROUPS__ = ${groupsJson};</script>
  <script src="/dashboard.js" nonce="${nonce}"></script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      ...securityHeaders("text/html; charset=utf-8"),
      "Cache-Control": "no-cache, no-store",
      "Content-Security-Policy":
        `default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'strict-dynamic' 'nonce-${nonce}'; font-src 'self'; object-src 'none'; frame-ancestors 'none'`,
    },
  });
}));

// -- API routes (session required, JSON responses) --
router.get("/api/passwords", requireSessionJson(listPasswordsJson));
router.post("/api/passwords", requireSessionJson(createPasswordJson));
router.get("/api/passwords/:id/decrypt", requireSessionJson(decryptPasswordJson));
router.put("/api/passwords/:id", requireSessionJson(updatePasswordJson));
router.delete("/api/passwords/:id", requireSessionJson(deletePasswordJson));

// -- Static files (public/*) --
router.get("/styles.css", () => {
  const file = Bun.file("public/styles.css");
  return new Response(file, {
    headers: {
      "Content-Type": "text/css; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
router.get("/fonts/material-icons.css", () => {
  const file = Bun.file("public/fonts/material-icons.css");
  return new Response(file, {
    headers: {
      "Content-Type": "text/css; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
router.get("/fonts/MaterialIcons.woff2", () => {
  const file = Bun.file("public/fonts/MaterialIcons.woff2");
  return new Response(file, {
    headers: {
      "Content-Type": "font/woff2",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
router.get("/dashboard.js", () => {
  const file = Bun.file("public/dashboard.js");
  return new Response(file, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
router.get("/login.js", () => {
  const file = Bun.file("public/login.js");
  return new Response(file, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
});

// -- Start server --
const cfg = getConfig();
const server = Bun.serve({
  port: cfg.PORT,
  async fetch(request, server) {
    const response = await router.resolve(request, server);
    if (response) return response;
    return new Response("Not found", { status: 404 });
  },
});

console.log(`${APP_NAME()} running on http://localhost:${server.port}`);

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "\x26amp;")
    .replace(/</g, "\x26lt;")
    .replace(/>/g, "\x26gt;")
    .replace(/"/g, "\x26quot;")
    .replace(/'/g, "\x26#39;");
}