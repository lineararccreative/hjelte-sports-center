/* =====================================================================
   Hjelte Sports Center — Community Sports Hub
   Behavior: navigation, schedule engine, directory, map, forms.
   Depends on window.HJELTE (js/data.js). No frameworks.
   ===================================================================== */
(function () {
  "use strict";
  const D = window.HJELTE;
  if (!D) { console.error("HJELTE data missing"); return; }

  /* ---------------- helpers ---------------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const I18 = window.I18N || { lang: "en", locale: "en-US", days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], t: (x) => x, apply() {}, init() {} };
  let DAYS = I18.days, DAYS_S = I18.daysShort;
  const tr = (obj, key) => (I18.lang === "es" && obj && obj[key + "_es"]) ? obj[key + "_es"] : (obj ? obj[key] : "");
  const toMin = (t) => { if (!t) return NaN; const [h, m] = String(t).split(":").map(Number); return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : NaN; };
  const fmtTime = (t) => { if (!t) return "—"; let [h, m] = String(t).split(":").map(Number); if (!Number.isFinite(h)) return "—"; const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; return m ? `${h}:${String(m).padStart(2, "0")} ${ap}` : `${h} ${ap}`; };
  const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scrollBehavior = () => (reduceMotion() ? "auto" : "smooth");
  // Only http(s) links are rendered; anything else (javascript:, data:) is dropped.
  const safeUrl = (u) => { const v = String(u || "").trim(); return /^https?:\/\//i.test(v) ? v : ""; };
  const safeMail = (e) => { const v = String(e || "").trim(); return /^[^@\s<>"']+@[^@\s<>"']+\.[^@\s<>"']+$/.test(v) ? v : ""; };
  const fmtRange = (a, b) => `${fmtTime(a)} – ${fmtTime(b)}`;
  const isoDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const parseISO = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const fmtDate = (d, opts = { weekday: "long", month: "long", day: "numeric" }) => d.toLocaleDateString(I18.locale, opts);
  const UNKNOWN_SPORT = { id: "unknown", name: "Other", color: "#63676C", icon: "other", activities: [], blurb: "" };
  const sport = (id) => D.sports.find((s) => s.id === id) || (id && console.warn("Unknown sport id:", id), D.sports.find((s) => s.id === id) || UNKNOWN_SPORT);
  const group = (id) => D.groups.find((g) => g.id === id) || null;
  const facility = (id) => D.facilities.find((f) => f.id === id) || null;
  // Only the Groups sheet carries an `example` column, so a schedule / event /
  // work-log row is a placeholder when its own flag says so OR when it belongs
  // to a sample group. Headline totals must never count placeholder rows.
  const isSample = (x) => {
    if (!x) return false;
    if (x.example === true || x.example === "TRUE" || x.example === "true") return true;
    const g = x.groupId ? group(x.groupId) : null;
    return !!(g && g.example);
  };
  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-");
  /* Enum-ish fields (category, permitStatus) come from the Sheet and are used
     as CSS class tokens. Anyone with edit access to the Sheet could otherwise
     close the attribute and inject markup, so keep them to a known set. */
  const token = (v, allowed, fallback) => {
    const t = String(v == null ? "" : v).trim();
    return allowed.indexOf(t) !== -1 ? t : fallback;
  };
  const catClass = (v) => token(v, Object.keys(D.categories), "open");
  const permitClass = (v) => token(v, ["permitted", "none", "unknown"], "unknown");
  const sportStyle = (id) => { const s = sport(id); return `--sport:${s.color};--sport-tint:${s.color}22`; };
  const badgeClass = (b) => {
    const k = b.toUpperCase();
    if (k.includes("PERMITTED")) return "permitted";
    if (k.includes("COMMUNITY GROUP")) return "community-group";
    if (k.includes("YOUTH")) return "youth";
    // exact token, so "YOUTH PROGRAM" is not mistaken for the pro tier
    if (k === "PRO" || k.includes("MINOR LEAGUE")) return "pro";
    if (k.includes("LEAGUE")) return "league";
    if (k.includes("CLUB")) return "club";
    if (k.includes("NONPROFIT")) return "nonprofit";
    if (k.includes("OPEN")) return "open-rec";
    return "";
  };
  const mailto = (subject, body) => `mailto:${D.config.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body || "")}`;

  /* ---------------- API (Google Apps Script) ---------------- */
  const API = D.config.apiUrl || "";
  async function api(action, data, token, extra) {
    const r = await fetch(API, { method: "POST", body: JSON.stringify(Object.assign({ action, data, token }, extra || {})) });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || "Request failed");
    return j;
  }
  async function loadRemote() {
    if (!API) return false;
    try {
      const r = await fetch(API + "?action=data", { cache: "no-store" });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error);
      ["groups", "schedule", "specialEvents", "updates", "projects", "worklog"].forEach((k) => { if (Array.isArray(j[k])) D[k] = j[k]; });
      if (j.lastUpdated) D.config.lastUpdated = j.lastUpdated;
      document.body.classList.add("live-data");
      return true;
    } catch (e) { console.warn("Live data unavailable; showing bundled data.", e); return false; }
  }

  /* ---------------- icons ---------------- */
  const I = {
    baseball: '<circle cx="12" cy="12" r="9"/><path d="M6.5 5.5c2 2.2 2 10.8 0 13M17.5 5.5c-2 2.2-2 10.8 0 13"/><path d="M7.2 8.5l1.6.4M7.2 15.5l1.6-.4M16.8 8.5l-1.6.4M16.8 15.5l-1.6-.4"/>',
    softball: '<circle cx="12" cy="12" r="9.5"/><path d="M7 5c2.4 2.4 2.4 11.6 0 14M17 5c-2.4 2.4-2.4 11.6 0 14"/>',
    cricket: '<path d="M14.5 3.5 20.5 9.5 11 19l-3-3z"/><path d="M8 16l-4.5 4.5"/><circle cx="5.5" cy="6.5" r="2.5"/>',
    soccer: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5l4 3-1.5 4.5h-5L8 10.5z"/><path d="M12 7.5V3.2M16 10.5l4-1.3M14.5 15l2.5 3.7M9.5 15 7 18.7M8 10.5 4 9.2"/>',
    disc: '<ellipse cx="12" cy="12" rx="9.5" ry="5"/><ellipse cx="12" cy="11.5" rx="5" ry="2.2"/>',
    fitness: '<path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12"/>',
    youth: '<circle cx="12" cy="5" r="2.5"/><path d="M12 8v6M8 10l4 2 4-2M12 14l-3 6M12 14l3 6"/>',
    community: '<circle cx="8" cy="8" r="2.5"/><circle cx="16" cy="8" r="2.5"/><path d="M3 18c0-2.8 2.2-5 5-5s5 2.2 5 5M11 18c0-2.8 2.2-5 5-5s5 2.2 5 5"/>',
    other: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
    expand: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    pin: '<path d="M12 21s-6-5.3-6-11a6 6 0 0 1 12 0c0 5.7-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/>',
    users: '<circle cx="9" cy="8" r="3"/><path d="M3 19c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 5.5a3 3 0 0 1 0 5.5M21 19c0-2.6-1.6-4.8-4-5.6"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
    instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".9" fill="currentColor"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7l8.5 6 8.5-6"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    hands: '<path d="M12 21s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.4-7 10-7 10z"/>',
    box: '<path d="M3 8l9-4 9 4v9l-9 4-9-4z"/><path d="M3 8l9 4 9-4M12 12v9"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.5 1.5"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5"/>',
    wrench: '<path d="M14.5 6.5a4 4 0 0 0 5 5L9 22l-3-3z"/><path d="M14.5 6.5L18 3a4 4 0 0 1 3 3l-3.5 3.5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    impact: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'
  };
  const icon = (name, cls = "") => `<svg class="i ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[name] || I.other}</svg>`;

  /* ---------------- photo slots ---------------- */
  function applyImage(container, key, subkey) {
    if (!container) return;
    const src = subkey ? (D.images[key] || {})[subkey] : D.images[key];
    if (src) {
      const img = document.createElement("img");
      img.className = "photo"; img.src = src; img.alt = container.dataset.alt || "";
      if (container.id !== "heroMedia") { img.loading = "lazy"; img.decoding = "async"; }
      container.appendChild(img);
      container.classList.add("has-photo");
    } else if (D.config.showPhotoSlotLabels && container.dataset.label) {
      const tag = document.createElement("span");
      tag.className = "slot-label"; tag.textContent = container.dataset.label;
      container.appendChild(tag);
    }
  }

  /* ---------------- header / nav ---------------- */
  const header = $("#siteHeader"), nav = $("#siteNav"), toggle = $("#navToggle");
  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 24);
    $("#toTop").classList.toggle("is-visible", window.scrollY > 900);
  };
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    header.classList.toggle("menu-open", open);
  });
  $$("a", nav).forEach((a) => a.addEventListener("click", () => { nav.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); header.classList.remove("menu-open"); }));
  $("#toTop").addEventListener("click", () => window.scrollTo({ top: 0, behavior: scrollBehavior() }));

  // scroll spy
  const navLinks = $$("#siteNav ul a");
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const id = e.target.id === "happening" ? "sports" : e.target.id === "add-group" ? "groups" : e.target.id === "featured" ? "projects" : e.target.id;
      navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + id));
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  $$("main section[id]").forEach((s) => spy.observe(s));

  /* ---------------- reveal + counters ---------------- */
  const reveal = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      $$("[data-count]", e.target).forEach(countUp);
      $$(".progress-bar i", e.target).forEach((b) => b.classList.add("in"));
      reveal.unobserve(e.target);
    });
  }, { threshold: 0.12 });
  function observeReveals(root = document) { $$(".reveal", root).forEach((el) => reveal.observe(el)); }
  function countUp(el) {
    const target = el.dataset.count === "sports" ? D.sports.length : el.dataset.count === "groups" ? D.groups.length : Number(el.textContent) || 0;
    const suffix = el.dataset.count === "groups" ? "+" : "";
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { el.textContent = target + suffix; return; }
    const t0 = performance.now(), dur = 900;
    const step = (t) => { const p = Math.min(1, (t - t0) / dur), v = Math.round(target * (1 - Math.pow(1 - p, 3))); el.textContent = v + (p === 1 ? suffix : ""); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }

  /* ---------------- stats & callout icons ---------------- */
  $$(".stat-icon").forEach((s) => s.innerHTML = icon(s.dataset.icon));
  $$("#aboutCallouts li").forEach((li) => li.insertAdjacentHTML("afterbegin", `<span class="ic">${icon(li.dataset.icon)}</span>`));
  applyImage($("#heroMedia"), "hero");
  applyImage($(".about-map"), "about");

  /* ---------------- modal ---------------- */
  const modal = $("#modal"), modalBody = $("#modalBody");
  const FOCUSABLE = 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const BG_REGIONS = ["main#top", ".site-header", ".site-footer"];
  let lastFocus = null;
  function trapFocus(e) {
    if (e.key !== "Tab") return;
    const f = $$(FOCUSABLE, $(".modal-panel", modal)).filter((el) => el.offsetParent !== null || el === document.activeElement);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function openModal(html) {
    lastFocus = document.activeElement;
    modalBody.innerHTML = html; modal.hidden = false; document.body.style.overflow = "hidden";
    BG_REGIONS.forEach((sel) => { const el = $(sel); if (el) el.setAttribute("aria-hidden", "true"); });
    document.addEventListener("keydown", trapFocus);
    $(".modal-close", modal).focus();
  }
  function closeModal() {
    modal.hidden = true; document.body.style.overflow = "";
    BG_REGIONS.forEach((sel) => { const el = $(sel); if (el) el.removeAttribute("aria-hidden"); });
    document.removeEventListener("keydown", trapFocus);
    if (lastFocus) lastFocus.focus();
  }
  modal.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) closeModal(); });

  /* ---------------- sports ---------------- */
  function renderSports() {
    $("#sportGrid").innerHTML = D.sports.map((s) => {
      const n = D.groups.filter((g) => g.sport === s.id).length;
      return `<button class="sport-card reveal" style="${sportStyle(s.id)}" data-sport="${s.id}" aria-haspopup="dialog">
        <span class="sport-bar"></span>
        <div class="sport-visual" data-image="sports" data-sub="${s.id}" data-label="sport-${s.id}.jpg" data-alt="${esc(s.name)} at Hjelte Sports Center"><span class="ic">${icon(s.icon)}</span></div>
        <div class="sport-body">
          <h3>${esc(s.name)}</h3>
          <p>${esc(s.blurb)}</p>
          <div class="sport-tags">${s.activities.slice(0, 3).map((a) => `<span>${esc(a)}</span>`).join("")}</div>
          <div class="sport-foot"><span>Explore Groups ${icon("arrow")}</span><small>${n} ${n === 1 ? "group" : "groups"}</small></div>
        </div></button>`;
    }).join("");
    $$("#sportGrid .sport-visual").forEach((v) => applyImage(v, "sports", v.dataset.sub));
    $$("#sportGrid .sport-card").forEach((c, i) => { c.style.transitionDelay = `${(i % 3) * 60}ms`; c.addEventListener("click", () => openSport(c.dataset.sport)); });
    observeReveals($("#sportGrid"));
  }
  function openSport(id) {
    const s = sport(id), gs = D.groups.filter((g) => g.sport === id);
    const weekly = D.schedule.filter((e) => e.sport === id).length;
    openModal(`<div style="${sportStyle(id)}">
      <div class="sport-visual"><span class="ic">${icon(s.icon)}</span></div>
      <p class="eyebrow">Sport at Hjelte</p>
      <h3 id="modalTitle">${esc(s.name)}</h3>
      <p class="lead" style="font-size:1rem">${esc(s.blurb)}</p>
      <h4>Typical activities</h4>
      <div class="sport-tags">${s.activities.map((a) => `<span>${esc(a)}</span>`).join("")}</div>
      <h4>Groups (${gs.length}) · ${weekly} weekly schedule blocks</h4>
      <div class="modal-groups">${gs.length ? gs.map((g) => `<a href="#groups" data-group="${g.id}"><span class="logo-tile" style="--sport:${s.color}">${esc(g.short)}</span><span><b>${esc(g.name)}</b><small>${esc(g.programType)}</small></span></a>`).join("") : `<p class="fine-print">No groups listed yet for this sport. <a href="#add-group" style="color:var(--grass);font-weight:600">Add yours →</a></p>`}</div>
      <div class="modal-actions">
        <a href="#groups" class="btn btn-primary" data-explore="${id}">Explore Groups</a>
        <a href="#schedule" class="btn btn-outline" data-sched-sport="${id}">See schedule</a>
      </div></div>`);
    $$("[data-explore], [data-group]", modalBody).forEach((a) => a.addEventListener("click", () => { setGroupFilter("sport", id); closeModal(); }));
    $("[data-sched-sport]", modalBody).addEventListener("click", () => { setScheduleFilter("sport", id); closeModal(); });
  }

  /* ---------------- schedule engine ---------------- */
  const today = new Date();
  const todayISO = isoDate(today);
  $("#todayStamp").textContent = fmtDate(today, { weekday: "long", month: "short", day: "numeric", year: "numeric" });

  function occurrencesOn(date) {
    const dow = date.getDay(), iso = isoDate(date);
    const rec = D.schedule.filter((e) => Number(e.day) === dow).map((e) => ({ ...e, date: iso }));
    const sp = D.specialEvents.filter((e) => e.date === iso).map((e) => ({ ...e, day: dow, special: true }));
    return [...rec, ...sp].sort((a, b) => toMin(a.start) - toMin(b.start));
  }
  function titleOf(e) { if (e.title) return e.title; const g = group(e.groupId); return g ? g.name : e.type; }
  function activityCard(e, opts = {}) {
    const g = group(e.groupId), f = facility(e.facility), s = sport(e.sport);
    const nowMin = today.getHours() * 60 + today.getMinutes();
    const isNow = opts.today && toMin(e.start) <= nowMin && nowMin < toMin(e.end);
    return `<article class="activity${isNow ? " is-now" : ""}" style="${sportStyle(e.sport)}">
      <div class="activity-time">${fmtTime(e.start)}<small>to ${fmtTime(e.end)}${isNow ? " · now" : ""}</small></div>
      <div class="activity-main">
        <div class="activity-title">${esc(titleOf(e))} ${isSample(e) || (g && g.example) ? '<span class="tag tag-example">Sample</span>' : ""} ${e.special ? '<span class="tag" style="background:var(--gold-light);color:var(--gold-dark)">Special</span>' : ""}</div>
        <div class="activity-meta">
          <span class="tag tag-sport">${esc(s.name)}</span>
          <span class="tag">${esc(e.type)}</span>
          ${(D.categories[e.category]?.label || e.category) === e.type ? "" : `<span class="tag tag-cat ${catClass(e.category)}">${esc(D.categories[e.category]?.label || e.category)}</span>`}
        </div>
        <div class="activity-meta">
          ${g && e.title ? `<span>${icon("users")}${esc(g.name)}</span>` : ""}
          <span>${icon("pin")}${esc(f ? f.name : e.facility)}</span>
        </div>
        ${e.note ? `<p class="activity-note">${esc(e.note)}</p>` : ""}
      </div></article>`;
  }

  // Today / This Week / Upcoming
  function renderHappening(range) {
    const out = $("#activityList");
    if (range === "today") {
      const items = occurrencesOn(today);
      out.innerHTML = items.length ? items.map((e) => activityCard(e, { today: true })).join("") : `<p class="empty-note">Nothing scheduled today. Open recreation may still be available; check posted signage.</p>`;
    } else if (range === "week") {
      let html = "";
      for (let i = 0; i < 7; i++) {
        const d = new Date(today); d.setDate(today.getDate() + i);
        const items = occurrencesOn(d);
        if (!items.length) continue;
        html += `<h3 class="day-heading">${i === 0 ? "Today" : i === 1 ? "Tomorrow" : DAYS[d.getDay()]} · ${fmtDate(d, { month: "short", day: "numeric" })}</h3>` + items.map((e) => activityCard(e, { today: i === 0 })).join("");
      }
      out.innerHTML = html || `<p class="empty-note">No activities this week.</p>`;
    } else {
      const upcoming = D.specialEvents.filter((e) => e.date >= todayISO).sort((a, b) => a.date.localeCompare(b.date) || toMin(a.start) - toMin(b.start));
      out.innerHTML = upcoming.length ? upcoming.map((e) => `<h3 class="day-heading">${fmtDate(parseISO(e.date))}</h3>` + activityCard({ ...e, special: true })).join("") : `<p class="empty-note">No special events posted yet. <a href="#connect" data-topic="Schedule update">Tell us about one →</a></p>`;
    }
  }
  let currentRange = "today";
  const TABS = $$(".tabs .tab");
  function selectTab(t) {
    TABS.forEach((x) => {
      const on = x === t;
      x.classList.toggle("is-active", on); x.setAttribute("aria-selected", String(on)); x.tabIndex = on ? 0 : -1;
    });
    $("#activityList").setAttribute("aria-labelledby", t.id);
    currentRange = t.dataset.range; renderHappening(currentRange);
  }
  TABS.forEach((t, i) => {
    t.addEventListener("click", () => selectTab(t));
    t.addEventListener("keydown", (e) => {
      const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : e.key === "Home" ? -i : e.key === "End" ? TABS.length - 1 - i : 0;
      if (!d) return;
      e.preventDefault();
      const next = TABS[(i + d + TABS.length) % TABS.length];
      next.focus(); selectTab(next);
    });
  });

  // Weekly master schedule
  const sched = { sport: "", day: "", facility: "", type: "", group: "", category: "" };
  const filtersForm = $("#scheduleFilters");
  function fillSelect(sel, opts) { opts.forEach(([v, l]) => { const o = document.createElement("option"); o.value = v; o.textContent = l; sel.appendChild(o); }); }
  fillSelect(filtersForm.sport, D.sports.map((s) => [s.id, s.name]));
  fillSelect(filtersForm.day, DAYS.map((d, i) => [String(i), d]));
  fillSelect(filtersForm.facility, D.facilities.map((f) => [f.id, f.name]));
  fillSelect(filtersForm.type, D.activityTypes.map((t) => [t, t]));
  function fillGroupFilter() {
    const keep = filtersForm.group.value;
    filtersForm.group.innerHTML = `<option value="">All organizations</option>`;
    fillSelect(filtersForm.group, D.groups.map((g) => [g.id, g.name + (g.example ? " (sample)" : "")]));
    if (D.groups.some((g) => g.id === keep)) filtersForm.group.value = keep; else sched.group = "";
  }
  fillGroupFilter();
  fillSelect(filtersForm.category, Object.entries(D.categories).map(([k, v]) => [k, v.label]));
  filtersForm.addEventListener("change", () => { Object.keys(sched).forEach((k) => sched[k] = filtersForm[k].value); renderSchedule(); });
  filtersForm.addEventListener("reset", () => setTimeout(() => { Object.keys(sched).forEach((k) => sched[k] = ""); renderSchedule(); }, 0));
  function setScheduleFilter(key, val) { filtersForm[key].value = val; sched[key] = val; renderSchedule(); }

  function filteredSchedule() {
    return D.schedule.filter((e) =>
      (!sched.sport || e.sport === sched.sport) &&
      (!sched.day || String(Number(e.day)) === sched.day) &&
      (!sched.facility || e.facility === sched.facility) &&
      (!sched.type || e.type === sched.type) &&
      (!sched.group || e.groupId === sched.group) &&
      (!sched.category || e.category === sched.category));
  }
  const START = 6 * 60, END = 22 * 60 + 30, HOUR_H = 44;
  function lanes(events) {
    // greedy lane assignment for overlapping events within one day
    const sorted = [...events].sort((a, b) => toMin(a.start) - toMin(b.start));
    const laneEnds = []; const placed = [];
    sorted.forEach((e) => {
      let lane = laneEnds.findIndex((end) => end <= toMin(e.start));
      if (lane === -1) { lane = laneEnds.length; laneEnds.push(0); }
      laneEnds[lane] = toMin(e.end); placed.push({ e, lane });
    });
    // group into clusters to size widths
    const clusters = []; let cur = null;
    placed.forEach((p) => {
      if (cur && toMin(p.e.start) < cur.end) { cur.items.push(p); cur.end = Math.max(cur.end, toMin(p.e.end)); }
      else { cur = { items: [p], end: toMin(p.e.end) }; clusters.push(cur); }
    });
    clusters.forEach((c) => { const n = Math.max(...c.items.map((p) => p.lane)) + 1; c.items.forEach((p) => p.n = n); });
    return placed;
  }
  function renderSchedule() {
    const items = filteredSchedule();
    const days = sched.day ? [Number(sched.day)] : [0, 1, 2, 3, 4, 5, 6];
    const grid = $("#weekGrid"), list = $("#weekList");
    $("#scheduleEmpty").hidden = items.length > 0;
    grid.hidden = list.hidden = items.length === 0;
    grid.style.gridTemplateColumns = `56px repeat(${days.length}, var(--wg-track, 1fr))`;
    grid.style.setProperty("--wg-days", days.length);
    const bodyH = (END - START) / 60 * HOUR_H;
    let html = `<div class="wg-head"></div>` + days.map((d) => `<div class="wg-head${d === today.getDay() ? " is-today" : ""}">${DAYS_S[d]}${d === today.getDay() ? "<em>Today</em>" : ""}</div>`).join("");
    html += `<div class="wg-gutter" style="height:${bodyH}px">` + Array.from({ length: (END - START) / 60 + 1 }, (_, i) => `<span style="top:${i * HOUR_H}px">${fmtTime(`${String(6 + i).padStart(2, "0")}:00`)}</span>`).join("") + `</div>`;
    html += days.map((d) => {
      const evs = lanes(items.filter((e) => Number(e.day) === d));
      return `<div class="wg-col${d === today.getDay() ? " is-today" : ""}" style="height:${bodyH}px;--hour-h:${HOUR_H}px">` + evs.map(({ e, lane, n }) => {
        const sMin = Math.max(START, Math.min(END, toMin(e.start) || START));
        const eMin = Math.max(sMin + 15, Math.min(END, toMin(e.end) || END));
        const top = (sMin - START) / 60 * HOUR_H, h = Math.max(18, (eMin - sMin) / 60 * HOUR_H);
        const w = 100 / n, f = facility(e.facility);
        return `<button class="wg-event ${catClass(e.category)}" style="${sportStyle(e.sport)};top:${top + 1}px;height:${h - 3}px;left:calc(${lane * w}% + 3px);width:calc(${w}% - 6px)" data-idx="${D.schedule.indexOf(e)}" title="${esc(titleOf(e))} · ${fmtRange(e.start, e.end)}">
          <b>${esc(titleOf(e))}</b><span>${fmtRange(e.start, e.end)}</span><span>${esc(f ? f.name : "")}</span></button>`;
      }).join("") + `</div>`;
    }).join("");
    grid.innerHTML = html;
    $$(".wg-event", grid).forEach((b) => b.addEventListener("click", () => openEvent(D.schedule[Number(b.dataset.idx)])));

    list.innerHTML = days.map((d) => {
      const evs = items.filter((e) => Number(e.day) === d).sort((a, b) => toMin(a.start) - toMin(b.start));
      if (!evs.length) return "";
      return `<details class="wl-day${d === today.getDay() ? " is-today" : ""}" ${d === today.getDay() || sched.day ? "open" : ""}>
        <summary>${DAYS[d]}<small>${evs.length} ${evs.length === 1 ? "activity" : "activities"}</small></summary>
        <div class="wl-items">${evs.map((e) => activityCard(e, { today: d === today.getDay() })).join("")}</div></details>`;
    }).join("");
  }
  function openEvent(e) {
    const g = group(e.groupId), f = facility(e.facility), s = sport(e.sport);
    openModal(`<div style="${sportStyle(e.sport)}">
      <p class="eyebrow">${DAYS[e.day]} · ${fmtRange(e.start, e.end)}</p>
      <h3 id="modalTitle">${esc(titleOf(e))}</h3>
      <div class="activity-meta" style="margin-bottom:14px"><span class="tag tag-sport">${esc(s.name)}</span><span class="tag">${esc(e.type)}</span><span class="tag tag-cat ${catClass(e.category)}">${esc(D.categories[e.category]?.label || "")}</span></div>
      <dl class="map-card-dl" style="display:grid;gap:10px;margin:0 0 8px">
        <div><dt class="fine-print" style="text-transform:uppercase;letter-spacing:.1em;font-weight:700">Facility</dt><dd style="margin:0">${esc(f ? f.name : e.facility)}</dd></div>
        ${g ? `<div><dt class="fine-print" style="text-transform:uppercase;letter-spacing:.1em;font-weight:700">Organization</dt><dd style="margin:0">${esc(g.name)}${g.example ? " <span class='tag tag-example'>Sample</span>" : ""}<br><small style="color:var(--muted)">${esc(g.programType)} · ${esc(g.ages)}</small></dd></div>` : ""}
        <div><dt class="fine-print" style="text-transform:uppercase;letter-spacing:.1em;font-weight:700">Category</dt><dd style="margin:0;color:var(--muted);font-size:.9rem">${esc(D.categories[e.category]?.desc || "")}</dd></div>
      </dl>
      <div class="modal-actions">
        ${g ? `<a href="#groups" class="btn btn-primary" data-group-open="${g.id}">View group</a>` : ""}
        <a href="#connect" class="btn btn-outline" data-topic="Schedule update" data-msg="Schedule update for: ${esc(titleOf(e))} (${DAYS[e.day]} ${fmtRange(e.start, e.end)}, ${esc(f ? f.name : "")}).%0A%0AWhat changed:%0A">Report a change</a>
      </div></div>`);
    const go = $("[data-group-open]", modalBody); if (go) go.addEventListener("click", () => { $("#groupSearch").value = g.name; dir.q = g.name.toLowerCase(); renderGroups(); closeModal(); });
    $("[data-topic]", modalBody).addEventListener("click", closeModal);
  }
  function renderLegend() {
    $("#legend").innerHTML = Object.entries(D.categories).map(([k, v]) => `<div class="legend-item"><span class="legend-swatch ${k}"></span><div><b>${esc(v.label)}</b><small>${esc(v.desc)}</small></div></div>`).join("")
      + `<div class="legend-sports">${D.sports.map((s) => `<span><i class="dot" style="background:${s.color}"></i>${esc(s.name)}</span>`).join("")}</div>`;
  }
  function renderLastUpdated() {
    const el = $("#lastUpdated");
    const d = D.config.lastUpdated ? parseISO(D.config.lastUpdated) : new Date(document.lastModified);
    el.dateTime = isoDate(d); el.textContent = fmtDate(d, { month: "long", day: "numeric", year: "numeric" });
  }

  /* ---------------- directory ---------------- */
  const dir = { q: "", sport: "", ages: "", level: "", category: "", when: "", permit: "" };
  const sportRow = $('#groupFilters [data-filter="sport"]');
  sportRow.insertAdjacentHTML("beforeend", `<button class="chip is-active" data-value="">All</button>` + D.sports.map((s) => `<button class="chip" data-value="${s.id}"><i class="dot" style="background:${s.color}"></i>${esc(s.name)}</button>`).join(""));
  $("#groupFilters").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip"); if (!chip) return;
    const row = chip.closest(".chip-row"); setGroupFilter(row.dataset.filter, chip.dataset.value);
  });
  function setGroupFilter(key, val) {
    const row = $(`#groupFilters [data-filter="${key}"]`);
    $$(".chip", row).forEach((c) => { const on = c.dataset.value === val; c.classList.toggle("is-active", on); c.setAttribute("aria-pressed", String(on)); });
    dir[key] = val; renderGroups();
  }
  $("#groupSearch").addEventListener("input", (e) => { dir.q = e.target.value.trim().toLowerCase(); renderGroups(); });
  fillSelect($("#formSport"), D.sports.map((s) => [s.name, s.name]));

  function groupMatches(g) {
    const hay = `${g.name} ${sport(g.sport).name} ${g.programType} ${g.description} ${g.badges.join(" ")}`.toLowerCase();
    const weekend = g.days.some((d) => d === 0 || d === 6), weekday = g.days.some((d) => d >= 1 && d <= 5);
    return (!dir.q || hay.includes(dir.q)) && (!dir.sport || g.sport === dir.sport) && (!dir.ages || g.ages === dir.ages) &&
      (!dir.level || g.level === dir.level) && (!dir.category || g.category === dir.category) &&
      (!dir.when || (dir.when === "weekend" ? weekend : weekday)) && (!dir.permit || (g.permitStatus || "unknown") === dir.permit);
  }
  function groupCard(g) {
    const s = sport(g.sport);
    const mail = safeMail(g.email);
    const contactHref = mail ? `mailto:${encodeURIComponent(mail)}?subject=${encodeURIComponent("Hello from the Hjelte community hub")}` : mailto(`Contact request: ${g.name}`, `I'd like to get in touch with ${g.name} (listed on the Hjelte Sports Center hub).\n\nMy message:\n`);
    const site = safeUrl(g.website), social = safeUrl(g.social);
    return `<article class="group-card" style="${sportStyle(g.sport)}" data-id="${g.id}">
      ${g.example ? '<span class="tag tag-example sample-tag" title="Placeholder listing to be replaced with a real group">Sample</span>' : ""}
      <div class="group-top">
        <div class="logo-tile">${safeUrl(g.logoUrl || g.logo) ? `<img src="${esc(safeUrl(g.logoUrl || g.logo))}" alt="" loading="lazy">` : esc(g.short)}</div>
        <div><h3 class="group-name">${esc(g.name)}</h3><div class="group-sport">${icon(s.icon)} ${esc(s.name)}</div></div>
      </div>
      <div class="badges">${g.badges.map((b) => `<span class="badge ${badgeClass(b)}">${esc(b)}</span>`).join("")}${permitBadge(g)}</div>
      <p class="group-desc">${esc(tr(g, "description"))}</p>
      <div class="group-meta">
        <div>${icon("tag")}<span><b>${esc(g.programType)}</b></span></div>
        <div>${icon("users")}<span>${esc(g.ages)} · ${esc(g.level)}</span></div>
        <div>${icon("calendar")}<span>${g.days.map((d) => DAYS_S[d]).join(" · ")}</span></div>
        <div>${icon("clock")}<span>${esc(g.times)}</span></div>
      </div>
      <div class="group-links">
        <a class="btn btn-dark" href="${contactHref}">${icon("mail")} Contact</a>
        ${site ? `<a class="link-icon" href="${esc(site)}" target="_blank" rel="noopener">${icon("globe")} Website</a>` : ""}
        ${social ? `<a class="link-icon" href="${esc(social)}" target="_blank" rel="noopener">${icon("instagram")} ${esc(g.socialHandle || "Social")}</a>` : ""}
      </div></article>`;
  }
  function permitBadge(g) {
    const st = g.permitStatus || "unknown";
    const label = D.config.permitLabels[st] || st;
    return `<span class="badge permit permit-${permitClass(st)}">${esc(label)}</span>` + (st === "permitted" && g.paidPermit ? `<span class="badge permit permit-paid">Paid permit</span>` : "");
  }
  function renderRoster() {
    const order = { permitted: 0, unknown: 1, none: 2 };
    const list = [...D.groups].sort((a, b) => (order[a.permitStatus] ?? 1) - (order[b.permitStatus] ?? 1) || a.name.localeCompare(b.name));
    $("#rosterTable").innerHTML = `<caption class="sr-only">Every group that participates at Hjelte Sports Center, with sport, program, permit status and typical days</caption><thead><tr><th scope="col">Group</th><th scope="col">Sport</th><th scope="col">Program</th><th scope="col">Permit status</th><th scope="col">Fee</th><th scope="col">Days</th><th scope="col">Contact</th></tr></thead><tbody>` +
      list.map((g) => { const s = sport(g.sport); const st = g.permitStatus || "unknown"; return `<tr class="${g.example ? "is-sample" : ""}">
        <th scope="row"><b>${esc(g.name)}</b>${g.example ? ' <span class="tag tag-example">Sample</span>' : ""}</th>
        <td><span class="dot" style="background:${s.color}"></span> ${esc(s.name)}</td>
        <td>${esc(g.programType)}</td>
        <td><span class="badge permit permit-${permitClass(st)}">${esc(D.config.permitLabels[st] || st)}</span></td>
        <td>${st === "permitted" ? (g.paidPermit ? "Paid" : "Unpaid") : "—"}</td>
        <td>${g.days.map((d) => DAYS_S[d]).join(" · ")}</td>
        <td>${safeMail(g.email) ? `<a href="mailto:${esc(safeMail(g.email))}" aria-label="Email ${esc(g.name)}">${icon("mail")}</a>` : ""}${safeUrl(g.website) ? ` <a href="${esc(safeUrl(g.website))}" target="_blank" rel="noopener" aria-label="${esc(g.name)} website">${icon("globe")}</a>` : ""}</td></tr>`; }).join("") + `</tbody>`;
  }
  function renderGroups() {
    const matches = D.groups.filter(groupMatches);
    const perm = matches.filter((g) => g.category === "permitted"), comm = matches.filter((g) => g.category === "community");
    $("#permittedGrid").innerHTML = perm.map(groupCard).join("") || `<p class="empty-note" style="grid-column:1/-1">No permitted organizations match.</p>`;
    $("#communityGrid").innerHTML = comm.map(groupCard).join("") || `<p class="empty-note" style="grid-column:1/-1">No community groups match.</p>`;
    $("#groupsEmpty").hidden = matches.length > 0;
  }

  /* ---------------- forms ---------------- */
  function handleForm(form, statusEl, buildSubject, buildBody) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      $$(".field-error", form).forEach((n) => n.remove());
      if (form.id === "groupForm") captchaOk(form);
      $$("input, select, textarea", form).forEach((i) => { i.classList.add("touched"); i.setAttribute("aria-invalid", String(!i.checkValidity())); });
      if (!form.checkValidity()) {
        const bad = $$(":invalid", form).filter((f) => f.name);
        bad.forEach((f) => {
          const lbl = f.closest("label") || f.parentElement;
          const id = (f.name || "f") + "-err";
          f.setAttribute("aria-describedby", id);
          lbl.insertAdjacentHTML("beforeend", `<span class="field-error" id="${id}">${esc(f.validationMessage)}</span>`);
        });
        statusEl.setAttribute("role", "alert");
        statusEl.textContent = I18.t("Please complete the required fields.") + ` (${bad.length})`;
        statusEl.classList.add("is-error");
        if (bad[0]) bad[0].focus();
        return;
      }
      statusEl.classList.remove("is-error");
      const fd = new FormData(form);
      if (form.id === "groupForm") {
        const trap = String(fd.get("website2") || "").trim();
        const elapsed = Date.now() - Number(fd.get("formTs") || 0);
        if (trap || elapsed < 3000) {
          statusEl.textContent = I18.t("Your listing was sent for review. It appears once a hub admin approves it.");
          form.reset(); newCaptcha(); return;
        }
      }
      if (API && form.id === "groupForm") {
        try {
          statusEl.textContent = I18.t("Sending…");
          const obj = {}; fd.forEach((v, k) => { if (!(v instanceof File)) obj[k] = v; });
          await api("submitGroup", obj);
          statusEl.textContent = I18.t("Your listing was sent for review. It appears once a hub admin approves it."); form.reset(); newCaptcha(); return;
        } catch (err) { statusEl.textContent = err.message; statusEl.classList.add("is-error"); return; }
      }
      if (D.config.formEndpoint) {
        try {
          statusEl.textContent = "Sending…";
          const r = await fetch(D.config.formEndpoint, { method: "POST", body: fd, headers: { Accept: "application/json" } });
          if (!r.ok) throw new Error(r.status);
          statusEl.textContent = "Thank you. Your submission was received."; form.reset(); return;
        } catch (err) { statusEl.textContent = "Could not send online; opening your email app instead."; }
      }
      window.location.href = mailto(buildSubject(fd), buildBody(fd));
      statusEl.textContent = "Opening your email app with the details pre-filled. Send it to complete your submission.";
    });
  }
  /* Spam control without a third-party service: a question a person answers,
     a field only a bot fills in, and a floor on how fast the form comes back.
     The same two signals are checked again server-side. */
  const captcha = { a: 0, b: 0 };
  function newCaptcha() {
    const q = $("#captchaQuestion"); if (!q) return;
    captcha.a = 2 + Math.floor(Math.random() * 8);
    captcha.b = 1 + Math.floor(Math.random() * 8);
    q.textContent = `${captcha.a} + ${captcha.b} = ?`;
    const ts = $("#groupFormTs"); if (ts) ts.value = String(Date.now());
    const field = $('#groupForm [name="captcha"]'); if (field) field.value = "";
  }
  function captchaOk(form) {
    if (form.id !== "groupForm") return true;
    const field = form.querySelector('[name="captcha"]');
    const given = Number(String(field.value).trim());
    const ok = given === captcha.a + captcha.b;
    field.setCustomValidity(ok ? "" : I18.t("That answer is not right — please try the sum again."));
    return ok;
  }
  newCaptcha();

  handleForm($("#groupForm"), $("#groupFormStatus"),
    (fd) => `Hjelte directory submission: ${fd.get("groupName")}`,
    (fd) => ["GROUP LISTING REQUEST — Hjelte Sports Center Community Hub", "",
      ...["groupName:Group Name", "sport:Sport", "orgType:Organization Type", "contact:Primary Contact", "email:Email", "phone:Phone", "website:Website", "social:Instagram / Social", "days:Typical Days", "times:Typical Times", "participants:Approx. Participants", "ages:Who plays", "description:Description", "permit:Holds facility permit"].map((p) => { const [k, l] = p.split(":"); return `${l}: ${fd.get(k) || "—"}`; }),
      "", "Please attach your logo and a group photo to this email.", "",
      "Note: Directory inclusion does not represent official City recognition or permit status unless specifically indicated."].join("\n"));
  handleForm($("#contactForm"), $("#contactFormStatus"),
    (fd) => `[Hjelte Hub] ${fd.get("topic")}`,
    (fd) => `From: ${fd.get("name")} <${fd.get("email")}>\nTopic: ${fd.get("topic")}\n\n${fd.get("message")}`);

  // links that preset the contact topic (Report a Schedule Update, etc.)
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-topic]"); if (!a) return;
    const sel = $("#contactTopic"); const opt = Array.from(sel.options).find((o) => o.text === a.dataset.topic); if (opt) sel.value = opt.text;
    if (a.dataset.msg) $("#contactForm textarea").value = decodeURIComponent(a.dataset.msg);
  });

  /* ---------------- facility map ---------------- */
  const svgNS = "http://www.w3.org/2000/svg";
  const W = 1000, H = 700;
  function svgEl(tag, attrs) { const n = document.createElementNS(svgNS, tag); Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v)); return n; }
  function renderMap() {
    const shapes = $("#mapShapes"), pins = $("#mapPins");
    shapes.innerHTML = pins.innerHTML = "";
    D.mapLocations.forEach((loc) => {
      const cx = loc.x / 100 * W, cy = loc.y / 100 * H;
      const g = svgEl("g", { class: "hotspot", tabindex: "0", role: "button", "aria-label": loc.name, "data-id": loc.id });
      if (loc.sport) g.style.setProperty("--sport-fill", sport(loc.sport).color + "66");
      const lx = (loc.lx !== undefined ? loc.lx : loc.x) / 100 * W, ly = (loc.ly !== undefined ? loc.ly : loc.y) / 100 * H;
      const shortName = loc.short !== undefined ? loc.short : loc.name.replace("Softball ", "").replace(" (west lot)", "").replace(" & Picnic Area", "").replace("Los Angeles ", "");
      // A location can carry an emoji badge; when it has no short name the
      // badge stands alone (the soccer areas), otherwise it sits above the label.
      const addLabel = (gx, gy) => {
        if (loc.emoji) {
          const e = svgEl("text", { class: "map-emoji", "aria-hidden": "true", x: gx, y: shortName ? gy - 12 : gy + 9, "text-anchor": "middle" });
          e.textContent = loc.emoji; g.appendChild(e);
        }
        if (!shortName) return;
        const t = svgEl("text", { "aria-hidden": "true", x: gx, y: loc.emoji ? gy + 18 : gy, "text-anchor": "middle" });
        t.textContent = shortName; g.appendChild(t);
      };
      if (loc.shape === "none") {
        // listed in the chips and the detail card, but draws no shape of its own
      } else if (loc.shape === "circle") {
        const r = loc.r / 100 * W;
        g.appendChild(svgEl("circle", { class: "shape", cx, cy, r }));
        addLabel(lx, loc.ly !== undefined ? ly : cy + 4);
        shapes.appendChild(g);
      } else if (loc.shape === "rect") {
        const x = loc.x / 100 * W, y = loc.y / 100 * H, w = loc.w / 100 * W, h = loc.h / 100 * H;
        g.appendChild(svgEl("rect", { class: "shape", x, y, width: w, height: h, rx: 8 }));
        if (!loc.noLabel) addLabel(loc.lx !== undefined ? lx : x + w / 2, loc.ly !== undefined ? ly : y + h / 2 + 4);
        if (loc.id === "outfield") shapes.prepend(g); else shapes.appendChild(g);
      } else {
        const glyph = { Entrance: "M12 4v16M5 12l7 7 7-7", Restrooms: "M9 5a2 2 0 1 0 0 .01M15 5a2 2 0 1 0 0 .01M7 9h4v6l1 5M17 9h-4l-1 6-1 5", Seating: "M4 9h16v3H4zM6 12v7M18 12v7M4 15h16", Path: "M6 20c4-6 8-2 12-8" }[loc.kind] || "M12 8v8M8 12h8";
        const pinLabel = loc.kind === "Entrance" ? (loc.id === "accessRoad" ? "Access road" : "Field entrance") : loc.name.replace(" & Storage", "").replace(" & Path", "").replace(" & Lights", "");
        const pg = svgEl("g", { transform: `translate(${cx} ${cy})` });
        pg.appendChild(svgEl("circle", { class: "pin-body", r: 15 }));
        pg.appendChild(svgEl("path", { class: "pin-glyph", d: glyph, transform: "translate(-9 -9) scale(.75)", fill: "none", stroke: "#1C1F22", "stroke-width": 2.2, "stroke-linecap": "round", "stroke-linejoin": "round" }));
        g.appendChild(pg);
        const t = svgEl("text", { "aria-hidden": "true", x: cx, y: cy + 32, "text-anchor": "middle" }); t.textContent = pinLabel; g.appendChild(t);
        pins.appendChild(g);
      }
      g.addEventListener("click", () => selectLocation(loc.id));
      g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectLocation(loc.id); } });
    });
    $("#mapChips").innerHTML = D.mapLocations.map((l) => `<button class="chip" data-loc="${l.id}">${l.sport ? `<i class="dot" style="background:${sport(l.sport).color}"></i>` : ""}${esc(l.name)}</button>`).join("");
    $$("#mapChips .chip").forEach((c) => c.addEventListener("click", () => selectLocation(c.dataset.loc)));
    $$(".map-modes .mode-btn").forEach((b) => b.addEventListener("click", () => setMapMode(b.dataset.mode)));
  }

  /* Which areas stay open while a given sport has the field. The protected
     pitch buffer is closed in every mode except cricket, when it is in use. */
  const MAP_MODES = {
    open: "All areas are open. The 15 ft buffer around the cricket pitch stays closed at all times so the prepared turf is not damaged.",
    cricket: "Cricket has the 420 ft circle. All four diamonds stay open, and so do the parts of the soccer/football areas that fall outside the boundary — the shaded portions are not available, and play should never run alongside or across the circle.",
    diamonds: "The diamonds are in use. The cricket ground and all four soccer/football areas stay open; keep clear of the ground behind each backstop and watch for foul balls."
  };
  function setMapMode(mode) {
    const svg = $("#facilitySvg");
    if (!svg || !MAP_MODES[mode]) return;
    Object.keys(MAP_MODES).forEach((m) => svg.classList.toggle("mode-" + m, m === mode));
    $$(".map-modes .mode-btn").forEach((b) => {
      const on = b.dataset.mode === mode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    const note = $("#mapModeNote");
    if (note) { note.textContent = MAP_MODES[mode]; I18.apply(); }
  }
  function selectLocation(id) {
    const loc = D.mapLocations.find((l) => l.id === id);
    if (!loc) return;
    $$(".hotspot").forEach((h) => h.classList.toggle("is-active", h.dataset.id === id));
    $$("#mapChips .chip").forEach((c) => c.classList.toggle("is-active", c.dataset.loc === id));
    const s = loc.sport ? sport(loc.sport) : null;
    const weekly = loc.facility ? D.schedule.filter((e) => e.facility === loc.facility).length : 0;
    $("#mapCard").innerHTML = `<div style="${s ? `--sport:${s.color}` : ""}">
      <p class="kind">${s ? icon(s.icon) : icon("pin")} ${esc(loc.kind)}</p>
      <h3>${esc(loc.name)}</h3>
      <dl>
        ${s ? `<div><dt>Sport / activity</dt><dd>${esc(s.name)}</dd></div>` : ""}
        <div><dt>Field information</dt><dd>${esc(loc.fieldInfo)}</dd></div>
        <div><dt>Typical uses</dt><dd>${esc(loc.uses)}</dd></div>
        <div><dt>Accessibility</dt><dd>${esc(loc.accessibility || "Information not yet available.")}</dd></div>
      </dl>
      ${loc.facility ? `<a href="#schedule" class="btn btn-dark btn-sm" data-fac="${loc.facility}">${icon("calendar")} View schedule (${weekly} weekly)</a>` : ""}</div>`;
    const f = $("[data-fac]", $("#mapCard")); if (f) f.addEventListener("click", () => setScheduleFilter("facility", f.dataset.fac));
    if (window.innerWidth < 1024) $("#mapCard").scrollIntoView({ behavior: scrollBehavior(), block: "nearest" });
  }

  /* ---------------- featured ---------------- */
  function renderFeatured() {
    const f = D.featured;
    $("#featuredCard").innerHTML = `
      ${f.hero ? `<figure class="featured-hero"><button type="button" class="zoom-btn" data-zoom="${esc(f.hero.file)}" data-zoom-cap="${esc(f.hero.caption)}" aria-label="${esc(f.hero.caption)} — open larger"><img src="${esc(f.hero.file)}" alt="${esc(f.hero.alt)}" loading="lazy" decoding="async"><span class="zoom-hint">${icon("expand")}</span></button><figcaption>${esc(f.hero.caption)}</figcaption></figure>` : ""}
      <div class="featured-body">
        <div>
          <p class="eyebrow">${icon("check")} ${esc(f.status)}</p>
          <h3>${esc(f.title)}</h3>
          <p class="sub">${esc(f.subtitle)}</p>
          <p class="desc">${esc(f.description)}</p>
          <div class="featured-lead"><span class="logo-tile" style="--sport:${sport("cricket").color}">LAC</span> Developed by ${esc(f.lead)}</div>
          ${f.documents ? `<div class="featured-docs"><p class="eyebrow">Plans &amp; guides</p><div class="doc-grid">${f.documents.map((d) => `<button type="button" class="doc" data-zoom="${esc(d.file)}" data-zoom-cap="${esc(d.label)} — ${esc(d.caption)}"><img src="${esc(d.file)}" alt="" loading="lazy"><span><b>${esc(d.label)}</b><small>${esc(d.caption)}</small></span>${icon("expand")}</button>`).join("")}</div></div>` : ""}
        </div>
        <dl class="fact-grid">
          ${f.geometry ? `<div class="fact wide"><dt>Ground geometry</dt><dd><ul class="geo">${f.geometry.map(([k, v]) => `<li><span>${esc(k)}</span><b>${esc(v)}</b></li>`).join("")}</ul></dd></div>` : ""}
          <div class="fact"><dt>Funding source</dt><dd>${esc(f.funding)}</dd></div>
          <div class="fact"><dt>Completion status</dt><dd>${esc(f.status)}</dd></div>
          <div class="fact wide"><dt>Community benefit</dt><dd>${esc(f.benefit)}</dd></div>
          <div class="fact wide"><dt>Partners</dt><dd><div class="partner-list">${f.partners.map((p) => `<span>${esc(p)}</span>`).join("")}</div></dd></div>
        </dl>
      </div>
`;
  }

  /* ---------------- projects ---------------- */
  let projStatus = "", projArea = "";
  function renderAreas() {
    const areas = D.config.projectAreas.map((a) => {
      const ps = D.projects.filter((p) => p.area === a), active = ps.filter((p) => p.status !== "COMPLETED");
      const next = active.map((p) => p.targetDate).filter(Boolean).sort()[0];
      return { a, total: ps.length, active: active.length, next };
    }).filter((x) => x.total);
    $("#areaStrip").innerHTML = areas.map((x) => `<button class="area-tile${projArea === x.a ? " is-active" : ""}" data-area="${esc(x.a)}">
      <b>${esc(x.a)}</b><span>${x.total} ${x.total === 1 ? "project" : "projects"}</span>${x.next ? `<small>Target ${esc(x.next)}</small>` : (x.active ? `<small>Target TBD</small>` : `<small>${x.total} ${I18.t("Completed").toLowerCase()}</small>`)}</button>`).join("");
    $$("#areaStrip .area-tile").forEach((b) => b.addEventListener("click", () => { projArea = projArea === b.dataset.area ? "" : b.dataset.area; syncAreaChips(); renderProjects(); }));
    const row = $("#areaFilters");
    row.innerHTML = `<span class="chip-label">Area</span><button class="chip${projArea ? "" : " is-active"}" data-value="">All areas</button>` + areas.map((x) => `<button class="chip${projArea === x.a ? " is-active" : ""}" data-value="${esc(x.a)}">${esc(x.a)}</button>`).join("");
    $$("#areaFilters .chip").forEach((c) => { c.setAttribute("aria-pressed", String(c.dataset.value === projArea)); c.addEventListener("click", () => { projArea = c.dataset.value; syncAreaChips(); renderProjects(); }); });
  }
  function syncAreaChips() {
    $$("#areaFilters .chip").forEach((c) => { const on = c.dataset.value === projArea; c.classList.toggle("is-active", on); c.setAttribute("aria-pressed", String(on)); });
    $$("#areaStrip .area-tile").forEach((b) => b.classList.toggle("is-active", b.dataset.area === projArea));
  }
  function renderProjects() {
    const list = D.projects.filter((p) => (!projStatus || p.status === projStatus) && (!projArea || p.area === projArea));
    $("#projectGrid").innerHTML = list.map((p) => {
      return `<article class="project-card">
        <div class="status-row"><span class="status s-${slug(p.status)}">${esc(p.status)}</span>${p.area ? `<span class="tag">${esc(p.area)}</span>` : ""}</div>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.description)}</p>
        <div class="impact">${icon("impact")}<span>${esc(p.impact)}</span></div>
        <div class="project-meta">
          <div><b>Lead:</b> ${esc(p.lead)}</div>
          ${p.partners.length ? `<div><b>Partners:</b> ${p.partners.map(esc).join(", ")}</div>` : ""}
          <div><b>Volunteer:</b> ${esc(p.volunteer)}</div>
        </div>
        ${p.status === "COMPLETED" ? "" : `<p class="fund-line"><b>Funding needed:</b> TBD</p>`}
        ${p.status === "COMPLETED" ? `<a href="#featured" class="btn btn-outline btn-sm">See the story</a>` : `<a href="#connect" class="btn btn-primary btn-sm" data-topic="Fund a project" data-msg="I'd like to support the project: ${esc(p.title)}.%0A%0AHow I can help (funds, materials, volunteer time, introductions):%0A">Support This Project</a>`}
      </article>`;
    }).join("") || `<p class="empty-note" style="grid-column:1/-1">No projects with this status yet.</p>`;
  }
  $("#projectFilters").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip"); if (!chip) return;
    $$("#projectFilters .chip").forEach((c) => c.classList.toggle("is-active", c === chip));
    projStatus = chip.dataset.value; renderProjects();
  });

  /* ---------------- updates & subscribe ---------------- */
  let updFilter = "all";
  function renderUpdates() {
    const ups = [...(D.updates || [])].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    const sportsIn = [...new Set(ups.map((u) => u.sport).filter((x) => x && x !== "all"))];
    $("#updateFilters").innerHTML = `<button class="chip${updFilter === "all" ? " is-active" : ""}" data-value="all">All</button>` + sportsIn.map((id) => `<button class="chip${updFilter === id ? " is-active" : ""}" data-value="${id}"><i class="dot" style="background:${sport(id).color}"></i>${esc(sport(id).name)}</button>`).join("");
    $$("#updateFilters .chip").forEach((c) => { c.setAttribute("aria-pressed", String(c.dataset.value === updFilter)); c.addEventListener("click", () => { updFilter = c.dataset.value; renderUpdates(); }); });
    const list = ups.filter((u) => updFilter === "all" || u.sport === updFilter || u.sport === "all");
    $("#updateList").innerHTML = list.length ? list.map((u) => { const s = u.sport && u.sport !== "all" ? sport(u.sport) : null; const g = group(u.groupId);
      return `<article class="update" style="${s ? sportStyle(s.id) : "--sport:var(--ink-3)"}">
        <div class="update-meta"><time datetime="${esc(u.createdAt)}">${fmtDate(new Date(u.createdAt), { month: "short", day: "numeric" })}</time>${s ? `<span class="tag tag-sport">${esc(s.name)}</span>` : `<span class="tag">All</span>`}<span>${esc(g ? g.name : u.author)}</span></div>
        <h3>${esc(tr(u, "title"))}</h3><p>${esc(tr(u, "body"))}</p></article>`; }).join("") : `<p class="empty-note">No updates yet.</p>`;
  }
  function renderSubscribeSports() {
    const chosen = $$("#subscribeSports input:checked").map((i) => i.value);
    const on = (v) => (chosen.length ? chosen.indexOf(v) !== -1 : v === "all");
    $("#subscribeSports").innerHTML = `<label class="sub-all"><input type="checkbox" name="sports" value="all"${on("all") ? " checked" : ""}> <b>All sports</b></label>` +
      D.sports.map((s) => `<label><input type="checkbox" name="sports" value="${s.id}"${on(s.id) ? " checked" : ""}> ${esc(s.name)}</label>`).join("");
    const all = $('#subscribeSports input[value="all"]');
    $$("#subscribeSports input").forEach((i) => i.addEventListener("change", () => {
      if (i === all && all.checked) $$("#subscribeSports input").forEach((x) => { if (x !== all) x.checked = false; });
      else if (i !== all && i.checked) all.checked = false;
    }));
  }
  $("#subscribeForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target, st = $("#subscribeStatus"), email = f.email.value.trim();
    const sports = $$("#subscribeSports input:checked").map((i) => i.value);
    st.classList.remove("is-error");
    if (!f.email.checkValidity()) { st.textContent = I18.t("Please complete the required fields."); st.classList.add("is-error"); return; }
    if (!sports.length) { st.textContent = I18.t("Choose at least one sport or All sports."); st.classList.add("is-error"); return; }
    if (!API) { window.location.href = mailto(`Subscribe to Hjelte updates: ${sports.join(", ")}`, `Please add ${email} to updates for: ${sports.join(", ")}.`); st.textContent = I18.t("Email updates aren't switched on yet; check back soon."); return; }
    try { st.textContent = I18.t("Sending…"); const r = await api("subscribe", null, null, { email, sports }); st.textContent = I18.t(r.message || "Check your inbox to confirm your subscription."); f.reset(); renderSubscribeSports(); }
    catch (err) { st.textContent = err.message; st.classList.add("is-error"); }
  });

  /* ---------------- stewardship ---------------- */
  function renderStewardship() {
    const all = D.worklog || [];
    // Headline totals count verified, non-sample entries only — published numbers
    // on a civic page should never include placeholder rows.
    const w = all.filter((x) => !isSample(x));
    const hours = w.reduce((a, x) => a + Number(x.hours || 0), 0), vols = w.reduce((a, x) => a + Number(x.volunteers || 0), 0);
    $("#stewardStats").innerHTML = [[hours, "Volunteer hours"], [vols, "Volunteer shifts"], [w.length, "Work days"], ["TBD", "Materials & services"]].map(([v, l]) => `<li><strong>${v}</strong><span>${l}</span></li>`).join("");
    $("#worklogList").innerHTML = all.length ? [...all].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 8).map((x) => `<article class="work">
      <time>${x.date ? fmtDate(parseISO(x.date), { month: "short", day: "numeric", year: "numeric" }) : "—"}</time>
      <div><b>${esc(x.activity)}</b><span>${esc(x.organization)}${x.area ? ` · ${esc(x.area)}` : ""}${isSample(x) ? ' <span class="tag tag-example">Sample</span>' : ""}</span></div>
      <div class="work-nums"><span>${Number(x.hours || 0)} hrs</span><span>${Number(x.volunteers || 0)} people</span><span class="tag ${x.verified ? "tag-ok" : ""}">${x.verified ? "Verified" : "Pending"}</span></div></article>`).join("") : `<p class="empty-note">No work logged yet.</p>`;
    const byOrg = {}; w.forEach((x) => { byOrg[x.organization] = (byOrg[x.organization] || 0) + Number(x.hours || 0); });
    if (!Object.keys(byOrg).length) $("#orgBars").innerHTML = "";
    const rows = Object.entries(byOrg).sort((a, b) => b[1] - a[1]); const max = rows[0] ? rows[0][1] : 1;
    $("#orgBars").innerHTML = rows.map(([org, h]) => `<div class="org-bar"><span>${esc(org)}</span><i style="--pct:${h / max}"></i><b>${h} hrs</b></div>`).join("");
    requestAnimationFrame(() => $$("#orgBars i").forEach((b) => b.classList.add("in")));
  }

  /* ---------------- contribute ---------------- */
  function renderContribute() {
    const topicFor = { volunteer: "Volunteering", sponsor: "Sponsorship", equipment: "Equipment donation", collaborate: "Partnership proposal" };
    $("#contributeGrid").innerHTML = D.contribute.map((c) => `<article class="contribute-card">
      <span class="ic">${icon(c.icon)}</span><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p>
      <a href="${c.href || "#connect"}" class="btn ${c.href ? "btn-outline" : "btn-dark"} btn-sm" ${topicFor[c.id] ? `data-topic="${topicFor[c.id]}"` : ""}>${esc(c.cta)}</a></article>`).join("");
  }

  /* ---------------- connect ---------------- */
  function renderConnect() {
    const c = D.config;
    $("#infoList").innerHTML = [
      ["pin", "Address", `<a href="${c.mapsUrl}" target="_blank" rel="noopener">${esc(c.address)}</a>`],
      ["clock", "Facility hours", esc(c.hours)]
    ].map(([ic, t, v]) => `<div><dt><span class="ic">${icon(ic)}</span>${t}</dt><dd>${v}</dd></div>`).join("");
    $("#mapsLink").href = c.mapsUrl; $("#cityLink").href = c.cityPageUrl;
    $("#year").textContent = new Date().getFullYear();
  }

  /* schedule view switch — the week grid scrolls sideways on a phone, the
     day list reads better for "what is on today". Both stay available. */
  const schedSection = document.getElementById("schedule");
  $$(".sched-view .sv-btn").forEach((b) => b.addEventListener("click", () => {
    schedSection.dataset.view = b.dataset.view;
    $$(".sched-view .sv-btn").forEach((o) => {
      const on = o === b;
      o.classList.toggle("is-active", on);
      o.setAttribute("aria-pressed", on ? "true" : "false");
    });
    if (b.dataset.view === "grid") {
      const col = $("#weekGrid .wg-col.is-today") || $("#weekGrid .wg-col");
      if (col) col.scrollIntoView({ behavior: scrollBehavior(), inline: "start", block: "nearest" });
    }
  }));

  /* ---------------- community membership ---------------- */
  function renderMembership() {
    const M = D.membership; if (!M || !$("#memberForm")) return;
    $("#memberBenefits").innerHTML = M.benefits.map((b) => `<li>${esc(b)}</li>`).join("");
    $("#memberType").innerHTML = `<option value="">${I18.t("Select…")}</option>` +
      M.memberTypes.map((t) => `<option>${esc(t)}</option>`).join("");
    $("#memberInterests").innerHTML = M.interests.map((i, n) => `<label class="check-item">
      <input type="checkbox" name="interests" value="${esc(i.id)}"${n === 0 ? " checked" : ""}>
      <span><b>${esc(i.label)}</b><small>${esc(i.note)}</small></span></label>`).join("");
    // a group name only makes sense for the group and organization types
    const typeSel = $("#memberType"), wrap = $("#memberGroupWrap"), sizeWrap = $("#memberSizeWrap");
    typeSel.addEventListener("change", () => {
      const isGroup = typeSel.value && typeSel.value !== "Individual";
      wrap.hidden = !isGroup;
      wrap.querySelector("input").required = !!isGroup;
      sizeWrap.hidden = !isGroup;
      sizeWrap.querySelector("input").required = !!isGroup;
      if (!isGroup) sizeWrap.querySelector("input").value = "";
      updateRate();
    });
    $("#memberSizeWrap input").addEventListener("input", updateRate);
    updateRate();

    const pay = [
      { key: "monthly", title: "Monthly maintenance", text: `$${(D.membership.monthlyPerPerson * (1 + (D.membership.adminPct || 0) / 100)).toFixed(2)} per person per month — $${D.membership.monthlyPerPerson} toward the upkeep the City does not cover, plus ${D.membership.adminPct}% for administration and processing.`, cta: "Set up a monthly contribution", icon: "hands" },
      { key: "oneTime", title: "One-time toward a project", text: "Choose your own amount and pick the project it goes to — restrooms, irrigation, signage, or wherever it is needed most. That choice travels with the contribution.", cta: "Make a one-time contribution", icon: "target" }
    ];
    $("#payGrid").innerHTML = pay.map((o) => {
      const url = safeUrl((D.membership.stripe || {})[o.key]);
      return `<article class="pay-card">
        <span class="ic">${icon(o.icon)}</span>
        <h4>${esc(o.title)}</h4>
        <p>${esc(o.text)}</p>
        ${url
          ? `<a class="btn btn-primary btn-sm" href="${esc(url)}" target="_blank" rel="noopener">${esc(o.cta)}</a>`
          : `<p class="pay-pending">${I18.t("Opening soon — join the list above and we'll email you the moment contributions open.")}</p>`}
      </article>`;
    }).join("");
  }

  /* $10 a head, shown as it is entered so nobody is surprised at checkout */
  function updateRate() {
    const note = $("#rateNote"); if (!note) return;
    const M = D.membership || {};
    const rate = Number(M.monthlyPerPerson || 0), pct = Number(M.adminPct || 0);
    const each = rate * (1 + pct / 100);
    const usd = (v) => "$" + (Math.round(v * 100) / 100).toFixed(2).replace(/\.00$/, "");
    const input = $("#memberSizeWrap input");
    const n = input && !$("#memberSizeWrap").hidden ? Math.max(0, Math.round(Number(input.value) || 0)) : 0;
    note.innerHTML = n
      ? `<p><b>${n} ${n === 1 ? I18.t("person") : I18.t("people")} × ${usd(each)} = ${usd(n * each)} ${I18.t("per month")}</b> — ${usd(n * rate)} ${I18.t("toward upkeep plus")} ${pct}% ${I18.t("for administration and processing. An admin can change your headcount at any time and the amount follows it.")}</p>`
      : `<p>${I18.t("Monthly maintenance is")} <b>${usd(each)} ${I18.t("per person, per month")}</b> — ${usd(rate)} ${I18.t("toward upkeep plus")} ${pct}% ${I18.t("for administration and processing.")}</p>`;
  }

  /* the member form: same spam controls as the group form */
  const mCaptcha = { a: 0, b: 0 };
  function newMemberCaptcha() {
    const q = $("#memberCaptchaQuestion"); if (!q) return;
    mCaptcha.a = 2 + Math.floor(Math.random() * 8);
    mCaptcha.b = 1 + Math.floor(Math.random() * 8);
    q.textContent = `${mCaptcha.a} + ${mCaptcha.b} = ?`;
    const ts = $("#memberFormTs"); if (ts) ts.value = String(Date.now());
    const f = $('#memberForm [name="captcha"]'); if (f) f.value = "";
  }
  function initMemberForm() {
    const form = $("#memberForm"), statusEl = $("#memberFormStatus");
    if (!form) return;
    newMemberCaptcha();
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      $$(".field-error", form).forEach((n) => n.remove());
      const cf = form.querySelector('[name="captcha"]');
      cf.setCustomValidity(Number(String(cf.value).trim()) === mCaptcha.a + mCaptcha.b ? "" : I18.t("That answer is not right — please try the sum again."));
      const picked = $$('input[name="interests"]:checked', form).length;
      const box = $$('input[name="interests"]', form)[0];
      box.setCustomValidity(picked ? "" : I18.t("Pick at least one way you'd like to help."));
      $$("input, select, textarea", form).forEach((i) => { i.classList.add("touched"); i.setAttribute("aria-invalid", String(!i.checkValidity())); });
      if (!form.checkValidity()) {
        const bad = $$(":invalid", form).filter((f) => f.name);
        bad.forEach((f) => {
          const lbl = f.closest("label") || f.closest("fieldset") || f.parentElement;
          const id = "m-" + (f.name || "f") + "-err";
          if (!document.getElementById(id)) lbl.insertAdjacentHTML("beforeend", `<span class="field-error" id="${id}">${esc(f.validationMessage)}</span>`);
        });
        statusEl.textContent = I18.t("Please complete the required fields.") + ` (${bad.length})`;
        statusEl.classList.add("is-error");
        if (bad[0]) bad[0].focus();
        return;
      }
      statusEl.classList.remove("is-error");
      const fd = new FormData(form);
      const data = {
        name: fd.get("name"), email: fd.get("email"), phone: fd.get("phone"),
        memberType: fd.get("memberType"), groupName: fd.get("groupName") || "",
        orgSize: Number(fd.get("orgSize")) || 1,
        interests: fd.getAll("interests"), notes: fd.get("notes") || "",
        website2: fd.get("website2") || "", formTs: fd.get("formTs")
      };
      const done = () => {
        statusEl.textContent = I18.t("You're on the community list. Check your email for a confirmation.");
        form.reset(); $("#memberGroupWrap").hidden = true; $("#memberSizeWrap").hidden = true; newMemberCaptcha(); updateRate();
        renderMembership();
      };
      if (String(data.website2).trim() || Date.now() - Number(data.formTs || 0) < 3000) { done(); return; }
      if (API) {
        try {
          statusEl.textContent = I18.t("Sending…");
          await api("joinCommunity", data);
          done(); return;
        } catch (err) { statusEl.textContent = err.message; statusEl.classList.add("is-error"); return; }
      }
      window.location.href = mailto(`Hjelte community sign-up: ${data.name}`,
        [`Name: ${data.name}`, `Email: ${data.email}`, `Phone: ${data.phone}`,
         `Joining as: ${data.memberType}`, `Group: ${data.groupName || "—"}`, `People in group: ${data.orgSize}`,
         `Would like to help with: ${data.interests.join(", ") || "—"}`, "", data.notes || ""].join("\n"));
      statusEl.textContent = I18.t("Opening your email app with the details pre-filled. Send it to complete your sign-up.");
    });
  }
  initMemberForm();

  /* ---------------- lightbox ---------------- */
  /* One <dialog> serves every zoomable image: it lives in the top layer, so no
     stacking context can clip it, and Esc / backdrop click close it for free. */
  const lb = $("#lightbox"), lbImg = $("#lightboxImg"), lbCap = $("#lightboxCap");
  function openLightbox(src, caption, alt) {
    if (!lb || !src) return;
    lbImg.src = src; lbImg.alt = alt || caption || "";
    lbCap.textContent = caption || "";
    lbCap.hidden = !caption;
    if (typeof lb.showModal === "function") lb.showModal(); else lb.setAttribute("open", "");
    $("#lightboxClose").focus();
  }
  function closeLightbox() {
    if (!lb) return;
    if (typeof lb.close === "function") lb.close(); else lb.removeAttribute("open");
    lbImg.removeAttribute("src");
  }
  if (lb) {
    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-zoom]");
      if (!t) return;
      e.preventDefault();
      const img = t.querySelector("img");
      openLightbox(t.dataset.zoom, t.dataset.zoomCap || "", img ? img.alt : "");
    });
    $("#lightboxClose").addEventListener("click", closeLightbox);
    // clicking the backdrop (the dialog element itself, outside the figure) closes
    lb.addEventListener("click", (e) => { if (e.target === lb) closeLightbox(); });
    lb.addEventListener("close", () => lbImg.removeAttribute("src"));
  }

  /* ---------------- init ---------------- */
  function renderAll() {
    DAYS = I18.days; DAYS_S = I18.daysShort;
    fillGroupFilter();
    renderSports(); renderHappening(currentRange); renderSchedule(); renderLegend(); renderLastUpdated();
    renderGroups(); renderRoster(); renderFeatured(); renderAreas(); renderProjects(); renderContribute(); renderConnect();
    renderUpdates(); renderSubscribeSports(); renderStewardship(); renderMembership();
    $$("[data-count]").forEach((el) => { if (el.closest(".in")) countUp(el); });
  }
  window.HJELTE_RERENDER = renderAll;
  /* The diamonds are labelled 1–4 on this site. Sheet rows seeded before the
     change still say "Diamond A", so normalise the text fields on the way in
     rather than leaving the map and the schedule disagreeing. */
  const DIAMOND_NUM = { A: "1", B: "2", C: "3", D: "4" };
  function normalizeDiamonds() {
    const fix = (v) => typeof v === "string"
      ? v.replace(/\bDiamonds?\s+[A-D](\s*[–-]\s*[A-D])?\b/g, (m) => m.replace(/[A-D]/g, (c) => DIAMOND_NUM[c]))
      : v;
    const pass = (rows, keys) => (rows || []).forEach((r) => keys.forEach((k) => { r[k] = fix(r[k]); }));
    pass(D.schedule, ["title", "notes"]);
    pass(D.specialEvents, ["title", "note"]);
    pass(D.groups, ["description", "description_es"]);
    pass(D.updates, ["title", "body", "title_es", "body_es"]);
    pass(D.projects, ["title", "description", "impact"]);
    pass(D.worklog, ["activity"]);
  }

  normalizeDiamonds();
  renderMap(); renderAll(); observeReveals(); I18.init();
  loadRemote().then((ok) => { if (ok) { normalizeDiamonds(); renderAll(); observeReveals(); I18.apply(); } });
  // hero content should be visible immediately
  requestAnimationFrame(() => $$(".hero .reveal").forEach((el) => el.classList.add("in")));
  // deep link support: index.html#sport-cricket opens that sport's panel
  if (location.hash.startsWith("#sport-")) { const id = location.hash.slice(7); if (sport(id).id === id) openSport(id); }
})();
