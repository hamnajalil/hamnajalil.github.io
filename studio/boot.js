// First thing the page runs: puts the name on the loading screen, checks that 3D can start, then loads the room.
// If 3D cannot start (old device, blocked graphics) the visitor gets a plain page with the same facts instead of nothing.
import { PROFILE, WORKS, LINKS, INTRO, HELLO, CERTS } from './content.js';

const veil = document.getElementById('veil');
veil.querySelector('.who').textContent = PROFILE.name;
veil.querySelector('.role').textContent = PROFILE.role;
const bar = veil.querySelector('.bar i'), pct = veil.querySelector('.pct');
window.__progress = (k) => { const v = Math.round(Math.max(0, Math.min(1, k)) * 100); bar.style.width = v + '%'; pct.textContent = INTRO.loading + ' ' + v + '%'; };
window.__progress(0);

function fallback() {
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };
  const link = (label, href, pri) => { const a = el('a', pri ? 'pri' : '', label); a.href = href; a.target = '_blank'; a.rel = 'noopener'; return a; };
  const root = el('main'); root.id = 'plain';
  if (PROFILE.portrait) { const im = el('img', 'me'); im.src = PROFILE.portrait; im.alt = 'Portrait of ' + PROFILE.name; root.append(im); }
  root.append(el('div', 'status', INTRO.status), el('h1', '', PROFILE.name), el('div', 'role', PROFILE.role), el('p', 'line', PROFILE.line), el('p', 'note', INTRO.plain));
  const links = el('div', 'links');
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
  ok = !new URLSearchParams(location.search).has('plain') && !!c.getContext('webgl2');
} catch (e) { ok = false; }
if (ok) import('./main.js').catch((e) => { console.error(e); fallback(); });
else fallback();
