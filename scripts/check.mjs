// Pre-deploy check for hamnajalil.com. main is production, so every PR runs this (.github/workflows/check.yml).
// Since 2026-11-16 the repo holds two pages: the studio room at the root (index.html + studio/, copied in from its own
// project) and the RPG portfolio in portfolio/. Most checks below are about the portfolio page; the last one is the room.
// Run locally: node scripts/check.mjs   (optional: path to the site folder; defaults to the repo root)
// Exits 1 if any check fails. Plain Node, no dependencies.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(process.argv[2] || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
const DOMAIN = 'hamnajalil.com';
const RESUME = 'HAMNA_JALIL.pdf';
const MAX_BYTES = 600_000; // index.html is ~350 KB since images moved to assets/ (2026-11-09)
const MAX_EMBEDDED = 60_000; // images go in assets/; only tiny ones (favicon, the locked portrait) stay embedded

const results = [];
const check = (name, fn) => {
  try {
    const problems = fn() || [];
    results.push({ name, problems });
  } catch (err) {
    results.push({ name, problems: [err.message] });
  }
};

const PAGE_DIR = 'portfolio'; // the RPG portfolio page lives here; the resume, CNAME and share card stay at the root
const html = fs.readFileSync(path.join(ROOT, PAGE_DIR, 'index.html'), 'utf8');
const files = new Set(fs.readdirSync(ROOT)); // exact names: GitHub Pages is case-sensitive
// exact-case lookup from the repo root, folder by folder (GitHub Pages is case-sensitive, Windows is not)
const exists = rel => {
  let dir = ROOT;
  for (const part of rel.split('/')) {
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory() || !fs.readdirSync(dir).includes(part)) return false;
    dir = path.join(dir, part);
  }
  return true;
};
// a link written in a page, as a path from the repo root ('' if it climbs out of the repo)
const fromRoot = (dir, ref) => { const r = path.posix.normalize(path.posix.join(dir, ref.split(/[?#]/)[0])); return r.startsWith('..') ? '' : r.replace(/^\.\//, ''); };

// All <script> blocks, found with indexOf (regexes over this 2.8 MB file can backtrack for minutes)
const scripts = [];
for (let i = html.indexOf('<script'); i >= 0; i = html.indexOf('<script', i + 1)) {
  const tagEnd = html.indexOf('>', i);
  const close = html.indexOf('</script>', tagEnd);
  scripts.push({ attrs: html.slice(i + 7, tagEnd), code: html.slice(tagEnd + 1, close), line: html.slice(0, i).split('\n').length });
}
const tags = name => {
  const out = [];
  for (let i = html.indexOf('<' + name); i >= 0; i = html.indexOf('<' + name, i + 1)) out.push(html.slice(i, html.indexOf('>', i) + 1));
  return out;
};
const attr = (tag, a) => (tag.match(new RegExp('\\s' + a + '="([^"]*)"')) || [])[1];

check('CNAME is ' + DOMAIN, () => {
  if (!files.has('CNAME')) return ['CNAME file is missing: the site would fall off the custom domain'];
  const v = fs.readFileSync(path.join(ROOT, 'CNAME'), 'utf8').trim();
  return v === DOMAIN ? [] : [`CNAME says "${v}"`];
});

check('Resume link matches the PDF file', () => {
  const p = [];
  if (!files.has(RESUME)) p.push(`${RESUME} is missing`);
  const pdfLinks = tags('a').map(t => attr(t, 'href')).filter(h => h && /\.pdf(\?|#|$)/i.test(h) && !/^https?:/i.test(h));
  if (!pdfLinks.length) p.push('no link to the resume PDF found');
  for (const h of pdfLinks) {
    const f = fromRoot(PAGE_DIR, h);
    if (f !== RESUME || !files.has(f)) p.push(`link "${h}" points to a file that does not exist (names must match exactly, including case)`);
  }
  return p;
});

check('Every inline script parses', () => scripts.flatMap(s => {
  if (/\ssrc=/.test(s.attrs)) return [];
  const type = attr(s.attrs, 'type');
  try {
    if (type === 'application/ld+json') JSON.parse(s.code);
    else if (!type || /javascript|module/.test(type)) new vm.Script(s.code);
    return [];
  } catch (err) {
    return [`script at line ${s.line}: ${err.message}`];
  }
}));

check('No external scripts, frames or trackers', () => {
  const p = [];
  for (const s of scripts) if (/\ssrc=/.test(s.attrs)) p.push(`external script at line ${s.line}: ${attr(s.attrs, 'src')}`);
  for (const t of tags('iframe')) p.push('iframe: ' + t.slice(0, 80));
  for (const t of tags('link')) {
    const href = attr(t, 'href') || '';
    if (/stylesheet/.test(attr(t, 'rel') || '') && /^https?:/.test(href) && !href.startsWith('https://fonts.googleapis.com/')) p.push('external stylesheet: ' + href);
  }
  for (const k of ['navigator.sendBeacon', 'XMLHttpRequest', 'google-analytics', 'googletagmanager', 'gtag(']) if (html.includes(k)) p.push('tracker-like code: ' + k);
  return p;
});

check('index.html under ' + MAX_BYTES / 1000 + ' KB', () => {
  const n = fs.statSync(path.join(ROOT, PAGE_DIR, 'index.html')).size;
  return n <= MAX_BYTES ? [] : [`index.html is ${Math.round(n / 1000)} KB`];
});

check('No big images embedded in the page (they belong in assets/)', () => {
  const p = [];
  for (let i = html.indexOf('data:image/'); i >= 0; i = html.indexOf('data:image/', i + 1)) {
    let e = html.indexOf(',', i) + 1;
    while (/[A-Za-z0-9+/=%]/.test(html[e])) e++;
    if (e - i > MAX_EMBEDDED) p.push(`${Math.round((e - i) / 1000)} KB image embedded at line ${html.slice(0, i).split('\n').length}`);
    i = e;
  }
  return p;
});

check('Every local file the page uses exists (exact case)', () => {
  const refs = new Set();
  for (const t of [...tags('img'), ...tags('link'), ...tags('a'), ...tags('source')]) {
    for (const a of ['src', 'href']) {
      const v = attr(t, a);
      if (v && !/^(https?:|mailto:|tel:|data:|#|javascript:)/i.test(v)) refs.add(fromRoot(PAGE_DIR, v) || v);
    }
  }
  for (const m of html.matchAll(/["'](assets\/[^"'\s]+)["']/g)) refs.add(fromRoot(PAGE_DIR, m[1])); // paths set from scripts
  refs.delete('');
  return [...refs].filter(r => !exists(r)).map(r => 'missing file: ' + r);
});

check('No UI sound effects (only the opt-in ambience may make sound)', () => {
  const p = [];
  for (const k of ['SFX: Fantasy RPG', 'CLICK SFX', 'HOVER SFX', '= window._playTone', '= window._playNoise']) if (html.includes(k)) p.push('sound-effect code found: ' + k);
  // every tone/noise call must sit in a named function (e.g. pearl, gull) that first checks the ambience switch
  for (const k of ['window._playTone(', 'window._playNoise(']) {
    for (let i = html.indexOf(k); i >= 0; i = html.indexOf(k, i + 1)) {
      const before = html.slice(Math.max(0, i - 3000), i);
      const named = [...before.matchAll(/function [A-Za-z_$][\w$]*\s*\(/g)].pop();
      const gated = named && before.slice(named.index, named.index + 120).includes('if(!_snd.on');
      if (!gated) p.push(`${k} call at line ${html.slice(0, i).split('\n').length} is not behind the ambience switch`);
    }
  }
  return p;
});

check('Share-card images exist', () => tags('meta')
  .filter(t => /(og|twitter):image"/.test(t) && !/:image:/.test(attr(t, 'property') || ''))
  .map(t => attr(t, 'content'))
  .filter(u => u && u.startsWith(`https://${DOMAIN}/`) && !files.has(u.slice(`https://${DOMAIN}/`.length)))
  .map(u => 'missing file for ' + u));

check('In-page links point to real sections', () => {
  const ids = new Set();
  for (const m of html.matchAll(/\sid="([^"]+)"/g)) ids.add(m[1]);
  const p = [];
  for (const t of tags('a')) {
    const h = attr(t, 'href');
    if (h && h.length > 1 && h.startsWith('#') && !ids.has(h.slice(1))) p.push(`link to ${h} has no matching id`);
  }
  return [...new Set(p)];
});

check('Home page (the studio room): every file it loads exists (exact case), nothing external but fonts', () => {
  const p = [];
  if (!exists('index.html') || !exists('studio')) return ['index.html or studio/ is missing at the root'];
  const home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const need = new Set();
  for (const m of home.matchAll(/\s(?:src|href)="([^"]+)"/g)) {
    const v = m[1];
    if (/^https?:/i.test(v)) { if (!/^https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|hamnajalil\.com)\b/.test(v)) p.push('external address in the home page: ' + v); }
    else if (!/^(data:|#|mailto:)/i.test(v)) need.add(v.endsWith('/') ? fromRoot('', v + 'index.html') : fromRoot('', v));
  }
  // follow the module imports from the page's scripts, and collect every "studio/..." path written in the code
  const seen = new Set(), queue = [...need].filter(f => f.endsWith('.js'));
  const bare = { three: 'studio/three/three.module.js' };
  while (queue.length) {
    const f = queue.pop();
    if (seen.has(f) || !exists(f)) { need.add(f); continue; }
    seen.add(f);
    const code = fs.readFileSync(path.join(ROOT, f), 'utf8');
    for (const m of code.matchAll(/^\s*(?:import\b[^'"\n;]*?|export\b[^'"\n;=]*?\bfrom\s*)['"]([^'"\n]+)['"]/gm)) { // real import lines only, not text inside comments
      const v = m[1];
      const t = v.startsWith('.') ? fromRoot(path.posix.dirname(f), v) : v.startsWith('three/addons/') ? 'studio/three/addons/' + v.slice(13) : bare[v];
      if (t) { need.add(t); queue.push(t); } else p.push(`${f} imports "${v}", which is not a local file`);
    }
    if (!f.startsWith('studio/three/')) for (const m of code.matchAll(/\bimport\(\s*['"](\.[^'"\n]+)['"]\s*\)/g)) { const t = fromRoot(path.posix.dirname(f), m[1]); need.add(t); queue.push(t); } // import('./x.js')
    if (!f.startsWith('studio/three/')) for (const m of code.matchAll(/['"`](studio\/[^'"`\s$?]+\.[a-z0-9]+)['"`]/g)) need.add(m[1]);
  }
  if (exists('studio/os.css')) for (const m of fs.readFileSync(path.join(ROOT, 'studio/os.css'), 'utf8').matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) if (!/^(data:|https?:)/.test(m[1])) need.add(fromRoot('studio', m[1]));
  need.delete('');
  for (const f of need) if (!exists(f)) p.push('missing file: ' + f);
  return p;
});

let failed = 0;
for (const r of results) {
  if (r.problems.length) {
    failed++;
    console.log('✗ ' + r.name);
    for (const x of r.problems) console.log('    - ' + x);
  } else console.log('✓ ' + r.name);
}
console.log(failed ? `\n${failed} check(s) failed. Do not ship.` : `\nAll ${results.length} checks passed.`);
process.exit(failed ? 1 : 0);
