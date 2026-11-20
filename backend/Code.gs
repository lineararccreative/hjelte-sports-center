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
// Ids and phone numbers are text even when they are all digits. Sheets stores
// the string "12345678" as the number 12345678, and a number never === the
// string the browser sends back: Edit then made a copy and Delete found
// nothing. These keys are always written and read as text.
const TEXT_FIELDS = { id: 1, groupId: 1, phone: 1 };
// Fixed lists, mirrored from js/data.js. Anything outside them is refused
// rather than stored, because these values end up in page markup and filters.
const SPORT_IDS = ["baseball", "softball", "cricket", "soccer", "disc", "fitness", "youth", "community", "other"];
const CATEGORY_IDS = ["permitted", "community", "open", "maintenance"];
const AGE_GROUPS = ["Youth", "Adult", "Mixed"];
const PROJECT_STATUSES = ["PROPOSED", "PLANNING", "FUNDRAISING", "IN PROGRESS", "COMPLETED"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;
const DIGEST_MAX_AGE_DAYS = 7;     // news older than this is not emailed; mirrored in js/admin.js

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
/* Text that reaches the Sheet is data, and Sheets must store it as typed.
   Left alone, Sheets reinterprets what it is given:

     • a value starting with = + - or @ is evaluated as a formula, and a
       formula can read any tab, including the sign-in tokens;
     • "12345678" becomes a number, "6-8" and "10/12" become dates, "1e3"
       becomes 1000 and "true" becomes a checkbox value.

   So any text Sheets would not take literally goes in behind a leading
   apostrophe. That is Sheets' own "this is text" marker; it is not part of
   the stored value. Time and date columns are exempt: their values are
   validated to one exact format and their columns are plain-text already. */
function needsTextGuard_(key, s) {
  if (TIME_FIELDS[key] || DATE_FIELDS[key]) return false;
  return /^[\s\u0000-\u001f\u200b-\u200d\ufeff]*[=+\-@]/.test(s)   // would run as a formula
    || /^['\d.]/.test(s)                                           // a number, date, time or fraction — or the marker itself
    || /^(true|false)$/i.test(s.trim());                           // would become TRUE / FALSE
}
function guardText_(key, s) { return needsTextGuard_(key, s) ? "'" + s : s; }
// A cell already formatted as plain text keeps the marker, so drop it on the way out.
function unguardText_(key, s) { return s.charAt(0) === "'" && needsTextGuard_(key, s.slice(1)) ? s.slice(1) : s; }
function fromCell(key, v) {
  if (v === "" || v === null || v === undefined) return LIST_FIELDS[key] ? [] : (BOOL_FIELDS[key] ? false : "");
  if (typeof v === "string") v = unguardText_(key, v);
  if (TEXT_FIELDS[key]) return String(v);
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
  if (BOOL_FIELDS[key]) return !!v;
  if (NUM_FIELDS[key]) { if (v === "") return ""; const n = Number(v); return Number.isFinite(n) ? n : ""; }
  const s = LIST_FIELDS[key] ? (Array.isArray(v) ? v.join("|") : String(v)) : (typeof v === "object" ? JSON.stringify(v) : String(v));
  return guardText_(key, s);
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
  // Keys are compared the way rows() would read them, and an email key
  // without regard to case: an address typed into the sheet by hand as
  // "Bob@Club.org" must still be found, or removing that admin did nothing.
  const norm = (x) => { const s = unguardText_(keyField, String(x)); return keyField === "email" ? s.toLowerCase() : s; };
  const want = norm(value);
  for (let i = 0; i < vals.length; i++) if (norm(vals[i][0]) === want) return i + 2;
  return -1;
}
// True when any cell of that row is a formula. Nothing this script writes can
// be one; a row saved before that was enforced might hold one.
function rowHasFormula_(name, keyField, value) {
  const i = findRowIndex(name, keyField, value);
  if (i === -1) return false;
  return sheet(name).getRange(i, 1, 1, SCHEMA[name].length).getFormulas()[0].some((f) => !!f);
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
function deleteRowsWhere_(name, field, value) { let n = 0; while (deleteRowBy(name, field, value)) n++; return n; }
/* Writes one cell of an existing row and nothing else. A whole-row upsert
   from a copy read earlier would put back a row someone deleted in the
   meantime (an unsubscribe during a digest run) or undo a concurrent edit. */
function setCell_(name, keyField, keyValue, field, value) {
  const i = findRowIndex(name, keyField, keyValue);
  if (i === -1) return false;
  sheet(name).getRange(i, SCHEMA[name].indexOf(field) + 1).setValue(toCell(field, value));
  SpreadsheetApp.flush();
  return true;
}
// Ids are compared as text on both sides; a blank id matches nothing.
function byId_(list, id) {
  const k = String(id === null || id === undefined ? "" : id);
  return k ? (list.find((x) => String(x.id) === k) || null) : null;
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
/* Sign-in codes share Google's daily email allowance with everything else,
   and the public forms can each trigger an email. The last few sends of the
   day are therefore kept back for sign-in codes, so a burst of sign-ups or
   subscriptions can never leave an admin unable to get in. */
const MAIL_RESERVE_FOR_SIGN_IN = 15;
function sendMail_(kind, opts) {
  if (kind !== "auth" && emailsPaused()) {
    Logger.log("email paused (" + kind + ") -> " + opts.to + " :: " + opts.subject);
    return false;
  }
  if (kind !== "auth" && MailApp.getRemainingDailyQuota() <= MAIL_RESERVE_FOR_SIGN_IN) {
    Logger.log("email held back, daily allowance nearly used (" + kind + ") -> " + opts.to + " :: " + opts.subject);
    return false;
  }
  MailApp.sendEmail(opts);
  return true;
}
/* For mail that accompanies something already saved: a failed or paused send
   must not turn a successful save into an error, and the caller needs to know
   whether the email really went so it never tells anyone to check an inbox
   that will stay empty. Returns true only when the message was handed over. */
function safeSend_(kind, opts) {
  try { return sendMail_(kind, opts); }
  catch (err) { Logger.log("email failed (" + kind + ") -> " + opts.to + " :: " + err); return false; }
}
function touch() { setMeta("lastUpdated", todayISO()); }
function nowISO() { return new Date().toISOString(); }
function todayISO() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"); }
// Starts with a letter so Sheets can never read a new id as a number.
function uid() { return "r" + Utilities.getUuid().replace(/-/g, "").slice(0, 8); }
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
function cleanTime_(t) {
  const m = String(t === null || t === undefined ? "" : t).trim().match(TIME_RE);
  return m ? pad2(Number(m[1])) + ":" + m[2] : "";
}
function pick_(v, allowed) { return allowed.indexOf(String(v)) !== -1 ? String(v) : ""; }
/* Fixed-window throttle. The window is part of the cache key, so a refused
   call cannot push the expiry forward. Before, every blocked attempt restarted
   the clock, and anyone pinging an admin's address kept sign-in codes switched
   off for as long as they kept pinging. Apps Script gives us no client IP, so
   the key is the action plus the target address; a global counter caps total
   abuse volume. Cache keys are limited to 250 characters. */
function throttle(key, limit, windowSec) {
  const cache = CacheService.getScriptCache();
  const k = ("t:" + key).slice(0, 200) + ":" + Math.floor(Date.now() / (windowSec * 1000));
  const n = Number(cache.get(k) || 0) + 1;
  cache.put(k, String(n), windowSec);
  if (n > limit) throw new Error("Too many requests. Please try again later.");
  return n;
}
function throttleGlobal(action, limit) { throttle("g:" + action, limit, 3600); }

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
      // both write to the sheet, so they take the same lock every other write does
      case "confirm": return withLock(() => confirmSubscriber(p.token));
      case "unsubscribe": return withLock(() => unsubscribe(p.token));
      case "ping": return json({ ok: true, time: nowISO() });
      default: return page(SITE_NAME + " API", "This is the data service for the community hub website.");
    }
  } catch (err) {
    return json({ ok: false, error: String(err.message || err) });
  }
}
function publicData() {
  const groups = rows("Groups").filter((g) => g.status === "approved");
  const byline = bylineFor_(rows("Admins"));
  // Admin email addresses never leave the sheet: an author that is an address
  // becomes a name, and the bookkeeping columns that record who saved a row
  // (updatedBy on schedule blocks and events, addedBy on the work log) are
  // dropped from everything public.
  const strip = (r) => { delete r.updatedBy; delete r.addedBy; return r; };
  const updates = rows("Updates").sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 40)
    .map((u) => { u.author = byline(u.author); return u; });
  const worklog = rows("WorkLog").sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 200).map(strip);
  return {
    ok: true,
    lastUpdated: DATE_RE.test(meta("lastUpdated")) ? meta("lastUpdated") : todayISO(),
    groups,
    schedule: rows("Schedule").map(strip),
    specialEvents: rows("Events").map(strip),
    updates,
    projects: rows("Projects"),
    worklog
  };
}
// An author stored as an email address is shown as that admin's name instead.
function bylineFor_(admins) {
  return (author) => {
    if (!EMAIL_RE.test(String(author))) return author;
    const a = admins.find((x) => String(x.email).toLowerCase() === String(author).toLowerCase());
    return a && a.name ? a.name : "Hub maintainers";
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

/* The two public forms carry a hidden field only a bot fills in, and the time
   the form was drawn. That time is the VISITOR's clock, so it is only trusted
   to show a form came back implausibly fast: a device running a few minutes
   ahead produces a negative gap, and treating that as "too fast" silently
   dropped real sign-ups. A missing timestamp still counts as a bot, otherwise
   the check is skipped simply by leaving the field out of a scripted POST. */
function looksAutomated_(d) {
  if (String(d.website2 || "").trim()) return true;
  const started = Number(d.formTs || 0);
  if (!started) return true;
  const gap = Date.now() - started;
  return gap >= 0 && gap < 3000;
}
function joinCommunity(d) {
  if (looksAutomated_(d)) return { ok: true };

  throttleGlobal("join", 60);
  const email = String(d.email || "").trim().toLowerCase();
  const phone = cleanPhone(d.phone);
  if (!validEmail(email) || email.length > 254) throw new Error("Please enter a valid email address.");
  if (!phone) throw new Error("Please enter a valid phone number so we can reach you.");
  const name = oneLine(d.name, 120).trim();
  if (!name) throw new Error("Please enter your name.");
  throttle("join:" + email, 3, 3600);

  const type = MEMBER_TYPES.indexOf(String(d.memberType)) !== -1 ? String(d.memberType) : "Individual";
  const interests = (Array.isArray(d.interests) ? d.interests : String(d.interests || "").split("|"))
    .map(function (x) { return String(x).trim(); })
    .filter(function (x) { return MEMBER_INTERESTS.indexOf(x) !== -1; });

  /* This form is open to anyone, so an address already on the list keeps the
     record it has: otherwise whoever knows a member's email could replace that
     member's name and phone. The reply and the email are the same either way,
     so the form cannot be used to find out who is a member. */
  const existing = rows("Members").filter(function (m) { return String(m.email).toLowerCase() === email; })[0];
  const rec = existing || {
    id: uid(),
    createdAt: nowISO(),
    name: name, email: email, phone: phone,
    memberType: type,
    groupName: oneLine(d.groupName, 120),
    orgSize: Math.max(1, Math.min(2000, Math.round(Number(d.orgSize) || 1))),
    interests: interests,
    notes: oneLine(d.notes, 400),
    status: "active",
    updatedAt: nowISO()
  };
  if (!existing) appendRow("Members", rec);

  // No name in the greeting: the form is public, and whatever is typed into it
  // would otherwise arrive in someone's inbox under the hub's name.
  const emailed = safeSend_("member", {
    to: email,
    subject: "You are on the Hjelte community list",
    htmlBody: "<p>Thanks for joining the Hjelte Sports Center community list.</p>" +
      "<p>We have your email and your phone on file, so we can reach you about field news, work days and the projects you said you were interested in.</p>" +
      (rec.interests.length ? "<p>You told us you would like to help with: " + escapeHtml_(rec.interests.join(", ")) + ".</p>" : "") +
      "<p>Nothing has been charged and no payment details were collected here. If you chose to contribute toward monthly maintenance or a project, you will do that yourself from the community page whenever you are ready.</p>" +
      "<p>— Hjelte Sports Center community hub</p>"
  });
  // "emailed" lets the page say "check your email" only when one really went.
  return { ok: true, emailed: emailed };
}
function escapeHtml_(s) {
  return String(s || "").replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function doPost(e) {
  let body = {};
  try { body = JSON.parse((e.postData && e.postData.contents) || "{}"); } catch (err) { return json({ ok: false, error: "Bad JSON" }); }
  // JSON "null", a number or a list parse fine but are not a request
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ ok: false, error: "Bad JSON" });
  const action = body.action;
  const payload = body.data && typeof body.data === "object" && !Array.isArray(body.data) ? body.data : {};
  try {
    // public actions
    if (action === "subscribe") return json(withLock(() => subscribe(body)));
    if (action === "submitGroup") return json(withLock(() => submitGroup(payload)));
    if (action === "joinCommunity") return json(withLock(() => joinCommunity(payload)));
    if (action === "createCheckout") return json(createCheckout(payload));
    if (action === "requestCode") return json(withLock(() => requestCode(body.email)));
    if (action === "verifyCode") return json(withLock(() => verifyCode(body.email, body.code)));
    // Holding the token is the proof; this ends the session on the server, so
    // a token copied from a shared computer stops working at sign-out.
    if (action === "logout") return json(logout(body.token));
    // admin actions
    const admin = auth(body.token);
    const d = payload;
    // ids arrive as text and are kept that way, so they compare equal to the sheet
    ["id", "groupId"].forEach((k) => { if (d[k] !== undefined && d[k] !== null) d[k] = String(d[k]); });
    switch (action) {
      case "me": return json({ ok: true, admin: publicAdmin(admin) });
      case "adminData": return json(adminData(admin));
      case "saveGroup": return json(withLock(() => saveGroup(admin, d)));
      case "deleteGroup": return json(withLock(() => deleteGroup(admin, d)));
      case "saveSchedule": return json(withLock(() => saveScheduleLike("Schedule", admin, d)));
      case "deleteSchedule": return json(withLock(() => deleteScheduleLike("Schedule", admin, d.id)));
      case "saveEvent": return json(withLock(() => saveScheduleLike("Events", admin, d)));
      case "deleteEvent": return json(withLock(() => deleteScheduleLike("Events", admin, d.id)));
      case "postUpdate": return json(withLock(() => postUpdate(admin, d)));
      case "deleteUpdate": return json(withLock(() => deleteUpdate(admin, d.id)));
      case "saveProject": return json(withLock(() => saveProject(admin, d)));
      case "deleteProject": return json(withLock(() => { requireMaster(admin); deleteRowBy("Projects", "id", d.id); touch(); return { ok: true }; }));
      case "addWorkLog": return json(withLock(() => addWorkLog(admin, d)));
      case "deleteWorkLog": return json(withLock(() => deleteWorkLog(admin, d.id)));
      case "verifyWorkLog": return json(withLock(() => { requireMaster(admin); if (!setCell_("WorkLog", "id", d.id, "verified", !!d.verified)) throw new Error("Not found"); touch(); return { ok: true }; }));
      case "addAdmin": return json(withLock(() => addAdmin(admin, d)));
      // Compare the same normalised address the delete uses, or "TeamLA@..."
      // slips past the guard and deletes the master's own row.
      case "removeAdmin": return json(withLock(() => { requireMaster(admin); const em = String(d.email || "").trim().toLowerCase(); if (em === MASTER_EMAIL) throw new Error("Cannot remove the master admin"); deleteRowBy("Admins", "email", em); return { ok: true }; }));
      case "approveSubmission": return json(withLock(() => approveSubmission(admin, d)));
      // Same pending-only rule as approveSubmission, so an already-approved
      // submission cannot be flipped to rejected after its group exists.
      case "rejectSubmission": return json(withLock(() => { requireMaster(admin); const s = byId_(rows("Submissions"), d.id); if (!s) throw new Error("Submission not found"); if (String(s.status).toLowerCase() !== "pending") throw new Error("That submission has already been " + String(s.status) + "."); setCell_("Submissions", "id", s.id, "status", "rejected"); return { ok: true }; }));
      case "subscribers": requireMaster(admin); return json({ ok: true, subscribers: rows("Subscribers").map((s) => ({ email: s.email, sports: s.sports, confirmed: s.confirmed, createdAt: s.createdAt })) });
      case "sendDigestNow": requireMaster(admin); return json(sendDailyDigest());
      case "setLastUpdated": requireMaster(admin); setMeta("lastUpdated", DATE_RE.test(String(d.date)) ? String(d.date) : todayISO()); return json({ ok: true });
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
  const SAME = { ok: true, message: "If that address is an admin, a sign-in code is on its way. A new code can be requested every two minutes." };
  if (!validEmail(email) || email.length > 254) return SAME;
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
  try {
    sendMail_("auth", {
      to: email,
      subject: `${code} is your ${SITE_NAME} sign-in code`,
      htmlBody: `<p style="font-family:Inter,system-ui,sans-serif">Your sign-in code for the <b>${SITE_NAME}</b> admin center:</p>
        <p style="font:700 32px/1 Inter,system-ui,sans-serif;letter-spacing:6px">${code}</p>
        <p style="font-family:Inter,system-ui,sans-serif;color:#555">It expires in ${CODE_TTL_MIN} minutes. If you didn't request it, you can ignore this email.</p>`
    });
  } catch (err) {
    // Say so, in words an admin can act on, instead of letting them wait for a
    // code that was never sent.
    Logger.log("sign-in code not sent -> " + email + " :: " + err);
    throw new Error("We couldn't send a sign-in code just now. Please try again in a few minutes.");
  }
  return SAME;
}
function verifyCode(email, code) {
  email = String(email || "").trim().toLowerCase();
  throttle("verify:" + email, 12, 600);
  /* One answer for every way this can fail. Separate messages for "no code
     requested", "expired" and "wrong" told a stranger which addresses belong
     to admins, because only an admin's address ever has a code on file. */
  const FAIL = "That code didn't work. Check it and try again, or request a new one.";
  const rec = rows("Auth").find((a) => String(a.email).toLowerCase() === email);
  if (!rec || !rec.code) throw new Error(FAIL);
  if (new Date(rec.codeExpires) < new Date()) throw new Error(FAIL);
  if (Number(rec.attempts) >= MAX_CODE_ATTEMPTS) throw new Error(FAIL);
  if (String(rec.code) !== String(code || "").trim()) {
    setCell_("Auth", "email", rec.email, "attempts", Number(rec.attempts || 0) + 1);
    throw new Error(FAIL);
  }
  const admin = rows("Admins").find((a) => String(a.email).toLowerCase() === email);
  if (!admin) throw new Error(FAIL);
  const token = Utilities.getUuid() + Utilities.getUuid().replace(/-/g, "");
  upsertRow("Auth", "email", Object.assign(rec, { code: "", attempts: 0, token, tokenExpires: new Date(Date.now() + TOKEN_TTL_DAYS * 86400000).toISOString() }));
  return { ok: true, token, admin: publicAdmin(admin) };
}
// Open to anyone, so the lookup happens outside the lock: only a real token
// ever takes it, and a flood of made-up ones cannot queue up behind saves.
function logout(token) {
  const rec = token && typeof token === "string" ? rows("Auth").find((a) => a.token && a.token === token) : null;
  if (rec) withLock(() => { setCell_("Auth", "email", rec.email, "token", ""); setCell_("Auth", "email", rec.email, "tokenExpires", ""); });
  return { ok: true };
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
  ["name", "short", "programType", "times", "socialHandle", "level"].forEach((k) => { if (o[k] !== undefined) o[k] = oneLine(o[k], 160).trim(); });
  ["description", "description_es"].forEach((k) => { if (o[k] !== undefined) o[k] = String(o[k]).slice(0, 1200); });
  // Values from a fixed list are checked against it. One that is not on the
  // list is dropped, so what is already stored stands, rather than saving
  // text the public page would have to print.
  [["sport", SPORT_IDS], ["ages", AGE_GROUPS], ["category", ["permitted", "community"]], ["permitStatus", ["permitted", "none", "unknown"]]]
    .forEach(([k, allowed]) => { if (o[k] !== undefined && allowed.indexOf(String(o[k])) === -1) delete o[k]; });
  if (o.badges !== undefined) o.badges = (Array.isArray(o.badges) ? o.badges : String(o.badges).split("|")).map((b) => oneLine(b, 40).trim()).filter(Boolean).slice(0, 8);
  if (o.days !== undefined) o.days = (Array.isArray(o.days) ? o.days : []).map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
  // headcount drives the monthly maintenance amount, so keep it sane
  if (o.participants !== undefined) o.participants = Math.max(0, Math.min(2000, Math.round(Number(o.participants) || 0)));
  return o;
}
function saveGroup(admin, d) {
  const all = rows("Groups");
  const existing = byId_(all, d.id);
  if (!existing) {
    requireMaster(admin);
    d = sanitizeGroup(d);
    if (!d.name) throw new Error("Name is required");
    // reuse the rows we already read rather than pulling the sheet twice
    const g = Object.assign({ status: "approved", sport: "other", ages: "Mixed", category: "community", permitStatus: "unknown", paidPermit: false, badges: ["COMMUNITY GROUP"], days: [] }, d, { id: freshGroupId(d.name, all), updatedAt: nowISO() });
    upsertRow("Groups", "id", g); touch(); return { ok: true, group: g };
  }
  requireGroup(admin, existing.id);
  const patch = sanitizeGroup(d);
  if (!isMaster(admin)) MASTER_ONLY_GROUP_FIELDS.forEach((k) => delete patch[k]);
  if (patch.name !== undefined && !patch.name) throw new Error("Name is required");
  const g = Object.assign(existing, patch, { id: existing.id, updatedAt: nowISO() });
  upsertRow("Groups", "id", g); touch(); return { ok: true, group: g };
}
/* Removing a group removes what only makes sense with it. Its weekly blocks
   and dated events go too, or they stay on the public schedule with no group
   behind them. Its updates and work-log entries are history, so they stay but
   are detached, and its id comes off every admin: a group's id is the slug of
   its name, and a later group with the same name must not inherit the old
   one's schedule, logged hours or admins. */
function deleteGroup(admin, d) {
  requireMaster(admin);
  const id = String(d.id || "");
  const removed = { schedule: 0, events: 0 };
  if (!id || !deleteRowBy("Groups", "id", id)) return { ok: true, removed: removed };
  removed.schedule = deleteRowsWhere_("Schedule", "groupId", id);
  removed.events = deleteRowsWhere_("Events", "groupId", id);
  ["Updates", "WorkLog"].forEach((name) => {
    rows(name).filter((r) => String(r.groupId) === id).forEach((r) => setCell_(name, "id", r.id, "groupId", ""));
  });
  rows("Admins").filter((a) => a.groupIds.indexOf(id) !== -1).forEach((a) => {
    setCell_("Admins", "email", a.email, "groupIds", a.groupIds.filter((x) => x !== id));
  });
  touch();
  return { ok: true, removed: removed };
}
const GROUP_GONE = "That group is no longer in the directory. Reload the page and choose another.";
function saveScheduleLike(sheetName, admin, d) {
  const existing = d.id ? byId_(rows(sheetName), d.id) : null;
  if (existing) requireGroup(admin, existing.groupId);
  if (!d.groupId && !isMaster(admin)) throw new Error("Choose one of your groups");
  requireGroup(admin, d.groupId);
  const g = d.groupId ? byId_(rows("Groups"), d.groupId) : null;
  // a removed group can still be sitting in an open browser tab
  if (d.groupId && !g) throw new Error(GROUP_GONE);
  const sameGroup = !!existing && String(existing.groupId || "") === String(d.groupId || "");
  const derived = g ? (g.permitStatus === "permitted" ? "permitted" : "community") : "maintenance";
  const field = (k) => (d[k] !== undefined ? d[k] : (existing ? existing[k] : ""));
  const rec = Object.assign({}, existing || {}, d, {
    id: existing ? existing.id : uid(),
    groupId: d.groupId || "",
    // The admin form has no sport field. A row keeps the sport it has while it
    // stays with the same group; a new row, or one moved to another group,
    // follows the group.
    sport: pick_(d.sport, SPORT_IDS) || (sameGroup && pick_(existing.sport, SPORT_IDS)) || (g && pick_(g.sport, SPORT_IDS)) || "community",
    // Only the master chooses a category. A blank choice ("Auto") follows the
    // group's permit status; a request that leaves it out keeps what is stored.
    // A group admin's save follows the group's permit status too, except that
    // "open" and "maintenance" — which only the master can have set — are left
    // as they are, so fixing a title does not undo the master's choice.
    category: isMaster(admin)
      ? (pick_(d.category, CATEGORY_IDS) || (d.category === undefined && sameGroup && pick_(existing.category, CATEGORY_IDS)) || derived)
      : ((sameGroup && pick_(existing.category, ["open", "maintenance"])) || derived),
    start: cleanTime_(field("start")), end: cleanTime_(field("end")),
    title: oneLine(field("title"), 160).trim(), type: oneLine(field("type"), 60).trim(), facility: oneLine(field("facility"), 60).trim(),
    updatedBy: admin.email, updatedAt: nowISO()
  });
  if (sheetName === "Schedule") {
    const day = Number(rec.day);
    if (rec.day === "" || rec.day === null || rec.day === undefined || !Number.isInteger(day) || day < 0 || day > 6) throw new Error("Day is required");
    rec.day = day;
    rec.notes = oneLine(rec.notes, 300);
  } else {
    // Dates and times are printed into the schedule and into emails, so only
    // the real formats are accepted.
    rec.date = String(rec.date || "").trim();
    if (!rec.date) throw new Error("Date is required");
    if (!DATE_RE.test(rec.date) || isNaN(Date.parse(rec.date + "T12:00:00Z"))) throw new Error("That date is not valid. Use the date picker.");
    if (!rec.title) throw new Error("Title is required");
    rec.note = oneLine(rec.note, 300);
  }
  if (!rec.start || !rec.end) throw new Error("Start and end times are required");
  if (rec.start >= rec.end) throw new Error("End time must be after the start time.");
  upsertRow(sheetName, "id", rec); touch();
  return { ok: true, item: rec };
}
function deleteScheduleLike(sheetName, admin, id) {
  const existing = byId_(rows(sheetName), id);
  if (!existing) return { ok: true };
  requireGroup(admin, existing.groupId);
  deleteRowBy(sheetName, "id", existing.id); touch(); return { ok: true };
}
function postUpdate(admin, d) {
  const title = oneLine(d.title, 160).trim();
  if (!title) throw new Error("Title is required");
  let sport = d.sport === "all" ? "all" : (pick_(d.sport, SPORT_IDS) || "all"), groupId = d.groupId || "";
  const g = groupId ? byId_(rows("Groups"), groupId) : null;
  if (groupId && !g) throw new Error(GROUP_GONE);
  if (!isMaster(admin)) {
    if (!groupId) throw new Error("Choose one of your groups");
    requireGroup(admin, groupId);
    sport = pick_(g.sport, SPORT_IDS) || "other";
  }
  const prev = d.id ? byId_(rows("Updates"), d.id) : null;
  // Editing an existing update requires rights over the record as it stands,
  // not just over the group the caller is submitting.
  if (prev && !isMaster(admin) && !canEditGroup(admin, prev.groupId) && prev.author !== admin.email) {
    throw new Error("You can only edit your own group's updates");
  }
  // The byline is whoever is signed in. Only the master may put another name
  // on a post, and editing a post keeps the byline it was published under.
  const author = prev ? prev.author : ((isMaster(admin) && oneLine(d.author, 80).trim()) || admin.name || admin.email);
  const u = { id: prev ? prev.id : uid(), createdAt: prev ? prev.createdAt : nowISO(), author, sport, groupId, title, body: String(d.body || "").slice(0, 4000), title_es: oneLine(d.title_es, 160).trim(), body_es: String(d.body_es || "").slice(0, 4000), sentAt: prev ? prev.sentAt : "" };
  upsertRow("Updates", "id", u); touch(); return { ok: true, update: u };
}
function deleteUpdate(admin, id) {
  const u = byId_(rows("Updates"), id);
  if (!u) return { ok: true };
  if (!isMaster(admin) && !canEditGroup(admin, u.groupId) && u.author !== admin.email) throw new Error("Not your update");
  deleteRowBy("Updates", "id", u.id); touch(); return { ok: true };
}
// A blank stays blank; anything else becomes a number that is never negative.
function nonNegative_(v) {
  if (v === "" || v === null || v === undefined) return "";
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
function addWorkLog(admin, d) {
  let groupId = d.groupId || "", organization = oneLine(d.organization, 120).trim();
  const g = groupId ? byId_(rows("Groups"), groupId) : null;
  if (groupId && !g) throw new Error(GROUP_GONE);
  if (!isMaster(admin)) {
    if (!groupId) throw new Error("Choose one of your groups");
    requireGroup(admin, groupId);
    organization = g.name;
  } else if (g && !organization) organization = g.name;
  const prevW = d.id ? byId_(rows("WorkLog"), d.id) : null;
  if (prevW && !isMaster(admin) && !canEditGroup(admin, prevW.groupId)) throw new Error("Not your entry");
  const w = Object.assign({ verified: false }, prevW || {}, {
    id: prevW ? prevW.id : uid(), groupId, organization,
    date: String(d.date || "").trim(), activity: String(d.activity || "").trim().slice(0, 600),
    area: oneLine(d.area, 80), hours: nonNegative_(d.hours), volunteers: nonNegative_(d.volunteers),
    materials: oneLine(d.materials, 300), value: nonNegative_(d.value),
    // who first logged it, and when, are part of the record and survive edits
    addedBy: prevW ? prevW.addedBy : admin.email, createdAt: prevW ? prevW.createdAt : nowISO()
  });
  if (!DATE_RE.test(w.date) || !w.activity) throw new Error("Date and activity are required");
  if (isMaster(admin)) {
    if (d.verified !== undefined) w.verified = !!d.verified;
  } else if (prevW && prevW.verified) {
    // "Verified" vouches for the figures as they stood. If a group admin then
    // changes them, the entry goes back to pending for the master to look at.
    const changed = ["groupId", "date", "activity", "area", "hours", "volunteers", "materials", "value"].some((k) => String(prevW[k]) !== String(w[k]));
    if (changed) w.verified = false;
  }
  upsertRow("WorkLog", "id", w); touch(); return { ok: true, entry: w };
}
function deleteWorkLog(admin, id) {
  const w = byId_(rows("WorkLog"), id);
  if (!w) return { ok: true };
  if (!isMaster(admin) && !canEditGroup(admin, w.groupId)) throw new Error("Not your entry");
  deleteRowBy("WorkLog", "id", w.id); touch(); return { ok: true };
}
function saveProject(admin, d) {
  requireMaster(admin);
  const prev = d.id ? byId_(rows("Projects"), d.id) : null;
  const p = Object.assign({}, prev || {}, d, { id: prev ? prev.id : uid(), updatedAt: nowISO() });
  p.title = oneLine(p.title, 160).trim();
  if (!p.title) throw new Error("Title is required");
  p.status = pick_(p.status, PROJECT_STATUSES) || "PROPOSED";
  p.goal = nonNegative_(p.goal); p.raised = nonNegative_(p.raised);
  p.partners = (Array.isArray(p.partners) ? p.partners : String(p.partners || "").split("|")).map((x) => oneLine(x, 80).trim()).filter(Boolean);
  upsertRow("Projects", "id", p); touch();
  return { ok: true, project: p };
}
function addAdmin(admin, d, opts) {
  requireMaster(admin);
  const email = String(d.email || "").trim().toLowerCase();
  if (!validEmail(email) || email.length > 254) throw new Error("Valid email required");
  const prev = rows("Admins").find((a) => String(a.email).toLowerCase() === email) || null;
  const known = rows("Groups").map((g) => String(g.id));
  let groupIds = (Array.isArray(d.groupIds) ? d.groupIds : []).map(String).filter((id) => known.indexOf(id) !== -1);
  // Approving a second group for someone who already manages one adds it to
  // their list. The Admins editor sends the whole list and replaces it.
  const merge = !!(opts && opts.merge && prev);
  if (merge) groupIds = prev.groupIds.concat(groupIds.filter((id) => prev.groupIds.indexOf(id) === -1));
  // The master role is bound to MASTER_EMAIL; nobody else can be granted it.
  const rec = {
    email, role: email === MASTER_EMAIL ? "master" : "community", groupIds,
    name: merge && prev.name ? prev.name : oneLine(d.name, 80).trim(),
    addedBy: prev ? prev.addedBy : admin.email, addedAt: prev ? prev.addedAt : nowISO()
  };
  upsertRow("Admins", "email", rec);
  const invited = d.notify !== false;
  const emailed = invited && safeSend_("adminInvite", { to: email, subject: `You're an admin on the ${SITE_NAME}`,
    htmlBody: `<p style="font-family:Inter,system-ui,sans-serif">You've been added as a <b>${rec.role} admin</b> on the ${SITE_NAME}.</p>
      <p style="font-family:Inter,system-ui,sans-serif">Sign in with this email address at <a href="${SITE_URL}admin.html">${SITE_URL}admin.html</a>. A 6-digit code is emailed to you each time you sign in.</p>` });
  // "emailed" is false while outgoing email is paused, so the admin screen can say so.
  return { ok: true, admin: rec, invited: invited, emailed: emailed };
}
function approveSubmission(admin, d) {
  requireMaster(admin);
  const s = byId_(rows("Submissions"), d.id);
  if (!s) throw new Error("Submission not found");
  // freshGroupId mints a new row every call, so approving twice would list the
  // group twice. The UI only offers Approve on a pending row; this guards the
  // endpoint itself.
  if (String(s.status).toLowerCase() !== "pending") throw new Error("That submission has already been " + String(s.status) + ".");
  // Approving copies this row into the public directory. A formula in it would
  // be copied as whatever it currently displays, which could be anything else
  // in the spreadsheet, so such a row is never published.
  if (rowHasFormula_("Submissions", "id", s.id)) throw new Error("This submission contains a spreadsheet formula, so it cannot be published. Reject it instead.");
  const sportId = pick_(d.sportId, SPORT_IDS) || pick_(slug(s.sport), SPORT_IDS) || "other";
  const permitted = String(s.permit).toLowerCase() === "yes";
  // The form invites "@handle or link". A link is kept as it is; a bare handle
  // becomes an Instagram link, since that is what the field is labelled.
  const rawSocial = String(s.social || "").trim();
  const handle = /^@?[A-Za-z0-9._]{2,30}$/.test(rawSocial) ? rawSocial.replace(/^@/, "") : "";
  const g = {
    id: freshGroupId(s.groupName), name: s.groupName, short: initials(s.groupName), sport: sportId,
    category: permitted ? "permitted" : "community", permitStatus: permitted ? "permitted" : (String(s.permit).toLowerCase() === "no" ? "none" : "unknown"), paidPermit: permitted,
    badges: permitted ? ["PERMITTED ORGANIZATION"] : ["COMMUNITY GROUP"], programType: oneLine(s.orgType, 160), ages: pick_(s.ages, AGE_GROUPS) || "Mixed", level: "Recreational",
    days: parseDays(s.days), times: oneLine(s.times, 160), website: cleanUrl(s.website),
    social: cleanUrl(rawSocial) || (handle ? "https://instagram.com/" + handle : ""), socialHandle: handle ? "@" + handle : "",
    email: validEmail(s.email) ? String(s.email).trim() : "",
    description: String(s.description || "").slice(0, 1200), description_es: "", logoUrl: "", status: "approved", example: false, updatedAt: nowISO()
  };
  upsertRow("Groups", "id", g);
  setCell_("Submissions", "id", s.id, "status", "approved");
  const made = d.makeAdmin && validEmail(s.email) ? addAdmin(admin, { email: s.email, groupIds: [g.id], name: s.contact }, { merge: true }) : null;
  touch();
  // pass on whether the new admin's invitation really went out
  return { ok: true, group: g, invited: !!(made && made.invited), emailed: !!(made && made.emailed) };
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
  // Apps Script gives doPost no caller address, so the hourly cap is shared by
  // the whole public: anyone could burn it in seconds and shut off
  // contributions for the rest of the hour. A tighter per-minute cap underneath
  // it means a burst costs everyone a minute, not the best part of an hour.
  throttleGlobal("createCheckout", 120);
  throttle("cc:min", 10, 60);
  try {
    return createCheckout_(d);
  } catch (err) {
    // Anything we raised deliberately is meant for the donor. Anything else is
    // plumbing — a renamed sheet, Stripe unreachable — and saying so mid-payment
    // helps nobody, so it is logged and replaced.
    if (err && err.expected) throw new Error(err.message);
    Logger.log("createCheckout failed: " + (err && err.stack ? err.stack : err));
    throw new Error("Something went wrong setting that up. Please try again in a moment.");
  }
}
function donorError_(msg) { const e = new Error(msg); e.expected = true; return e; }
function createCheckout_(d) {
  const key = scriptProp_("STRIPE_SECRET_KEY");
  if (!key) throw donorError_("Contributions are not switched on yet.");
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
    if (!priceId) throw donorError_("Monthly contributions are not switched on yet.");
    if (!grp) throw donorError_("Choose a group for a monthly contribution.");
    // The headcount comes from the admin's row, never from the caller, and it
    // is fixed onto the subscription here. An admin editing the roster later
    // does not change what somebody has already agreed to pay.
    const n = Math.round(Number(grp.participants) || 0);
    if (n < 1) throw donorError_("That group has no headcount on file yet. An admin can add one.");
    o.priceId = priceId;
    o.quantity = Math.min(MAX_HEADCOUNT, n);
    o.metadata.headcount = String(o.quantity);
  } else {
    const cents = Math.round(Number(d.amountCents) || 0);
    if (!(cents >= ONETIME_MIN_CENTS)) throw donorError_("The smallest contribution is $" + (ONETIME_MIN_CENTS / 100) + ".");
    if (cents > ONETIME_MAX_CENTS) throw donorError_("For more than $" + (ONETIME_MAX_CENTS / 100) + ", please get in touch so we can thank you properly.");
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
    throw donorError_("Stripe could not start that contribution. Please try again.");
  }
  return { ok: true, url: out.url };
}

/* ---------------------------------------------------- public: submissions */
function submitGroup(f) {
  // same two signals the page checks; a scripted POST skips the page
  if (looksAutomated_(f)) return { ok: true };
  const email = String(f.email || "").trim().toLowerCase();
  const groupName = oneLine(f.groupName, 120).trim();
  if (!groupName || !validEmail(email) || email.length > 254) throw new Error("Group name and a valid email are required");
  throttle("sg:" + email, 3, 3600);
  throttleGlobal("submitGroup", 40);
  const line = (k, max) => oneLine(f[k], max).trim();
  const size = Math.max(0, Math.min(2000, Math.round(Number(f.participants) || 0)));
  // Every field is built here from text of a known length. The id is ours,
  // never the caller's: a client-supplied id lands in the admin panel's markup.
  const s = {
    id: uid(), createdAt: nowISO(), status: "pending", groupName: groupName, email: email,
    sport: line("sport", 60), orgType: line("orgType", 60), contact: line("contact", 120), phone: line("phone", 40),
    website: cleanUrl(f.website), social: line("social", 200), days: line("days", 120), times: line("times", 160),
    participants: size || "", ages: pick_(f.ages, AGE_GROUPS) || "Mixed",
    description: String(f.description || "").slice(0, 1200),
    permit: /^(yes|no)$/i.test(String(f.permit)) ? String(f.permit) : ""
  };
  appendRow("Submissions", s);
  safeSend_("submission", { to: MASTER_EMAIL, subject: `[Hjelte Hub] New group submission: ${oneLine(groupName, 80)}`,
    htmlBody: `<p style="font-family:Inter,system-ui,sans-serif">A new group asked to be listed. Review it in the admin center → Submissions.</p><pre>${escapeHtml(JSON.stringify(s, null, 2))}</pre>` });
  return { ok: true };
}

/* ------------------------------------------------------- subscriptions */
function sendConfirmation_(s) {
  const url = ScriptApp.getService().getUrl() + "?action=confirm&token=" + s.token;
  return safeSend_("subscribeConfirm", { to: s.email, subject: `Confirm your ${SITE_NAME} updates`,
    htmlBody: `<p style="font-family:Inter,system-ui,sans-serif">Tap to confirm you'd like updates for <b>${escapeHtml(s.sports.join(", "))}</b> at Hjelte Sports Center:</p>
      <p><a href="${url}" style="font-family:Inter,system-ui,sans-serif;background:#2E7D4F;color:#fff;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:600">Confirm subscription</a></p>
      <p style="font-family:Inter,system-ui,sans-serif;color:#555">If you didn't sign up, ignore this email.</p>` });
}
function subscribe(b) {
  const email = String(b.email || "").trim().toLowerCase();
  if (!validEmail(email) || email.length > 254) throw new Error("Valid email required");
  throttle("sub:" + email, 3, 3600);
  throttleGlobal("subscribe", 80);
  // Only ids the site actually offers are stored — this value is echoed back
  // into the admin UI and into emails.
  const ALLOWED = ["all"].concat(SPORT_IDS);
  let sports = (Array.isArray(b.sports) ? b.sports : []).map((x) => String(x).trim().toLowerCase()).filter((x) => ALLOWED.indexOf(x) !== -1);
  if (!sports.length || sports.indexOf("all") !== -1) sports = ["all"];
  const existing = rows("Subscribers").find((s) => String(s.email).toLowerCase() === email);
  const rec = Object.assign({ email, createdAt: nowISO(), confirmed: false, token: Utilities.getUuid(), confirmedAt: "", lastSentAt: "" }, existing || {}, { sports });
  if (rec.confirmed) {
    upsertRow("Subscribers", "email", rec);
    return { ok: true, emailed: false, message: "Your sports preferences were updated." };
  }
  /* Until someone confirms, lastSentAt records that their confirmation link
     went out. Blank means one is still owed — which is what happens to
     everyone who signs up while outgoing email is paused — and the daily run
     sends those first once email is back on. The reply says which it was, so
     nobody is told to check an inbox that will stay empty. */
  const emailed = sendConfirmation_(rec);
  if (emailed) rec.lastSentAt = nowISO();
  upsertRow("Subscribers", "email", rec);
  return emailed
    ? { ok: true, emailed: true, message: "Check your inbox to confirm your subscription." }
    : { ok: true, emailed: false, message: "You're signed up. We'll email your confirmation link as soon as email updates are running." };
}
function confirmSubscriber(token) {
  const s = token ? rows("Subscribers").find((x) => x.token === token) : null;
  if (!s) return page("Link not found", "This confirmation link is no longer valid. You can subscribe again on the website.");
  if (!s.confirmed) {
    setCell_("Subscribers", "email", s.email, "confirmed", true);
    setCell_("Subscribers", "email", s.email, "confirmedAt", nowISO());
  }
  return page("You're subscribed", `You'll receive ${SITE_NAME} updates for: ${escapeHtml(s.sports.join(", "))}. Each email includes an unsubscribe link.`);
}
function unsubscribe(token) {
  const s = token ? rows("Subscribers").find((x) => x.token === token) : null;
  if (s) deleteRowBy("Subscribers", "email", s.email);
  return page("Unsubscribed", "You won't receive further update emails from the community hub.");
}

/* --------------------------------------------------------------- digest
   Each subscriber is sent what is new to THEM: updates posted since their
   last email, and events that have been added, changed, or have come inside
   the next seven days since then. Their own lastSentAt is the bookmark, so

     • nothing is emailed twice — not by pressing "Send digest now" and then
       letting the morning run fire, and not when a run stops half way;
     • an update posted while email was paused still goes out when email
       resumes, as long as it is under DIGEST_MAX_AGE_DAYS old;
     • a week-ahead event is announced once, not again every morning.

   One address failing does not stop the rest, and the run reports what it
   did. Only single cells are written, so someone who unsubscribes while a run
   is under way is not written back in.                                    */
/* Before the pause switch existed every sign-up was emailed its confirmation
   link on the spot, and nothing recorded that. Only people who signed up from
   this day on can be owed one; older unconfirmed rows already had theirs. */
const CONFIRMATIONS_OWED_SINCE = "2026-09-20T00:00:00.000Z";
function sendDailyDigest() {
  // Stop before any bookkeeping, so a paused run leaves every bookmark alone.
  if (emailsPaused()) { Logger.log("Daily digest skipped — outgoing email is paused."); return { ok: true, sent: 0, skipped: 0, failed: 0, confirmations: 0, paused: true }; }
  // One run at a time. "Send digest now" pressed as the morning run fires
  // would otherwise have both read the same bookmarks and both send.
  const cache = CacheService.getScriptCache();
  if (cache.get("digest:running")) return { ok: true, sent: 0, skipped: 0, failed: 0, confirmations: 0, busy: true };
  cache.put("digest:running", "1", 900);
  try { return runDigest_(); } finally { cache.remove("digest:running"); }
}
function runDigest_() {
  const startedMs = Date.now(), startedISO = new Date(startedMs).toISOString();
  const tz = Session.getScriptTimeZone();
  const dayOf = (ms) => Utilities.formatDate(new Date(ms), tz, "yyyy-MM-dd");
  const floorMs = startedMs - DIGEST_MAX_AGE_DAYS * 86400000;
  const today = dayOf(startedMs), weekOut = dayOf(startedMs + 7 * 86400000);
  const when = (iso) => { const t = Date.parse(iso); return Number.isFinite(t) ? t : 0; };
  // Up to the moment this run began and no later: something posted while the
  // run is reading belongs to the next one, where the bookmark will find it.
  const updates = rows("Updates").filter((u) => when(u.createdAt) > floorMs && when(u.createdAt) <= startedMs);
  const events = rows("Events").filter((e) => DATE_RE.test(String(e.date)) && e.date >= today && e.date <= weekOut)
    .sort((a, b) => String(a.date + a.start).localeCompare(String(b.date + b.start)));
  const groups = rows("Groups");
  const byline = bylineFor_(rows("Admins"));
  const base = ScriptApp.getService().getUrl();
  // the same reserve sendMail_ keeps for sign-in codes
  const quotaOk = () => MailApp.getRemainingDailyQuota() > MAIL_RESERVE_FOR_SIGN_IN;
  // A bookmark that cannot be written (the sheet busy for 20 seconds) must not
  // stop the run for everyone after it; it is logged and the run carries on.
  const stamp = (name, keyField, keyValue, field, value) => {
    try { return withLock(() => setCell_(name, keyField, keyValue, field, value)); }
    catch (err) { Logger.log("digest bookmark not written (" + name + " " + keyValue + "): " + err); return false; }
  };
  let sent = 0, skipped = 0, failed = 0, confirmations = 0, stoppedForQuota = false;

  // 1. confirmation links owed to people who signed up while email was paused
  for (const s of rows("Subscribers")) {
    if (s.confirmed || s.lastSentAt || String(s.createdAt) < CONFIRMATIONS_OWED_SINCE) continue;
    if (!quotaOk()) { stoppedForQuota = true; break; }
    if (sendConfirmation_(s)) { stamp("Subscribers", "email", s.email, "lastSentAt", startedISO); confirmations++; } else failed++;
  }

  // 2. the digest itself
  for (const s of rows("Subscribers")) {
    if (!s.confirmed) continue;
    if (stoppedForQuota || !quotaOk()) { stoppedForQuota = true; break; }
    const sinceMs = Math.max(floorMs, when(s.lastSentAt) || when(s.confirmedAt));
    const horizonThen = dayOf(sinceMs + 7 * 86400000);
    const wants = (sport) => s.sports.indexOf("all") !== -1 || sport === "all" || s.sports.indexOf(sport) !== -1;
    const myUpdates = updates.filter((u) => wants(u.sport) && when(u.createdAt) > sinceMs);
    const myEvents = events.filter((e) => wants(e.sport));
    const newsworthy = myEvents.some((e) => e.date > horizonThen || when(e.updatedAt) > sinceMs);
    if (!myUpdates.length && !newsworthy) { skipped++; continue; }
    const li = (h) => `<li style="margin:0 0 10px">${h}</li>`;
    const gname = (id) => { const g = byId_(groups, id); return g ? g.name : ""; };
    const html = `<div style="font-family:Inter,system-ui,sans-serif;color:#1C1F22;max-width:600px">
      <p style="color:#2E7D4F;font-weight:700;letter-spacing:.1em;font-size:12px;margin:0">HJELTE SPORTS CENTER</p>
      <h2 style="margin:4px 0 16px">Your ${s.sports.indexOf("all") !== -1 ? "" : escapeHtml(s.sports.join(" · ")) + " "}update</h2>
      ${myUpdates.length ? `<h3 style="font-size:15px;margin:16px 0 8px">Latest updates</h3><ul style="padding-left:18px">${myUpdates.map((u) => li(`<b>${escapeHtml(u.title)}</b> <span style="color:#6B7076">· ${escapeHtml(byline(u.author))}</span><br>${escapeHtml(u.body)}`)).join("")}</ul>` : ""}
      ${myEvents.length ? `<h3 style="font-size:15px;margin:16px 0 8px">Coming up this week</h3><ul style="padding-left:18px">${myEvents.map((e) => li(`<b>${escapeHtml(e.title)}</b> · ${escapeHtml(e.date)} ${escapeHtml(e.start)}–${escapeHtml(e.end)}${e.groupId && gname(e.groupId) ? " · " + escapeHtml(gname(e.groupId)) : ""}${e.note ? "<br>" + escapeHtml(e.note) : ""}`)).join("")}</ul>` : ""}
      <p style="margin-top:20px"><a href="${SITE_URL}#schedule" style="background:#1C1F22;color:#fff;padding:10px 16px;border-radius:999px;text-decoration:none;font-weight:600">See the full schedule</a></p>
      <p style="color:#8A8F95;font-size:12px;margin-top:24px">Schedules are a community information resource and may change. Official permits and City of Los Angeles Department of Recreation and Parks requirements govern facility use.<br>
      <a href="${base}?action=unsubscribe&token=${encodeURIComponent(s.token)}" style="color:#8A8F95">Unsubscribe</a></p></div>`;
    const lead = myUpdates[0] || myEvents.find((e) => e.date > horizonThen || when(e.updatedAt) > sinceMs);
    if (safeSend_("digest", { to: s.email, subject: oneLine(`Hjelte update · ${lead.title}`, 120), htmlBody: html })) {
      // the bookmark is the moment this run began, so anything posted while it
      // was sending is still new to this subscriber next time
      stamp("Subscribers", "email", s.email, "lastSentAt", startedISO); sent++;
    } else failed++;
  }

  // 3. "Emailed" on an update means a full run has carried it. A run that was
  //    cut short leaves it queued; nobody is sent it twice either way.
  if (!stoppedForQuota && !failed) updates.forEach((u) => { if (!u.sentAt) stamp("Updates", "id", u.id, "sentAt", startedISO); });
  if (stoppedForQuota || failed) Logger.log("Daily digest incomplete — sent " + sent + ", failed " + failed + (stoppedForQuota ? ", stopped at the daily email limit" : ""));
  return { ok: true, sent, skipped, failed, confirmations, stoppedForQuota, quotaLeft: MailApp.getRemainingDailyQuota() };
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

/* =====================================================================
   auditFormulas() — run from the editor; it only reads. No data tab should
   ever contain a formula: every value is written as plain text. Rows saved
   before that was enforced could hold one that a visitor typed into a public
   form, so this lists any formula cell it finds in the execution log.
   ===================================================================== */
function auditFormulas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let found = 0;
  Object.keys(SCHEMA).forEach(function (name) {
    const sh = ss.getSheetByName(name);
    if (!sh || sh.getLastRow() < 2) return;
    const formulas = sh.getRange(2, 1, sh.getLastRow() - 1, SCHEMA[name].length).getFormulas();
    formulas.forEach(function (row, r) {
      row.forEach(function (cell, c) {
        if (!cell) return;
        found++;
        Logger.log(name + "!" + String.fromCharCode(65 + c) + (r + 2) + " (" + SCHEMA[name][c] + "): " + String(cell).slice(0, 80));
      });
    });
  });
  Logger.log(found
    ? found + " formula cell(s) found. Replace each with plain text, then clear the token column of the Auth tab so every admin signs in again."
    : "No formulas found in any data tab.");
  return found;
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
