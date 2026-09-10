import { loadConfig, getConfig } from "./config";

const APP_NAME = () => getConfig().APP_NAME;
import { getDb, getSession } from "./db";
import { Router } from "./router";
import { requireSession, requireSessionJson } from "./middleware";
import { getLoginPage, handleLogin, handleLogout } from "./routes/auth";
import { listPasswordsJson, createPasswordJson, deletePasswordJson, decryptPasswordJson } from "./routes/passwords";

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
<title>${escapeHtml(APP_NAME())}</title>
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

  <script>
    window.__GROUPS__ = ${groupsJson};
    (function() {
      // passwordMap: id -> plaintext password (never rendered).
      // Populated ONLY when the user explicitly requests decryption.
      var passwordMap = {};
      var groups = window.__GROUPS__ || [];

      // --- Populate the group dropdown ---
      var sel = document.getElementById("f-group");
      if (sel) {
        groups.forEach(function(g) {
          var opt = document.createElement("option");
          opt.value = g;
          opt.textContent = g;
          sel.appendChild(opt);
        });
      }

      // --- Escape HTML for safe rendering ---
      function esc(s) {
        if (s === null || s === undefined) return "";
        return String(s)
          .replace(/&/g, "\x26amp;")
          .replace(/</g, "\x26lt;")
          .replace(/>/g, "\x26gt;")
          .replace(/\x22/g, "\x26quot;")
          .replace(/'/g, "\x26#39;");
      }

      // --- Render one row ---
      function makeRow(entry) {
        var tr = document.createElement("tr");
        var urlCell = entry.url
          ? '<a href="' + esc(entry.url) + '" target="_blank" rel="noopener noreferrer">' + esc(entry.url) + "</a>"
          : "";
        tr.innerHTML =
          "<td>" + esc(entry.title) + "</td>" +
          "<td>" + esc(entry.username) + "</td>" +
          '<td class="url-cell">' + urlCell + "</td>" +
          "<td>" + esc(entry.group_cn) + "</td>" +
          "<td>" +
            '<button class="btn-decrypt" data-id="' + entry.id + '">Show</button>' +
            '<button class="btn-copy" data-id="' + entry.id + '" disabled>Copy</button>' +
            '<button class="btn-del" data-id="' + entry.id + '">Delete</button>' +
          "</td>";
        return tr;
      }

      // --- On-demand decryption ---
      async function fetchDecrypted(entryId) {
        if (passwordMap[entryId] !== undefined) return passwordMap[entryId];
        var res = await fetch("/api/passwords/" + entryId + "/decrypt");
        if (!res.ok) {
          var b = await res.json().catch(function() { return {}; });
          throw new Error(b.error || "Decrypt failed");
        }
        var data = await res.json();
        passwordMap[entryId] = data.password;
        return data.password;
      }

      // --- Bind row actions ---
      function bindRowActions(tr, entry) {
        var decryptBtn = tr.querySelector(".btn-decrypt");
        var copyBtn = tr.querySelector(".btn-copy");
        var delBtn = tr.querySelector(".btn-del");

        decryptBtn.addEventListener("click", async function() {
          decryptBtn.disabled = true;
          decryptBtn.textContent = "\u2026";
          try {
            await fetchDecrypted(entry.id);
            decryptBtn.textContent = "Shown";
            copyBtn.disabled = false;
            copyBtn.textContent = "Copy";
          } catch (e) {
            decryptBtn.textContent = "Retry";
            alert(e.message || "Failed to decrypt");
          }
        });

        copyBtn.addEventListener("click", async function() {
          var pw = passwordMap[entry.id];
          if (pw === undefined) { copyBtn.textContent = "Unavailable"; return; }
          try {
            await navigator.clipboard.writeText(pw);
            copyBtn.textContent = "Copied!";
            setTimeout(function() { copyBtn.textContent = "Copy"; }, 2000);
          } catch (e) {
            copyBtn.textContent = "Error";
          }
        });

        delBtn.addEventListener("click", async function() {
          if (!confirm("Delete this password?")) return;
          var res = await fetch("/api/passwords/" + entry.id, { method: "DELETE", headers: { "Content-Type": "application/json" } });
          if (res.ok) {
            delete passwordMap[entry.id];
            loadPasswords();
          } else {
            var b = await res.json();
            alert(b.error || "Delete failed");
          }
        });
      }

      // --- Load the password table (encrypted blobs only) ---
      async function loadPasswords() {
        var res = await fetch("/api/passwords");
        if (!res.ok) {
          document.getElementById("pw-body").innerHTML = '<tr><td colspan="5">Failed to load</td></tr>';
          return;
        }
        var data = await res.json();
        // Keep cached decryptions for entries that still exist; drop removed ones
        var ids = {};
        data.forEach(function(e) { ids[e.id] = true; });
        Object.keys(passwordMap).forEach(function(id) {
          if (!ids[id]) delete passwordMap[id];
        });

        var tbody = document.getElementById("pw-body");
        tbody.innerHTML = "";
        data.forEach(function(entry) {
          var tr = makeRow(entry);
          bindRowActions(tr, entry);
          tbody.appendChild(tr);
        });
      }

      // --- Toggle the add form ---
      var form = document.getElementById("add-form");
      var toggleBtn = document.getElementById("btn-toggle-add");
      if (form && toggleBtn) {
        form.style.display = "none";
        toggleBtn.addEventListener("click", function() {
          if (form.style.display === "none" || form.style.display === "") {
            form.style.display = "block";
            toggleBtn.textContent = "− Cancel";
          } else {
            form.style.display = "none";
            toggleBtn.textContent = "+ Add password";
          }
        });
      }

      // --- Add a new password ---
      var addBtn = document.getElementById("btn-add");
      if (addBtn) {
        addBtn.addEventListener("click", async function() {
          var title = document.getElementById("f-title").value.trim();
          var username = document.getElementById("f-username").value.trim();
          var url = document.getElementById("f-url").value.trim();
          var password = document.getElementById("f-password").value.trim();
          var group_cn = document.getElementById("f-group").value;
          if (!title || !username || !password) { alert("Title, username, and password are required"); return; }
          var res = await fetch("/api/passwords", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: title, username: username, url: url, password: password, group_cn: group_cn }),
          });
          if (res.ok) {
            document.getElementById("f-title").value = "";
            document.getElementById("f-username").value = "";
            document.getElementById("f-url").value = "";
            document.getElementById("f-password").value = "";
            loadPasswords();
          } else {
            var b = await res.json();
            alert(b.error || "Failed to add");
          }
        });
      }

      // Initial load
      loadPasswords();
    })();
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      ...securityHeaders("text/html; charset=utf-8"),
      "Cache-Control": "no-cache, no-store",
      "Content-Security-Policy":
        "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'strict-dynamic'; object-src 'none'; frame-ancestors 'none'",
    },
  });
}));

// -- API routes (session required, JSON responses) --
router.get("/api/passwords", requireSessionJson(listPasswordsJson));
router.post("/api/passwords", requireSessionJson(createPasswordJson));
router.get("/api/passwords/:id/decrypt", requireSessionJson(decryptPasswordJson));
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