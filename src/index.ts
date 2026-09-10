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

const cfg = getConfig();
const base = cfg.BASE_PATH;
const router = new Router(base);

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
    return new Response(null, { status: 302, headers: { Location: base + "/dashboard" } });
  }
  // If a session cookie exists but the token is malformed, reject with 401
  if (cookie?.match(/\bsession=/)) {
    return new Response("Unauthorized", { status: 401 });
  }
  return new Response(null, { status: 302, headers: { Location: base + "/login" } });
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
  // Group list for the dropdown.
  // - Normal users: only their own groups (which are whitelisted — they passed LOGIN_GROUPS).
  // - Super users: all whitelisted groups so they can create in any allowed group.
  //   If no whitelist is set, they get all LDAP + DB groups.
  // - When LOGIN_GROUPS is configured, the dropdown is limited to those groups.
  // - User's own groups are listed FIRST for default selection.
  const loginGroups = getConfig().LOGIN_GROUPS;
  let availableGroups = ctx.userGroups;

  if (ctx.isSuper) {
    if (loginGroups.length > 0) {
      // Own groups first (default selection), then remaining whitelisted groups
      availableGroups = [...new Set([...ctx.userGroups, ...loginGroups])] as string[];
    } else {
      const ldapGroups = await getAllGroupNames();
      const dbGroups = getDistinctGroupNames();
      const merged = [...new Set([...ctx.userGroups, ...ldapGroups, ...dbGroups])].filter(Boolean) as string[];
      availableGroups = merged.length > 0 ? merged : ctx.userGroups;
    }
  } else if (loginGroups.length > 0) {
    // Non-super users: only their own whitelisted groups
    const lowerWhitelist = loginGroups.map((g) => g.toLowerCase());
    availableGroups = ctx.userGroups.filter((g) => lowerWhitelist.includes(g.toLowerCase()));
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
<link rel="stylesheet" href="${base}/fonts/material-icons.css">
<link rel="stylesheet" href="${base}/styles.css">
</head>
<body>
  <div class="topbar">
    <span class="app-name">${escapeHtml(APP_NAME())}</span>
    <span class="user-info">${escapeHtml(ctx.username)}</span>
    <form method="post" action="${base}/logout" class="logout-form">
      <button type="submit" class="btn-logout">Log out</button>
    </form>
  </div>
  <div class="container">
    <div class="pw-header">
      <h2>Passwords</h2>
      <div class="search-wrapper">
        <span class="material-icons search-icon">search</span>
        <input type="text" id="search-bar" class="search-bar" placeholder="Search by name, username or URL&hellip;" autocomplete="off">
        <button id="btn-clear-search" class="btn-clear-search" style="display:none" title="Clear search"><span class="material-icons md-18">close</span></button>
      </div>
    </div>

    <button id="btn-toggle-add" class="btn-toggle"><span class="material-icons md-18">add</span> Add entry</button>

    <div class="add-form" id="add-form" style="display:none">
      <div class="add-form-fields">
        <div class="field-group">
          <label>Title <span class="hint">(required)</span></label>
          <input type="text" id="f-title" placeholder="e.g. Company Email" autocomplete="off" required>
        </div>
        <div class="field-group">
          <label>Username <span class="hint">(required)</span></label>
          <input type="text" id="f-username" placeholder="e.g. john@example.com" autocomplete="off" required>
        </div>
        <div class="field-group">
          <label>Password <span class="hint">(required)</span></label>
          <input type="password" id="f-password" placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" autocomplete="new-password" required>
        </div>
        <div class="field-group">
          <label>URL <span class="hint">(optional)</span></label>
          <input type="text" id="f-url" placeholder="https://example.com" autocomplete="off">
        </div>
        <div class="field-group">
          <label>Group</label>
          <select id="f-group"></select>
        </div>
        <button id="btn-add" class="btn-add-form"><span class="material-icons md-18">add_circle_outline</span> Add</button>
      </div>
    </div>

    <div id="empty-state" class="empty-state" style="display:none">
      <span class="material-icons empty-icon">vpn_key</span>
      <p class="empty-title">No passwords yet</p>
      <p class="empty-desc">Click <strong>Add entry</strong> above to store your first password.</p>
    </div>

    <div id="no-results" class="empty-state" style="display:none">
      <span class="material-icons empty-icon">search_off</span>
      <p class="empty-title">No matching entries</p>
      <p class="empty-desc">Try a different search term or <a href="#" id="clear-search-link">clear the filter</a>.</p>
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

  <script nonce="${nonce}">window.__BASE__ = ${JSON.stringify(base)}; window.__GROUPS__ = ${groupsJson};</script>
  <script src="${base}/dashboard.js" nonce="${nonce}"></script>
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