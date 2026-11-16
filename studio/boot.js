// First thing the page runs: puts the name on the loading screen, checks that 3D can start, then loads the room.
// If 3D cannot start (old device, blocked graphics) the visitor gets a plain page with the same facts instead of nothing.
import { PROFILE, WORKS, LINKS, INTRO, HELLO, CERTS } from './content.js';

const veil = document.getElementById('veil');
veil.querySelector('.who').textContent = PROFILE.name;
veil.querySelector('.role').textContent = PROFILE.role;
const bar = veil.querySelector('.bar i'), pct = veil.querySelector('.pct');
window.__progress = (k) => { const v = Math.round(Math.max(0, Math.min(1, k)) * 100); bar.style.width = v + '%'; pct.textContent = INTRO.loading + ' ' + v + '%'; };
window.__progress(0);
// The wait is the longest look anyone gives this page on a slow line, so it already shows the results and two ways out.
{
  const mk = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };
  const box = veil.querySelector('.in');
  if (INTRO.proof) { const row = mk('div', 'proof'); for (const [n, what] of INTRO.proof) { const it = mk('span'); it.append(mk('b', '', n), ' ' + what); row.append(it); } box.append(row); }
  const out = mk('div', 'out');
  const cv = mk('a', '', INTRO.resume); cv.href = LINKS.resume; cv.target = '_blank'; cv.rel = 'noopener';
  const short = mk('a', '', INTRO.short); short.href = '?plain';
  out.append(cv, short); box.append(out);
}

const chosen = new URLSearchParams(location.search).has('plain');
function fallback() {
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };
  const link = (label, href, pri) => { const a = el('a', pri ? 'pri' : '', label); a.href = href; a.target = '_blank'; a.rel = 'noopener'; return a; };
  const root = el('main'); root.id = 'plain';
  if (PROFILE.portrait) { const im = el('img', 'me'); im.src = PROFILE.portrait; im.alt = 'Portrait of ' + PROFILE.name; root.append(im); }
  root.append(el('div', 'status', INTRO.status), el('h1', '', PROFILE.name), el('div', 'role', PROFILE.role), el('p', 'line', PROFILE.line));
  if (!chosen) root.querySelector('.line').after(el('p', 'note', INTRO.plain)); // the apology is only for a real failure, not for a visitor who asked for the short version
  const links = el('div', 'links');
  if (chosen) { const back = el('a', '', INTRO.room); back.href = location.pathname; links.append(back); }
  links.append(link('Contact me', LINKS.contact, true), link('Full portfolio', LINKS.site), link('LinkedIn', LINKS.linkedin), link('Résumé (PDF)', LINKS.resume));
  root.append(links);
  const list = el('div', 'works');
  for (const w of WORKS) {
    const c = el('article');
    if (w.img) { const i = el('img'); i.src = w.img; i.alt = ''; i.loading = 'lazy'; c.append(i); }
    else { // pieces without key art get the same kind of tile as their card in the room
      const t = el('div', 'tile');
      if (w.badge) { const i = el('img', 'badge'); i.src = w.badge; i.alt = ''; t.append(i); }
      else if (w.art === 'logos') for (const x of CERTS) { const i = el('img', 'logo'); i.src = x.img; i.alt = x.by; t.append(i); }
      else t.innerHTML = '<svg viewBox="0 0 60 40" aria-hidden="true"><path d="M8 34h44M14 34V22M24 34V12M34 34V18M44 34V8"/></svg>';
      c.append(t);
    }
    c.append(el('small', '', w.kind), el('h2', '', w.title), el('p', '', w.text));
    if (w.wins) { const r = el('div', 'wins'); for (const t of w.wins) r.append(el('span', '', t)); c.append(r); }
    if (w.link) c.append(link(w.linkText, w.link));
    list.append(c);
  }
  root.append(list, el('p', 'line', HELLO.text));
  if (HELLO.open) root.querySelector('.status').textContent = HELLO.open;
  document.body.classList.add('plain');
  document.body.append(root);
}

let ok = false;
try {
  const c = document.createElement('canvas');
  ok = !chosen && !!c.getContext('webgl2');
} catch (e) { ok = false; }
if (ok) import('./main.js').catch((e) => { console.error(e); fallback(); });
else fallback();
