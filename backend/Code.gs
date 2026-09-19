/* =====================================================================
   Hjelte Sports Center Community Hub — Google Apps Script backend
   ---------------------------------------------------------------------
   Bound to the "Hjelte Hub Data" Google Sheet. Provides:
     • public JSON for the website            GET  ?action=data
     • email subscriptions (double opt-in)     POST subscribe / GET confirm
     • "Add your group" submissions            POST submitGroup
     • admin sign-in by emailed 6-digit code   POST requestCode / verifyCode
     • admin CRUD with roles                   POST (token) saveGroup, …
     • daily digest email by sport             sendDailyDigest() (trigger)

   Roles
     master     – the one account that manages admins, permits, projects,
                  submissions and subscribers; can edit everything.
     community  – can edit only the groups listed in Admins.groupIds:
                  group profile, that group's schedule blocks and events,
                  updates for that group, work-log entries for that group.

   Deploy: Deploy → New deployment → Web app → Execute as: Me,
           Who has access: Anyone. Paste the URL into js/data.js config.apiUrl.
   ===================================================================== */

const MASTER_EMAIL = "teamla@losangelescricket.org";
const SITE_NAME = "Hjelte Sports Center Community Hub";
const SITE_URL = "https://lineararccreative.github.io/hjelte-sports-center/";
const CODE_TTL_MIN = 10;
const TOKEN_TTL_DAYS = 30;
const MAX_CODE_ATTEMPTS = 5;

const SCHEMA = {
  Groups: ["id", "name", "short", "sport", "category", "permitStatus", "paidPermit", "badges", "programType", "ages", "level", "days", "times", "website", "social", "socialHandle", "email", "description", "description_es", "logoUrl", "status", "example", "updatedAt"],
  Schedule: ["id", "groupId", "day", "start", "end", "sport", "facility", "type", "category", "title", "notes", "updatedBy", "updatedAt"],
  Events: ["id", "date", "start", "end", "title", "sport", "groupId", "facility", "type", "category", "note", "updatedBy", "updatedAt"],
  Updates: ["id", "createdAt", "author", "sport", "groupId", "title", "body", "title_es", "body_es", "sentAt"],
  Subscribers: ["email", "sports", "confirmed", "token", "createdAt", "confirmedAt", "lastSentAt"],
  Projects: ["id", "area", "title", "status", "description", "impact", "lead", "partners", "goal", "raised", "volunteer", "targetDate", "updatedAt"],
  WorkLog: ["id", "date", "organization", "groupId", "activity", "area", "hours", "volunteers", "materials", "value", "verified", "addedBy", "createdAt"],
  Admins: ["email", "role", "groupIds", "name", "addedBy", "addedAt"],
  Submissions: ["id", "createdAt", "groupName", "sport", "orgType", "contact", "email", "phone", "website", "social", "days", "times", "participants", "ages", "description", "permit", "status"],
  Auth: ["email", "code", "codeExpires", "attempts", "token", "tokenExpires"],
  Meta: ["key", "value"]
};
const LIST_FIELDS = { badges: 1, days: 1, partners: 1, sports: 1, groupIds: 1 };
const BOOL_FIELDS = { paidPermit: 1, example: 1, confirmed: 1, verified: 1 };
const NUM_FIELDS = { day: 1, goal: 1, raised: 1, hours: 1, volunteers: 1, value: 1, attempts: 1, participants: 1 };

/* ---------------------------------------------------------------- setup */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SCHEMA).forEach((name) => {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.appendRow(SCHEMA[name]);
      sh.setFrozenRows(1);
      sh.getRange(1, 1, 1, SCHEMA[name].length).setFontWeight("bold").setBackground("#E4EFE7");
    }
  });
  const first = ss.getSheets()[0];
  if (first.getName() === "Sheet1" && first.getLastRow() === 0) ss.deleteSheet(first);
  if (!rows("Admins").some((a) => a.email === MASTER_EMAIL)) {
    appendRow("Admins", { email: MASTER_EMAIL, role: "master", groupIds: [], name: "Master admin", addedBy: "setup", addedAt: nowISO() });
  }
  if (!meta("lastUpdated")) setMeta("lastUpdated", todayISO());
  ensureTrigger();
  Logger.log("Setup complete. Now run seedSampleData() (optional) and deploy as a web app.");
}
function ensureTrigger() {
  const has = ScriptApp.getProjectTriggers().some((t) => t.getHandlerFunction() === "sendDailyDigest");
  if (!has) ScriptApp.newTrigger("sendDailyDigest").timeBased().everyDays(1).atHour(7).create();
}

/* --------------------------------------------------------- sheet helpers */
function sheet(name) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh) throw new Error("Missing sheet " + name + " — run setup()");
  return sh;
}
function fromCell(key, v) {
  if (v === "" || v === null || v === undefined) return LIST_FIELDS[key] ? [] : (BOOL_FIELDS[key] ? false : "");
  if (LIST_FIELDS[key]) return String(v).split("|").filter(Boolean).map((x) => (key === "days" ? Number(x) : x));
  if (BOOL_FIELDS[key]) return v === true || String(v).toUpperCase() === "TRUE";
  if (v instanceof Date) return key === "date" ? Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd") : v.toISOString();
  return v;
}
function toCell(key, v) {
  if (v === null || v === undefined) return "";
  if (LIST_FIELDS[key]) return Array.isArray(v) ? v.join("|") : String(v);
  if (BOOL_FIELDS[key]) return !!v;
  if (NUM_FIELDS[key]) return v === "" ? "" : Number(v);
  return typeof v === "object" ? JSON.stringify(v) : String(v);
}
function rows(name) {
  const sh = sheet(name), last = sh.getLastRow();
  if (last < 2) return [];
  const head = SCHEMA[name];
  const vals = sh.getRange(2, 1, last - 1, head.length).getValues();
  return vals.filter((r) => r.some((c) => c !== "")).map((r) => {
    const o = {}; head.forEach((k, i) => (o[k] = fromCell(k, r[i]))); return o;
  });
}
function appendRow(name, obj) {
  sheet(name).appendRow(SCHEMA[name].map((k) => toCell(k, obj[k])));
}
function findRowIndex(name, keyField, value) {
  const sh = sheet(name), last = sh.getLastRow();
  if (last < 2) return -1;
  const col = SCHEMA[name].indexOf(keyField) + 1;
  const vals = sh.getRange(2, col, last - 1, 1).getValues();
  for (let i = 0; i < vals.length; i++) if (String(vals[i][0]) === String(value)) return i + 2;
  return -1;
}
function upsertRow(name, keyField, obj) {
  const i = findRowIndex(name, keyField, obj[keyField]);
  const vals = [SCHEMA[name].map((k) => toCell(k, obj[k]))];
  if (i === -1) sheet(name).appendRow(vals[0]);
  else sheet(name).getRange(i, 1, 1, SCHEMA[name].length).setValues(vals);
  return obj;
}
function deleteRowBy(name, keyField, value) {
  const i = findRowIndex(name, keyField, value);
  if (i !== -1) sheet(name).deleteRow(i);
  return i !== -1;
}
function meta(key) { const r = rows("Meta").find((m) => m.key === key); return r ? r.value : ""; }
function setMeta(key, value) { upsertRow("Meta", "key", { key, value }); }
function touch() { setMeta("lastUpdated", todayISO()); }
function nowISO() { return new Date().toISOString(); }
function todayISO() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"); }
function uid() { return Utilities.getUuid().slice(0, 8); }
function withLock(fn) {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}

/* ------------------------------------------------------------- responses */
function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function page(title, message) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
  <style>body{font-family:Inter,system-ui,sans-serif;background:#F6F5F1;color:#1C1F22;display:grid;place-items:center;min-height:100vh;margin:0}
  .card{background:#fff;border-radius:16px;padding:32px;max-width:440px;box-shadow:0 10px 30px rgba(0,0,0,.08);text-align:center}h1{font-size:1.4rem;margin:0 0 8px}p{color:#555}a{color:#2E7D4F;font-weight:600}</style></head>
  <body><div class="card"><h1>${title}</h1><p>${message}</p><p><a href="${SITE_URL}">Back to ${SITE_NAME}</a></p></div></body></html>`;
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/* ------------------------------------------------------------------ GET */
function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    switch (p.action) {
      case "data": return json(publicData());
      case "confirm": return confirmSubscriber(p.token);
      case "unsubscribe": return unsubscribe(p.token);
      case "ping": return json({ ok: true, time: nowISO() });
      default: return page(SITE_NAME + " API", "This is the data service for the community hub website.");
    }
  } catch (err) {
    return json({ ok: false, error: String(err.message || err) });
  }
}
function publicData() {
  const groups = rows("Groups").filter((g) => g.status === "approved");
  const updates = rows("Updates").sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 40);
  const worklog = rows("WorkLog").sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 200);
  return {
    ok: true,
    lastUpdated: meta("lastUpdated"),
    groups,
    schedule: rows("Schedule"),
    specialEvents: rows("Events"),
    updates,
    projects: rows("Projects"),
    worklog
  };
}

/* ----------------------------------------------------------------- POST */
function doPost(e) {
  let body = {};
  try { body = JSON.parse((e.postData && e.postData.contents) || "{}"); } catch (err) { return json({ ok: false, error: "Bad JSON" }); }
  const action = body.action;
  try {
    // public actions
    if (action === "subscribe") return json(subscribe(body));
    if (action === "submitGroup") return json(submitGroup(body.data || {}));
    if (action === "requestCode") return json(requestCode(body.email));
    if (action === "verifyCode") return json(verifyCode(body.email, body.code));
    // admin actions
    const admin = auth(body.token);
    const d = body.data || {};
    switch (action) {
      case "me": return json({ ok: true, admin: publicAdmin(admin) });
      case "adminData": return json(adminData(admin));
      case "saveGroup": return json(withLock(() => saveGroup(admin, d)));
      case "deleteGroup": return json(withLock(() => { requireMaster(admin); deleteRowBy("Groups", "id", d.id); touch(); return { ok: true }; }));
      case "saveSchedule": return json(withLock(() => saveScheduleLike("Schedule", admin, d)));
      case "deleteSchedule": return json(withLock(() => deleteScheduleLike("Schedule", admin, d.id)));
      case "saveEvent": return json(withLock(() => saveScheduleLike("Events", admin, d)));
      case "deleteEvent": return json(withLock(() => deleteScheduleLike("Events", admin, d.id)));
      case "postUpdate": return json(withLock(() => postUpdate(admin, d)));
      case "deleteUpdate": return json(withLock(() => deleteUpdate(admin, d.id)));
      case "saveProject": return json(withLock(() => { requireMaster(admin); const p = Object.assign({ id: uid() }, d, { updatedAt: nowISO() }); upsertRow("Projects", "id", p); touch(); return { ok: true, project: p }; }));
      case "deleteProject": return json(withLock(() => { requireMaster(admin); deleteRowBy("Projects", "id", d.id); touch(); return { ok: true }; }));
      case "addWorkLog": return json(withLock(() => addWorkLog(admin, d)));
      case "deleteWorkLog": return json(withLock(() => deleteWorkLog(admin, d.id)));
      case "verifyWorkLog": return json(withLock(() => { requireMaster(admin); const w = rows("WorkLog").find((x) => x.id === d.id); if (!w) throw new Error("Not found"); w.verified = !!d.verified; upsertRow("WorkLog", "id", w); return { ok: true }; }));
      case "addAdmin": return json(withLock(() => addAdmin(admin, d)));
      case "removeAdmin": return json(withLock(() => { requireMaster(admin); if (d.email === MASTER_EMAIL) throw new Error("Cannot remove the master admin"); deleteRowBy("Admins", "email", String(d.email).toLowerCase()); return { ok: true }; }));
      case "approveSubmission": return json(withLock(() => approveSubmission(admin, d)));
      case "rejectSubmission": return json(withLock(() => { requireMaster(admin); const s = rows("Submissions").find((x) => x.id === d.id); if (s) { s.status = "rejected"; upsertRow("Submissions", "id", s); } return { ok: true }; }));
      case "subscribers": requireMaster(admin); return json({ ok: true, subscribers: rows("Subscribers").map((s) => ({ email: s.email, sports: s.sports, confirmed: s.confirmed, createdAt: s.createdAt })) });
      case "sendDigestNow": requireMaster(admin); return json(sendDailyDigest(true));
      case "setLastUpdated": requireMaster(admin); setMeta("lastUpdated", d.date || todayISO()); return json({ ok: true });
      default: return json({ ok: false, error: "Unknown action" });
    }
  } catch (err) {
    return json({ ok: false, error: String(err.message || err) });
  }
}

/* ------------------------------------------------------------------ auth */
function requestCode(email) {
  email = String(email || "").trim().toLowerCase();
  const admin = rows("Admins").find((a) => String(a.email).toLowerCase() === email);
  // Always answer the same way so the endpoint doesn't reveal who is an admin.
  if (!admin) return { ok: true, message: "If that address is an admin, a sign-in code is on its way." };
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expires = new Date(Date.now() + CODE_TTL_MIN * 60000).toISOString();
  const existing = rows("Auth").find((a) => a.email === email) || { email };
  upsertRow("Auth", "email", Object.assign(existing, { code, codeExpires: expires, attempts: 0 }));
  MailApp.sendEmail({
    to: email,
    subject: `${code} is your ${SITE_NAME} sign-in code`,
    htmlBody: `<p style="font-family:Inter,system-ui,sans-serif">Your sign-in code for the <b>${SITE_NAME}</b> admin center:</p>
      <p style="font:700 32px/1 Inter,system-ui,sans-serif;letter-spacing:6px">${code}</p>
      <p style="font-family:Inter,system-ui,sans-serif;color:#555">It expires in ${CODE_TTL_MIN} minutes. If you didn't request it, you can ignore this email.</p>`
  });
  return { ok: true, message: "If that address is an admin, a sign-in code is on its way." };
}
function verifyCode(email, code) {
  email = String(email || "").trim().toLowerCase();
  const rec = rows("Auth").find((a) => a.email === email);
  if (!rec || !rec.code) throw new Error("Request a new code first.");
  if (new Date(rec.codeExpires) < new Date()) throw new Error("That code has expired. Request a new one.");
  if (Number(rec.attempts) >= MAX_CODE_ATTEMPTS) throw new Error("Too many attempts. Request a new code.");
  if (String(rec.code) !== String(code || "").trim()) {
    rec.attempts = Number(rec.attempts || 0) + 1; upsertRow("Auth", "email", rec);
    throw new Error("Incorrect code.");
  }
  const admin = rows("Admins").find((a) => String(a.email).toLowerCase() === email);
  if (!admin) throw new Error("This address is no longer an admin.");
  const token = Utilities.getUuid() + Utilities.getUuid().replace(/-/g, "");
  upsertRow("Auth", "email", Object.assign(rec, { code: "", attempts: 0, token, tokenExpires: new Date(Date.now() + TOKEN_TTL_DAYS * 86400000).toISOString() }));
  return { ok: true, token, admin: publicAdmin(admin) };
}
function auth(token) {
  if (!token) throw new Error("Sign in required");
  const rec = rows("Auth").find((a) => a.token === token);
  if (!rec || new Date(rec.tokenExpires) < new Date()) throw new Error("Session expired. Sign in again.");
  const admin = rows("Admins").find((a) => String(a.email).toLowerCase() === rec.email);
  if (!admin) throw new Error("This address is no longer an admin.");
  return admin;
}
function publicAdmin(a) { return { email: a.email, role: a.role, groupIds: a.groupIds, name: a.name }; }
function isMaster(a) { return a.role === "master"; }
function requireMaster(a) { if (!isMaster(a)) throw new Error("Master admin only"); }
function canEditGroup(a, groupId) { return isMaster(a) || (groupId && a.groupIds.indexOf(groupId) !== -1); }
function requireGroup(a, groupId) { if (!canEditGroup(a, groupId)) throw new Error("You can only edit your own group(s)"); }

/* -------------------------------------------------------- admin actions */
function adminData(admin) {
  const all = rows("Groups");
  const mine = isMaster(admin) ? all : all.filter((g) => admin.groupIds.indexOf(g.id) !== -1);
  const ids = mine.map((g) => g.id);
  const own = (r) => isMaster(admin) || ids.indexOf(r.groupId) !== -1;
  const out = {
    ok: true,
    admin: publicAdmin(admin),
    groups: mine,
    schedule: rows("Schedule").filter(own),
    events: rows("Events").filter(own),
    updates: rows("Updates").filter((u) => isMaster(admin) || own(u) || u.author === admin.email).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),
    projects: rows("Projects"),
    worklog: rows("WorkLog").filter(own).sort((a, b) => String(b.date).localeCompare(String(a.date))),
    lastUpdated: meta("lastUpdated")
  };
  if (isMaster(admin)) {
    out.submissions = rows("Submissions").sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    out.admins = rows("Admins");
    const subs = rows("Subscribers");
    out.subscriberStats = { total: subs.length, confirmed: subs.filter((s) => s.confirmed).length, quotaLeft: MailApp.getRemainingDailyQuota() };
  }
  return out;
}
const MASTER_ONLY_GROUP_FIELDS = ["category", "permitStatus", "paidPermit", "badges", "status", "example", "id"];
function saveGroup(admin, d) {
  const existing = rows("Groups").find((g) => g.id === d.id);
  if (!existing) {
    requireMaster(admin);
    const g = Object.assign({ id: d.id || slug(d.name) || uid(), status: "approved", category: "community", permitStatus: "unknown", paidPermit: false, badges: ["COMMUNITY GROUP"], days: [] }, d, { updatedAt: nowISO() });
    upsertRow("Groups", "id", g); touch(); return { ok: true, group: g };
  }
  requireGroup(admin, existing.id);
  const patch = Object.assign({}, d);
  if (!isMaster(admin)) MASTER_ONLY_GROUP_FIELDS.forEach((k) => delete patch[k]);
  const g = Object.assign(existing, patch, { id: existing.id, updatedAt: nowISO() });
  upsertRow("Groups", "id", g); touch(); return { ok: true, group: g };
}
function saveScheduleLike(sheetName, admin, d) {
  const existing = d.id ? rows(sheetName).find((x) => x.id === d.id) : null;
  if (existing) requireGroup(admin, existing.groupId);
  if (!d.groupId && !isMaster(admin)) throw new Error("Choose one of your groups");
  requireGroup(admin, d.groupId);
  const g = d.groupId ? rows("Groups").find((x) => x.id === d.groupId) : null;
  const rec = Object.assign({ id: uid() }, existing || {}, d, {
    sport: d.sport || (g ? g.sport : "community"),
    category: isMaster(admin) ? (d.category || (g ? (g.permitStatus === "permitted" ? "permitted" : "community") : "maintenance")) : (g.permitStatus === "permitted" ? "permitted" : "community"),
    updatedBy: admin.email, updatedAt: nowISO()
  });
  if (sheetName === "Schedule" && (rec.day === "" || rec.day === undefined)) throw new Error("Day is required");
  if (sheetName === "Events" && !rec.date) throw new Error("Date is required");
  if (!rec.start || !rec.end) throw new Error("Start and end times are required");
  upsertRow(sheetName, "id", rec); touch();
  return { ok: true, item: rec };
}
function deleteScheduleLike(sheetName, admin, id) {
  const existing = rows(sheetName).find((x) => x.id === id);
  if (!existing) return { ok: true };
  requireGroup(admin, existing.groupId);
  deleteRowBy(sheetName, "id", id); touch(); return { ok: true };
}
function postUpdate(admin, d) {
  if (!d.title) throw new Error("Title is required");
  let sport = d.sport || "all", groupId = d.groupId || "";
  if (!isMaster(admin)) {
    if (!groupId) throw new Error("Choose one of your groups");
    requireGroup(admin, groupId);
    const g = rows("Groups").find((x) => x.id === groupId); sport = g ? g.sport : sport;
  }
  const prev = d.id ? rows("Updates").find((x) => x.id === d.id) : null;
  const u = { id: d.id || uid(), createdAt: prev ? prev.createdAt : nowISO(), author: d.author || admin.name || admin.email, sport, groupId, title: d.title, body: d.body || "", title_es: d.title_es || "", body_es: d.body_es || "", sentAt: prev ? prev.sentAt : "" };
  upsertRow("Updates", "id", u); touch(); return { ok: true, update: u };
}
function deleteUpdate(admin, id) {
  const u = rows("Updates").find((x) => x.id === id);
  if (!u) return { ok: true };
  if (!isMaster(admin) && !canEditGroup(admin, u.groupId) && u.author !== admin.email) throw new Error("Not your update");
  deleteRowBy("Updates", "id", id); touch(); return { ok: true };
}
function addWorkLog(admin, d) {
  let groupId = d.groupId || "", organization = d.organization || "";
  if (!isMaster(admin)) {
    if (!groupId) throw new Error("Choose one of your groups");
    requireGroup(admin, groupId);
    const g = rows("Groups").find((x) => x.id === groupId); organization = g ? g.name : organization;
  }
  const w = Object.assign({ id: uid(), verified: isMaster(admin) }, d, { groupId, organization, addedBy: admin.email, createdAt: nowISO() });
  if (!w.date || !w.activity) throw new Error("Date and activity are required");
  upsertRow("WorkLog", "id", w); touch(); return { ok: true, entry: w };
}
function deleteWorkLog(admin, id) {
  const w = rows("WorkLog").find((x) => x.id === id);
  if (!w) return { ok: true };
  if (!isMaster(admin) && !canEditGroup(admin, w.groupId)) throw new Error("Not your entry");
  deleteRowBy("WorkLog", "id", id); touch(); return { ok: true };
}
function addAdmin(admin, d) {
  requireMaster(admin);
  const email = String(d.email || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Valid email required");
  const rec = { email, role: d.role === "master" ? "master" : "community", groupIds: d.groupIds || [], name: d.name || "", addedBy: admin.email, addedAt: nowISO() };
  if (email === MASTER_EMAIL) rec.role = "master";
  upsertRow("Admins", "email", rec);
  if (d.notify !== false) {
    MailApp.sendEmail({ to: email, subject: `You're an admin on the ${SITE_NAME}`,
      htmlBody: `<p style="font-family:Inter,system-ui,sans-serif">You've been added as a <b>${rec.role} admin</b> on the ${SITE_NAME}.</p>
        <p style="font-family:Inter,system-ui,sans-serif">Sign in with this email address at <a href="${SITE_URL}admin.html">${SITE_URL}admin.html</a>. A 6-digit code is emailed to you each time you sign in.</p>` });
  }
  return { ok: true, admin: rec };
}
function approveSubmission(admin, d) {
  requireMaster(admin);
  const s = rows("Submissions").find((x) => x.id === d.id);
  if (!s) throw new Error("Submission not found");
  const sportId = d.sportId || slug(s.sport);
  const permitted = String(s.permit).toLowerCase() === "yes";
  const g = {
    id: d.groupId || slug(s.groupName) || uid(), name: s.groupName, short: initials(s.groupName), sport: sportId,
    category: permitted ? "permitted" : "community", permitStatus: permitted ? "permitted" : (String(s.permit).toLowerCase() === "no" ? "none" : "unknown"), paidPermit: permitted,
    badges: permitted ? ["PERMITTED ORGANIZATION"] : ["COMMUNITY GROUP"], programType: s.orgType, ages: s.ages || "Mixed", level: "Recreational",
    days: parseDays(s.days), times: s.times, website: s.website, social: s.social, socialHandle: "", email: s.email,
    description: s.description, description_es: "", logoUrl: "", status: "approved", example: false, updatedAt: nowISO()
  };
  upsertRow("Groups", "id", g);
  s.status = "approved"; upsertRow("Submissions", "id", s);
  if (d.makeAdmin && s.email) addAdmin(admin, { email: s.email, role: "community", groupIds: [g.id], name: s.contact });
  touch(); return { ok: true, group: g };
}

/* ---------------------------------------------------- public: submissions */
function submitGroup(f) {
  if (!f.groupName || !f.email) throw new Error("Group name and email are required");
  const s = Object.assign({ id: uid(), createdAt: nowISO(), status: "pending" }, f);
  Object.keys(s).forEach((k) => { if (SCHEMA.Submissions.indexOf(k) === -1) delete s[k]; });
  appendRow("Submissions", s);
  MailApp.sendEmail({ to: MASTER_EMAIL, subject: `[Hjelte Hub] New group submission: ${f.groupName}`,
    htmlBody: `<p style="font-family:Inter,system-ui,sans-serif">A new group asked to be listed. Review it in the admin center → Submissions.</p><pre>${escapeHtml(JSON.stringify(s, null, 2))}</pre>` });
  return { ok: true };
}

/* ------------------------------------------------------- subscriptions */
function subscribe(b) {
  const email = String(b.email || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Valid email required");
  let sports = Array.isArray(b.sports) ? b.sports.filter(Boolean) : [];
  if (!sports.length || sports.indexOf("all") !== -1) sports = ["all"];
  const existing = rows("Subscribers").find((s) => s.email === email);
  const rec = Object.assign({ email, createdAt: nowISO(), confirmed: false, token: Utilities.getUuid() }, existing || {}, { sports });
  upsertRow("Subscribers", "email", rec);
  if (!rec.confirmed) {
    const url = ScriptApp.getService().getUrl() + "?action=confirm&token=" + rec.token;
    MailApp.sendEmail({ to: email, subject: `Confirm your ${SITE_NAME} updates`,
      htmlBody: `<p style="font-family:Inter,system-ui,sans-serif">Tap to confirm you'd like updates for <b>${sports.join(", ")}</b> at Hjelte Sports Center:</p>
        <p><a href="${url}" style="font-family:Inter,system-ui,sans-serif;background:#2E7D4F;color:#fff;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:600">Confirm subscription</a></p>
        <p style="font-family:Inter,system-ui,sans-serif;color:#555">If you didn't sign up, ignore this email.</p>` });
    return { ok: true, message: "Check your inbox to confirm your subscription." };
  }
  return { ok: true, message: "Your sports preferences were updated." };
}
function confirmSubscriber(token) {
  const s = rows("Subscribers").find((x) => x.token === token);
  if (!s) return page("Link not found", "This confirmation link is no longer valid. You can subscribe again on the website.");
  s.confirmed = true; s.confirmedAt = nowISO(); upsertRow("Subscribers", "email", s);
  return page("You're subscribed", `You'll receive ${SITE_NAME} updates for: ${s.sports.join(", ")}. Each email includes an unsubscribe link.`);
}
function unsubscribe(token) {
  const s = rows("Subscribers").find((x) => x.token === token);
  if (s) deleteRowBy("Subscribers", "email", s.email);
  return page("Unsubscribed", "You won't receive further update emails from the community hub.");
}

/* --------------------------------------------------------------- digest */
function sendDailyDigest(force) {
  const since = new Date(Date.now() - 26 * 3600000); // slight overlap so nothing is missed
  const updates = rows("Updates").filter((u) => new Date(u.createdAt) > since);
  const today = todayISO(), weekOut = Utilities.formatDate(new Date(Date.now() + 7 * 86400000), Session.getScriptTimeZone(), "yyyy-MM-dd");
  const events = rows("Events").filter((e) => e.date >= today && e.date <= weekOut);
  const groups = rows("Groups");
  const subs = rows("Subscribers").filter((s) => s.confirmed);
  const base = ScriptApp.getService().getUrl();
  let sent = 0, skipped = 0;
  for (const s of subs) {
    if (MailApp.getRemainingDailyQuota() < 5) break;
    const wants = (sport) => s.sports.indexOf("all") !== -1 || sport === "all" || s.sports.indexOf(sport) !== -1;
    const myUpdates = updates.filter((u) => wants(u.sport));
    const myEvents = events.filter((e) => wants(e.sport));
    if (!myUpdates.length && !myEvents.length) { skipped++; continue; }
    const li = (h) => `<li style="margin:0 0 10px">${h}</li>`;
    const gname = (id) => { const g = groups.find((x) => x.id === id); return g ? g.name : ""; };
    const html = `<div style="font-family:Inter,system-ui,sans-serif;color:#1C1F22;max-width:600px">
      <p style="color:#2E7D4F;font-weight:700;letter-spacing:.1em;font-size:12px;margin:0">HJELTE SPORTS CENTER</p>
      <h2 style="margin:4px 0 16px">Your ${s.sports.indexOf("all") !== -1 ? "" : s.sports.join(" · ") + " "}update</h2>
      ${myUpdates.length ? `<h3 style="font-size:15px;margin:16px 0 8px">Latest updates</h3><ul style="padding-left:18px">${myUpdates.map((u) => li(`<b>${escapeHtml(u.title)}</b> <span style="color:#6B7076">· ${escapeHtml(u.author)}</span><br>${escapeHtml(u.body)}`)).join("")}</ul>` : ""}
      ${myEvents.length ? `<h3 style="font-size:15px;margin:16px 0 8px">Coming up this week</h3><ul style="padding-left:18px">${myEvents.map((e) => li(`<b>${escapeHtml(e.title)}</b> · ${e.date} ${e.start}–${e.end}${e.groupId ? " · " + escapeHtml(gname(e.groupId)) : ""}${e.note ? "<br>" + escapeHtml(e.note) : ""}`)).join("")}</ul>` : ""}
      <p style="margin-top:20px"><a href="${SITE_URL}#schedule" style="background:#1C1F22;color:#fff;padding:10px 16px;border-radius:999px;text-decoration:none;font-weight:600">See the full schedule</a></p>
      <p style="color:#8A8F95;font-size:12px;margin-top:24px">Schedules are a community information resource and may change. Official permits and City of Los Angeles Department of Recreation and Parks requirements govern facility use.<br>
      <a href="${base}?action=unsubscribe&token=${s.token}" style="color:#8A8F95">Unsubscribe</a></p></div>`;
    MailApp.sendEmail({ to: s.email, subject: `Hjelte update · ${myUpdates[0] ? myUpdates[0].title : myEvents[0].title}`, htmlBody: html });
    s.lastSentAt = nowISO(); upsertRow("Subscribers", "email", s); sent++;
  }
  updates.forEach((u) => { if (!u.sentAt) { u.sentAt = nowISO(); upsertRow("Updates", "id", u); } });
  return { ok: true, sent, skipped, quotaLeft: MailApp.getRemainingDailyQuota() };
}

/* ---------------------------------------------------------------- utils */
function slug(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function initials(s) { return String(s || "").split(/\s+/).map((w) => w[0]).join("").slice(0, 3).toUpperCase(); }
function parseDays(s) {
  const map = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
  return String(s || "").toLowerCase().split(/[^a-z]+/).map((w) => map[w.slice(0, 3)]).filter((d) => d !== undefined);
}
function escapeHtml(s) { return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
