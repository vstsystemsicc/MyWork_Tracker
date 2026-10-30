# Deploy MyWork Tracker for free

The app is **plain static files** — no server, no database, no build required.
`dist/` (or `mywork-tracker-site.zip`) is the entire website: ~60 KB zipped.

> **Your records never go to the host.** The server only delivers the files;
> work, tasks, notes and photos live in the browser storage of each device.

---

## This repository — `vstsystemsicc/MyWork_Tracker`

Already connected to GitHub. Publish the **repository root**:

- **Settings → Pages → Deploy from a branch → main → / (root) → Save**
- URL: `https://vstsystemsicc.github.io/MyWork_Tracker/`

The root already holds `index.html`, `css/`, `js/`, `icons/`, `manifest.webmanifest`
and `sw.js`, so no build step is needed for Pages. `dist/` and `site/` are
generated copies (`npm run build`) and are excluded from git.

To publish changes:

```powershell
git add -A
git commit -m "Update MyWork Tracker"
git push
```

---

## Step 0 — save your data first (do this once)

Browser storage is tied to the **address** (origin). Your current records live
under `http://192.168.1.4:5599`. A new website address starts empty.

1. On the phone/PC you used so far: **History → Backup → Export** → keep the
   downloaded `mywork-backup-YYYY-MM-DD.json`.
2. After deploying, open the new address → **History → Import** → pick that file.

Do the export **before** you switch, otherwise you will have to type the records
again.

---

## Option A — Netlify Drop (easiest, ~1 minute)

No git, no account needed to try; sign in free to keep it.

1. On the PC open <https://app.netlify.com/drop>.
2. Drag the **`dist` folder** (or `mywork-tracker-site.zip`) onto the page.
3. Wait for "Site deployed" → copy the URL, e.g.
   `https://calm-lemon-1a2b3c.netlify.app`.
4. Sign in (free) so the site is saved to your account; rename it in
   **Site configuration → Change site name**.
5. Open that URL on the phone → menu → **Add to Home screen**.

Free plan: ~100 GB bandwidth/month, HTTPS automatic, custom domain optional.
The `_headers` file keeps `sw.js` from being cached stale.

---

## Option B — GitHub Pages (free, permanent, versioned)

This project is already pushed to
`https://github.com/vstsystemsicc/MyWork_Tracker` on `main`. The site is served
from the **repository root** — `index.html` is at the top level, with `css/`,
`js/`, `icons/`, `manifest.webmanifest`, `sw.js` and `.nojekyll` beside it.

**One-time setup (only once):**

1. Open <https://github.com/vstsystemsicc/MyWork_Tracker/settings/pages>.
2. **Build and deployment → Source: Deploy from a branch.**
3. Branch **main**, folder **/ (root)** → **Save**.
4. Wait 1–2 minutes: `https://vstsystemsicc.github.io/MyWork_Tracker/`.

**Publishing an update:**

```powershell
cd "C:\Users\SOFTWARES\Documents\MyWork_Tracker"
git add -A
git commit -m "Update MyWork Tracker"
git push
```

GitHub Pages redeploys automatically. On the phone, pull to refresh — the
service worker is network-first, so the new version loads on the next visit.

`dist/` and `site/` are generated copies (`npm run build`) and are ignored by
git; only the source at the root is published.

GitHub Pages free limits: 1 GB site size, ~100 GB/month bandwidth, public repos.
The published folder is `site/`; `dist/` is a build artifact and the rest of the
project (tests, tools, screenshots) is not uploaded.

---

## Option C — Cloudflare Pages (fast, free direct upload)

1. Sign in at <https://dash.cloudflare.com> → **Workers & Pages → Create →
   Pages → Upload assets**.
2. Project name, then drag `dist` (or the zip) → **Deploy**.
3. URL: `https://<project>.pages.dev`. Add the phone's home screen from there.

Free: unlimited static bandwidth (fair use), custom domains, `_headers` support.

---

## Option D — Vercel

```powershell
npx vercel dist --prod
```

Sign in when the CLI asks; you get `https://<project>.vercel.app`. Free hobby
plan is plenty for this app.

---

## Which one should you use?

| Goal | Use |
| --- | --- |
| Online in one minute, no git | **Netlify Drop** |
| Stable free link, easy future updates | **GitHub Pages** |
| Fastest loading / most bandwidth | **Cloudflare Pages** |

All four give **free HTTPS**, which this app needs for the install-to-home-screen
prompt, offline caching and notification permission.

---

## After deploying

1. Open the new URL on the phone and **Add to Home screen**.
2. **History → Import** your backup file.
3. **More → Reminders → Turn on notifications** so reminders can appear.
4. Test one entry, then reload to confirm it persists.

## Updating the site later

```powershell
# after changing anything in index.html / css / js
npm run build
```

Then re-upload `dist`:

- Netlify: open the site → **Deploys** → drag the new `dist` again.
- GitHub Pages: `cd dist` → `git add .` → `git commit -m "Update"` → `git push`.
- Cloudflare Pages: **Create new deployment** → upload the new `dist`.

On the phone, pull to refresh. The service worker is network-first, so the new
version loads on the next visit; if it ever looks stale, close the app and reopen
it once.

---

## Good to know

- **Data is per address and per device.** `192.168.1.4:5599`,
  `my-app.netlify.app` and `username.github.io` are three separate storages.
  Use **Export / Import** to move records.
- **No account, no cloud, no tracking** — the host only serves files. Clearing
  the browser's site data deletes the records, so export a backup now and then.
- **Reminders** need the app open (or the next time you open it). A website
  cannot wake itself while closed.
- **HTTPS** comes with every option above; do not use a plain `http://` host for
  the installed app, because the service worker and notifications are disabled
  there.
- The free tiers are far above this app's usage; the site is about 330 KB
  including icons.
