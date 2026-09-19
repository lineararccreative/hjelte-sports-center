# Backend setup — Google Sheets + Apps Script

The public page works on its own with the sample data in `js/data.js`. Connect this backend and you get: the admin center, per-group schedule editing, email updates by sport, group submissions landing in a queue, and a work log that feeds the Stewardship totals. Free with a normal Google account. Budget about 15 minutes.

Everything runs under **teamla@losangelescricket.org** — sign in as that account for all of it.

---

## 1. Create the spreadsheet

1. Go to <https://sheets.new> and name it **Hjelte Hub Data**.
2. **Extensions → Apps Script**. A script editor opens in a new tab.

## 2. Paste the code

1. In the editor, select everything in `Code.gs` and replace it with the contents of **`backend/Code.gs`** from this repo.
2. Click the **+** next to *Files* → **Script**, name it `Seed`, and paste the contents of **`backend/Seed.gs`**.
3. Click **Save** (disk icon).

## 3. Build the sheets

1. In the function dropdown at the top, pick **`setup`** → **Run**.
2. Google asks for permission the first time: **Review permissions** → choose the account → *Advanced* → *Go to (unsafe)* → **Allow**. (The "unsafe" warning is normal for a script you wrote yourself and haven't published.)
3. Switch back to the spreadsheet — you now have tabs for Groups, Schedule, Events, Updates, Subscribers, Projects, WorkLog, Admins, Submissions, Auth and Meta, and your email is in **Admins** as `master`.

## 4. Load the sample content (optional but recommended)

Pick **`seedSampleData`** → **Run**. This copies the sample groups, schedule, events, updates, projects and work log into the sheet so the admin center has something to show. Later, after real groups are in, run **`clearSampleData`** to delete every placeholder at once.

## 5. Deploy as a web app

1. **Deploy → New deployment** → gear icon → **Web app**.
2. Description: `Hjelte hub API`. **Execute as: Me**. **Who has access: Anyone**.
3. **Deploy**, approve if asked, then **copy the Web app URL** (ends in `/exec`).

> "Anyone" means the page can read published data and accept submissions without visitors signing in to Google. Admin actions still require the emailed sign-in code, and only addresses in the Admins sheet can get one.

## 6. Connect the website

In `js/data.js`, set:

```js
apiUrl: "https://script.google.com/macros/s/AKfy.../exec",
```

Commit and push. The public page now loads live data from the sheet (and falls back to the bundled sample data if the script is unreachable), and `admin.html` accepts sign-ins.

## 7. Sign in

Open `admin.html`, enter **teamla@losangelescricket.org**, and use the 6-digit code emailed to you. Codes expire in 10 minutes; a session lasts 30 days on that device.

---

## Roles

| | Master admin | Community admin |
|---|---|---|
| Groups | add, edit, delete any | edit only their assigned group(s) |
| Permit status & category | yes | no |
| Schedule & events | any group | only their group(s) |
| Updates | any sport, hub-wide | only for their group |
| Work log | add and **verify** | add (shows Pending until verified) |
| Projects | full control | view only |
| Submissions, admins, subscribers | yes | no |

Add a community admin: **Admins → + Add admin**, enter their email, tick the groups they manage. They get an invitation email and sign in the same way. Approving a submission can create their admin account in one step.

## Email digests

A daily trigger (7 AM) runs `sendDailyDigest`: for each confirmed subscriber it collects updates posted in the last day and events in the next 7 days that match their chosen sports, and sends one email. Nothing matching means no email. **Subscribers → Send digest now** fires it manually.

Gmail's free quota is roughly **100 emails/day** (Workspace: 1,500). The admin center shows the remaining quota. Past that, move to a mail service such as Resend or Mailgun and swap the `MailApp.sendEmail` calls.

## Changing things later

- **Edit the sheet directly** for bulk fixes — the site reads whatever is there. Keep the header row intact and use `|` to separate list values (badges, days, partners).
- **Re-deploy after editing the code**: Deploy → Manage deployments → pencil → Version: New version → Deploy. The URL stays the same.
- **Sports, facilities and map locations** live in `js/data.js`, not the sheet — edit and push.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Admin center says "Backend not connected yet" | `config.apiUrl` is still empty in `js/data.js`. |
| "Sign in required" right after signing in | The deployment is set to *Execute as: Me* but access isn't *Anyone*, so the browser request never reaches the script. Re-deploy with both settings. |
| No sign-in code arrives | Check the address is in the Admins sheet, spelled exactly; check Gmail's quota in the admin center; check spam. |
| Public page shows sample data | Open the `/exec` URL with `?action=data` — you should see JSON. If it shows an error, re-run `setup`. |
| Changes don't appear on the site | Hard refresh. The page fetches with `no-store`, but a CDN or service worker may cache. |
