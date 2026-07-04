#!/usr/bin/env node
/**
 * Regenerates blog/posts.json and blog/feed.xml from blog/posts/*.md front matter.
 *
 * This is NOT a site build step — the site is fully static. Run this once after
 * adding or editing a post (or edit posts.json / feed.xml by hand if you prefer):
 *
 *   node tools/build-blog.mjs
 *
 * Zero dependencies; needs Node 16+.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = 'https://hamnajalil.com';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const postsDir = join(root, 'blog', 'posts');

function parseFrontMatter(text) {
  const meta = {};
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { meta, body: text };
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (k === 'tags') {
      v = v.replace(/^\[|\]$/g, '');
      meta.tags = v ? v.split(',').map(t => t.trim().replace(/^["']|["']$/g, '')) : [];
    } else meta[k] = v;
  }
  return { meta, body: text.slice(m[0].length) };
}

const escXml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const files = (await readdir(postsDir)).filter(f => f.endsWith('.md'));
const posts = [];
for (const f of files) {
  const { meta } = parseFrontMatter(await readFile(join(postsDir, f), 'utf8'));
  const slug = f.replace(/\.md$/, '');
  if (!meta.title || !meta.date) {
    console.warn(`skipping ${f}: front matter needs at least "title" and "date"`);
    continue;
  }
  posts.push({
    slug,
    title: meta.title,
    date: meta.date,
    description: meta.description || '',
    tags: meta.tags || [],
    ...(meta.image ? { image: meta.image } : {}),
  });
}
posts.sort((a, b) => (a.date < b.date ? 1 : -1));

await writeFile(join(root, 'blog', 'posts.json'), JSON.stringify(posts, null, 2) + '\n');
console.log(`wrote blog/posts.json (${posts.length} posts)`);

const items = posts.map(p => {
  const url = `${SITE}/blog/post.html?p=${encodeURIComponent(p.slug)}`;
  return `    <item>
      <title>${escXml(p.title)}</title>
      <link>${escXml(url)}</link>
      <guid isPermaLink="true">${escXml(url)}</guid>
      <pubDate>${new Date(p.date + 'T09:00:00Z').toUTCString()}</pubDate>
      <description>${escXml(p.description)}</description>${(p.tags || []).map(t => `
      <category>${escXml(t)}</category>`).join('')}
    </item>`;
}).join('\n');

const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Hamna Jalil — Writing</title>
    <link>${SITE}/blog/</link>
    <description>Field notes on AI-powered product management, game production workflows, and building in public.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE}/blog/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;
await writeFile(join(root, 'blog', 'feed.xml'), feed);
console.log('wrote blog/feed.xml');
