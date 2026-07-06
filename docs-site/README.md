# Praeco Docs

Standalone documentation site for [Praeco](https://github.com/your-org/praeco). Host separately from the main app.

## Develop

```bash
npm install
npm run dev
```

Opens at http://localhost:5173

## Build static site

```bash
npm run build
```

Output: `.vitepress/dist/` — deploy to Vercel, Netlify, Cloudflare Pages, or GitHub Pages.

## Deploy examples

**Vercel** — set root directory to `docs-site`, build command `npm run build`, output `.vitepress/dist`.

**Netlify** — publish directory `docs-site/.vitepress/dist`, base `docs-site`.

**GitHub Pages** — build locally or in CI, push `dist` to `gh-pages` branch.

## Environment

Set `VITE_APP_URL` at build time to point API examples at your deployed Praeco instance:

```bash
VITE_APP_URL=https://praeco.example.com npm run build
```
