# Sharky Triathlon Team — hub

Static site: calendar, weekend results, trip bus (9 seats), roster template.

## Give the team one link

After publishing (see below), send parents the **homepage URL** (e.g. `https://YOUR_USERNAME.github.io/sharky-triathlon-team-hub/`). They only need a browser.

- **Cups / weekend cards:** open `admin-results.html` on the same site + PIN from `admin-results.html` (`ADMIN_PIN`). To align phones, use **Download / Import JSON** there.
- **Bus:** with Supabase (`useCloud: true` in `bus-config.js`), everyone sees the same 9 seats. See `supabase_bus_board.sql`.

## Where data lives

| Feature | Storage |
|--------|---------|
| Weekend result cards | Browser `localStorage`, or shared via JSON export/import in admin |
| Trip bus (cloud off) | Browser `localStorage` only |
| Trip bus (cloud on) | Supabase table `bus_board` |

## GitHub Pages

1. Create a new empty repository on GitHub (e.g. `sharky-triathlon-team-hub`).
2. Push this folder (see commands below).
3. Repo → **Settings → Pages → Build and deployment:** source **Deploy from a branch**, branch **main**, folder **/ (root)**.
4. Wait a minute; the site will be at `https://<user>.github.io/<repo>/`.

## First push (replace YOUR_USER and REPO)

```bash
cd triathlon-team-hub
git init
git add .
git commit -m "Initial Sharky Triathlon Team hub"
git branch -M main
git remote add origin https://github.com/YOUR_USER/REPO.git
git push -u origin main
```

If GitHub asks for auth, use a [Personal Access Token](https://github.com/settings/tokens) as the password, or GitHub Desktop.

## Files to edit before sharing

- `index.html` — calendar embed, Drive link, chat link, roster table.
- `admin-results.html` — change `ADMIN_PIN`.
- `bus-config.js` — optional Supabase URL + anon key + `useCloud: true`.
