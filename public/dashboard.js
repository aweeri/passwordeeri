// passwordeeri — dashboard script
// Security: decrypted passwords are held ONLY in an in-memory Map keyed by
// entry id. They are fetched on demand (per entry) from the server and are
// NEVER written into the DOM (no data-pw attributes), so devtools,
// extensions, and XSS cannot read them from the page.

(function () {
  // Groups injected server-side as JSON
  const groups = window.__GROUPS__ || [];

  // passwordMap: id -> plaintext password (never rendered).
  // Populated ONLY when the user explicitly requests decryption of an entry.
  const passwordMap = new Map();

  const sel = document.getElementById("f-group");
  groups.forEach((g) => {
    const opt = document.createElement("option");
    opt.value = g;
    opt.textContent = g;
    sel.appendChild(opt);
  });

  function escapeHtml(s) {
    if (s === null || s === undefined) return "";
    return String(s)
      .replace(/&/g, "&")
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/"/g, """)
      .replace(/'/g, "'");
  }

  // Client-side URL safety check (defence-in-depth; server also sanitizes).
  // Only http:// and https:// schemes are allowed for clickable links.
  function isSafeUrl(url) {
    if (!url) return true;
    const u = url.trim().toLowerCase();
    return u.startsWith("http://") || u.startsWith("https://");
  }

  function makeRow(entry) {
    const tr = document.createElement("tr");
    let urlCell;
    if (entry.url && isSafeUrl(entry.url)) {
      urlCell = `<a href="${escapeHtml(entry.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(entry.url)}</a>`;
    } else if (entry.url) {
      // Unsafe scheme — render as plain text only, not a clickable link
      urlCell = `<span class="unsafe-url">${escapeHtml(entry.url)}</span>`;
    } else {
      urlCell = "";
    }
    tr.innerHTML =
      "<td>" + escapeHtml(entry.title) + "</td>" +
      "<td>" + escapeHtml(entry.username) + "</td>" +
      "<td class=\"url-cell\">" + urlCell + "</td>" +
      "<td>" + escapeHtml(entry.group_cn) + "</td>" +
      "<td>" +
        "<button class=\"btn-decrypt\" data-id=\"" + entry.id + "\">Show</button>" +
        "<button class=\"btn-copy\" data-id=\"" + entry.id + "\" disabled>Copy</button>" +
        "<button class=\"btn-del\" data-id=\"" + entry.id + "\">Delete</button>" +
      "</td>";
    return tr;
  }

  async function fetchDecrypted(entryId) {
    // On-demand decryption: request this single entry's plaintext from the
    // server, then cache it in the in-memory Map for this session.
    if (passwordMap.has(entryId)) return passwordMap.get(entryId);

    const res = await fetch("/api/passwords/" + entryId + "/decrypt");
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      throw new Error(b.error || "Decrypt failed");
    }
    const data = await res.json();
    passwordMap.set(entryId, data.password);
    return data.password;
  }

  function bindRowActions(tr, entry) {
    const decryptBtn = tr.querySelector(".btn-decrypt");
    const copyBtn = tr.querySelector(".btn-copy");
    const delBtn = tr.querySelector(".btn-del");

    // "Show" / "Decrypt" — the only action that pulls the plaintext
    decryptBtn.addEventListener("click", async () => {
      decryptBtn.disabled = true;
      decryptBtn.textContent = "…";
      try {
        await fetchDecrypted(entry.id);
        decryptBtn.textContent = "Shown";
        // Reveal the copy button now that the plaintext is cached
        copyBtn.disabled = false;
        copyBtn.textContent = "Copy";
      } catch (e) {
        decryptBtn.textContent = "Retry";
        alert(e.message || "Failed to decrypt");
      }
    });

    copyBtn.addEventListener("click", async () => {
      // Look up the password from the in-memory map, NOT from the DOM
      const pw = passwordMap.get(entry.id);
      if (pw === undefined) { copyBtn.textContent = "Unavailable"; return; }
      try {
        await navigator.clipboard.writeText(pw);
        copyBtn.textContent = "Copied!";
        setTimeout(() => { copyBtn.textContent = "Copy"; }, 2000);
      } catch {
        copyBtn.textContent = "Error";
      }
    });

    delBtn.addEventListener("click", async () => {
      if (!confirm("Delete this password?")) return;
      const res = await fetch("/api/passwords/" + entry.id, { method: "DELETE", headers: { "Content-Type": "application/json" } });
      if (res.ok) {
        passwordMap.delete(entry.id);
        loadPasswords();
      } else {
        const b = await res.json();
        alert(b.error || "Delete failed");
      }
    });
  }

  async function loadPasswords() {
    // Fetch metadata + encrypted blobs ONLY. No plaintext is transferred.
    const res = await fetch("/api/passwords");
    if (!res.ok) { document.getElementById("pw-body").innerHTML = "<tr><td colspan=\"5\">Failed to load</td></tr>"; return; }
    const data = await res.json();
    // Keep cached decryptions for entries that still exist; drop removed ones
    const ids = new Set(data.map((e) => e.id));
    for (const id of [...passwordMap.keys()]) {
      if (!ids.has(id)) passwordMap.delete(id);
    }

    const tbody = document.getElementById("pw-body");
    tbody.innerHTML = "";
    for (const entry of data) {
      const tr = makeRow(entry);
      bindRowActions(tr, entry);
      tbody.appendChild(tr);
    }
  }

  document.getElementById("btn-add").addEventListener("click", async () => {
    const title = document.getElementById("f-title").value.trim();
    const username = document.getElementById("f-username").value.trim();
    const url = document.getElementById("f-url").value.trim();
    const password = document.getElementById("f-password").value.trim();
    const group_cn = document.getElementById("f-group").value;
    if (!title || !username || !password) { alert("Title, username, and password are required"); return; }
    const res = await fetch("/api/passwords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, username, url, password, group_cn }),
    });
    if (res.ok) {
      document.getElementById("f-title").value = "";
      document.getElementById("f-username").value = "";
      document.getElementById("f-url").value = "";
      document.getElementById("f-password").value = "";
      loadPasswords();
    } else {
      const b = await res.json();
      alert(b.error || "Failed to add");
    }
  });

  loadPasswords();
})();