# Hjelte Sports Center — Community Sports Hub

A single-scroll, mobile-first community hub for **Hjelte Sports Center** (16200 Burbank Blvd., Encino, CA) in the Sepulveda Basin. Static HTML/CSS/JS, no build step, ready for GitHub Pages.

## Run it

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8080   # then visit http://localhost:8080
```

## Structure

```
index.html        page markup (12 sections + header, footer, modal)
css/styles.css    design system: charcoal · off-white · grass · warm gold
js/data.js        ALL CONTENT lives here — edit this to update the site
js/app.js         behavior: nav, schedule engine, directory filters, map, forms
assets/img/       drop photos here (see below)
.nojekyll         tells GitHub Pages to serve files as-is
```

## Editing content (`js/data.js`)

| Key | What it drives |
|---|---|
| `config` | contact email, last-updated date, address, hours, permit phone, optional form endpoint |
| `images` | photo paths for hero, about, featured project phases and sport cards (empty = illustrated placeholder) |
| `sports` | the nine sport cards, their colors and typical activities |
| `facilities` | field list used by schedule filters and the map |
| `groups` | directory of organizations and community groups (`example: true` marks SAMPLE listings) |
| `schedule` | weekly recurring blocks: `day` 0–6 (Sun–Sat), `start`/`end` in 24h `"HH:MM"` |
| `specialEvents` | dated events (`"YYYY-MM-DD"`) shown in Today / This Week / Upcoming |
| `mapLocations` | hotspots on the illustrated map (x/y/w/h as % of the canvas) |
| `featured` | the Los Angeles Cricket Ground development story |
| `projects` | improvement projects with status, goal and amount raised |
| `contribute` | the five "Help Improve Hjelte" cards |

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
