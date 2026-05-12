# Sharky Triathlon Team — hub

Static site: calendar, weekend results, trip bus (9 seats), roster template.

## Give the team one link

After publishing (see below), send parents the **homepage URL**:  
`https://mariapomileva-alt.github.io/sharky/`  
(works after you enable GitHub Pages on repo [sharky](https://github.com/mariapomileva-alt/sharky).) They only need a browser.

- **Cups / weekend cards:** open `admin-results.html` on the same site + PIN from `admin-results.html` (`ADMIN_PIN`). To align phones, use **Download / Import JSON** there.
- **Bus:** with Supabase (`useCloud: true` in `bus-config.js`), everyone sees the same 9 seats. See `supabase_bus_board.sql`.

## Where data lives

| Feature | Storage |
|--------|---------|
| Weekend result cards | Browser `localStorage`, or shared via JSON export/import in admin |
| Trip bus (cloud off) | Browser `localStorage` only |
| Trip bus (cloud on) | Supabase table `bus_board` |

## GitHub Pages

1. Repo is **[mariapomileva-alt/sharky](https://github.com/mariapomileva-alt/sharky)** — push `main` to `origin` (see below).
2. Repo → **Settings → Pages → Build and deployment:** source **Deploy from a branch**, branch **main**, folder **/ (root)**.
3. Site URL: **`https://mariapomileva-alt.github.io/sharky/`** (GitHub shows the exact link on the Pages settings page).

## Push to GitHub (already initialized here)

```bash
cd triathlon-team-hub
git remote add origin https://github.com/mariapomileva-alt/sharky.git
# if origin already exists: git remote set-url origin https://github.com/mariapomileva-alt/sharky.git
git branch -M main
git push -u origin main
```

If you already ran `git init` elsewhere, skip that step.

If GitHub asks for auth, use a [Personal Access Token](https://github.com/settings/tokens) as the password, or GitHub Desktop.

## Files to edit before sharing

- `index.html` — calendar embed, Drive link, chat link, roster table.
- `admin-results.html` — change `ADMIN_PIN`.
- `bus-config.js` — optional Supabase URL + anon key + `useCloud: true`.
