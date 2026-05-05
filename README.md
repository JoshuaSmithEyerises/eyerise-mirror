# EyeRise Mirror

A static, SEO-optimized companion site for the [EyeRise Substack](https://eyerise.substack.com). Posts sync automatically from RSS, with an editorial override layer for manual SEO control.

Built with [Eleventy](https://www.11ty.dev/) and vanilla HTML/CSS/JS. No framework lock-in. Open any file in VS Code and you can read it.

---

## Quick start

```bash
git clone <this-repo> eyerise-mirror
cd eyerise-mirror
npm install
npm run sync          # pull posts from Substack RSS → data/posts.json
npm run build         # build static site → public/
npm run search-index  # build search index → public/search-index.json
```

Or in one shot for local dev:

```bash
npm run dev           # sync + serve at http://localhost:8080 with live reload
```

---

## Project structure

```
.
├── site.config.js          # ← MAIN CONFIG. Edit this first.
├── .eleventy.js            # Eleventy build config (filters, collections)
├── package.json
│
├── scripts/
│   ├── sync.js             # Pulls RSS, merges overrides, writes data/posts.json
│   └── build-search-index.js  # Builds /search-index.json after build
│
├── data/
│   └── posts.json          # ← Generated. Don't edit by hand. Run `npm run sync`.
│
├── overrides/              # ← Manual SEO overrides per post
│   ├── _SAMPLE.json        # Reference file — every available field
│   └── {slug}.json         # One file per post you want to customize
│
├── src/                    # Eleventy input
│   ├── _data/              # Site-wide data exposed to templates
│   ├── _includes/
│   │   ├── base.njk        # Wraps every page (head, header, footer)
│   │   └── article.njk     # Article body partial
│   ├── index.njk           # Homepage
│   ├── articles.njk        # One page per post (paginated)
│   ├── articles.11tydata.js # Computes per-article SEO fields in JS (avoids HTML double-escaping)
│   ├── topic-pages.njk     # One page per topic
│   ├── topics-index.njk    # /topics/
│   ├── archive.njk         # /archive/
│   ├── search.njk          # /search/
│   ├── start-here.njk      # /start-here/ (evergreen)
│   ├── about.njk
│   ├── sitemap.njk
│   └── rss.njk
│
├── content/
│   └── robots.txt
│
├── assets/                 # Static, copied as-is into public/
│   ├── css/main.css        # All styles. CSS variables at top.
│   ├── js/main.js          # Theme toggle, reading progress, archive filters
│   └── img/
│
├── public/                 # ← Build output. Gitignored. Deploy this.
│
└── .github/workflows/
    └── sync.yml            # Runs every 6 hours: sync → build → commit
```

---

## Editing article SEO manually

Every post has a slug (visible in `data/posts.json` after sync). To override SEO for a post:

1. Create a file at `overrides/{slug}.json`.
2. Add only the fields you want to override. Everything else falls back to the RSS feed.
3. Run `npm run build`.

Example minimal override:

```json
{
  "seoTitle": "A better, keyword-rich title for search",
  "metaDescription": "An exact 155-character description tuned for SERP click-through.",
  "featuredImage": "https://example.com/better-hero.jpg",
  "topic": "film-and-television"
}
```

See `overrides/_SAMPLE.json` for every available field with comments.

**Important:** the override `slug` field changes the URL. If you change it after Google has indexed the original, add a redirect on your host. Easiest path: don't change slugs once a post is live.

---

## Canonical strategy (read this carefully)

The single most important SEO decision when running a Substack mirror. Three modes, set in `site.config.js → canonicalDefault` and overridable per post in `overrides/{slug}.json → canonicalMode`:

### `"substack"` (default, recommended)
The mirror page exists, is crawlable, and is internally linked — but `<link rel="canonical">` points to the Substack URL. Google reads this as "the Substack version is the source of truth, consolidate ranking signals there."

**When to use:** for most posts. The mirror still helps with discovery (topic hubs, search, internal linking), but you don't compete with yourself in search results.

### `"mirror"`
Canonical points to your mirror URL. Google may rank your mirror above Substack.

**When to use:** ONLY for posts where you've added meaningful original content via the override file — an expanded intro, an FAQ section, deeper analysis, additional research. Without that, Google sees thin duplication and demotes both pages.

### `"noindex"`
Page renders but tells Google not to index it.

**When to use:** drafts, experiments, or posts you don't want surfaced.

### Picking a strategy

- **Starting out:** keep the global default at `"substack"`. Don't overthink it.
- **Have a flagship essay you've expanded for the mirror?** Set its override `canonicalMode` to `"mirror"`, write a real expanded intro and FAQ, and watch it.
- **Never set canonical to mirror without adding original content.** It's worse than doing nothing.

---

## Adding or editing topic hubs

Open `site.config.js`. Each topic looks like:

```js
{
  slug: "ai-and-labor",
  name: "AI and Labor",
  intro: "Editorial intro that shows on the topic hub page. Treat it as SEO copy.",
  match: ["ai", "automation", "llm"]
}
```

- `match[]` is a keyword list. The sync script checks each post's RSS categories and title/snippet against these. First match wins. Posts that match nothing land in `personal-and-essays`.
- To force a post into a specific topic regardless of keyword matching, set `topic` in its override file.
- After editing, run `npm run sync && npm run build`.

---

## Featured / evergreen / "Start Here"

Two ways to flag posts:

1. **Per-post:** add `"featured": true` or `"evergreen": true` to the override file.
2. **Centralized:** list slugs in `site.config.js → featuredSlugs` or `evergreenSlugs`.

Featured posts appear in the homepage hero. Evergreen posts appear on `/start-here/`.

---

## Search

Client-side, no server needed. After build, `/public/search-index.json` contains a stripped-down array of every post (title, excerpt, topic, year, URL). The `/search/` page fetches it once and filters live.

For 600+ posts the index stays under ~200KB. If you grow beyond a few thousand posts, swap in [MiniSearch](https://github.com/lucaong/minisearch) — the integration point is `scripts/build-search-index.js` plus the inline script on `src/search.njk`.

---

## Deployment

The GitHub Actions workflow at `.github/workflows/sync.yml` runs every 6 hours, syncs the feed, builds the site, and commits any new posts back to the repo. To deploy the built `public/` folder, uncomment one of the deploy blocks in that workflow:

### Netlify
1. New site → connect this repo.
2. Build command: `npm run all`
3. Publish directory: `public`
4. (Optional) Add `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` to repo secrets and uncomment the Netlify deploy step in the workflow.

### Vercel
1. New project → import this repo.
2. Framework preset: **Other**.
3. Build command: `npm run all`
4. Output directory: `public`

### GitHub Pages
1. In repo settings → Pages → Source: **GitHub Actions**.
2. Uncomment the GitHub Pages deploy step in `sync.yml`.
3. Set `site.url` in `site.config.js` to your Pages URL (e.g. `https://yourname.github.io/eyerise-mirror`).

After deploying, set `site.url` in `site.config.js` to the production URL. Canonical tags, sitemaps, and OG tags all read from there.

---

## What to do after first deploy

1. **Submit the sitemap** (`/sitemap.xml`) in Google Search Console.
2. **Verify** the site in Search Console (DNS or HTML file method).
3. **Confirm canonical tags resolve correctly** — view-source on a few article pages and check `<link rel="canonical">` points where you expect.
4. **Wait 1–4 weeks** for Google to crawl and consolidate. Watch Search Console's Coverage and Performance reports.

---

## Local development tips

- Edit `assets/css/main.css` — all colors, fonts, and spacing live in `:root` variables at the top.
- Edit a Nunjucks template — Eleventy hot-reloads the page.
- Edit `data/posts.json` directly only for debugging. Real edits go in `overrides/`.
- Test new override files: drop in `overrides/{slug}.json`, run `npm run build`, open `public/articles/{slug}/index.html`.

---

## License

Code: MIT. Essay content: © Joshua Smith, all rights reserved.
