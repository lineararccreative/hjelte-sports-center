/* =====================================================================
   Hjelte Sports Center — Admin Center
   Talks to the Google Apps Script backend (config.apiUrl in js/data.js).
   Roles: master (everything) · community (only their own groups).
   ===================================================================== */
(function () {
  "use strict";
  const D = window.HJELTE, API = (D.config && D.config.apiUrl) || "";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const DAYS_S = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const TOKEN_KEY = "hjelte-admin-token";
  const fmtTime = (t) => { if (!t) return ""; let [h, m] = String(t).split(":").map(Number); const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; return m ? `${h}:${String(m).padStart(2, "0")} ${ap}` : `${h} ${ap}`; };
  const money = (n) => "$" + Number(n || 0).toLocaleString("en-US");
  const sportName = (id) => { const s = D.sports.find((x) => x.id === id); return s ? s.name : id || "—"; };
  const facName = (id) => { const f = D.facilities.find((x) => x.id === id); return f ? f.name : id || "—"; };

  let token = null, me = null, data = null, tab = "overview";
  try { token = localStorage.getItem(TOKEN_KEY); } catch (e) { token = null; }

  /* ---------------- transport ---------------- */
  async function api(action, payload) {
    const r = await fetch(API, { method: "POST", body: JSON.stringify(Object.assign({ action, token }, payload || {})) });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || "Request failed");
    return j;
  }
  function toast(msg, isError) {
    const t = $("#toast"); t.textContent = msg; t.classList.toggle("is-error", !!isError); t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(() => { t.hidden = true; }, 3800);
  }

  /* ---------------- sign-in ---------------- */
  if (!API) { $("#notConfigured").hidden = false; return; }
  let pendingEmail = "";
  $("#emailForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = e.target.email.value.trim(), st = $("#emailStatus");
    if (!e.target.email.checkValidity()) { st.textContent = "Enter a valid email."; st.classList.add("is-error"); return; }
    st.classList.remove("is-error"); st.textContent = "Sending…";
    try {
      const r = await fetch(API, { method: "POST", body: JSON.stringify({ action: "requestCode", email }) }).then((x) => x.json());
      pendingEmail = email;
      st.textContent = r.message || "Check your email for the code.";
      $("#emailForm").hidden = true; $("#codeForm").hidden = false; $("#codeForm").code.focus();
    } catch (err) { st.textContent = err.message; st.classList.add("is-error"); }
  });
  $("#resend").addEventListener("click", () => { $("#codeForm").hidden = true; $("#emailForm").hidden = false; $("#emailStatus").textContent = ""; });
  $("#codeForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const st = $("#codeStatus"); st.classList.remove("is-error"); st.textContent = "Checking…";
    try {
      const r = await fetch(API, { method: "POST", body: JSON.stringify({ action: "verifyCode", email: pendingEmail, code: e.target.code.value.trim() }) }).then((x) => x.json());
      if (!r.ok) throw new Error(r.error);
      token = r.token; me = r.admin;
      try { localStorage.setItem(TOKEN_KEY, token); } catch (err) { /* private mode */ }
      start();
    } catch (err) { st.textContent = err.message; st.classList.add("is-error"); }
  });
  $("#signOut").addEventListener("click", () => {
    token = null; me = null;
    try { localStorage.removeItem(TOKEN_KEY); } catch (e) { /* ignore */ }
    location.reload();
  });

  /* ---------------- boot ---------------- */
  async function start() {
    try {
      data = await api("adminData");
      me = data.admin;
      $("#login").hidden = true; $("#app").hidden = false; $("#adminUser").hidden = false;
      $("#adminRole").textContent = me.role === "master" ? "Master admin" : "Group admin";
      $("#adminRole").classList.toggle("community", me.role !== "master");
      $("#adminEmail").textContent = me.email;
      renderTabs(); render();
    } catch (err) {
      token = null; try { localStorage.removeItem(TOKEN_KEY); } catch (e) { /* ignore */ }
      $("#login").hidden = false;
      if (!/Sign in required/.test(err.message)) { $("#emailStatus").textContent = err.message; $("#emailStatus").classList.add("is-error"); }
    }
  }
  async function refresh() { data = await api("adminData"); renderTabs(); render(); }
  const isMaster = () => me && me.role === "master";

  /* ---------------- tabs ---------------- */
  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "schedule", label: "Schedule" },
    { id: "events", label: "Events" },
    { id: "updates", label: "Updates" },
    { id: "worklog", label: "Work log" },
    { id: "groups", label: "Groups" },
    { id: "projects", label: "Projects", master: true },
    { id: "submissions", label: "Submissions", master: true, count: () => (data.submissions || []).filter((s) => s.status === "pending").length },
    { id: "admins", label: "Admins", master: true },
    { id: "subscribers", label: "Subscribers", master: true }
  ];
  function renderTabs() {
    $("#adminTabs").innerHTML = TABS.filter((t) => !t.master || isMaster()).map((t) => {
      const n = t.count ? t.count() : 0;
      return `<button data-tab="${t.id}" aria-current="${tab === t.id ? "true" : "false"}" class="${tab === t.id ? "is-active" : ""}">${t.label}${n ? `<span class="n">${n}</span>` : ""}</button>`;
    }).join("");
    $$("#adminTabs button").forEach((b) => b.addEventListener("click", () => { tab = b.dataset.tab; renderTabs(); render(); }));
  }

  /* ---------------- panel rendering ---------------- */
  const myGroups = () => data.groups || [];
  function groupOptions(sel, allowBlank) {
    return (allowBlank && isMaster() ? `<option value="">— none / facility-wide —</option>` : "") +
      myGroups().map((g) => `<option value="${g.id}"${sel === g.id ? " selected" : ""}>${esc(g.name)}</option>`).join("");
  }
  function opts(list, sel) { return list.map((o) => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}"${String(sel) === String(v) ? " selected" : ""}>${esc(l)}</option>`; }).join(""); }
  function table(cols, rows, caption) {
    if (!rows.length) return `<p class="empty">Nothing here yet.</p>`;
    const cap = caption || (TABS.find((t) => t.id === tab) || {}).label || "Data";
    return `<div class="admin-table-wrap" tabindex="0" role="region" aria-label="${esc(cap)}"><table class="admin-table"><caption class="sr-only">${esc(cap)}</caption><thead><tr>${cols.map((c) => `<th scope="col">${c}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`;
  }
  function actionBtns(editAction, delAction, id, name) {
    const n = name ? ` ${esc(String(name))}` : "";
    const i = esc(String(id == null ? "" : id));
    // Duplicate exists for every record type whose editor is "edit<Thing>".
    const dupAction = editAction.replace(/^edit/, "dup");
    const dup = ACTIONS[dupAction]
      ? `<button class="btn btn-text" data-act="${dupAction}" data-id="${i}" aria-label="Duplicate${n}">Duplicate</button>`
      : "";
    return `<td class="actions"><button class="btn btn-text" data-act="${editAction}" data-id="${i}" aria-label="Edit${n}">Edit</button>${dup}<button class="btn btn-text btn-danger" data-act="${delAction}" data-id="${i}" aria-label="Delete${n}">Delete</button></td>`;
  }
  function bindActions() {
    $$("#panel [data-act]").forEach((b) => b.addEventListener("click", () => ACTIONS[b.dataset.act](b.dataset.id)));
  }

  function render() {
    const P = $("#panel"), T = $("#panelTitle"), A = $("#panelActions");
    A.innerHTML = ""; P.innerHTML = "";
    const R = RENDER[tab]; T.textContent = TABS.find((t) => t.id === tab).label;
    R(P, A);
    bindActions();
    $$("#panelActions [data-act]").forEach((b) => b.addEventListener("click", () => ACTIONS[b.dataset.act]()));
  }

  const RENDER = {
    overview(P) {
      const w = data.worklog || [], hours = w.reduce((a, x) => a + Number(x.hours || 0), 0);
      const tiles = [
        [myGroups().length, isMaster() ? "Groups" : "Your groups"],
        [(data.schedule || []).length, "Weekly blocks"],
        [(data.events || []).length, "Dated events"],
        [hours, "Volunteer hours logged"]
      ];
      if (isMaster() && data.subscriberStats) tiles.push([data.subscriberStats.confirmed, "Confirmed subscribers"], [data.subscriberStats.quotaLeft, "Emails left today"], [(data.submissions || []).filter((s) => s.status === "pending").length, "Pending submissions"], [(data.admins || []).length, "Admins"]);
      P.innerHTML = `<p class="panel-note">Signed in as <b>${esc(me.email)}</b>${isMaster() ? " — you can edit everything on the hub." : ` — you can edit ${myGroups().map((g) => `<b>${esc(g.name)}</b>`).join(", ") || "no groups yet (ask the master admin to assign one)"}.`}</p>
        <div class="tiles">${tiles.map(([v, l]) => `<div class="tile"><strong>${v}</strong><span>${l}</span></div>`).join("")}</div>
        <p class="panel-note">Public site last updated: <b>${esc(data.lastUpdated || "—")}</b>. Every change you save here updates the public page within a minute.</p>`;
    },
    schedule(P, A) {
      A.innerHTML = `<button class="btn btn-primary btn-sm" data-act="newSchedule">+ Add weekly block</button>`;
      const rows = [...(data.schedule || [])].sort((a, b) => a.day - b.day || String(a.start).localeCompare(String(b.start))).map((r) => {
        const g = myGroups().find((x) => x.id === r.groupId);
        return `<tr><td><b>${DAYS[r.day] || "—"}</b></td><td>${fmtTime(r.start)} – ${fmtTime(r.end)}</td><td>${esc(g ? g.name : r.title || "—")}<small>${esc(sportName(r.sport))}</small></td><td>${esc(facName(r.facility))}</td><td>${esc(r.type)}</td><td><span class="pill ${r.category === "permitted" ? "ok" : ""}">${esc(r.category)}</span></td>${actionBtns("editSchedule", "delSchedule", r.id, `${DAYS[r.day] || ""} ${fmtTime(r.start)} ${g ? g.name : r.title || ""}`)}</tr>`;
      });
      P.innerHTML = `<p class="panel-note">Recurring weekly activity. These blocks fill the community schedule grid on the public page.</p>` + table(["Day", "Time", "Group", "Facility", "Type", "Category", ""], rows);
    },
    events(P, A) {
      A.innerHTML = `<button class="btn btn-primary btn-sm" data-act="newEvent">+ Add dated event</button>`;
      const rows = [...(data.events || [])].sort((a, b) => String(a.date).localeCompare(String(b.date))).map((r) => {
        const g = myGroups().find((x) => x.id === r.groupId);
        return `<tr><td><b>${esc(r.date)}</b></td><td>${fmtTime(r.start)} – ${fmtTime(r.end)}</td><td>${esc(r.title)}<small>${esc(g ? g.name : sportName(r.sport))}</small></td><td>${esc(facName(r.facility))}</td><td>${esc(r.type)}</td>${actionBtns("editEvent", "delEvent", r.id, r.title)}</tr>`;
      });
      P.innerHTML = `<p class="panel-note">One-off events: tournaments, open days, cleanups, closures. They appear under Today / This Week / Upcoming and in subscriber emails.</p>` + table(["Date", "Time", "Event", "Facility", "Type", ""], rows);
    },
    updates(P, A) {
      A.innerHTML = `<button class="btn btn-primary btn-sm" data-act="newUpdate">+ Post update</button>`;
      const rows = (data.updates || []).map((u) => `<tr><td>${esc(String(u.createdAt).slice(0, 10))}</td><td><b>${esc(u.title)}</b><small>${esc(String(u.body).slice(0, 90))}${String(u.body).length > 90 ? "…" : ""}</small></td><td>${esc(u.sport === "all" ? "All sports" : sportName(u.sport))}</td><td>${esc(u.author)}</td><td>${u.sentAt ? '<span class="pill ok">Emailed</span>' : '<span class="pill warn">Queued</span>'}</td>${actionBtns("editUpdate", "delUpdate", u.id, u.title)}</tr>`);
      P.innerHTML = `<p class="panel-note">Posts appear in Latest Updates on the public page and go out in the next daily digest to subscribers of that sport.</p>` + table(["Posted", "Update", "Sport", "Author", "Email", ""], rows);
    },
    worklog(P, A) {
      A.innerHTML = `<button class="btn btn-primary btn-sm" data-act="newWork">+ Log work</button>`;
      const rows = (data.worklog || []).map((w) => `<tr><td>${esc(w.date)}</td><td><b>${esc(w.activity)}</b><small>${esc(w.organization)}${w.area ? " · " + esc(w.area) : ""}</small></td><td>${Number(w.hours || 0)} hrs</td><td>${Number(w.volunteers || 0)}</td><td>${w.value ? money(w.value) : "—"}</td><td>${w.verified ? '<span class="pill ok">Verified</span>' : `<span class="pill warn">Pending</span>${isMaster() ? ` <button class="btn btn-text" data-act="verifyWork" data-id="${esc(String(w.id))}">Verify</button>` : ""}`}</td>${actionBtns("editWork", "delWork", w.id, `${w.date} ${w.activity}`)}</tr>`);
      P.innerHTML = `<p class="panel-note">Maintenance, cleanups and repairs your group does at the park. This feeds the Stewardship totals on the public page. ${isMaster() ? "As master admin you verify entries." : "Entries show as Pending until the master admin verifies them."}</p>` + table(["Date", "Work", "Hours", "People", "Materials", "Status", ""], rows);
    },
    groups(P, A) {
      if (isMaster()) A.innerHTML = `<button class="btn btn-primary btn-sm" data-act="newGroup">+ Add group</button>`;
      const rows = myGroups().map((g) => `<tr><td><b>${esc(g.name)}</b><small>${esc(g.programType)}</small></td><td>${esc(sportName(g.sport))}</td><td><span class="pill ${g.permitStatus === "permitted" ? "ok" : g.permitStatus === "none" ? "bad" : ""}">${esc(D.config.permitLabels[g.permitStatus] || g.permitStatus || "unknown")}</span></td><td>${g.paidPermit ? "Paid" : "—"}</td><td>${(g.days || []).map((d) => DAYS_S[d]).join(" · ")}</td><td>${esc(g.times || "")}</td>${isMaster() ? actionBtns("editGroup", "delGroup", g.id, g.name) : `<td class="actions"><button class="btn btn-text" data-act="editGroup" data-id="${esc(String(g.id))}" aria-label="Edit ${esc(g.name)}">Edit</button></td>`}</tr>`);
      P.innerHTML = `<p class="panel-note">${isMaster() ? "All listed groups. Permit status and category are master-admin only." : "Your group profile. Contact the master admin to change permit status."}</p>` + table(["Group", "Sport", "Permit", "Fee", "Days", "Times", ""], rows);
    },
    projects(P, A) {
      A.innerHTML = `<button class="btn btn-primary btn-sm" data-act="newProject">+ Add project</button>`;
      const rows = (data.projects || []).map((p) => `<tr><td><b>${esc(p.title)}</b><small>${esc(p.description).slice(0, 80)}</small></td><td>${esc(p.area || "—")}</td><td><span class="pill ${p.status === "COMPLETED" ? "ok" : "warn"}">${esc(p.status)}</span></td><td>${p.goal ? money(p.raised) + " / " + money(p.goal) : "—"}</td><td>${esc(p.lead || "")}</td>${actionBtns("editProject", "delProject", p.id, p.title)}</tr>`);
      P.innerHTML = `<p class="panel-note">Improvement projects shown on the public page, grouped by area (restrooms, facility updates, fields…).</p>` + table(["Project", "Area", "Status", "Raised / Goal", "Lead", ""], rows);
    },
    submissions(P) {
      const rows = (data.submissions || []).map((s) => `<tr><td>${esc(String(s.createdAt).slice(0, 10))}</td><td><b>${esc(s.groupName)}</b><small>${esc(s.sport)} · ${esc(s.orgType)}</small></td><td>${esc(s.contact)}<small>${esc(s.email)}</small></td><td>${esc(s.days)}<small>${esc(s.times)}</small></td><td>Permit: ${esc(s.permit)}</td><td><span class="pill ${s.status === "approved" ? "ok" : s.status === "rejected" ? "bad" : "warn"}">${esc(s.status)}</span></td><td class="actions">${s.status === "pending" ? `<button class="btn btn-text" data-act="approveSub" data-id="${esc(String(s.id))}">Approve</button><button class="btn btn-text btn-danger" data-act="rejectSub" data-id="${esc(String(s.id))}">Reject</button>` : ""}</td></tr>`);
      P.innerHTML = `<p class="panel-note">Groups that submitted themselves from the public page. Approving creates their directory listing; you can also make their contact a group admin.</p>` + table(["Received", "Group", "Contact", "When", "Permit", "Status", ""], rows);
    },
    admins(P, A) {
      A.innerHTML = `<button class="btn btn-primary btn-sm" data-act="newAdmin">+ Add admin</button>`;
      const rows = (data.admins || []).map((a) => `<tr><td><b>${esc(a.email)}</b><small>${esc(a.name || "")}</small></td><td><span class="pill ${a.role === "master" ? "ok" : ""}">${esc(a.role)}</span></td><td>${(a.groupIds || []).map((id) => { const g = (data.groups || []).find((x) => x.id === id); return esc(g ? g.name : id); }).join(", ") || (a.role === "master" ? "All groups" : "—")}</td><td>${esc(String(a.addedAt).slice(0, 10))}</td><td class="actions">${a.role === "master" ? "" : `<button class="btn btn-text" data-act="editAdmin" data-id="${esc(String(a.email))}">Edit</button><button class="btn btn-text btn-danger" data-act="delAdmin" data-id="${esc(String(a.email))}">Remove</button>`}</td></tr>`);
      P.innerHTML = `<p class="panel-note">One master admin manages the hub; community admins manage only the groups you assign them. They sign in with an emailed code, no passwords.</p>` + table(["Email", "Role", "Groups", "Added", ""], rows);
    },
    subscribers(P, A) {
      A.innerHTML = `<button class="btn btn-outline btn-sm" data-act="sendDigest">Send digest now</button>`;
      const st = data.subscriberStats || {};
      P.innerHTML = `<div class="tiles"><div class="tile"><strong>${st.total || 0}</strong><span>Total</span></div><div class="tile"><strong>${st.confirmed || 0}</strong><span>Confirmed</span></div><div class="tile"><strong>${st.quotaLeft ?? "—"}</strong><span>Emails left today</span></div></div>
        <p class="panel-note">Digests go out automatically each morning to people whose chosen sports have news. Gmail allows about 100 emails a day on a free account.</p><div id="subList"></div>`;
      api("subscribers").then((r) => {
        $("#subList").innerHTML = table(["Email", "Sports", "Status", "Joined"], r.subscribers.map((s) => `<tr><td>${esc(s.email)}</td><td>${esc((s.sports || []).join(", "))}</td><td>${s.confirmed ? '<span class="pill ok">Confirmed</span>' : '<span class="pill warn">Unconfirmed</span>'}</td><td>${esc(String(s.createdAt).slice(0, 10))}</td></tr>`));
      }).catch((e) => toast(e.message, true));
    }
  };

  /* ---------------- drawer forms ---------------- */
  const drawer = $("#drawer");
  const FOCUSABLE = 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  let onSave = null, drawerLastFocus = null;
  function trapDrawer(e) {
    if (e.key !== "Tab") return;
    const f = $$(FOCUSABLE, $(".drawer-panel", drawer)).filter((el) => !el.disabled && el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function openDrawer(title, fields, save) {
    drawerLastFocus = document.activeElement;
    $("#drawerTitle").textContent = title;
    $("#drawerForm").innerHTML = fields;
    $("#drawerStatus").textContent = "";
    onSave = save; drawer.hidden = false;
    document.addEventListener("keydown", trapDrawer);
    const first = $("#drawerForm input, #drawerForm select, #drawerForm textarea"); if (first) first.focus();
  }
  function closeDrawer() {
    drawer.hidden = true; onSave = null;
    document.removeEventListener("keydown", trapDrawer);
    if (drawerLastFocus && drawerLastFocus.isConnected) drawerLastFocus.focus();
  }
  drawer.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeDrawer(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !drawer.hidden) closeDrawer(); });
  $("#drawerSave").addEventListener("click", async () => {
    const f = $("#drawerForm"), st = $("#drawerStatus");
    const v = {}; $$("[name]", f).forEach((el) => {
      if (el.type === "checkbox") { if (el.dataset.multi) { v[el.name] = v[el.name] || []; if (el.checked) v[el.name].push(el.value); } else v[el.name] = el.checked; }
      else v[el.name] = el.value;
    });
    if (v.start && v.end && v.start >= v.end) { st.textContent = "End time must be after the start time."; st.classList.add("is-error"); return; }
    st.classList.remove("is-error"); st.textContent = "Saving…";
    try { await onSave(v); closeDrawer(); await refresh(); toast("Saved. The public page will show it shortly."); }
    catch (err) { st.textContent = err.message; st.classList.add("is-error"); }
  });
  const field = (label, name, value, type = "text", help) => `<label class="span-2"><span>${label}${help ? ` <em class="field-help">${help}</em>` : ""}</span><input name="${name}" type="${type}" value="${esc(value ?? "")}"></label>`;
  const select = (label, name, list, sel, help) => `<label class="span-2"><span>${label}${help ? ` <em class="field-help">${help}</em>` : ""}</span><select name="${name}">${opts(list, sel)}</select></label>`;
  const area = (label, name, value, help) => `<label class="span-2"><span>${label}${help ? ` <em class="field-help">${help}</em>` : ""}</span><textarea name="${name}">${esc(value ?? "")}</textarea></label>`;

  const TYPES = D.activityTypes;
  const CATS = Object.keys(D.categories).map((k) => [k, D.categories[k].label]);

  /* ---------------- actions ---------------- */
  const byId = (list, id) => (data[list] || []).find((x) => x.id === id) || {};
  /* Duplicating opens the editor on an existing record's values but saves it as
     a new one: a blank id makes the backend mint a fresh one. */
  const newId = (id, dup) => (dup ? "" : (id || ""));
  const drawerTitle = (id, dup, noun, addLabel) => (dup ? "Duplicate " + noun : id ? "Edit " + noun : addLabel);
  const ACTIONS = {
    dupSchedule: (id) => ACTIONS.editSchedule(id, true),
    dupEvent: (id) => ACTIONS.editEvent(id, true),
    dupUpdate: (id) => ACTIONS.editUpdate(id, true),
    dupWork: (id) => ACTIONS.editWork(id, true),
    dupGroup: (id) => ACTIONS.editGroup(id, true),
    dupProject: (id) => ACTIONS.editProject(id, true),
    /* schedule */
    newSchedule: () => ACTIONS.editSchedule(null),
    editSchedule: (id, dup) => {
      const r = id ? byId("schedule", id) : {};
      openDrawer(drawerTitle(id, dup, "weekly block", "Add weekly block"),
        select("Group", "groupId", myGroups().map((g) => [g.id, g.name]).concat(isMaster() ? [["", "— facility-wide / maintenance —"]] : []), r.groupId) +
        select("Day", "day", DAYS.map((d, i) => [i, d]), r.day) +
        field("Start time", "start", r.start || "17:00", "time") + field("End time", "end", r.end || "19:00", "time") +
        select("Facility", "facility", D.facilities.map((f) => [f.id, f.name]), r.facility) +
        select("Activity type", "type", TYPES, r.type || "Practice") +
        (isMaster() ? select("Category", "category", CATS, r.category) : "") +
        field("Title", "title", r.title, "text", "optional — defaults to the group name"),
        (v) => api("saveSchedule", { data: Object.assign({ id: newId(id, dup) }, v) }));
    },
    delSchedule: (id) => confirm("Delete this weekly block?") && api("deleteSchedule", { data: { id } }).then(refresh).then(() => toast("Deleted.")).catch((e) => toast(e.message, true)),
    /* events */
    newEvent: () => ACTIONS.editEvent(null),
    editEvent: (id, dup) => {
      const r = id ? byId("events", id) : {};
      openDrawer(drawerTitle(id, dup, "event", "Add dated event"),
        field("Title", "title", r.title) +
        field("Date", "date", r.date, "date") +
        field("Start time", "start", r.start || "09:00", "time") + field("End time", "end", r.end || "13:00", "time") +
        select("Group", "groupId", myGroups().map((g) => [g.id, g.name]).concat(isMaster() ? [["", "— facility-wide —"]] : []), r.groupId) +
        select("Facility", "facility", D.facilities.map((f) => [f.id, f.name]), r.facility) +
        select("Activity type", "type", TYPES, r.type || "Special Event") +
        (isMaster() ? select("Category", "category", CATS, r.category) : "") +
        area("Note", "note", r.note, "one line shown on the card and in emails"),
        (v) => api("saveEvent", { data: Object.assign({ id: newId(id, dup) }, v) }));
    },
    delEvent: (id) => confirm("Delete this event?") && api("deleteEvent", { data: { id } }).then(refresh).then(() => toast("Deleted.")).catch((e) => toast(e.message, true)),
    /* updates */
    newUpdate: () => ACTIONS.editUpdate(null),
    editUpdate: (id, dup) => {
      const u = id ? (data.updates || []).find((x) => x.id === id) || {} : {};
      openDrawer(drawerTitle(id, dup, "update", "Post an update"),
        field("Title", "title", u.title) + area("Message", "body", u.body) +
        (isMaster() ? select("Sport", "sport", [["all", "All sports"]].concat(D.sports.map((s) => [s.id, s.name])), u.sport || "all") : "") +
        select("Group", "groupId", (isMaster() ? [["", "— hub-wide —"]] : []).concat(myGroups().map((g) => [g.id, g.name])), u.groupId) +
        field("Title (Español)", "title_es", u.title_es, "text", "optional") + area("Message (Español)", "body_es", u.body_es, "optional — English shows if blank"),
        (v) => api("postUpdate", { data: Object.assign({ id: newId(id, dup) }, v) }));
    },
    delUpdate: (id) => confirm("Delete this update?") && api("deleteUpdate", { data: { id } }).then(refresh).then(() => toast("Deleted.")).catch((e) => toast(e.message, true)),
    /* work log */
    newWork: () => ACTIONS.editWork(null),
    editWork: (id, dup) => {
      const w = id ? (data.worklog || []).find((x) => x.id === id) || {} : {};
      openDrawer(drawerTitle(id, dup, "work entry", "Log work at the park"),
        field("Date", "date", w.date || new Date().toISOString().slice(0, 10), "date") +
        area("What was done", "activity", w.activity) +
        select("Group", "groupId", (isMaster() ? [["", "— community volunteers —"]] : []).concat(myGroups().map((g) => [g.id, g.name])), w.groupId) +
        (isMaster() ? field("Organization name", "organization", w.organization, "text", "used when no group is selected") : "") +
        select("Area", "area", D.config.projectAreas, w.area) +
        field("People-hours", "hours", w.hours, "number") + field("Number of volunteers", "volunteers", w.volunteers, "number") +
        field("Materials / services", "materials", w.materials) + field("Estimated value ($)", "value", w.value, "number"),
        (v) => api("addWorkLog", { data: Object.assign({ id: newId(id, dup) }, v) }));
    },
    verifyWork: (id) => api("verifyWorkLog", { data: { id, verified: true } }).then(refresh).then(() => toast("Verified.")).catch((e) => toast(e.message, true)),
    delWork: (id) => confirm("Delete this work entry?") && api("deleteWorkLog", { data: { id } }).then(refresh).then(() => toast("Deleted.")).catch((e) => toast(e.message, true)),
    /* groups */
    newGroup: () => ACTIONS.editGroup(null),
    editGroup: (id, dup) => {
      const g = id ? myGroups().find((x) => x.id === id) || {} : {};
      const dayChecks = `<fieldset class="span-2"><legend>Typical days</legend><div class="check-row">${DAYS.map((d, i) => `<label><input type="checkbox" name="days" data-multi="1" value="${i}"${(g.days || []).indexOf(i) !== -1 ? " checked" : ""}> ${DAYS_S[i]}</label>`).join("")}</div></fieldset>`;
      // A new group's id is the slug of its name, so a duplicate keeps the
      // original name it would overwrite the row it was copied from.
      const gName = dup ? (g.name ? g.name + " (copy)" : "") : g.name;
      openDrawer(drawerTitle(id, dup, "group", "Add group"),
        field("Name", "name", gName) + field("Short code", "short", g.short, "text", "2–3 letters for the logo tile") +
        select("Sport", "sport", D.sports.map((s) => [s.id, s.name]), g.sport) +
        field("Program type", "programType", g.programType) +
        select("Ages", "ages", ["Youth", "Mixed"], g.ages) + select("Level", "level", ["Recreational", "Competitive"], g.level) +
        field("People in the group", "participants", g.participants, "number", "drives the $10-per-person monthly maintenance amount") +
        dayChecks + field("Typical times", "times", g.times, "text", 'e.g. "Tue · Thu 6:00 – 8:00 PM"') +
        field("Website", "website", g.website, "url") + field("Social link", "social", g.social, "url") + field("Social handle", "socialHandle", g.socialHandle) +
        field("Contact email", "email", g.email, "email") +
        area("Description", "description", g.description) + area("Description (Español)", "description_es", g.description_es, "optional") +
        (isMaster() ? select("Permit status", "permitStatus", [["permitted", "Permitted"], ["none", "No permit on file"], ["unknown", "Permit status unknown"]], g.permitStatus) +
          `<label class="span-2 check-row"><input type="checkbox" name="paidPermit"${g.paidPermit ? " checked" : ""}> Permit fee paid</label>` +
          select("Directory section", "category", [["permitted", "Permitted organizations"], ["community", "Community & independent"]], g.category) +
          field("Badges", "badges", (g.badges || []).join("|"), "text", "separate with |") : ""),
        (v) => { v.days = (v.days || []).map(Number); if (v.badges !== undefined) v.badges = String(v.badges).split("|").filter(Boolean); return api("saveGroup", { data: Object.assign({ id: newId(id, dup) }, v) }); });
    },
    delGroup: (id) => confirm("Remove this group from the directory?") && api("deleteGroup", { data: { id } }).then(refresh).then(() => toast("Removed.")).catch((e) => toast(e.message, true)),
    /* projects */
    newProject: () => ACTIONS.editProject(null),
    editProject: (id, dup) => {
      const p = id ? (data.projects || []).find((x) => x.id === id) || {} : {};
      openDrawer(drawerTitle(id, dup, "project", "Add project"),
        field("Title", "title", p.title) + select("Area", "area", D.config.projectAreas, p.area) +
        select("Status", "status", ["PROPOSED", "PLANNING", "FUNDRAISING", "IN PROGRESS", "COMPLETED"], p.status || "PROPOSED") +
        area("Description", "description", p.description) + area("Estimated impact", "impact", p.impact) +
        field("Lead organization", "lead", p.lead) + field("Partners", "partners", (p.partners || []).join("|"), "text", "separate with |") +
        field("Funding goal ($)", "goal", p.goal, "number") + field("Amount raised ($)", "raised", p.raised, "number") +
        field("Volunteer opportunities", "volunteer", p.volunteer) + field("Target date", "targetDate", p.targetDate, "month"),
        (v) => { v.partners = String(v.partners || "").split("|").filter(Boolean); return api("saveProject", { data: Object.assign({ id: newId(id, dup) }, v) }); });
    },
    delProject: (id) => confirm("Delete this project?") && api("deleteProject", { data: { id } }).then(refresh).then(() => toast("Deleted.")).catch((e) => toast(e.message, true)),
    /* submissions */
    approveSub: (id) => {
      const s = (data.submissions || []).find((x) => x.id === id) || {};
      openDrawer("Approve group listing",
        `<p class="span-2 panel-note">${esc(s.groupName)} — ${esc(s.contact)} (${esc(s.email)})<br>${esc(s.description || "")}</p>` +
        select("Sport", "sportId", D.sports.map((x) => [x.id, x.name]), (D.sports.find((x) => x.name.toLowerCase() === String(s.sport).toLowerCase()) || {}).id) +
        `<label class="span-2 check-row"><input type="checkbox" name="makeAdmin"> Also make ${esc(s.email)} an admin for this group</label>`,
        (v) => api("approveSubmission", { data: Object.assign({ id }, v) }));
    },
    rejectSub: (id) => confirm("Reject this submission?") && api("rejectSubmission", { data: { id } }).then(refresh).then(() => toast("Rejected.")).catch((e) => toast(e.message, true)),
    /* admins */
    newAdmin: () => ACTIONS.editAdmin(null),
    editAdmin: (email) => {
      const a = email ? (data.admins || []).find((x) => x.email === email) || {} : {};
      const checks = `<fieldset class="span-2"><legend>Groups this admin can manage</legend><div class="check-row">${(data.groups || []).map((g) => `<label><input type="checkbox" name="groupIds" data-multi="1" value="${g.id}"${(a.groupIds || []).indexOf(g.id) !== -1 ? " checked" : ""}> ${esc(g.name)}</label>`).join("")}</div></fieldset>`;
      openDrawer(email ? "Edit admin" : "Add community admin",
        field("Email", "email", a.email, "email") + field("Name", "name", a.name) + checks +
        `<label class="span-2 check-row"><input type="checkbox" name="notify" checked> Email them an invitation</label>`,
        (v) => api("addAdmin", { data: { email: v.email, name: v.name, role: "community", groupIds: v.groupIds || [], notify: !!v.notify } }));
    },
    delAdmin: (email) => confirm(`Remove ${email} as an admin?`) && api("removeAdmin", { data: { email } }).then(refresh).then(() => toast("Removed.")).catch((e) => toast(e.message, true)),
    /* subscribers */
    sendDigest: () => confirm("Send the digest now to everyone with matching news?") && api("sendDigestNow").then((r) => { toast(`Sent ${r.sent}, skipped ${r.skipped}.`); return refresh(); }).catch((e) => toast(e.message, true))
  };

  /* ---------------- go ---------------- */
  if (token) start(); else $("#login").hidden = false;
})();
