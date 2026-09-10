import { loadConfig, getConfig } from "./config";
import { getDb, getSession } from "./db";
import { Router } from "./router";
import { requireSession, requireSessionJson } from "./middleware";
import { getLoginPage, handleLogin, handleLogout } from "./routes/auth";
import { listPasswordsJson, createPasswordJson, deletePasswordJson } from "./routes/passwords";

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
  };
}

// -- Auth routes --
router.get("/", (ctx) => {
  const cookie = ctx.request.headers.get("Cookie");
  const match = cookie?.match(/\bsession=([^;]+)/);
  if (match) {
    return new Response(null, { status: 302, headers: { Location: "/dashboard" } });
  }
  return new Response(null, { status: 302, headers: { Location: "/login" } });
});

router.get("/login", getLoginPage);
router.post("/login", handleLogin);
router.get("/logout", handleLogout);

// -- Dashboard (session required) --
router.get("/dashboard", requireSession((ctx) => {
  // Inject groups as JSON for the external script
  const groupsJson = JSON.stringify(ctx.userGroups)
    .replace(/</g, "\\u003c") // neutralize any </script> breakout
    .replace(/>/g, "\\u003e");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>passwordeeri</title>
<link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div class="topbar">
    <span class="app-name">passwordeeri</span>
    <span class="user-info">${escapeHtml(ctx.username)}</span>
    <a href="/logout" class="btn-logout">Log out</a>
  </div>
  <div class="container">
    <h2>Passwords</h2>

    <div class="add-form">
      <h3>Add password</h3>
      <div class="form-row">
        <input type="text" id="f-title" placeholder="Title" required>
        <input type="text" id="f-username" placeholder="Username" required>
        <input type="text" id="f-url" placeholder="URL (optional)">
        <input type="password" id="f-password" placeholder="Password" required>
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

  <script>
    window.__GROUPS__ = ${groupsJson};
  </script>
  <script src="/dashboard.js"></script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      ...securityHeaders("text/html; charset=utf-8"),
      "Content-Security-Policy":
        "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; object-src 'none'; frame-ancestors 'none'",
    },
  });
}));

// -- API routes (session required, JSON responses) --
router.get("/api/passwords", requireSessionJson(listPasswordsJson));
router.post("/api/passwords", requireSessionJson(createPasswordJson));
router.delete("/api/passwords/:id", requireSessionJson(deletePasswordJson));

// -- Static files (public/*) --
router.get("/styles.css", () => {
  const file = Bun.file("public/styles.css");
  return new Response(file, {
    headers: {
      "Content-Type": "text/css; charset=utf-8",
      "Cache-Control": "max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
router.get("/dashboard.js", () => {
  const file = Bun.file("public/dashboard.js");
  return new Response(file, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
router.get("/login.js", () => {
  const file = Bun.file("public/login.js");
  return new Response(file, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
});

// -- Start server --
const cfg = getConfig();
const server = Bun.serve({
  port: cfg.PORT,
  async fetch(request) {
    const response = await router.resolve(request);
    if (response) return response;
    return new Response("Not found", { status: 404 });
  },
});

console.log(`passwordeeri running on http://localhost:${server.port}`);

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "\x26amp;")
    .replace(/</g, "\x26lt;")
    .replace(/>/g, "\x26gt;")
    .replace(/"/g, "\x26quot;")
    .replace(/'/g, "\x26#39;");
}