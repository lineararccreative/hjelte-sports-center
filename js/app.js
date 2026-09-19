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
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const DAYS_S = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const fmtTime = (t) => { let [h, m] = t.split(":").map(Number); const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; return m ? `${h}:${String(m).padStart(2, "0")} ${ap}` : `${h} ${ap}`; };
  const fmtRange = (a, b) => `${fmtTime(a)} – ${fmtTime(b)}`;
  const isoDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const parseISO = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const fmtDate = (d, opts = { weekday: "long", month: "long", day: "numeric" }) => d.toLocaleDateString("en-US", opts);
  const money = (n) => "$" + Number(n).toLocaleString("en-US");
  const sport = (id) => D.sports.find((s) => s.id === id) || D.sports[D.sports.length - 1];
  const group = (id) => D.groups.find((g) => g.id === id) || null;
  const facility = (id) => D.facilities.find((f) => f.id === id) || null;
  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const sportStyle = (id) => { const s = sport(id); return `--sport:${s.color};--sport-tint:${s.color}22`; };
  const badgeClass = (b) => {
    const k = b.toUpperCase();
    if (k.includes("PERMITTED")) return "permitted";
    if (k.includes("COMMUNITY GROUP")) return "community-group";
    if (k.includes("YOUTH")) return "youth";
    if (k.includes("LEAGUE")) return "league";
    if (k.includes("CLUB")) return "club";
    if (k.includes("NONPROFIT")) return "nonprofit";
    if (k.includes("OPEN")) return "open-rec";
    return "";
  };
  const mailto = (subject, body) => `mailto:${D.config.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body || "")}`;

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
  $("#toTop").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

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
  let lastFocus = null;
  function openModal(html) {
    lastFocus = document.activeElement;
    modalBody.innerHTML = html; modal.hidden = false; document.body.style.overflow = "hidden";
    $(".modal-close", modal).focus();
  }
  function closeModal() { modal.hidden = true; document.body.style.overflow = ""; if (lastFocus) lastFocus.focus(); }
  modal.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) closeModal(); });

  /* ---------------- sports ---------------- */
  function renderSports() {
    $("#sportGrid").innerHTML = D.sports.map((s) => {
      const n = D.groups.filter((g) => g.sport === s.id).length;
      return `<button class="sport-card reveal" style="${sportStyle(s.id)}" data-sport="${s.id}" aria-haspopup="dialog">
        <span class="sport-bar"></span>
        <div class="sport-visual" data-image="sports" data-sub="${s.id}" data-label="sport-${s.id}.jpg"><span class="ic">${icon(s.icon)}</span></div>
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
    const rec = D.schedule.filter((e) => e.day === dow).map((e) => ({ ...e, date: iso }));
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
        <div class="activity-title">${esc(titleOf(e))} ${g && g.example ? '<span class="tag tag-example">Sample</span>' : ""} ${e.special ? '<span class="tag" style="background:var(--gold-light);color:var(--gold-dark)">Special</span>' : ""}</div>
        <div class="activity-meta">
          <span class="tag tag-sport">${esc(s.name)}</span>
          <span class="tag">${esc(e.type)}</span>
          <span class="tag tag-cat ${e.category}">${esc(D.categories[e.category]?.label || e.category)}</span>
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
  $$(".tabs .tab").forEach((t) => t.addEventListener("click", () => {
    $$(".tabs .tab").forEach((x) => { x.classList.toggle("is-active", x === t); x.setAttribute("aria-selected", String(x === t)); });
    renderHappening(t.dataset.range);
  }));

  // Weekly master schedule
  const sched = { sport: "", day: "", facility: "", type: "", group: "", category: "" };
  const filtersForm = $("#scheduleFilters");
  function fillSelect(sel, opts) { opts.forEach(([v, l]) => { const o = document.createElement("option"); o.value = v; o.textContent = l; sel.appendChild(o); }); }
  fillSelect(filtersForm.sport, D.sports.map((s) => [s.id, s.name]));
  fillSelect(filtersForm.day, DAYS.map((d, i) => [String(i), d]));
  fillSelect(filtersForm.facility, D.facilities.map((f) => [f.id, f.name]));
  fillSelect(filtersForm.type, D.activityTypes.map((t) => [t, t]));
  fillSelect(filtersForm.group, D.groups.map((g) => [g.id, g.name + (g.example ? " (sample)" : "")]));
  fillSelect(filtersForm.category, Object.entries(D.categories).map(([k, v]) => [k, v.label]));
  filtersForm.addEventListener("change", () => { Object.keys(sched).forEach((k) => sched[k] = filtersForm[k].value); renderSchedule(); });
  filtersForm.addEventListener("reset", () => setTimeout(() => { Object.keys(sched).forEach((k) => sched[k] = ""); renderSchedule(); }, 0));
  function setScheduleFilter(key, val) { filtersForm[key].value = val; sched[key] = val; renderSchedule(); }

  function filteredSchedule() {
    return D.schedule.filter((e) =>
      (!sched.sport || e.sport === sched.sport) &&
      (!sched.day || String(e.day) === sched.day) &&
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
    grid.style.gridTemplateColumns = `56px repeat(${days.length}, 1fr)`;
    const bodyH = (END - START) / 60 * HOUR_H;
    let html = `<div class="wg-head"></div>` + days.map((d) => `<div class="wg-head${d === today.getDay() ? " is-today" : ""}">${DAYS_S[d]}${d === today.getDay() ? "<em>Today</em>" : ""}</div>`).join("");
    html += `<div class="wg-gutter" style="height:${bodyH}px">` + Array.from({ length: (END - START) / 60 + 1 }, (_, i) => `<span style="top:${i * HOUR_H}px">${fmtTime(`${String(6 + i).padStart(2, "0")}:00`)}</span>`).join("") + `</div>`;
    html += days.map((d) => {
      const evs = lanes(items.filter((e) => e.day === d));
      return `<div class="wg-col${d === today.getDay() ? " is-today" : ""}" style="height:${bodyH}px;--hour-h:${HOUR_H}px">` + evs.map(({ e, lane, n }) => {
        const top = (toMin(e.start) - START) / 60 * HOUR_H, h = (toMin(e.end) - toMin(e.start)) / 60 * HOUR_H;
        const w = 100 / n, f = facility(e.facility);
        return `<button class="wg-event ${e.category}" style="${sportStyle(e.sport)};top:${top + 1}px;height:${h - 3}px;left:calc(${lane * w}% + 3px);width:calc(${w}% - 6px)" data-idx="${D.schedule.indexOf(e)}" title="${esc(titleOf(e))} · ${fmtRange(e.start, e.end)}">
          <b>${esc(titleOf(e))}</b><span>${fmtRange(e.start, e.end)}</span><span>${esc(f ? f.name : "")}</span></button>`;
      }).join("") + `</div>`;
    }).join("");
    grid.innerHTML = html;
    $$(".wg-event", grid).forEach((b) => b.addEventListener("click", () => openEvent(D.schedule[Number(b.dataset.idx)])));

    list.innerHTML = days.map((d) => {
      const evs = items.filter((e) => e.day === d).sort((a, b) => toMin(a.start) - toMin(b.start));
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
      <div class="activity-meta" style="margin-bottom:14px"><span class="tag tag-sport">${esc(s.name)}</span><span class="tag">${esc(e.type)}</span><span class="tag tag-cat ${e.category}">${esc(D.categories[e.category]?.label || "")}</span></div>
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
  (function lastUpdated() {
    const el = $("#lastUpdated");
    const d = D.config.lastUpdated ? parseISO(D.config.lastUpdated) : new Date(document.lastModified);
    el.dateTime = isoDate(d); el.textContent = fmtDate(d, { month: "long", day: "numeric", year: "numeric" });
  })();

  /* ---------------- directory ---------------- */
  const dir = { q: "", sport: "", ages: "", level: "", category: "", when: "" };
  const sportRow = $('#groupFilters [data-filter="sport"]');
  sportRow.insertAdjacentHTML("beforeend", `<button class="chip is-active" data-value="">All</button>` + D.sports.map((s) => `<button class="chip" data-value="${s.id}"><i class="dot" style="background:${s.color}"></i>${esc(s.name)}</button>`).join(""));
  $("#groupFilters").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip"); if (!chip) return;
    const row = chip.closest(".chip-row"); setGroupFilter(row.dataset.filter, chip.dataset.value);
  });
  function setGroupFilter(key, val) {
    const row = $(`#groupFilters [data-filter="${key}"]`);
    $$(".chip", row).forEach((c) => c.classList.toggle("is-active", c.dataset.value === val));
    dir[key] = val; renderGroups();
  }
  $("#groupSearch").addEventListener("input", (e) => { dir.q = e.target.value.trim().toLowerCase(); renderGroups(); });
  fillSelect($("#formSport"), D.sports.map((s) => [s.name, s.name]));

  function groupMatches(g) {
    const hay = `${g.name} ${sport(g.sport).name} ${g.programType} ${g.description} ${g.badges.join(" ")}`.toLowerCase();
    const weekend = g.days.some((d) => d === 0 || d === 6), weekday = g.days.some((d) => d >= 1 && d <= 5);
    return (!dir.q || hay.includes(dir.q)) && (!dir.sport || g.sport === dir.sport) && (!dir.ages || g.ages === dir.ages) &&
      (!dir.level || g.level === dir.level) && (!dir.category || g.category === dir.category) &&
      (!dir.when || (dir.when === "weekend" ? weekend : weekday));
  }
  function groupCard(g) {
    const s = sport(g.sport);
    const contactHref = g.email ? `mailto:${g.email}?subject=${encodeURIComponent("Hello from the Hjelte community hub")}` : mailto(`Contact request: ${g.name}`, `I'd like to get in touch with ${g.name} (listed on the Hjelte Sports Center hub).\n\nMy message:\n`);
    return `<article class="group-card" style="${sportStyle(g.sport)}" data-id="${g.id}">
      ${g.example ? '<span class="tag tag-example sample-tag" title="Placeholder listing to be replaced with a real group">Sample</span>' : ""}
      <div class="group-top">
        <div class="logo-tile">${g.logo ? `<img src="${esc(g.logo)}" alt="">` : esc(g.short)}</div>
        <div><div class="group-name">${esc(g.name)}</div><div class="group-sport">${icon(s.icon)} ${esc(s.name)}</div></div>
      </div>
      <div class="badges">${g.badges.map((b) => `<span class="badge ${badgeClass(b)}">${esc(b)}</span>`).join("")}</div>
      <p class="group-desc">${esc(g.description)}</p>
      <div class="group-meta">
        <div>${icon("tag")}<span><b>${esc(g.programType)}</b></span></div>
        <div>${icon("users")}<span>${esc(g.ages)} · ${esc(g.level)}</span></div>
        <div>${icon("calendar")}<span>${g.days.map((d) => DAYS_S[d]).join(" · ")}</span></div>
        <div>${icon("clock")}<span>${esc(g.times)}</span></div>
      </div>
      <div class="group-links">
        <a class="btn btn-dark" href="${contactHref}">${icon("mail")} Contact</a>
        ${g.website ? `<a class="link-icon" href="${esc(g.website)}" target="_blank" rel="noopener">${icon("globe")} Website</a>` : ""}
        ${g.social ? `<a class="link-icon" href="${esc(g.social)}" target="_blank" rel="noopener">${icon("instagram")} ${esc(g.socialHandle || "Social")}</a>` : ""}
      </div></article>`;
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
      $$("input, select, textarea", form).forEach((i) => i.classList.add("touched"));
      if (!form.checkValidity()) { statusEl.textContent = "Please complete the required fields."; statusEl.classList.add("is-error"); const bad = $(":invalid", form); if (bad) bad.focus(); return; }
      statusEl.classList.remove("is-error");
      const fd = new FormData(form);
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
  handleForm($("#groupForm"), $("#groupFormStatus"),
    (fd) => `Hjelte directory submission: ${fd.get("groupName")}`,
    (fd) => ["GROUP LISTING REQUEST — Hjelte Sports Center Community Hub", "",
      ...["groupName:Group Name", "sport:Sport", "orgType:Organization Type", "contact:Primary Contact", "email:Email", "phone:Phone", "website:Website", "social:Instagram / Social", "days:Typical Days", "times:Typical Times", "participants:Approx. Participants", "ages:Youth / Adult / Mixed", "description:Description", "permit:Holds facility permit"].map((p) => { const [k, l] = p.split(":"); return `${l}: ${fd.get(k) || "—"}`; }),
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
    D.mapLocations.forEach((loc) => {
      const cx = loc.x / 100 * W, cy = loc.y / 100 * H;
      const g = svgEl("g", { class: "hotspot", tabindex: "0", role: "button", "aria-label": loc.name, "data-id": loc.id });
      if (loc.sport) g.style.setProperty("--sport-fill", sport(loc.sport).color + "AA");
      if (loc.shape === "diamond") {
        const r = loc.r / 100 * W;
        const field = svgEl("g", { transform: `translate(${cx} ${cy})` });
        field.appendChild(svgEl("rect", { class: "shape", x: -r, y: -r, width: r * 2, height: r * 2, rx: 6, transform: "rotate(45)" }));
        field.appendChild(svgEl("rect", { x: -r * .5, y: -r * .5, width: r, height: r, rx: 3, transform: "rotate(45)", fill: "rgba(255,255,255,.35)" }));
        field.appendChild(svgEl("circle", { r: r * .12, fill: "rgba(255,255,255,.7)" }));
        g.appendChild(field);
        const t = svgEl("text", { x: cx, y: cy + 30, "text-anchor": "middle" }); t.textContent = loc.name.replace("Softball ", "").replace("Baseball ", ""); g.appendChild(t);
        shapes.appendChild(g);
      } else if (loc.shape === "rect" || loc.shape === "pitch") {
        const x = loc.x / 100 * W, y = loc.y / 100 * H, w = loc.w / 100 * W, h = loc.h / 100 * H;
        if (loc.shape === "pitch") {
          g.appendChild(svgEl("ellipse", { cx: x + w / 2, cy: y + h / 2, rx: w * 2.4, ry: h * .8, fill: "none", stroke: "rgba(255,255,255,.55)", "stroke-width": 2, "stroke-dasharray": "6 6" }));
          g.appendChild(svgEl("rect", { class: "shape", x, y, width: w, height: h, rx: 3 }));
          g.style.setProperty("--sport-fill", "#D8C48A");
        } else {
          g.appendChild(svgEl("rect", { class: "shape", x, y, width: w, height: h, rx: 8 }));
          if (loc.id.startsWith("turf")) { g.appendChild(svgEl("path", { d: `M${x + w / 2} ${y} V${y + h}`, stroke: "rgba(255,255,255,.55)", "stroke-width": 2 })); g.appendChild(svgEl("circle", { cx: x + w / 2, cy: y + h / 2, r: Math.min(w, h) * .18, fill: "none", stroke: "rgba(255,255,255,.55)", "stroke-width": 2 })); }
          if (loc.id === "parking") for (let i = 1; i < 14; i++) g.appendChild(svgEl("path", { d: `M${x + i * (w / 14)} ${y + 6} V${y + h - 6}`, stroke: "rgba(255,255,255,.4)", "stroke-width": 1.5 }));
        }
        const t = svgEl("text", { x: x + w / 2, y: loc.shape === "pitch" ? y - 10 : y + h / 2 + 4, "text-anchor": "middle" }); t.textContent = loc.shape === "pitch" ? "Cricket" : loc.name.replace("Multi-Use ", "").replace("Open Recreation ", ""); g.appendChild(t);
        shapes.appendChild(g);
      } else {
        const glyph = { Entrance: "M12 4v16M5 12l7 7 7-7", Restrooms: "M9 5a2 2 0 1 0 0 .01M15 5a2 2 0 1 0 0 .01M7 9h4v6l1 5M17 9h-4l-1 6-1 5", Seating: "M4 9h16v3H4zM6 12v7M18 12v7M4 15h16", Path: "M6 20c4-6 8-2 12-8" }[loc.kind] || "M12 8v8M8 12h8";
        const pg = svgEl("g", { transform: `translate(${cx} ${cy})` });
        pg.appendChild(svgEl("circle", { class: "pin-body", r: 15 }));
        pg.appendChild(svgEl("path", { class: "pin-glyph", d: glyph, transform: "translate(-9 -9) scale(.75)", fill: "none", stroke: "#1C1F22", "stroke-width": 2.2, "stroke-linecap": "round", "stroke-linejoin": "round" }));
        g.appendChild(pg);
        const t = svgEl("text", { x: cx, y: cy + 32, "text-anchor": "middle" }); t.textContent = loc.kind === "Entrance" ? (loc.id === "entranceMain" ? "Main Entrance" : "East Access") : loc.name; g.appendChild(t);
        pins.appendChild(g);
      }
      g.addEventListener("click", () => selectLocation(loc.id));
      g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectLocation(loc.id); } });
    });
    $("#mapChips").innerHTML = D.mapLocations.map((l) => `<button class="chip" data-loc="${l.id}">${l.sport ? `<i class="dot" style="background:${sport(l.sport).color}"></i>` : ""}${esc(l.name)}</button>`).join("");
    $$("#mapChips .chip").forEach((c) => c.addEventListener("click", () => selectLocation(c.dataset.loc)));
  }
  function selectLocation(id) {
    const loc = D.mapLocations.find((l) => l.id === id);
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
    if (window.innerWidth < 1024) $("#mapCard").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  /* ---------------- featured ---------------- */
  function phaseArt(i) {
    const base = `<svg class="ph-art" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><pattern id="ph${i}" width="26" height="300" patternUnits="userSpaceOnUse" patternTransform="rotate(-6)"><rect width="13" height="300" fill="#2B6B42"/><rect x="13" width="13" height="300" fill="#2F7449"/></pattern></defs><rect width="400" height="300" fill="url(#ph${i})"/>`;
    if (i === 0) return base + `</svg>`;
    if (i === 1) return base + `<rect x="170" y="40" width="60" height="220" fill="#7A5A3A"/><rect x="176" y="46" width="48" height="208" fill="#8F6B45"/><path d="M150 40h100M150 260h100" stroke="#F1EEE6" stroke-width="2" stroke-dasharray="8 6"/></svg>`;
    return base + `<rect x="178" y="40" width="44" height="220" fill="#D8C48A"/><path d="M178 70h44M178 230h44M200 70v-12M200 230v12" stroke="#fff" stroke-width="2"/><ellipse cx="200" cy="150" rx="150" ry="120" fill="none" stroke="#F1EEE6" stroke-width="2" opacity=".6"/></svg>`;
  }
  function renderFeatured() {
    const f = D.featured;
    $("#featuredCard").innerHTML = `
      <div class="featured-phases">${f.phases.map((p, i) => `<figure class="phase" data-image="${p.key}" data-label="lac-pitch-${["before", "during", "after"][i]}.jpg">${phaseArt(i)}<figcaption class="phase-label"><i>${i + 1}</i>${esc(p.label)}</figcaption><p class="phase-cap">${esc(p.caption)}</p></figure>`).join("")}</div>
      <div class="featured-body">
        <div>
          <p class="eyebrow">${icon("check")} ${esc(f.status)}</p>
          <h3>${esc(f.title)}</h3>
          <p class="sub">${esc(f.subtitle)}</p>
          <p class="desc">${esc(f.description)}</p>
          <div class="featured-lead"><span class="logo-tile" style="--sport:${sport("cricket").color}">LAC</span> Developed by ${esc(f.lead)}</div>
        </div>
        <dl class="fact-grid">
          <div class="fact"><dt>Funding source</dt><dd>${esc(f.funding)}</dd></div>
          <div class="fact"><dt>Completion status</dt><dd>${esc(f.status)}</dd></div>
          <div class="fact wide"><dt>Community benefit</dt><dd>${esc(f.benefit)}</dd></div>
          <div class="fact wide"><dt>Partners</dt><dd><div class="partner-list">${f.partners.map((p) => `<span>${esc(p)}</span>`).join("")}</div></dd></div>
        </dl>
      </div>`;
    $$("#featuredCard .phase").forEach((ph) => applyImage(ph, ph.dataset.image));
  }

  /* ---------------- projects ---------------- */
  let projStatus = "";
  function renderProjects() {
    const list = D.projects.filter((p) => !projStatus || p.status === projStatus);
    $("#projectGrid").innerHTML = list.map((p) => {
      const pct = p.goal ? Math.min(1, (p.raised || 0) / p.goal) : null;
      return `<article class="project-card">
        <span class="status s-${slug(p.status)}">${esc(p.status)}</span>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.description)}</p>
        <div class="impact">${icon("impact")}<span>${esc(p.impact)}</span></div>
        <div class="project-meta">
          <div><b>Lead:</b> ${esc(p.lead)}</div>
          ${p.partners.length ? `<div><b>Partners:</b> ${p.partners.map(esc).join(", ")}</div>` : ""}
          <div><b>Volunteer:</b> ${esc(p.volunteer)}</div>
        </div>
        ${pct !== null ? `<div class="progress"><div class="progress-bar"><i style="--pct:${pct}"></i></div><div class="progress-text"><span><b>${money(p.raised || 0)}</b> raised</span><span>Goal ${money(p.goal)}</span></div></div>` : ""}
        ${p.status === "COMPLETED" ? `<a href="#featured" class="btn btn-outline btn-sm">See the story</a>` : `<a href="#connect" class="btn btn-primary btn-sm" data-topic="Fund a project" data-msg="I'd like to support the project: ${esc(p.title)}.%0A%0AHow I can help (funds, materials, volunteer time, introductions):%0A">Support This Project</a>`}
      </article>`;
    }).join("") || `<p class="empty-note" style="grid-column:1/-1">No projects with this status yet.</p>`;
    requestAnimationFrame(() => $$("#projectGrid .progress-bar i").forEach((b) => b.classList.add("in")));
  }
  $("#projectFilters").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip"); if (!chip) return;
    $$("#projectFilters .chip").forEach((c) => c.classList.toggle("is-active", c === chip));
    projStatus = chip.dataset.value; renderProjects();
  });

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
      ["clock", "Facility hours", esc(c.hours)],
      ["phone", "Permit office (City of LA Rec & Parks)", `<a href="tel:${c.permitOfficePhone.replace(/\D/g, "")}">${esc(c.permitOfficePhone)}</a>`],
      ["mail", "Community hub email", `<a href="mailto:${c.contactEmail}">${esc(c.contactEmail)}</a>`],
      ["info", "Region", esc(c.region)]
    ].map(([ic, t, v]) => `<div><span class="ic">${icon(ic)}</span><div><dt>${t}</dt><dd>${v}</dd></div></div>`).join("");
    $("#mapsLink").href = c.mapsUrl; $("#cityLink").href = c.cityPageUrl;
    $("#year").textContent = new Date().getFullYear();
  }

  /* ---------------- init ---------------- */
  renderSports(); renderHappening("today"); renderSchedule(); renderLegend();
  renderGroups(); renderMap(); renderFeatured(); renderProjects(); renderContribute(); renderConnect();
  observeReveals();
  // hero content should be visible immediately
  requestAnimationFrame(() => $$(".hero .reveal").forEach((el) => el.classList.add("in")));
  // deep link support: index.html#sport-cricket opens that sport's panel
  if (location.hash.startsWith("#sport-")) { const id = location.hash.slice(7); if (sport(id).id === id) openSport(id); }
})();
