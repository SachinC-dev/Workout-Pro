# Workout Tracker

A small, local-first workout tracking web app. Users can define exercises with sets and reps and mark exercises done using a checkbox. Data is saved to the browser's `localStorage`.

Files
- [workout-pro/index.html](workout-pro/index.html)
- [workout-pro/style.css](workout-pro/style.css)
- [workout-pro/app.js](workout-pro/app.js)

Quick start
1. Open [workout-pro/index.html](workout-pro/index.html) in your browser (double-click or drag into browser).

Optional: serve with a local static server for better behavior:

```bash
# Python 3
cd workout-app
python -m http.server 8000
# then open http://localhost:8000
# Workout Tracker

A small, local-first workout tracking web app. Users can define exercises with sets and reps and mark exercises done using a checkbox. Data is saved to the browser's `localStorage`.

Files
- [workout-app/index.html](workout-app/index.html)
- [workout-app/style.css](workout-app/style.css)
- [workout-app/app.js](workout-app/app.js)

Quick start
1. Open [workout-app/index.html](workout-app/index.html) in your browser (double-click or drag into browser).

Optional: serve with a local static server for better behavior:

```bash
# Python 3
cd workout-app
python -m http.server 8000
# then open http://localhost:8000
```

Features
- Last 30 days view (newest at top). Click a date to view that day's exercises.
- Per-day exercises saved separately (localStorage).
- Templates (preloads): Save today's exercises as a template, import/export templates, and import a template into a day. Imported templates are cloned so editing today's exercises does not change the template.
 - Templates (preloads): Save today's exercises as a template, create/edit/delete templates in the UI, import/export templates, and import a template into a day. Imported templates are cloned so editing today's exercises does not change the template.
 - Folder integration (optional): If your browser supports the File System Access API, you can choose a local `templates` folder to import from or export templates to. Note: browsers cannot silently write to arbitrary folders next to `index.html` without user permission; the app will prompt you to pick the folder when using folder import/export.

Next steps
- Add per-exercise history and history UI
- Backend sync and authentication
- Editable templates UI (rename, reorder)
