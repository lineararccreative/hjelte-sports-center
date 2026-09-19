# Hjelte Sports Center — Community Sports Hub

A single-scroll, mobile-first community hub for **Hjelte Sports Center** (16200 Burbank Blvd., Encino, CA) in the Sepulveda Basin. Static HTML/CSS/JS, no build step, ready for GitHub Pages.

## Run it

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8080   # then visit http://localhost:8080
```

## Structure

```
index.html        public page (14 sections + header, footer, modal)
admin.html        admin center (sign-in, schedule, updates, groups, projects)
css/styles.css    design system: charcoal · off-white · grass · warm gold
css/admin.css     admin center layout
js/data.js        CONTENT + CONFIG — edit this to update the site
js/app.js         public behavior: schedule engine, directory, map, forms
js/admin.js       admin center behavior
js/i18n.js        English/Spanish dictionary and toggle
backend/Code.gs   Google Apps Script backend (Sheets-backed API)
backend/Seed.gs   one-time sample-data seeding
backend/SETUP.md  15-minute backend setup guide
assets/img/       photos and plans
.nojekyll         tells GitHub Pages to serve files as-is
```

## What's on the page

Sticky nav · hero with aerial and stats · about · nine sport cards · Today/This Week/Upcoming · **Latest Updates + email subscribe by sport** · filterable weekly schedule · group directory with **permit status** and a **full roster table** · add-your-group form · **to-scale facility map** · featured LA Cricket Ground development with plans · **Stewardship** (volunteer hours and materials by organization) · **project areas** (restrooms, facility updates…) and project cards · contribute · connect.

## Admin center

`admin.html`. Sign in with an emailed 6-digit code — no passwords. One **master admin** (teamla@losangelescricket.org) manages everything; **community admins** manage only the groups assigned to them: their group profile, their schedule blocks and events, their updates and their work-log entries. Set it up with `backend/SETUP.md`; until then the page says the backend isn't connected and the public site runs on the sample data in `js/data.js`.

## Spanish

Every visitor gets an EN/ES toggle in the header. Translations live in `js/i18n.js` as an English→Spanish dictionary; anything without a translation falls back to English. Admin-entered content (group descriptions, updates) has optional `_es` fields in the admin forms.

## Editing content (`js/data.js`)

| Key | What it drives |
|---|---|
| `config` | contact email, last-updated date, address, hours, permit phone, optional form endpoint |
| `images` | photo paths for hero, about, featured project phases and sport cards (empty = illustrated placeholder) |
| `sports` | the nine sport cards, their colors and typical activities |
| `facilities` | field list used by schedule filters and the map |
| `groups` | directory of organizations and community groups (`example: true` marks SAMPLE listings; `permitStatus` is `permitted` / `none` / `unknown`) |
| `schedule` | weekly recurring blocks: `day` 0–6 (Sun–Sat), `start`/`end` in 24h `"HH:MM"` |
| `specialEvents` | dated events (`"YYYY-MM-DD"`) shown in Today / This Week / Upcoming |
| `mapLocations` | hotspots on the illustrated map (x/y/w/h as % of the canvas) |
| `featured` | the Los Angeles Cricket Ground development story |
| `projects` | improvement projects with status, goal and amount raised |
| `worklog` | stewardship entries (hours, volunteers, materials) |
| `updates` | posts shown in Latest Updates and emailed to subscribers |
| `contribute` | the five "Help Improve Hjelte" cards |

`config.apiUrl` connects the site to the Apps Script backend; leave it empty to run on bundled data only.

### Sample data to replace
Every group except **Los Angeles Cricket** is a placeholder (`example: true`) and shows a small "Sample" tag. Replace them with real groups as submissions come in. Sample schedule blocks and special events reference those placeholder groups.

### Photos
Add files to `assets/img/` and set the path in `images`, e.g. `hero: "assets/img/hero-aerial.jpg"`. Suggested files: `hero-aerial.jpg` (≥ 2000 px wide), `about-aerial.jpg`, `lac-pitch-before.jpg`, `lac-pitch-during.jpg`, `lac-pitch-after.jpg`, `sport-<id>.jpg`. Set `config.showPhotoSlotLabels` to `false` to hide the filename tags on empty slots.

### Forms
Both forms open the visitor's email client with a pre-filled message to `config.contactEmail`. To collect submissions online instead, set `config.formEndpoint` to a Formspree / Netlify / Google Apps Script URL; the forms will POST there and fall back to email if it fails.

## Publish on GitHub Pages
1. Create a public repo (e.g. `hjelte-sports-center`) and push this folder to `main`.
2. Repo → Settings → Pages → Source: *Deploy from a branch* → `main` / `/ (root)`.
3. The site appears at `https://<user>.github.io/hjelte-sports-center/`. Point a custom domain later from the same settings page.

## Facility facts
Address, hours and permit-office phone come from the City of Los Angeles Department of Recreation and Parks page for Hjelte Sports Center. The facility map is an illustrated schematic for orientation only, not to scale.

## Disclaimer
Schedules and listings are a community information resource and may change. Official permits, posted park regulations and City of Los Angeles Department of Recreation and Parks requirements govern facility use. This hub is community-maintained and is not an official City website.
