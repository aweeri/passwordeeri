// passwordeeri — dashboard script
// Security: decrypted passwords are held ONLY in an in-memory Map keyed by
// entry id. They are NEVER written into the DOM (no data-pw attributes), so
// devtools, extensions, and XSS cannot read them from the page.

(function () {
  // Groups injected server-side as JSON
  const groups = window.__GROUPS__ || [];

  // passwordMap: id -> plaintext password (never rendered)
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

  function makeRow(entry) {
    const tr = document.createElement("tr");
    const urlCell = entry.url
      ? `<a href="${escapeHtml(entry.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(entry.url)}</a>`
      : "";
    tr.innerHTML =
      "<td>" + escapeHtml(entry.title) + "</td>" +
      "<td>" + escapeHtml(entry.username) + "</td>" +
      "<td class=\"url-cell\">" + urlCell + "</td>" +
      "<td>" + escapeHtml(entry.group_cn) + "</td>" +
      "<td>" +
        "<button class=\"btn-copy\" data-id=\"" + entry.id + "\">Copy</button>" +
        "<button class=\"btn-del\" data-id=\"" + entry.id + "\">Delete</button>" +
      "</td>";
    return tr;
  }

  function bindRowActions(tr, entry) {
    const copyBtn = tr.querySelector(".btn-copy");
    const delBtn = tr.querySelector(".btn-del");

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
        loadPasswords();
      } else {
        const b = await res.json();
        alert(b.error || "Delete failed");
      }
    });
  }

  async function loadPasswords() {
    const res = await fetch("/api/passwords");
    if (!res.ok) { document.getElementById("pw-body").innerHTML = "<tr><td colspan=\"5\">Failed to load</td></tr>"; return; }
    const data = await res.json();
    passwordMap.clear();

    const tbody = document.getElementById("pw-body");
    tbody.innerHTML = "";
    for (const entry of data) {
      passwordMap.set(entry.id, entry.password);
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