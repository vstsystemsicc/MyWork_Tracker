# Roadmap — one feature at a time

Each step follows: **Input → Develop → Test → Fix → Complete → next feature.**
Nothing is added "because it might be useful"; a feature ships only when it is
usable on a phone.

---

## ✅ Step 1 — App shell + Dashboard (done)

**Built**
- Mobile-first shell: sticky header, bottom tab bar with active state, theme
  glow background, safe-area padding, page transitions, toasts.
- Dashboard, in this order: progress ring → counters → **Today's tasks**
  (overdue + due today) → **Today's work** → **Completed today** → **Upcoming**
  (future only, deadline first then priority).
- Quick-add sheet: **Project chips first**, then the day (Today / Tomorrow / any
  date), then the entry — as a Work log or a Task.
- Task completion toggle, record detail sheet with guarded delete.
- **Light + dark mode** with the purple accent, picked from More → Appearance;
  applied before first paint, saved per device automatically.
- Data layer: versioned localStorage store, default projects (CookieJet, CNC
  Machine, CA_Controller, General), backup export/import, defensive loading.
- Installable PWA shell, offline cache, 26 data tests + 132 browser checks.

**Verified**
- 26/26 data-layer tests, 132/132 browser checks, no console errors.
- Layout checked at 375×667, 430×932 and 1280×900; light and dark modes checked.

**Deliberately not included yet**
- Calendar view, project screens, reports.

---

## ✅ Step 2 — Daily Work Log (done)

**Built**
- `#/log`: search box, day navigation (‹ › plus a native calendar over the date),
  per-day summary (entries, photos, projects), the day's entries with photo
  thumbnails, and **Add work for this day**.
- Photos: up to 6 per entry, camera or gallery, compressed to a 1280 px JPEG
  (quality steps down if the file is heavy), removable before saving, viewable
  full-screen in a lightbox.
- Editing: **Edit** on any record reuses the same composer, prefilled, and keeps
  its photos. Delete still needs a second tap.
- Search across title and description for the whole history, with the record's
  date on every result.
- Storage safety: photos live inside the record; a full storage refuses the write
  and rolls back the entry instead of losing data.
- Day empty state, search empty state, and "record saved" counts.

**Verified**
- 26/26 data tests, 132/132 browser checks, no console errors.
- Covered: add with photo → thumbnail, compression to JPEG, edit keeps photo,
  search across days, lightbox open/close, empty day, photo survives reload,
  quota rollback (data test).

**Deliberately not included yet**
- Search is instant on every keystroke (no highlighting), no project filter yet,
  no bulk export UI.

---

## ✅ Step 3 — Future Planner (done)

**Built**
- `#/plan`: Overdue / Today / Tomorrow / This week / Later, each with counts and
  empty text, using the same task rows as the dashboard.
- Task composer opens from the planner with the due day, priority, project,
  notes and an optional reminder.
- Task detail can move a task to Today / Tomorrow / Next week in one tap.
- Planning works across month and year boundaries (`tasksGrouped` is date-key
  based).

**Verified** — grouping, priority order within a group, reschedule keeps one
record and moves it between groups.

---

## ✅ Step 4 — Projects (done)

**Built**
- `#/projects`: every project with its colour, open-task count and record count.
- Project detail: open tasks, recent work (with photos), **Add work** and
  **Add task** already scoped to that project.
- Create, rename, recolour, archive and restore. Duplicate names rejected;
  General cannot be archived; archived projects stay readable.

**Verified** — creation with colour, rename, archive/restore, duplicate-name and
General-archive guards (data tests).

---

## ✅ Step 5 — Ideas & Notes (done)

**Built**
- `#/ideas`: searchable note list, pinned notes first, quick capture sheet.
- Note sheet: title, body, pin toggle, delete with confirmation.
- Notes are plain text and stored with the rest of the data.

**Verified** — create, edit, pin ordering, search across title and body, delete.

---

## ✅ Step 6 — History & Reports (done)

**Built**
- `#/history`: rolling 7-day activity bars, This week / This month / Tasks done
  counters, month calendar coloured by activity (tap a day to open its log),
  active-days and photo counts.
- **Backup**: export a JSON file, import one after a confirmation sheet that
  shows what the file contains; storage-used readout.

**Verified** — calendar cells and counts match the records, month navigation,
click-through to the log, import replaces data only after confirming.

---

## ✅ Reminders (done)

- Any task can have a reminder date and time (set in the composer or from the
  task detail sheet).
- A reminder fires once, shows a toast and — if notifications are allowed — a
  system notification; missed reminders fire the next time the app opens.
- More → Reminders shows the next reminder, permission status and an enable
  button.
- Honest limitation: a browser cannot wake a closed app, so reminders are
  in-app/while-open rather than push notifications.

---

## Later / nice to have

- Swipe actions on list rows (complete, reschedule, delete).
- Project filter shared across log, planner and reports.
- Pinned notes on the dashboard.
- Undo for deletes (currently two-tap confirmation).
- Multiple device sync — requires a backend decision; out of scope for now.
