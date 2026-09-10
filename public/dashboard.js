// passwordeeri — dashboard script
// Security: decrypted passwords are held ONLY in an in-memory Map keyed by
// entry id. They are fetched on demand (per entry) from the server and are
// NEVER written into the DOM (no data-pw attributes), so devtools,
// extensions, and XSS cannot read them from the page.

(function () {
  // Groups injected server-side as JSON via window.__GROUPS__
  const groups = window.__GROUPS__ || [];

  // Base path injected server-side (empty string when app runs at root).
  const BASE = window.__BASE__ || "";

  function url(path) {
    return BASE + path;
  }

  // passwordMap: id -> plaintext password (never rendered).
  // Populated ONLY when the user explicitly requests decryption of an entry.
  const passwordMap = new Map();

  // --- Populate the group dropdown ---
  const sel = document.getElementById("f-group");
  if (sel) {
    groups.forEach((g, i) => {
      const opt = document.createElement("option");
      opt.value = g;
      opt.textContent = g;
      if (i === 0) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  function escapeHtml(s) {
    if (s === null || s === undefined) return "";
    return String(s)
      .replace(/&/g, "\x26amp;")
      .replace(/</g, "\x26lt;")
      .replace(/>/g, "\x26gt;")
      .replace(/"/g, "\x26quot;")
      .replace(/'/g, "\x26#39;");
  }

  // Client-side URL safety check (defence-in-depth; server also sanitizes).
  function isSafeUrl(url) {
    if (!url) return true;
    const u = url.trim().toLowerCase();
    return u.startsWith("http://") || u.startsWith("https://");
  }

  async function fetchDecrypted(entryId) {
    if (passwordMap.has(entryId)) return passwordMap.get(entryId);
    const res = await fetch(url("/api/passwords/" + entryId + "/decrypt"));
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      throw new Error(b.error || "Decrypt failed");
    }
    const data = await res.json();
    passwordMap.set(entryId, data.password);
    return data.password;
  }

  // --- Build the group select options HTML for edit mode ---
  function groupOptionsHtml(selected) {
    return groups.map(function (g) {
      var selAttr = g === selected ? ' selected' : '';
      return '<option value="' + escapeHtml(g) + '"' + selAttr + '>' + escapeHtml(g) + '</option>';
    }).join('');
  }

  function makeRow(entry) {
    var tr = document.createElement("tr");
    tr.dataset.entryId = entry.id;
    renderRowView(tr, entry);
    return tr;
  }

  function renderRowView(tr, entry) {
    var urlCell;
    if (entry.url && isSafeUrl(entry.url)) {
      urlCell = '<a href="' + escapeHtml(entry.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(entry.url) + '</a>';
    } else if (entry.url) {
      urlCell = '<span class="unsafe-url">' + escapeHtml(entry.url) + '</span>';
    } else {
      urlCell = "";
    }
    tr.innerHTML =
      '<td class="td-title" data-field="title">' + escapeHtml(entry.title) + '</td>' +
      '<td class="td-username" data-field="username">' + escapeHtml(entry.username) + '</td>' +
      '<td class="url-cell td-url" data-field="url">' + urlCell + '</td>' +
      '<td class="td-group" data-field="group_cn">' + escapeHtml(entry.group_cn) + '</td>' +
      '<td class="actions-cell">' +
        '<button class="btn-copy" data-id="' + entry.id + '" title="Copy password"><span class="material-icons md-18">content_copy</span> Copy</button>' +
        '<button class="btn-edit" data-id="' + entry.id + '" title="Edit entry"><span class="material-icons md-18">edit</span> Edit</button>' +
      '</td>';

    // Bind actions on the view row
    bindRowActions(tr, entry);
  }

  function renderEditForm(tr, entry) {
    var title = tr.querySelector('.td-title')?.textContent || entry.title;
    var username = tr.querySelector('.td-username')?.textContent || entry.username;
    var urlEl = tr.querySelector('.td-url');
    var editUrl = urlEl ? (urlEl.querySelector('a')?.textContent || urlEl.textContent || entry.url || '') : (entry.url || '');
    var groupEl = tr.querySelector('.td-group');
    var group_cn = groupEl?.textContent || entry.group_cn;

    tr.innerHTML =
      '<td><input type="text" class="edit-title" value="' + escapeHtml(title) + '" placeholder="Title" autocomplete="off"></td>' +
      '<td><input type="text" class="edit-username" value="' + escapeHtml(username) + '" placeholder="Username" autocomplete="off"></td>' +
      '<td><input type="text" class="edit-url" value="' + escapeHtml(editUrl) + '" placeholder="URL" autocomplete="off"></td>' +
      '<td><select class="edit-group">' + groupOptionsHtml(group_cn) + '</select></td>' +
      '<td class="actions-cell">' +
        '<button class="btn-save" data-id="' + entry.id + '"><span class="material-icons md-18">save</span> Save</button>' +
        '<button class="btn-cancel-edit" data-id="' + entry.id + '"><span class="material-icons md-18">close</span></button>' +
        '<button class="btn-del-inline" data-id="' + entry.id + '" title="Delete this entry permanently"><span class="material-icons md-18">delete_forever</span></button>' +
      '</td>';

    // Bind edit mode actions
    var saveBtn = tr.querySelector(".btn-save");
    var cancelBtn = tr.querySelector(".btn-cancel-edit");
    var delBtn = tr.querySelector(".btn-del-inline");

    saveBtn.addEventListener("click", async function () {
      var newTitle = tr.querySelector(".edit-title").value.trim();
      var newUsername = tr.querySelector(".edit-username").value.trim();
      var newUrl = tr.querySelector(".edit-url").value.trim();
      var newGroup = tr.querySelector(".edit-group").value;
      if (!newTitle || !newUsername) { alert("Title and username are required"); return; }

      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="material-icons md-18">sync</span>';

      var payload = { title: newTitle, username: newUsername, url: newUrl, group_cn: newGroup };
      try {
        var res = await fetch(url("/api/passwords/" + entry.id), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          entry.title = newTitle;
          entry.username = newUsername;
          entry.url = newUrl;
          entry.group_cn = newGroup;
          renderRowView(tr, entry);
        } else {
          var b = await res.json().catch(function () { return {}; });
          alert(b.error || ("Update failed (" + res.status + ")"));
          saveBtn.disabled = false;
          saveBtn.innerHTML = '<span class="material-icons md-18">save</span> Save';
        }
      } catch (e) {
        alert("Network error");
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<span class="material-icons md-18">save</span> Save';
      }
    });

    cancelBtn.addEventListener("click", function () {
      renderRowView(tr, entry);
    });

    delBtn.addEventListener("click", async function () {
      if (!confirm('Permanently delete "' + entry.title + '"? This cannot be undone.')) return;
      var res = await fetch(url("/api/passwords/" + entry.id), { method: "DELETE", headers: { "Content-Type": "application/json" } });
      if (res.ok) {
        passwordMap.delete(entry.id);
        loadPasswords();
      } else {
        var b = await res.json();
        alert(b.error || "Delete failed");
      }
    });
  }

  function bindRowActions(tr, entry) {
    var copyBtn = tr.querySelector(".btn-copy");
    var editBtn = tr.querySelector(".btn-edit");

    // Copy — fetch the encrypted entry and copy the decrypted password
    copyBtn.addEventListener("click", async function () {
      copyBtn.disabled = true;
      copyBtn.innerHTML = '<span class="material-icons md-18">sync</span>';
      try {
        var pw = await fetchDecrypted(entry.id);
        await navigator.clipboard.writeText(pw);
        copyBtn.innerHTML = '<span class="material-icons md-18">check_circle</span> Copied!';
        setTimeout(function () {
          copyBtn.disabled = false;
          copyBtn.innerHTML = '<span class="material-icons md-18">content_copy</span> Copy';
        }, 2000);
      } catch (e) {
        copyBtn.disabled = false;
        copyBtn.innerHTML = '<span class="material-icons md-18">error_outline</span> Error';
        setTimeout(function () { copyBtn.innerHTML = '<span class="material-icons md-18">content_copy</span> Copy'; }, 2000);
      }
    });

    // Edit — switch row to inline edit form
    editBtn.addEventListener("click", function () {
      renderEditForm(tr, entry);
    });
  }

  // --- Search state ---
  var searchQuery = "";
  var allEntries = [];

  function matchesSearch(entry) {
    if (!searchQuery) return true;
    var q = searchQuery.toLowerCase();
    return (
      (entry.title || "").toLowerCase().indexOf(q) !== -1 ||
      (entry.username || "").toLowerCase().indexOf(q) !== -1 ||
      (entry.url || "").toLowerCase().indexOf(q) !== -1
    );
  }

  function renderTable() {
    var tbody = document.getElementById("pw-body");
    var emptyState = document.getElementById("empty-state");
    var noResults = document.getElementById("no-results");
    var filtered = allEntries.filter(matchesSearch);

    tbody.innerHTML = "";

    // Handle empty/not-found states
    if (allEntries.length === 0) {
      if (emptyState) emptyState.style.display = "block";
      if (noResults) noResults.style.display = "none";
      return;
    }
    if (filtered.length === 0) {
      if (emptyState) emptyState.style.display = "none";
      if (noResults) noResults.style.display = "block";
      return;
    }
    if (emptyState) emptyState.style.display = "none";
    if (noResults) noResults.style.display = "none";

    for (var i = 0; i < filtered.length; i++) {
      var tr = makeRow(filtered[i]);
      tbody.appendChild(tr);
    }
  }

  function onSearchInput() {
    searchQuery = document.getElementById("search-bar").value;
    var clearBtn = document.getElementById("btn-clear-search");
    if (clearBtn) clearBtn.style.display = searchQuery ? "inline-flex" : "none";
    renderTable();
  }

  function clearSearch() {
    searchQuery = "";
    var searchEl = document.getElementById("search-bar");
    if (searchEl) searchEl.value = "";
    var clearBtn = document.getElementById("btn-clear-search");
    if (clearBtn) clearBtn.style.display = "none";
    renderTable();
  }

  function initSearch() {
    var searchEl = document.getElementById("search-bar");
    if (!searchEl) return;
    searchEl.addEventListener("input", onSearchInput);
    var clearBtn = document.getElementById("btn-clear-search");
    if (clearBtn) clearBtn.addEventListener("click", clearSearch);
    var clearLink = document.getElementById("clear-search-link");
    if (clearLink) clearLink.addEventListener("click", function (e) { e.preventDefault(); clearSearch(); });
  }

  async function loadPasswords() {
    var res = await fetch(url("/api/passwords"));
    if (!res.ok) { document.getElementById("pw-body").innerHTML = '<tr><td colspan="5">Failed to load</td></tr>'; return; }
    var data = await res.json();
    var ids = new Set(data.map(function (e) { return e.id; }));
    for (var id of [...passwordMap.keys()]) {
      if (!ids.has(id)) passwordMap.delete(id);
    }
    allEntries = data;
    renderTable();
  }

  // --- Toggle the add form ---
  var toggleBtn = document.getElementById("btn-toggle-add");
  var addForm = document.getElementById("add-form");
  if (toggleBtn && addForm) {
    addForm.style.display = "none";
    toggleBtn.innerHTML = '<span class="material-icons md-18">add</span> Add password';
    toggleBtn.addEventListener("click", function () {
      if (addForm.style.display === "none" || addForm.style.display === "") {
        addForm.style.display = "block";
        toggleBtn.innerHTML = '<span class="material-icons md-18">close</span> Cancel';
      } else {
        addForm.style.display = "none";
        toggleBtn.innerHTML = '<span class="material-icons md-18">add</span> Add password';
      }
    });
  }

  // --- Add a new password ---
  var addBtn = document.getElementById("btn-add");
  addBtn.innerHTML = '<span class="material-icons md-18">add_circle_outline</span> Add';
  addBtn.addEventListener("click", async function () {
    var title = document.getElementById("f-title").value.trim();
    var username = document.getElementById("f-username").value.trim();
    var fUrl = document.getElementById("f-url").value.trim();
    var password = document.getElementById("f-password").value.trim();
    var group_cn = document.getElementById("f-group").value;
    if (!title || !username || !password) { alert("Title, username, and password are required"); return; }
    var res = await fetch(url("/api/passwords"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title, username: username, url: fUrl, password: password, group_cn: group_cn }),
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

  // Init search bar
  initSearch();

  // Initial load
  loadPasswords();
})();