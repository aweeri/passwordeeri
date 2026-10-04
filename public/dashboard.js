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

  function escapeHtml(s) {
    if (s === null || s === undefined) return "";
    return String(s)
      .replace(/&/g, "\x26amp;")
      .replace(/</g, "\x26lt;")
      .replace(/>/g, "\x26gt;")
      .replace(/"/g, "\x26quot;")
      .replace(/'/g, "\x26#39;");
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

  // --- Reusable group picker (shared by add form and inline edit) ---
  function createGroupPicker(selectEl, addBtn, chipsEl, initialGroups) {
    const state = { groups: [...new Set(initialGroups || [])] };
    function render() {
      chipsEl.innerHTML = state.groups.map(g =>
        '<span class="group-chip" title="' + escapeHtml(g) + '">' +
          '<span class="chip-label">' + escapeHtml(g) + '</span>' +
          '<button type="button" class="chip-remove" data-group="' + escapeHtml(g) + '" ' +
            'title="Remove this group from the entry." ' +
            'aria-label="Remove group ' + escapeHtml(g) + '">&times;</button>' +
        '</span>').join('');
      const remaining = groups.filter(g => !state.groups.includes(g));
      selectEl.innerHTML = remaining.map(g =>
        '<option value="' + escapeHtml(g) + '">' + escapeHtml(g) + '</option>').join('')
        || '<option value="" disabled>No groups left</option>';
      addBtn.disabled = remaining.length === 0;
      chipsEl.classList.toggle('is-empty', state.groups.length === 0);
    }
    addBtn.addEventListener('click', () => {
      const g = selectEl.value;
      if (g && !state.groups.includes(g)) { state.groups.push(g); render(); }
    });
    chipsEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.chip-remove');
      if (!btn) return;
      state.groups = state.groups.filter(g => g !== btn.dataset.group);
      render();
    });
    render();
    return { getGroups: () => [...state.groups] };
  }

  // Add-form picker, created once from the server-injected group list.
  var addSelectEl = document.getElementById("f-group-select");
  var addGroupBtn = document.getElementById("f-group-add");
  var addChipsEl = document.getElementById("f-group-chips");
  var addPicker = (addSelectEl && addGroupBtn && addChipsEl)
    ? createGroupPicker(addSelectEl, addGroupBtn, addChipsEl, [])
    : null;

  function makeRow(entry) {
    var tr = document.createElement("tr");
    tr.dataset.entryId = entry.id;
    renderRowView(tr, entry);
    return tr;
  }

  function renderRowView(tr, entry) {
    tr.classList.remove("editing");
    var urlCell = entry.url ? '<a href="' + escapeHtml(entry.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(entry.url) + '</a>' : "";
    var notesHtml = entry.notes ? '<span class="notes-text" title="' + escapeHtml(entry.notes) + '">' + escapeHtml(truncate(entry.notes, 60)) + '</span>' : '';
    var gs = entry.groups || (entry.group_cn ? [entry.group_cn] : []);
    var groupsHtml = gs.map(function (g) {
      return '<span class="group-chip group-chip-readonly" title="' + escapeHtml(g) + '">' + escapeHtml(g) + '</span>';
    }).join('');
    tr.innerHTML =
      '<td class="td-title" data-field="title">' + escapeHtml(entry.title) + '</td>' +
      '<td class="td-username" data-field="username">' + escapeHtml(entry.username) + '</td>' +
      '<td class="url-cell td-url" data-field="url">' + urlCell + '</td>' +
      '<td class="td-notes" data-field="notes">' + notesHtml + '</td>' +
      '<td class="td-groups" data-field="groups">' + groupsHtml + '</td>' +
      '<td class="actions-cell">' +
        '<button class="btn-copy" data-id="' + entry.id + '" title="Copy password"><span class="material-icons md-18">content_copy</span> Copy</button>' +
        '<button class="btn-edit" data-id="' + entry.id + '" title="Edit entry"><span class="material-icons md-18">edit</span> Edit</button>' +
      '</td>';

    bindRowActions(tr, entry);
  }

  function truncate(s, maxLen) {
    if (s.length <= maxLen) return s;
    return s.substring(0, maxLen) + '…';
  }

  function renderEditForm(tr, entry) {
    var title = tr.querySelector('.td-title')?.textContent || entry.title;
    var username = tr.querySelector('.td-username')?.textContent || entry.username;
    var urlEl = tr.querySelector('.td-url');
    var editUrl = urlEl ? (urlEl.querySelector('a')?.textContent || urlEl.textContent || entry.url || '') : (entry.url || '');
    var notesEl = tr.querySelector('.td-notes');
    var editNotes = notesEl ? (notesEl.querySelector('.notes-text')?.textContent || notesEl.textContent || entry.notes || '') : (entry.notes || '');
    var initialGroups = entry.groups || (entry.group_cn ? [entry.group_cn] : []);

    tr.classList.add("editing");
    tr.innerHTML =
      '<td><input type="text" class="edit-title" value="' + escapeHtml(title) + '" placeholder="Title" autocomplete="off"></td>' +
      '<td><input type="text" class="edit-username" value="' + escapeHtml(username) + '" placeholder="Username" autocomplete="off"></td>' +
      '<td><input type="text" class="edit-url" value="' + escapeHtml(editUrl) + '" placeholder="URL" autocomplete="off"></td>' +
      '<td class="td-notes-edit"><textarea class="edit-notes" placeholder="Brief notes&hellip;" maxlength="500" rows="2">' + escapeHtml(editNotes) + '</textarea><span class="char-count" id="edit-notes-count-' + entry.id + '">' + editNotes.length + ' / 500</span></td>' +
      '<td class="td-groups-edit" data-field="groups">' +
        '<div class="group-picker">' +
          '<div class="group-picker-row">' +
            '<select class="edit-group-select" title="Select a group to grant access, then click + to add it."></select>' +
            '<button type="button" class="btn-group-add edit-group-add" title="Add the selected group to this entry\'s access list.">+</button>' +
          '</div>' +
          '<div class="edit-group-chips group-chips" aria-live="polite"></div>' +
        '</div>' +
      '</td>' +
      '<td class="actions-cell">' +
        '<button class="btn-save" data-id="' + entry.id + '"><span class="material-icons md-18">save</span> Save</button>' +
        '<button class="btn-cancel-edit" data-id="' + entry.id + '"><span class="material-icons md-18">close</span></button>' +
        '<button class="btn-del-inline" data-id="' + entry.id + '" title="Delete this entry permanently"><span class="material-icons md-18">delete_forever</span></button>' +
      '</td>';

    var editPicker = createGroupPicker(
      tr.querySelector(".edit-group-select"),
      tr.querySelector(".edit-group-add"),
      tr.querySelector(".edit-group-chips"),
      initialGroups
    );

    var saveBtn = tr.querySelector(".btn-save");
    var cancelBtn = tr.querySelector(".btn-cancel-edit");
    var delBtn = tr.querySelector(".btn-del-inline");

    var editNotesField = tr.querySelector(".edit-notes");
    if (editNotesField) {
      editNotesField.addEventListener("input", function () {
        var countEl = document.getElementById("edit-notes-count-" + entry.id);
        if (countEl) countEl.textContent = this.value.length + " / 500";
      });
    }

    saveBtn.addEventListener("click", async function () {
      var newTitle = tr.querySelector(".edit-title").value.trim();
      var newUsername = tr.querySelector(".edit-username").value.trim();
      var newUrl = tr.querySelector(".edit-url").value.trim();
      var newNotes = tr.querySelector(".edit-notes")?.value.trim() || "";
      if (!newTitle || !newUsername) { alert("Title and username are required"); return; }
      var groupsArr = editPicker.getGroups();
      if (groupsArr.length === 0) { alert("Add at least one group before saving."); return; }

      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="material-icons md-18">sync</span>';

      var payload = { title: newTitle, username: newUsername, url: newUrl, notes: newNotes, groups: groupsArr };
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
          entry.notes = newNotes;
          entry.groups = groupsArr;
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
    var entryGroups = entry.groups || (entry.group_cn ? [entry.group_cn] : []);
    return (
      (entry.title || "").toLowerCase().indexOf(q) !== -1 ||
      (entry.username || "").toLowerCase().indexOf(q) !== -1 ||
      (entry.url || "").toLowerCase().indexOf(q) !== -1 ||
      (entry.notes || "").toLowerCase().indexOf(q) !== -1 ||
      entryGroups.some(function (g) { return g.toLowerCase().indexOf(q) !== -1; })
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
    if (!res.ok) { document.getElementById("pw-body").innerHTML = '<tr><td colspan="6">Failed to load</td></tr>'; return; }
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
    var fNotes = document.getElementById("f-notes")?.value.trim() || "";
    var password = document.getElementById("f-password").value.trim();
    if (!title || !username || !password) { alert("Title, username, and password are required"); return; }
    var groupsArr = addPicker ? addPicker.getGroups() : [];
    if (groupsArr.length === 0) { alert("Add at least one group before saving."); return; }
    var res = await fetch(url("/api/passwords"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title, username: username, url: fUrl, notes: fNotes, password: password, groups: groupsArr }),
    });
    if (res.ok) {
      document.getElementById("f-title").value = "";
      document.getElementById("f-username").value = "";
      document.getElementById("f-url").value = "";
      document.getElementById("f-notes").value = "";
      document.getElementById("f-password").value = "";
      var countEl = document.getElementById("f-notes-count");
      if (countEl) countEl.textContent = "0 / 500";
      loadPasswords();
    } else {
      var b = await res.json();
      alert(b.error || "Failed to add");
    }
  });

  // --- Character counter for add form notes ---
  var notesInput = document.getElementById("f-notes");
  var notesCount = document.getElementById("f-notes-count");
  if (notesInput && notesCount) {
    notesInput.addEventListener("input", function () {
      notesCount.textContent = this.value.length + " / 500";
    });
  }

  // Init search bar
  initSearch();

  // Initial load
  loadPasswords();
})();