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
const SITE_URL = "https://hjeltesportscenter.com/";
const CODE_TTL_MIN = 10;
const TOKEN_TTL_DAYS = 30;
const MAX_CODE_ATTEMPTS = 5;

/* ------------------------------------------------------------------ Stripe
   The secret key is NEVER in this file, the repo, or any page the browser
   sees. Put it in Project Settings → Script properties:
     STRIPE_SECRET_KEY     a RESTRICTED key, "Checkout Sessions: write" only
     STRIPE_PRICE_MONTHLY  the recurring per-person price ($10.50 / month)
   The monthly rate lives on that Stripe price, so billing has exactly one
   source of truth. js/data.js only mirrors it for display. */
const STRIPE_CHECKOUT_URL = "https://api.stripe.com/v1/checkout/sessions";
const ONETIME_MIN_CENTS = 500;     // $5
const ONETIME_MAX_CENTS = 500000;  // $5,000 — above this, talk to a person
const MAX_HEADCOUNT = 300;         // a slipped digit must not bill $21,000/mo

const SCHEMA = {
  Groups: ["id", "name", "short", "sport", "category", "permitStatus", "paidPermit", "badges", "programType", "ages", "level", "participants", "days", "times", "website", "social", "socialHandle", "email", "description", "description_es", "logoUrl", "status", "example", "updatedAt"],
  Schedule: ["id", "groupId", "day", "start", "end", "sport", "facility", "type", "category", "title", "notes", "updatedBy", "updatedAt"],
  Events: ["id", "date", "start", "end", "title", "sport", "groupId", "facility", "type", "category", "note", "updatedBy", "updatedAt"],
  Updates: ["id", "createdAt", "author", "sport", "groupId", "title", "body", "title_es", "body_es", "sentAt"],
  Subscribers: ["email", "sports", "confirmed", "token", "createdAt", "confirmedAt", "lastSentAt"],
  Projects: ["id", "area", "title", "status", "description", "impact", "lead", "partners", "goal", "raised", "volunteer", "targetDate", "updatedAt"],
  WorkLog: ["id", "date", "organization", "groupId", "activity", "area", "hours", "volunteers", "materials", "value", "verified", "addedBy", "createdAt"],
  Admins: ["email", "role", "groupIds", "name", "addedBy", "addedAt"],
  Submissions: ["id", "createdAt", "groupName", "sport", "orgType", "contact", "email", "phone", "website", "social", "days", "times", "participants", "ages", "description", "permit", "status"],
  Members: ["id", "createdAt", "name", "email", "phone", "memberType", "groupName", "orgSize", "interests", "notes", "status", "updatedAt"],
  Auth: ["email", "code", "codeExpires", "attempts", "token", "tokenExpires"],
  Meta: ["key", "value"]
};
const LIST_FIELDS = { badges: 1, days: 1, partners: 1, sports: 1, groupIds: 1, interests: 1 };
const BOOL_FIELDS = { paidPermit: 1, example: 1, confirmed: 1, verified: 1 };
const NUM_FIELDS = { day: 1, goal: 1, raised: 1, hours: 1, volunteers: 1, attempts: 1, participants: 1, orgSize: 1 };
// Sheets silently converts "09:00" into a time value and "2026-09-19" into a
// date, so these columns are read back through explicit formatters and are
// stored as plain text.
const TIME_FIELDS = { start: 1, end: 1 };
const DATE_FIELDS = { date: 1 };
const TEXT_COLUMNS = { Schedule: ["start", "end"], Events: ["date", "start", "end"], WorkLog: ["date"], Meta: ["value"], Projects: ["targetDate"] };

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
    // Keep time and date columns as literal text so Sheets does not coerce
    // "09:00" into a time value or "2026-09-19" into a date.
    (TEXT_COLUMNS[name] || []).forEach((col) => {
      const i = SCHEMA[name].indexOf(col);
      if (i !== -1) sh.getRange(2, i + 1, Math.max(sh.getMaxRows() - 1, 1), 1).setNumberFormat("@");
    });
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
function pad2(n) { return String(n).length < 2 ? "0" + n : String(n); }
function fromCell(key, v) {
  if (v === "" || v === null || v === undefined) return LIST_FIELDS[key] ? [] : (BOOL_FIELDS[key] ? false : "");
  if (LIST_FIELDS[key]) return String(v).split("|").filter(Boolean).map((x) => (key === "days" ? Number(x) : x));
  if (BOOL_FIELDS[key]) return v === true || String(v).toUpperCase() === "TRUE";
  if (TIME_FIELDS[key]) {
    if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), "HH:mm");
    if (typeof v === "number") { const mins = Math.round(v * 1440); return pad2(Math.floor(mins / 60)) + ":" + pad2(mins % 60); }
    const m = String(v).trim().match(/^(\d{1,2}):(\d{2})/);
    return m ? pad2(Number(m[1])) + ":" + m[2] : String(v).trim();
  }
  if (DATE_FIELDS[key]) {
    if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd");
    return String(v).trim();
  }
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd");
  if (NUM_FIELDS[key]) { const n = Number(v); return Number.isFinite(n) ? n : v; }
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
  SpreadsheetApp.flush();
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
  // Apps Script batches writes; flushing means an admin with the sheet open
  // sees the row the moment the save returns, not whenever the batch lands.
  SpreadsheetApp.flush();
  return obj;
}
function deleteRowBy(name, keyField, value) {
  const i = findRowIndex(name, keyField, value);
  if (i !== -1) { sheet(name).deleteRow(i); SpreadsheetApp.flush(); }
  return i !== -1;
}
function meta(key) {
  const r = rows("Meta").find((m) => m.key === key);
  const v = r ? String(r.value) : "";
  return /^#[A-Z]+!?$/.test(v) ? "" : v; // a spreadsheet error cell is not a value
}
function setMeta(key, value) { upsertRow("Meta", "key", { key, value }); }
/* Every outbound email goes through here. While emails are paused only the
   sign-in code still sends, so an admin can always get back in; everything
   else is skipped and written to the log instead of the outside world.
   Paused by default: meta() returns "" until someone turns sending on.
   NB: the reader is meta(), not getMeta() — only setMeta() has the prefix. */
function emailsPaused() { return String(meta("emailsSending")) !== "1"; }
function sendMail_(kind, opts) {
  if (kind !== "auth" && emailsPaused()) {
    Logger.log("email paused (" + kind + ") -> " + opts.to + " :: " + opts.subject);
    return false;
  }
  MailApp.sendEmail(opts);
  return true;
}
function touch() { setMeta("lastUpdated", todayISO()); }
function nowISO() { return new Date().toISOString(); }
function todayISO() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"); }
function uid() { return Utilities.getUuid().slice(0, 8); }
function withLock(fn) {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}

/* ------------------------------------------------------- validation utils */
const EMAIL_RE = /^[^@\s<>"']+@[^@\s<>"']+\.[^@\s<>"']+$/;
function validEmail(e) { return EMAIL_RE.test(String(e || "").trim()); }
/* Members sign up with both an email and a phone, so the hub can reach them
   either way and either can identify them at sign-in later. Keep the digits,
   keep a leading +, and require enough of them to be a real number. */
function cleanPhone(p) {
  const raw = String(p || "").trim();
  const plus = raw.charAt(0) === "+" ? "+" : "";
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15 ? plus + digits : "";
}
function cleanUrl(u) { const v = String(u || "").trim(); return /^https?:\/\//i.test(v) ? v.slice(0, 300) : ""; }
function oneLine(s, max) { return String(s || "").replace(/[\r\n]+/g, " ").slice(0, max || 200); }
// Small fixed-window throttle. Apps Script gives us no client IP, so the key is
// the action plus the target address; a global counter caps total abuse volume.
function throttle(key, limit, windowSec) {
  const cache = CacheService.getScriptCache();
  const k = "t:" + key;
  const n = Number(cache.get(k) || 0) + 1;
  cache.put(k, String(n), windowSec);
  if (n > limit) throw new Error("Too many requests. Please try again later.");
  return n;
}
function throttleGlobal(action, limit) { throttle("g:" + action + ":" + Math.floor(Date.now() / 3600000), limit, 3600); }

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
  const admins = rows("Admins");
  const displayName = (email) => {
    const a = admins.find((x) => String(x.email).toLowerCase() === String(email).toLowerCase());
    return a && a.name ? a.name : "Hub maintainers";
  };
  // Admin email addresses never leave the sheet: author falls back to a name,
  // and the work log's addedBy column is dropped entirely.
  const updates = rows("Updates").sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 40)
    .map((u) => { if (EMAIL_RE.test(u.author)) u.author = displayName(u.author); return u; });
  const worklog = rows("WorkLog").sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 200)
    .map((w) => { delete w.addedBy; return w; });
  return {
    ok: true,
    lastUpdated: /^\d{4}-\d{2}-\d{2}$/.test(meta("lastUpdated")) ? meta("lastUpdated") : todayISO(),
    groups,
    schedule: rows("Schedule"),
    specialEvents: rows("Events"),
    updates,
    projects: rows("Projects"),
    worklog
  };
}

/* ----------------------------------------------------------------- POST */
/* ---------------------------------------------------------------------
   Community membership
   Anyone who uses the park can join: a permitted organization, a community
   or independent group, or a neighbour on their own. Email and phone are
   both required — two ways to reach a member, and later two ways to sign in.
   --------------------------------------------------------------------- */
const MEMBER_TYPES = ["Individual", "Community group", "Permitted organization", "Business"];
const MEMBER_INTERESTS = ["Monthly maintenance", "One-time project support", "Volunteer time", "Materials or equipment"];

function joinCommunity(d) {
  // a bot filled the hidden field, or came back faster than a person can type
  if (String(d.website2 || "").trim()) return { ok: true };
  // a missing timestamp is treated as "too fast" — otherwise the guard is
  // skipped simply by leaving the field out of a scripted POST
  const started = Number(d.formTs || 0);
  if (!started || Date.now() - started < 3000) return { ok: true };

  throttleGlobal("join", 60);
  const email = String(d.email || "").trim().toLowerCase();
  const phone = cleanPhone(d.phone);
  if (!validEmail(email)) throw new Error("Please enter a valid email address.");
  if (!phone) throw new Error("Please enter a valid phone number so we can reach you.");
  const name = oneLine(d.name, 120);
  if (!name) throw new Error("Please enter your name.");
  throttle("join:" + email, 3, 3600);

  const type = MEMBER_TYPES.indexOf(String(d.memberType)) !== -1 ? String(d.memberType) : "Individual";
  const interests = (Array.isArray(d.interests) ? d.interests : String(d.interests || "").split("|"))
    .map(function (x) { return String(x).trim(); })
    .filter(function (x) { return MEMBER_INTERESTS.indexOf(x) !== -1; });

  const existing = rows("Members").filter(function (m) { return String(m.email).toLowerCase() === email; })[0];
  const rec = {
    id: existing ? existing.id : uid(),
    createdAt: existing ? existing.createdAt : nowISO(),
    name: name, email: email, phone: phone,
    memberType: type,
    groupName: oneLine(d.groupName, 120),
    orgSize: Math.max(1, Math.min(2000, Math.round(Number(d.orgSize) || 1))),
    interests: interests,
    notes: oneLine(d.notes, 400),
    status: existing ? existing.status : "active",
    updatedAt: nowISO()
  };
  upsertRow("Members", "id", rec);

  try {
    sendMail_("member", {
      to: email,
      subject: "You are on the Hjelte community list",
      htmlBody: "<p>Thanks for joining the Hjelte Sports Center community list, " + escapeHtml_(name) + ".</p>" +
        "<p>We have your email and your phone on file, so we can reach you about field news, work days and the projects you said you were interested in.</p>" +
        (interests.length ? "<p>You told us you would like to help with: " + escapeHtml_(interests.join(", ")) + ".</p>" : "") +
        "<p>Nothing has been charged and no payment details were collected here. If you chose to contribute toward monthly maintenance or a project, you will do that yourself from the community page whenever you are ready.</p>" +
        "<p>— Hjelte Sports Center community hub</p>"
    });
  } catch (err) { /* the record is saved either way */ }

  return { ok: true, member: { id: rec.id, name: rec.name, email: rec.email } };
}
function escapeHtml_(s) {
  return String(s || "").replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function doPost(e) {
  let body = {};
  try { body = JSON.parse((e.postData && e.postData.contents) || "{}"); } catch (err) { return json({ ok: false, error: "Bad JSON" }); }
  const action = body.action;
  try {
    // public actions
    if (action === "subscribe") return json(withLock(() => subscribe(body)));
    if (action === "submitGroup") return json(withLock(() => submitGroup(body.data || {})));
    if (action === "joinCommunity") return json(withLock(() => joinCommunity(body.data || {})));
    if (action === "createCheckout") return json(createCheckout(body.data || {}));
    if (action === "requestCode") return json(withLock(() => requestCode(body.email)));
    if (action === "verifyCode") return json(withLock(() => verifyCode(body.email, body.code)));
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
      case "saveProject": return json(withLock(() => { requireMaster(admin); const prev = d.id ? rows("Projects").find((x) => x.id === d.id) : null; const p = Object.assign({}, d, { id: (prev && prev.id) || uid(), updatedAt: nowISO() }); upsertRow("Projects", "id", p); touch(); return { ok: true, project: p }; }));
      case "deleteProject": return json(withLock(() => { requireMaster(admin); deleteRowBy("Projects", "id", d.id); touch(); return { ok: true }; }));
      case "addWorkLog": return json(withLock(() => addWorkLog(admin, d)));
      case "deleteWorkLog": return json(withLock(() => deleteWorkLog(admin, d.id)));
      case "verifyWorkLog": return json(withLock(() => { requireMaster(admin); const w = rows("WorkLog").find((x) => x.id === d.id); if (!w) throw new Error("Not found"); w.verified = !!d.verified; upsertRow("WorkLog", "id", w); return { ok: true }; }));
      case "addAdmin": return json(withLock(() => addAdmin(admin, d)));
      // Compare the same normalised address the delete uses, or "TeamLA@..."
      // slips past the guard and deletes the master's own row.
      case "removeAdmin": return json(withLock(() => { requireMaster(admin); const em = String(d.email || "").trim().toLowerCase(); if (em === MASTER_EMAIL) throw new Error("Cannot remove the master admin"); deleteRowBy("Admins", "email", em); return { ok: true }; }));
      case "approveSubmission": return json(withLock(() => approveSubmission(admin, d)));
      // Same pending-only rule as approveSubmission, so an already-approved
      // submission cannot be flipped to rejected after its group exists.
      case "rejectSubmission": return json(withLock(() => { requireMaster(admin); const s = rows("Submissions").find((x) => x.id === d.id); if (!s) throw new Error("Submission not found"); if (String(s.status).toLowerCase() !== "pending") throw new Error("That submission has already been " + String(s.status) + "."); s.status = "rejected"; upsertRow("Submissions", "id", s); return { ok: true }; }));
      case "subscribers": requireMaster(admin); return json({ ok: true, subscribers: rows("Subscribers").map((s) => ({ email: s.email, sports: s.sports, confirmed: s.confirmed, createdAt: s.createdAt })) });
      case "sendDigestNow": requireMaster(admin); return json(sendDailyDigest(true));
      case "setLastUpdated": requireMaster(admin); setMeta("lastUpdated", d.date || todayISO()); return json({ ok: true });
      // Sign-in codes are never affected by this; only the master can flip it.
      case "setEmailsSending": return json(withLock(() => { requireMaster(admin); setMeta("emailsSending", d.on ? "1" : ""); return { ok: true, emailsPaused: emailsPaused() }; }));
      default: return json({ ok: false, error: "Unknown action" });
    }
  } catch (err) {
    return json({ ok: false, error: String(err.message || err) });
  }
}

/* ------------------------------------------------------------------ auth */
function requestCode(email) {
  email = String(email || "").trim().toLowerCase();
  const SAME = { ok: true, message: "If that address is an admin, a sign-in code is on its way." };
  // Throttle before looking the address up, so an admin address and a stranger's
  // behave identically — otherwise a second rapid call reveals which is which.
  try {
    throttle("code:" + email, 1, 120);
    throttle("codeh:" + email, 6, 3600);
  } catch (err) { return SAME; }
  throttleGlobal("requestCode", 60);
  const admin = rows("Admins").find((a) => String(a.email).toLowerCase() === email);
  if (!admin) return SAME;
  // Utilities.getUuid() is a random v4 UUID; mixing its digits with Math.random
  // gives a better-distributed code than Math.random alone.
  const entropy = Utilities.getUuid().replace(/\D/g, "") + String(Math.floor(Math.random() * 1e6));
  const code = String(100000 + (Number(entropy.slice(0, 12)) % 900000));
  const expires = new Date(Date.now() + CODE_TTL_MIN * 60000).toISOString();
  const existing = rows("Auth").find((a) => a.email === email) || { email };
  // A fresh code resets the attempt counter. Keeping it would lock an admin
  // out permanently, since verifyCode refuses before it ever compares the
  // code — and the address is public, so anyone could trigger that. Brute
  // force is bounded by the request throttle above instead.
  upsertRow("Auth", "email", Object.assign(existing, { code, codeExpires: expires, attempts: 0 }));
  sendMail_("auth", {
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
  throttle("verify:" + email, 12, 600);
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
    lastUpdated: meta("lastUpdated"),
    emailsPaused: emailsPaused()
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
// Free-text fields are rendered into links and attributes on the public page,
// so URLs and emails are normalised before they are ever stored.
function sanitizeGroup(d) {
  const o = Object.assign({}, d);
  if (o.website !== undefined) o.website = cleanUrl(o.website);
  if (o.social !== undefined) o.social = cleanUrl(o.social);
  // logoUrl has no field in the admin UI but is not master-only, so a
  // hand-crafted request could set it. The directory also guards it, but the
  // stored value should be a real URL in the first place.
  if (o.logoUrl !== undefined) o.logoUrl = cleanUrl(o.logoUrl);
  if (o.email !== undefined) o.email = validEmail(o.email) ? String(o.email).trim() : "";
  ["name", "short", "programType", "times", "socialHandle"].forEach((k) => { if (o[k] !== undefined) o[k] = oneLine(o[k], 160); });
  ["description", "description_es"].forEach((k) => { if (o[k] !== undefined) o[k] = String(o[k]).slice(0, 1200); });
  // headcount drives the monthly maintenance amount, so keep it sane
  if (o.participants !== undefined) o.participants = Math.max(0, Math.min(2000, Math.round(Number(o.participants) || 0)));
  return o;
}
function saveGroup(admin, d) {
  const all = rows("Groups");
  const existing = all.find((g) => g.id === d.id);
  if (!existing) {
    requireMaster(admin);
    d = sanitizeGroup(d);
    // reuse the rows we already read rather than pulling the sheet twice
    const g = Object.assign({ status: "approved", category: "community", permitStatus: "unknown", paidPermit: false, badges: ["COMMUNITY GROUP"], days: [] }, d, { id: freshGroupId(d.name, all), updatedAt: nowISO() });
    upsertRow("Groups", "id", g); touch(); return { ok: true, group: g };
  }
  requireGroup(admin, existing.id);
  const patch = sanitizeGroup(d);
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
  const rec = Object.assign({}, existing || {}, d, {
    id: (existing && existing.id) || uid(),
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
  // Editing an existing update requires rights over the record as it stands,
  // not just over the group the caller is submitting.
  if (prev && !isMaster(admin) && !canEditGroup(admin, prev.groupId) && prev.author !== admin.email) {
    throw new Error("You can only edit your own group's updates");
  }
  const u = { id: (prev && prev.id) || uid(), createdAt: prev ? prev.createdAt : nowISO(), author: d.author || admin.name || admin.email, sport, groupId, title: d.title, body: d.body || "", title_es: d.title_es || "", body_es: d.body_es || "", sentAt: prev ? prev.sentAt : "" };
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
  const prevW = d.id ? rows("WorkLog").find((x) => x.id === d.id) : null;
  if (prevW && !isMaster(admin) && !canEditGroup(admin, prevW.groupId)) throw new Error("Not your entry");
  const dw = Object.assign({}, d);
  // only a master may set or clear "verified"; otherwise keep what was there
  if (!isMaster(admin)) delete dw.verified;
  const w = Object.assign({ verified: false }, prevW || {}, dw, { id: (prevW && prevW.id) || uid(), groupId, organization, addedBy: admin.email, createdAt: nowISO() });
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
  // The master role is bound to MASTER_EMAIL; nobody else can be granted it.
  const rec = { email, role: email === MASTER_EMAIL ? "master" : "community", groupIds: d.groupIds || [], name: oneLine(d.name, 80), addedBy: admin.email, addedAt: nowISO() };
  upsertRow("Admins", "email", rec);
  if (d.notify !== false) {
    sendMail_("adminInvite", { to: email, subject: `You're an admin on the ${SITE_NAME}`,
      htmlBody: `<p style="font-family:Inter,system-ui,sans-serif">You've been added as a <b>${rec.role} admin</b> on the ${SITE_NAME}.</p>
        <p style="font-family:Inter,system-ui,sans-serif">Sign in with this email address at <a href="${SITE_URL}admin.html">${SITE_URL}admin.html</a>. A 6-digit code is emailed to you each time you sign in.</p>` });
  }
  return { ok: true, admin: rec };
}
function approveSubmission(admin, d) {
  requireMaster(admin);
  const s = rows("Submissions").find((x) => x.id === d.id);
  if (!s) throw new Error("Submission not found");
  // freshGroupId mints a new row every call, so approving twice would list the
  // group twice. The UI only offers Approve on a pending row; this guards the
  // endpoint itself.
  if (String(s.status).toLowerCase() !== "pending") throw new Error("That submission has already been " + String(s.status) + ".");
  const sportId = d.sportId || slug(s.sport);
  const permitted = String(s.permit).toLowerCase() === "yes";
  const g = {
    id: freshGroupId(s.groupName), name: s.groupName, short: initials(s.groupName), sport: sportId,
    category: permitted ? "permitted" : "community", permitStatus: permitted ? "permitted" : (String(s.permit).toLowerCase() === "no" ? "none" : "unknown"), paidPermit: permitted,
    badges: permitted ? ["PERMITTED ORGANIZATION"] : ["COMMUNITY GROUP"], programType: s.orgType, ages: s.ages || "Mixed", level: "Recreational",
    days: parseDays(s.days), times: oneLine(s.times, 160), website: cleanUrl(s.website), social: cleanUrl(s.social), socialHandle: "", email: validEmail(s.email) ? s.email : "",
    description: s.description, description_es: "", logoUrl: "", status: "approved", example: false, updatedAt: nowISO()
  };
  upsertRow("Groups", "id", g);
  s.status = "approved"; upsertRow("Submissions", "id", s);
  if (d.makeAdmin && s.email) addAdmin(admin, { email: s.email, role: "community", groupIds: [g.id], name: s.contact });
  touch(); return { ok: true, group: g };
}

/* -------------------------------------------------- public: contributions */
function scriptProp_(name) {
  return String(PropertiesService.getScriptProperties().getProperty(name) || "").trim();
}
/* Pure: the form body Stripe expects. Split out from the network call so the
   pricing and shape can be exercised without a key. */
function checkoutPayload_(o) {
  const p = {
    mode: o.mode,
    success_url: SITE_URL + "?contributed=1",
    cancel_url: SITE_URL + "#get-involved",
    client_reference_id: String(o.ref || "").slice(0, 200)
  };
  if (o.mode === "subscription") {
    p["line_items[0][price]"] = o.priceId;
    p["line_items[0][quantity]"] = String(o.quantity);
  } else {
    p.submit_type = "donate";
    p["line_items[0][quantity]"] = "1";
    p["line_items[0][price_data][currency]"] = "usd";
    p["line_items[0][price_data][unit_amount]"] = String(o.amountCents);
    p["line_items[0][price_data][product_data][name]"] = o.productName;
  }
  Object.keys(o.metadata || {}).forEach(function (k) {
    const v = o.metadata[k];
    if (v !== "" && v !== null && v !== undefined) p["metadata[" + k + "]"] = String(v).slice(0, 480);
  });
  return p;
}
function createCheckout(d) {
  throttleGlobal("createCheckout", 120);
  const key = scriptProp_("STRIPE_SECRET_KEY");
  if (!key) throw new Error("Contributions are not switched on yet.");
  const mode = d.mode === "subscription" ? "subscription" : "payment";
  const grp = d.groupId ? rows("Groups").find((g) => String(g.id) === String(d.groupId)) : null;
  const proj = d.projectId ? rows("Projects").find((p) => String(p.id) === String(d.projectId)) : null;
  const o = {
    mode: mode,
    // the caller's ref is a memo, so it is reduced to the characters Stripe
    // allows rather than trusted
    ref: String(d.ref || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 200),
    metadata: {
      groupId: grp ? grp.id : "", groupName: grp ? grp.name : "Not for a group",
      projectId: proj ? proj.id : "", projectTitle: proj ? proj.title : "General maintenance",
      source: "hjeltesportscenter.com"
    }
  };
  if (mode === "subscription") {
    const priceId = scriptProp_("STRIPE_PRICE_MONTHLY");
    if (!priceId) throw new Error("Monthly contributions are not switched on yet.");
    if (!grp) throw new Error("Choose a group for a monthly contribution.");
    // The headcount comes from the admin's row, never from the caller, and it
    // is fixed onto the subscription here. An admin editing the roster later
    // does not change what somebody has already agreed to pay.
    const n = Math.round(Number(grp.participants) || 0);
    if (n < 1) throw new Error("That group has no headcount on file yet. An admin can add one.");
    o.priceId = priceId;
    o.quantity = Math.min(MAX_HEADCOUNT, n);
    o.metadata.headcount = String(o.quantity);
  } else {
    const cents = Math.round(Number(d.amountCents) || 0);
    if (!(cents >= ONETIME_MIN_CENTS)) throw new Error("The smallest contribution is $" + (ONETIME_MIN_CENTS / 100) + ".");
    if (cents > ONETIME_MAX_CENTS) throw new Error("For more than $" + (ONETIME_MAX_CENTS / 100) + ", please get in touch so we can thank you properly.");
    o.amountCents = cents;
    o.productName = "Hjelte Community Maintenance — one-time contribution";
  }
  const res = UrlFetchApp.fetch(STRIPE_CHECKOUT_URL, {
    method: "post",
    headers: { Authorization: "Bearer " + key },
    payload: checkoutPayload_(o),
    muteHttpExceptions: true
  });
  const code = res.getResponseCode();
  let out = {};
  try { out = JSON.parse(res.getContentText() || "{}"); } catch (err) { out = {}; }
  if (code < 200 || code >= 300 || !out.url) {
    // Stripe's error can quote the request back; log it, never return it to
    // the browser.
    Logger.log("Stripe checkout failed " + code + ": " + String(res.getContentText()).slice(0, 500));
    throw new Error("Stripe could not start that contribution. Please try again.");
  }
  return { ok: true, url: out.url };
}

/* ---------------------------------------------------- public: submissions */
function submitGroup(f) {
  if (!f.groupName || !validEmail(f.email)) throw new Error("Group name and a valid email are required");
  throttle("sg:" + String(f.email).toLowerCase(), 3, 3600);
  throttleGlobal("submitGroup", 40);
  // the id is ours, never the caller's: a client-supplied id lands in the
  // admin panel's markup and is a stored-XSS vector
  const s = Object.assign({}, f, { id: uid(), createdAt: nowISO(), status: "pending" });
  Object.keys(s).forEach((k) => { if (SCHEMA.Submissions.indexOf(k) === -1) delete s[k]; else if (typeof s[k] === "string") s[k] = s[k].slice(0, 1200); });
  s.website = cleanUrl(s.website); s.groupName = oneLine(s.groupName, 120);
  appendRow("Submissions", s);
  sendMail_("submission", { to: MASTER_EMAIL, subject: `[Hjelte Hub] New group submission: ${oneLine(f.groupName, 80)}`,
    htmlBody: `<p style="font-family:Inter,system-ui,sans-serif">A new group asked to be listed. Review it in the admin center → Submissions.</p><pre>${escapeHtml(JSON.stringify(s, null, 2))}</pre>` });
  return { ok: true };
}

/* ------------------------------------------------------- subscriptions */
function subscribe(b) {
  const email = String(b.email || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Valid email required");
  throttle("sub:" + email, 3, 3600);
  throttleGlobal("subscribe", 80);
  // Only ids the site actually offers are stored — this value is echoed back
  // into the admin UI and into emails.
  const ALLOWED = ["all", "baseball", "softball", "cricket", "soccer", "disc", "fitness", "youth", "community", "other"];
  let sports = (Array.isArray(b.sports) ? b.sports : []).map((x) => String(x).trim().toLowerCase()).filter((x) => ALLOWED.indexOf(x) !== -1);
  if (!sports.length || sports.indexOf("all") !== -1) sports = ["all"];
  const existing = rows("Subscribers").find((s) => s.email === email);
  const rec = Object.assign({ email, createdAt: nowISO(), confirmed: false, token: Utilities.getUuid() }, existing || {}, { sports });
  upsertRow("Subscribers", "email", rec);
  if (!rec.confirmed) {
    const url = ScriptApp.getService().getUrl() + "?action=confirm&token=" + rec.token;
    sendMail_("subscribeConfirm", { to: email, subject: `Confirm your ${SITE_NAME} updates`,
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
  // Stop before any bookkeeping. The loop below stamps lastSentAt and sentAt
  // as it goes, so running it while paused would mark updates as delivered
  // and quietly drop them from the first digest after email resumes.
  if (emailsPaused()) { Logger.log("Daily digest skipped — outgoing email is paused."); return { ok: true, sent: 0, skipped: 0, paused: true }; }
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
    sendMail_("digest", { to: s.email, subject: oneLine(`Hjelte update · ${myUpdates[0] ? myUpdates[0].title : myEvents[0].title}`, 120), htmlBody: html });
    s.lastSentAt = nowISO(); upsertRow("Subscribers", "email", s); sent++;
  }
  updates.forEach((u) => { if (!u.sentAt) { u.sentAt = nowISO(); upsertRow("Updates", "id", u); } });
  return { ok: true, sent, skipped, quotaLeft: MailApp.getRemainingDailyQuota() };
}

/* ---------------------------------------------------------------- utils */
function slug(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
/* A new group's id is the slug of its name, and upsertRow replaces any row
   that already carries that id. Two groups named the same — a duplicated row
   saved without renaming, or a public submission named after a group already
   in the directory — would otherwise have the second silently overwrite the
   first, contact email and all. Suffix until the id is free. */
function freshGroupId(name, known) {
  const base = slug(name) || uid();
  const taken = (known || rows("Groups")).map((g) => String(g.id));
  if (taken.indexOf(base) === -1) return base;
  for (var n = 2; n < 200; n++) if (taken.indexOf(base + "-" + n) === -1) return base + "-" + n;
  return base + "-" + uid();
}
function initials(s) { return String(s || "").split(/\s+/).map((w) => w[0]).join("").slice(0, 3).toUpperCase(); }
function parseDays(s) {
  const map = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
  return String(s || "").toLowerCase().split(/[^a-z]+/).map((w) => map[w.slice(0, 3)]).filter((d) => d !== undefined);
}
function escapeHtml(s) { return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }


/* =====================================================================
   repairFormats() — run once on a sheet created before the text-format
   fix. It re-applies plain-text formatting to the time and date columns,
   rewrites those cells as strings, and clears a corrupt lastUpdated.
   ===================================================================== */
function repairFormats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(TEXT_COLUMNS).forEach(function (name) {
    const sh = ss.getSheetByName(name);
    if (!sh || sh.getLastRow() < 2) return;
    TEXT_COLUMNS[name].forEach(function (col) {
      const i = SCHEMA[name].indexOf(col);
      if (i === -1) return;
      const range = sh.getRange(2, i + 1, sh.getLastRow() - 1, 1);
      const vals = range.getValues().map(function (r) { return [fromCell(col, r[0])]; });
      range.setNumberFormat("@");
      range.setValues(vals);
    });
  });
  setMeta("lastUpdated", todayISO());
  Logger.log("Formats repaired. lastUpdated = " + todayISO());
}

/* One-time: grants the "connect to an external service" permission that the
   Stripe call needs. Google only prompts for a scope when it notices one is
   missing, and a function that never calls out does not trigger that check.
   Sends no key and changes nothing — a 401 back from Stripe is the expected,
   correct result. Run it from the editor, not the web app. */
function authorizeStripe() {
  const res = UrlFetchApp.fetch("https://api.stripe.com/v1/checkout/sessions", { muteHttpExceptions: true });
  Logger.log("External requests authorized — Stripe replied HTTP " + res.getResponseCode());
}
