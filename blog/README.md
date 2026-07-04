# The Scribe's Archive — blog system

A zero-build-step blog for hamnajalil.com. Everything is static files served by
GitHub Pages; rendering happens client-side in vanilla JS.

## How it works

| File | Role |
| --- | --- |
| `posts/*.md` | Post content — Markdown with a front matter block |
| `posts.json` | Manifest the index page reads (slug, title, date, description, tags) |
| `index.html` | Blog index — fetches `posts.json`, renders cards |
| `post.html?p=<slug>` | Post page — fetches `posts/<slug>.md`, renders Markdown, sets SEO meta + JSON-LD |
| `blog.js` | Front matter parser, Markdown renderer, theme sync, page logic |
| `blog.css` | Styles — same design tokens (colors/fonts) as the main site |
| `feed.xml` | RSS 2.0 feed |
| `../.nojekyll` | **Required** — stops GitHub Pages' default Jekyll pass from eating raw `.md` files |
| `../tools/build-blog.mjs` | Optional helper: regenerates `posts.json` + `feed.xml` from the `.md` files |

The theme toggle shares `localStorage('portfolioTheme')` with the main site, so
dark/light follows the visitor between portfolio and blog.

## Writing a new post

1. Create `blog/posts/my-post-slug.md` (slug = filename, lowercase + hyphens):

   ```markdown
   ---
   title: My Post Title
   date: 2026-07-15
   description: One or two sentences used for the index card, meta description, and RSS.
   tags: [ai, workflows]
   image: /assets/my-og-image.png   (optional — used for og:image)
   ---

   Post body in Markdown…
   ```

2. Regenerate the manifest and feed:

   ```
   node tools/build-blog.mjs
   ```

   (Or add the entry to `posts.json` and an `<item>` to `feed.xml` by hand —
   the script is a convenience, not a build step; the site never depends on it.)

3. Commit and push. Done.

Supported Markdown: headings, paragraphs, bold/italic, links, images, inline
code, fenced code blocks, ordered/unordered lists, blockquotes, horizontal
rules, and tables.

## Local preview

```
node tools/dev-server.mjs 8123
```

then open http://localhost:8123/blog/ (a server is needed because the pages
`fetch()` the markdown; `file://` won't work).

## Known limitation

Post meta tags (og:title, og:description, og:image) are set by JavaScript.
Google renders JS fine; some social link scrapers (Slack, X, Discord) do not
and will show the generic post.html tags instead. If rich social cards per
post ever matter, the fix is to let `build-blog.mjs` also emit a static HTML
stub per post — say the word and it's a ~20-line addition.
