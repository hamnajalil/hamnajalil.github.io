// Dusk OS: a small desktop that lives inside the monitor. Plain DOM, so it is sharp at any size.
import { sfx } from './sound.js';
import { ABOUT, METHOD, WORKS, TOPICS, PROFILE, STUDIOS, CERTS, LOADOUT, LINKS, TODO, TRY, QUOTES, HELLO, INTRO } from './content.js';

const h = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  if (tag === 'img') e.loading = 'lazy';
  for (const k in attrs) {
    if (k === 'class') e.className = attrs[k];
    else if (k === 'style') e.style.cssText = attrs[k];
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
    else e.setAttribute(k, attrs[k]);
  }
  for (const c of kids.flat()) if (c != null) e.append(c);
  return e;
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ------------------------------------------------------------------ wallpapers
const WALLS = {
  dusk: { name: 'Dusk lake', tint: [1.0, 0.72, 0.78], paint(c, w, hh) {
    const g = c.createLinearGradient(0, 0, 0, hh);
    g.addColorStop(0, '#0d1030'); g.addColorStop(0.35, '#3a2260'); g.addColorStop(0.55, '#a8456a'); g.addColorStop(0.66, '#ff9a5c'); g.addColorStop(0.661, '#3a2450'); g.addColorStop(1, '#0c0e22');
    c.fillStyle = g; c.fillRect(0, 0, w, hh);
    const hz = hh * 0.66;
    c.fillStyle = '#ffd9a0'; c.beginPath(); c.arc(w * 0.62, hz, hh * 0.085, Math.PI, 0); c.fill();
    [['#4b2a5e', 0.12, 3, 1.1], ['#2a1a44', 0.085, 5, 3.3], ['#160f2c', 0.05, 8, 5.2]].forEach(([col, amp, f, ph]) => {
      c.fillStyle = col; c.beginPath(); c.moveTo(0, hz);
      for (let x = 0; x <= w; x += 6) { const u = x / w; c.lineTo(x, hz - hh * amp * (0.5 + 0.5 * Math.sin(u * f + ph) + 0.25 * Math.sin(u * f * 2.7 + ph * 2)) * (0.4 + Math.abs(u - 0.62))); }
      c.lineTo(w, hz); c.fill();
    });
    for (let i = 0; i < 26; i++) { const y = hz + 4 + i * i * 0.5 * (hh / 600); const ww = hh * (0.05 + i * 0.012); c.fillStyle = `rgba(255,190,130,${0.5 - i * 0.018})`; c.fillRect(w * 0.62 - ww, y, ww * 2, Math.max(1, hh / 400)); }
  } },
  aurora: { name: 'Aurora', tint: [0.5, 1.0, 0.85], paint(c, w, hh) {
    const g = c.createLinearGradient(0, 0, 0, hh); g.addColorStop(0, '#040714'); g.addColorStop(1, '#0c2233');
    c.fillStyle = g; c.fillRect(0, 0, w, hh);
    let s = 9; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    c.fillStyle = '#fff'; for (let i = 0; i < 130; i++) { c.globalAlpha = 0.2 + r() * 0.6; c.fillRect(r() * w, r() * hh * 0.7, 1.5, 1.5); }
    c.globalAlpha = 1; c.globalCompositeOperation = 'lighter';
    [['#1cff9a', 0.3, 2.2, 0], ['#2ad0ff', 0.4, 3.1, 2], ['#a35cff', 0.5, 1.7, 4]].forEach(([col, y0, f, ph]) => {
      for (let x = 0; x <= w; x += 3) {
        const u = x / w, y = hh * (y0 + 0.1 * Math.sin(u * f * 3 + ph) + 0.05 * Math.sin(u * f * 9 + ph));
        const len = hh * (0.2 + 0.12 * Math.sin(u * 14 + ph));
        const gr = c.createLinearGradient(0, y - len, 0, y + 10); gr.addColorStop(0, 'transparent'); gr.addColorStop(0.75, col + '2e'); gr.addColorStop(1, 'transparent');
        c.fillStyle = gr; c.fillRect(x, y - len, 3, len + 10);
      }
    });
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = '#03060c'; c.beginPath(); c.moveTo(0, hh);
    for (let x = 0; x <= w; x += 8) c.lineTo(x, hh * (0.86 - 0.06 * Math.abs(Math.sin(x / w * 9)) - 0.03 * Math.sin(x / w * 31)));
    c.lineTo(w, hh); c.fill();
  } },
  dunes: { name: 'Coral dunes', tint: [1.0, 0.78, 0.6], paint(c, w, hh) {
    const g = c.createLinearGradient(0, 0, 0, hh); g.addColorStop(0, '#f6c9a0'); g.addColorStop(0.6, '#f08f6e');
    c.fillStyle = g; c.fillRect(0, 0, w, hh);
    c.fillStyle = '#fff3d6'; c.beginPath(); c.arc(w * 0.3, hh * 0.3, hh * 0.07, 0, 7); c.fill();
    ['#e9785c', '#d2604f', '#b04a48', '#7d3340', '#4c2233'].forEach((col, i) => {
      c.fillStyle = col; c.beginPath(); c.moveTo(0, hh);
      for (let x = 0; x <= w; x += 6) { const u = x / w; c.lineTo(x, hh * (0.5 + i * 0.1 - 0.07 * Math.sin(u * (3 + i) + i * 2.1) - 0.03 * Math.sin(u * 11 + i))); }
      c.lineTo(w, hh); c.fill();
    });
  } },
  grid: { name: 'Night grid', tint: [0.85, 0.55, 1.0], paint(c, w, hh) {
    const g = c.createLinearGradient(0, 0, 0, hh); g.addColorStop(0, '#07041a'); g.addColorStop(0.55, '#2b0f4a'); g.addColorStop(0.56, '#12062a'); g.addColorStop(1, '#05020f');
    c.fillStyle = g; c.fillRect(0, 0, w, hh);
    const hz = hh * 0.56;
    const sg = c.createLinearGradient(0, hz - hh * 0.3, 0, hz); sg.addColorStop(0, '#ffd166'); sg.addColorStop(1, '#ff3d81');
    c.fillStyle = sg; c.beginPath(); c.arc(w / 2, hz, hh * 0.2, Math.PI, 0); c.fill();
    c.fillStyle = '#2b0f4a'; for (let i = 0; i < 6; i++) c.fillRect(w / 2 - hh * 0.22, hz - hh * (0.02 + i * 0.03), hh * 0.44, hh * (0.004 + i * 0.0012));
    c.strokeStyle = 'rgba(80,220,255,0.55)'; c.lineWidth = Math.max(1, hh / 500);
    for (let i = -14; i <= 14; i++) { c.beginPath(); c.moveTo(w / 2 + i * w * 0.02, hz); c.lineTo(w / 2 + i * w * 0.16, hh); c.stroke(); }
    for (let i = 1; i < 12; i++) { const y = hz + (hh - hz) * Math.pow(i / 12, 2.2); c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
  } },
};
export function paintWallpaper(c, w, hh, id) { c.save(); c.globalAlpha = 1; (WALLS[id] || WALLS.dusk).paint(c, w, hh); c.restore(); }
export function wallpaperTint(id) { return (WALLS[id] || WALLS.dusk).tint; }

// ------------------------------------------------------------------ OS core
const ICON = {
  terminal: '<path d="M5 8l5 4-5 4"/><path d="M13 17h6"/>',
  paint: '<path d="M4 20c2 0 4-1 4-3s2-3 3-2 1 3-1 4"/><path d="M11 14L20 4"/>',
  pads: '<rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/>',
  game: '<rect x="3" y="4" width="5" height="3" rx="1"/><rect x="10" y="4" width="5" height="3" rx="1"/><rect x="17" y="4" width="4" height="3" rx="1"/><circle cx="12" cy="13" r="1.6"/><path d="M8 20h8"/>',
  notes: '<path d="M6 3h9l4 4v14H6z"/><path d="M9 11h7M9 15h7M9 7h3"/>',
  playbook: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9l5 3-5 3z"/>',
  settings: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
};
export const OS = {
  state: { wallpaper: 'dusk', accent: '#ff8a5c', scan: true },
  apps: [
    { id: 'notes', name: 'Notes', color: '#f2b84b', w: 780, h: 540 },
    { id: 'playbook', name: 'Playbook', color: '#ff7a45', w: 660, h: 520 },
    // the toys: things to find, after the substance
    { id: 'terminal', name: 'Terminal', color: '#2b3246', w: 620, h: 400, toy: true },
    { id: 'paint', name: 'Paint', color: '#e8587a', w: 640, h: 440, toy: true },
    { id: 'pads', name: 'Beat pad', color: '#7b5cff', w: 680, h: 420, toy: true },
    { id: 'game', name: 'Backlog breaker', color: '#22a7a0', w: 560, h: 470, toy: true },
    { id: 'settings', name: 'Settings', color: '#6b7488', w: 520, h: 440, toy: true },
  ],
  onExit: null, onWallpaper: null,
  el: null, wins: {}, z: 10, booted: false, active: false, tickers: new Set(),

  init(el) {
    this.el = el;
    this.wall = h('canvas', { class: 'wall' });
    this.appName = h('span', { class: 'app' }, 'Desktop');
    this.clock = h('span', { class: 'clock' });
    this.snd = h('button', { class: 'snd', onclick: () => sfx.toggle() }, 'Enable sound');
    const bar = h('div', { class: 'bar' },
      h('span', { class: 'logo' }, h('i'), 'Dusk OS'), this.appName, h('span', { class: 'sp' }),
      this.snd, this.clock, h('button', { onclick: () => this.onExit && this.onExit() }, 'Back to the studio'));
    this.dock = h('div', { class: 'dock' }, this.apps.map((a) => {
      a.icon = h('div', { class: 'ic', style: `background:${a.color}`, onclick: () => this.open(a.id) }, h('span', {}, a.name));
      a.icon.insertAdjacentHTML('afterbegin', `<svg viewBox="0 0 24 24">${ICON[a.id]}</svg>`);
      return a.icon;
    }));
    this.dock.insertBefore(h('i', { class: 'sep' }), this.apps.find((a) => a.toy).icon);
    this.desk = h('div', { class: 'desk' });
    this.buildDesk();
    this.bootEl = h('div', { class: 'boot' }, h('div', { class: 'in' }, h('div', { class: 'sun' }), h('h1', {}, 'Dusk OS'), h('div', { class: 'pb' }, h('i')), h('pre')));
    el.append(this.wall, this.desk, bar, this.dock, h('div', { class: 'scan' }), this.bootEl);
    addEventListener('resize', () => { this.setZoom(); this.paintWall(); });
    this.setZoom();
    this.paintWall();
    const soundBtn = document.getElementById('sound');
    soundBtn.addEventListener('click', () => sfx.toggle());
    sfx.onChange((on) => { for (const b of [soundBtn, this.snd]) { b.textContent = on ? 'Sound on' : (b === soundBtn ? INTRO.soundOff : 'Enable sound'); b.classList.toggle('on', on); } soundBtn.title = soundBtn.textContent; });
    setInterval(() => { this.clock.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }, 1000);
    this.clock.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const loop = (t) => { requestAnimationFrame(loop); if (!this.active) return; for (const f of this.tickers) f(t / 1000); };
    requestAnimationFrame(loop);
  },
  openNote(i) { this.open('notes'); this.wins.notes && this.wins.notes.show(i); },
  // the desktop itself: shortcuts down the left, a few widgets on the right
  buildDesk() {
    const svg = (d) => `<svg viewBox="0 0 24 24">${d}</svg>`;
    const G = {
      me: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 4-7 8-7s7 2 8 7"/>',
      kit: '<path d="M4 8h16v11H4z"/><path d="M9 8V5h6v3M4 13h16"/>',
      badge: '<circle cx="12" cy="9" r="5"/><path d="M9 13l-2 8 5-3 5 3-2-8"/>',
      link: '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
      chart: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
    };
    const sc = (label, look, act) => {
      const ic = h('div', { class: 'ti', style: look.bg ? `background:${look.bg}` : '' });
      if (look.img) ic.append(h('img', { src: look.img, alt: '', draggable: 'false' })); else ic.insertAdjacentHTML('afterbegin', svg(look.g));
      return typeof act === 'string' ? h('a', { class: 'sc', href: act, target: '_blank', rel: 'noopener' }, ic, h('span', {}, label)) : h('div', { class: 'sc', onclick: act }, ic, h('span', {}, label));
    };
    const icons = h('div', { class: 'icons' },
      sc('About me', { g: G.me, bg: 'linear-gradient(160deg,#ff8a5c,#c2456e)' }, () => this.openNote(0)),
      sc('Shipped games', { img: WORKS[0].img.replace('flight.webp', 'flight-icon.webp') }, () => this.openNote(1)),
      sc('Loadout', { g: G.kit, bg: 'linear-gradient(160deg,#4cc9f0,#5b5cff)' }, () => this.openNote(2)),
      sc('Badges', { g: G.badge, bg: 'linear-gradient(160deg,#ffd166,#ff8a5c)' }, () => this.openNote(3)),
      sc('Playbook', { g: ICON.playbook, bg: '#ff7a45' }, () => this.open('playbook')),
      sc('Sprint health', { g: G.chart, bg: 'linear-gradient(160deg,#3ddc84,#1c8f8a)' }, LINKS.sprint),
      sc(INTRO.caseStudies, { g: G.link, bg: 'linear-gradient(160deg,#b08cff,#6a4cff)' }, LINKS.site));
    const f = WORKS[0];
    const feat = h('div', { class: 'wd feat', onclick: () => this.openNote(1) }, h('img', { src: f.img, alt: f.title, draggable: 'false' }),
      h('div', { class: 'cap' }, h('small', {}, 'Featured · ' + f.kind), h('b', {}, f.title)));
    const strip = h('div', { class: 'wd strip', onclick: () => this.openNote(1) }, WORKS.slice(1, 3).map((w) => h('img', { src: w.img, alt: w.title, title: w.title, draggable: 'false' })),
      h('span', {}, 'See all five games'));
    const sticky = h('div', { class: 'wd sticky' }, METHOD);
    const quest = h('div', { class: 'wd quest' }, h('small', {}, 'Quest log'), TODO.map(([done, t]) => h('div', { class: 'q' + (done ? ' done' : '') }, h('i'), t)));
    this.desk.append(icons, h('div', { class: 'widgets' }, feat, strip, sticky, quest));
  },
  // R7: on large screens the whole OS is drawn larger (windows, text, dock), so it is not a small app in a big wallpaper.
  // Everything inside keeps working in its own pixels: VW / VH are the OS's size, CX / CY the pointer, in those pixels.
  setZoom() { Z = innerWidth >= 1500 ? clamp(Math.min(innerWidth / 1500, innerHeight / 820), 1, 1.7) : 1; this.el.style.setProperty('--z', Z.toFixed(3)); },
  paintWall() {
    const d = Math.min(devicePixelRatio || 1, 2);
    this.wall.width = innerWidth * d; this.wall.height = innerHeight * d;
    paintWallpaper(this.wall.getContext('2d'), this.wall.width, this.wall.height, this.state.wallpaper);
  },
  setWallpaper(id) { if (!WALLS[id]) return false; this.state.wallpaper = id; this.paintWall(); this.onWallpaper && this.onWallpaper(); return true; },
  setAccent(c) { this.state.accent = c; document.documentElement.style.setProperty('--accent', c); },
  skipBoot() { this.booted = true; this.bootEl.classList.add('gone'); this.el.classList.add('booted'); },
  enter() {
    this.active = true;
    if (this.booted) return;
    this.booted = true;
    const bar = this.bootEl.querySelector('.pb i'), pre = this.bootEl.querySelector('pre');
    const lines = ['waking the display', 'loading the backlog', 'aligning stakeholders', 'pouring coffee', 'ready'];
    lines.forEach((l, i) => setTimeout(() => { pre.textContent = l; bar.style.width = ((i + 1) / lines.length * 100) + '%'; sfx.tick(440 + i * 110, 0.06); }, 150 + i * 260));
    setTimeout(() => { this.bootEl.classList.add('gone'); this.el.classList.add('booted'); sfx.note(523, 0.2); sfx.note(784, 0.4, 'triangle', 0.15, sfx.ctx ? sfx.ctx.currentTime + 0.12 : 0); }, 1650);
    setTimeout(() => this.open('notes'), 2000);
  },
  leave() { this.active = false; },

  focus(win) {
    win.el.style.zIndex = ++this.z;
    for (const k in this.wins) this.wins[k].el.classList.toggle('front', this.wins[k] === win);
    this.appName.textContent = win.app.name;
  },
  open(id) {
    const app = this.apps.find((a) => a.id === id);
    if (!app) return false;
    if (this.wins[id]) { this.wins[id].el.style.display = 'flex'; this.focus(this.wins[id]); return true; }
    const n = Object.keys(this.wins).length;
    const vw = VW(), vh = VH(); // the OS's own pixels: on large screens the whole OS is scaled up (see setZoom)
    const sc = clamp(vh / 760, 1, 1.45);
    let W = Math.min(app.w * sc, vw - 40), H = Math.min(app.h * sc, vh - 150);
    let x = clamp((vw - W) / 2 + (n % 4 - 1) * 60 - 20, 10, vw - W - 10), y = clamp(30 + (n % 4) * 34, 6, vh - H - 110);
    if (innerWidth < 700) { W = innerWidth; H = innerHeight - 34 - 70; x = 0; y = 34; } // phone: one window at a time, full width, above the dock
    const body = h('div', { class: 'body' });
    const win = { app, body, cleanup: [], onResize: null };
    const tb = h('div', { class: 'tb' },
      h('b', { class: 'x', title: 'Close', onclick: () => this.close(id) }),
      h('b', { class: 'm', title: 'Hide', onclick: () => { win.el.style.display = 'none'; this.appName.textContent = 'Desktop'; } }),
      h('b', { class: 'z', title: 'Fill', onclick: () => this.toggleMax(win) }),
      h('span', { class: 't' }, app.name));
    win.el = h('div', { class: 'win', style: `left:${x}px;top:${y}px;width:${W}px;height:${H}px` }, tb, body,
      h('div', { class: 'rs r', 'data-r': 'r' }), h('div', { class: 'rs b', 'data-r': 'b' }), h('div', { class: 'rs c', 'data-r': 'c' }));
    win.el.addEventListener('pointerdown', () => this.focus(win), true);
    // drag
    tb.addEventListener('pointerdown', (e) => {
      if (e.target.tagName === 'B' || win.max) return;
      const ox = CX(e) - win.el.offsetLeft, oy = CY(e) - win.el.offsetTop;
      tb.setPointerCapture(e.pointerId);
      const mv = (ev) => { win.el.style.left = clamp(CX(ev) - ox, -win.el.offsetWidth + 80, VW() - 80) + 'px'; win.el.style.top = clamp(CY(ev) - oy, 0, VH() - 120) + 'px'; };
      const up = () => { tb.removeEventListener('pointermove', mv); tb.removeEventListener('pointerup', up); };
      tb.addEventListener('pointermove', mv); tb.addEventListener('pointerup', up);
    });
    tb.addEventListener('dblclick', (e) => { if (e.target.tagName !== 'B') this.toggleMax(win); });
    // resize
    win.el.querySelectorAll('.rs').forEach((r) => r.addEventListener('pointerdown', (e) => {
      e.stopPropagation(); this.focus(win);
      const m = r.dataset.r, sx = CX(e), sy = CY(e), sw = win.el.offsetWidth, sh = win.el.offsetHeight;
      r.setPointerCapture(e.pointerId);
      const mv = (ev) => {
        if (m !== 'b') win.el.style.width = Math.max(300, sw + CX(ev) - sx) + 'px';
        if (m !== 'r') win.el.style.height = Math.max(200, sh + CY(ev) - sy) + 'px';
        win.onResize && win.onResize();
      };
      const up = () => { r.removeEventListener('pointermove', mv); r.removeEventListener('pointerup', up); };
      r.addEventListener('pointermove', mv); r.addEventListener('pointerup', up);
    }));
    this.desk.parentNode.insertBefore(win.el, this.dock);
    this.wins[id] = win;
    app.icon.classList.add('run', 'bounce');
    setTimeout(() => app.icon.classList.remove('bounce'), 520);
    APPS[id](win, this);
    this.focus(win);
    sfx.tick(720, 0.08);
    return true;
  },
  toggleMax(win) {
    if (win.max) { Object.assign(win.el.style, win.max); win.max = null; win.el.classList.remove('max'); }
    else { win.max = { left: win.el.style.left, top: win.el.style.top, width: win.el.style.width, height: win.el.style.height }; Object.assign(win.el.style, { left: '0px', top: '34px', width: VW() + 'px', height: (VH() - 34) + 'px' }); win.el.classList.add('max'); }
    win.onResize && win.onResize();
  },
  close(id) {
    const win = this.wins[id]; if (!win) return;
    win.cleanup.forEach((f) => f());
    win.el.classList.add('closing');
    setTimeout(() => win.el.remove(), 190);
    delete this.wins[id];
    win.app.icon.classList.remove('run');
    this.appName.textContent = 'Desktop';
    sfx.tick(360, 0.07);
  },
  ticker(win, f) { this.tickers.add(f); win.cleanup.push(() => this.tickers.delete(f)); },
};

// keeps a canvas the size of its box, in device pixels
function fitCanvas(cv, onSize) {
  const fit = () => {
    const d = Math.min(devicePixelRatio || 1, 2), w = Math.max(2, Math.round(cv.clientWidth * d)), hh = Math.max(2, Math.round(cv.clientHeight * d));
    if (cv.width !== w || cv.height !== hh) { onSize ? onSize(w, hh, d) : (cv.width = w, cv.height = hh); }
    return d;
  };
  return fit;
}

// ------------------------------------------------------------------ programs
let Z = 1;
const VW = () => innerWidth / Z, VH = () => innerHeight / Z, CX = (e) => e.clientX / Z, CY = (e) => e.clientY / Z;
const APPS = {};

// ---- terminal
APPS.terminal = (win, os) => {
  const out = h('div'), input = h('input', { spellcheck: 'false', autocomplete: 'off', 'aria-label': 'Terminal input' });
  const el = h('div', { class: 'term' }, out, h('div', { class: 'row' }, h('span', { class: 'p' }, 'ham@dusk ~ %'), input));
  win.body.append(el);
  el.addEventListener('click', () => { if (!String(getSelection())) input.focus(); });
  const print = (txt, cls = '') => { const d = h('div', { class: 'ln ' + cls }); d.textContent = txt; out.append(d); el.scrollTop = 1e9; return d; };
  const slug = (s) => s.toLowerCase().replace(/[^a-z]+/g, '-');
  const FS = { 'about.txt': ABOUT.join('\n\n'), 'method.txt': METHOD + '\n\n' + TOPICS.map((t) => `${t.title}\n  ${t.lines.join('\n  ')}`).join('\n\n'),
    'todo.txt': '[x] ship the portfolio\n[x] put a computer inside the portfolio\n[ ] stop adding features to the computer\n[ ] touch grass (blocked: dependency on weather)' };
  WORKS.slice(0, 5).forEach((w) => { FS['projects/' + slug(w.title) + '.txt'] = `${w.title}\n${w.kind}\n\n${w.text}`; });
  const fortunes = ['A sprint without a goal is just two weeks.', 'The backlog is not a wish list. It is a queue.', 'Scope creep enters through the phrase "while we are at it".', 'No surprises at milestone reviews.',
    'If it is not in the decision log, it did not happen.', 'Estimate in ranges. Promise in dates. Sleep at night.', 'The best process is the one the team forgets is there.'];
  const hist = []; let hi = 0;
  const C = {
    help: () => { print('Things you can type:', 'hl');
      [['about', 'who lives in this computer'], ['projects', 'games I have shipped'], ['ls, cat <file>', 'look around the files'], ['open <app>', 'notes, paint, pads, game, playbook, settings'], ['wallpaper <name>', 'dusk, aurora, dunes, grid'],
        ['neofetch', 'system summary'], ['fortune', 'production wisdom'], ['standup', 'generate a standup update'], ['matrix', 'you know'], ['sound on|off', 'toggle sound'], ['clear, history, date, echo', 'the classics'], ['exit', 'walk back out to the studio']]
        .forEach(([a, b]) => print('  ' + a.padEnd(22) + b));
      print('There are a few more. Producers always keep something in reserve.', 'dim'); },
    about: () => print(ABOUT[0] + '\n' + ABOUT[2]),
    whoami: () => print('visitor (welcome). The owner is Hamna Jalil, game producer and product manager.'),
    projects: () => WORKS.slice(0, 5).forEach((w) => { print(w.title, 'hl'); print('  ' + w.kind + '. ' + w.text, ''); }),
    ls: (a) => { const dir = (a[0] || '').replace(/\/$/, ''); const names = new Set();
      Object.keys(FS).forEach((k) => { if (!dir) names.add(k.includes('/') ? k.split('/')[0] + '/' : k); else if (k.startsWith(dir + '/')) names.add(k.slice(dir.length + 1)); });
      if (!dir) names.add('secrets/');
      names.size ? print([...names].join('   ')) : print('ls: ' + dir + ': nothing here', 'err'); },
    cat: (a) => { if (!a[0]) return print('cat: which file? Try: cat about.txt', 'err'); if (a[0].startsWith('secrets')) return print('cat: secrets: permission denied. Nice try.', 'err'); FS[a[0]] ? print(FS[a[0]]) : print('cat: ' + a[0] + ': no such file', 'err'); },
    open: (a) => { const map = { pads: 'pads', beat: 'pads', game: 'game', notes: 'notes', paint: 'paint', playbook: 'playbook', settings: 'settings', terminal: 'terminal' };
      map[a[0]] ? (print('opening ' + a[0] + '...', 'ok'), os.open(map[a[0]])) : print('open: try one of: notes paint pads game playbook settings', 'err'); },
    wallpaper: (a) => os.setWallpaper(a[0]) ? print('wallpaper set to ' + a[0] + '. Look at the room when you leave.', 'ok') : print('wallpaper: try dusk, aurora, dunes or grid', 'err'),
    date: () => print(new Date().toString()),
    echo: (a) => print(a.join(' ')),
    clear: () => { out.textContent = ''; },
    history: () => hist.forEach((x, i) => print(String(i + 1).padStart(3) + '  ' + x)),
    neofetch: () => { const art = ['    .-""""-.    ', '   /  ____  \\   ', '  |  /    \\  |  ', '--+--======--+--', '  ~  ~ ~~ ~  ~  ', '   ~ ~  ~ ~~    '];
      const info = ['visitor@dusk', '------------', 'OS: Dusk OS, running inside a monitor', 'Host: a studio at dusk', 'Shell: hamsh', 'Renderer: three.js, light baked in Blender Cycles', 'Owner: Hamna Jalil', 'Role: game producer and product manager'];
      for (let i = 0; i < Math.max(art.length, info.length); i++) { const d = print(''); d.append(h('span', { class: 'p' }, (art[i] || ' '.repeat(16)) + '  '), info[i] || ''); } },
    fortune: () => print(fortunes[Math.floor(Math.random() * fortunes.length)], 'hl'),
    standup: () => { const y = ['Refined the backlog', 'Unblocked the build', 'Aligned three calendars across four time zones', 'Cut scope with love'], t = ['Milestone review prep', 'Risk register sweep', 'Retro action items', 'Shipping'], b = ['None. Suspicious.', 'Waiting on a decision from past me.', 'Coffee supply chain.'];
      const p = (x) => x[Math.floor(Math.random() * x.length)]; print('Yesterday: ' + p(y) + '.\nToday: ' + p(t) + '.\nBlockers: ' + p(b)); },
    sound: (a) => { a[0] === 'off' ? sfx.disable() : sfx.enable(); print('sound ' + (sfx.on ? 'on' : 'off'), 'ok'); },
    exit: () => { print('walking back out...', 'dim'); setTimeout(() => os.onExit && os.onExit(), 350); },
    sudo: (a) => print(a.join(' ') === 'make me a sandwich' ? 'Okay.' : 'visitor is not in the sudoers file. This incident will be raised at standup.', 'err'),
    rm: () => print('rm: refusing. This portfolio took a while.', 'err'),
    coffee: () => print('   ( (\n    ) )\n  ........\n  |      |]\n  \\      /\n   `----\'\nBrewing. Productivity restored.', 'hl'),
    ship: () => { print('Running checks...', 'dim'); setTimeout(() => print('  scope ........ held', 'ok'), 250); setTimeout(() => print('  risks ........ owned', 'ok'), 500); setTimeout(() => print('  team ......... rested', 'ok'), 750); setTimeout(() => print('Shipped. Go outside.', 'hl'), 1050); },
    git: (a) => print(a[0] === 'blame' ? 'It was the deadline. It is always the deadline.' : 'On branch main. Nothing to commit, working tree suspiciously clean.'),
    make: () => print("make: *** No rule to make target 'deadline'. Negotiating scope instead.", 'err'),
    ping: () => print('pong. Latency: one stakeholder meeting.'),
    vim: () => print('You are now trapped. Just kidding. Type anything.', 'dim'),
    hello: () => print('Hello. Glad you stepped inside.'),
    matrix: () => { const cv = h('canvas', { class: 'fill', style: 'z-index:3;pointer-events:none' }); win.body.append(cv); cv.width = cv.clientWidth; cv.height = cv.clientHeight; const c = cv.getContext('2d');
      const cols = Math.floor(cv.width / 14), ys = Array.from({ length: cols }, () => Math.random() * -40); let n = 0;
      const id = setInterval(() => { c.fillStyle = 'rgba(4,8,6,0.16)'; c.fillRect(0, 0, cv.width, cv.height); c.fillStyle = '#5dff9b'; c.font = '14px monospace';
        ys.forEach((y, i) => { c.fillText(String.fromCharCode(0x30a0 + Math.random() * 96), i * 14, y * 16); ys[i] = y * 16 > cv.height && Math.random() > 0.95 ? 0 : y + 1; });
        if (++n > 110) { clearInterval(id); cv.remove(); print('Wake up. You have a retro in ten minutes.', 'ok'); } }, 33); win.cleanup.push(() => clearInterval(id)); },
  };
  const run = (line) => {
    const d = print(''); d.append(h('span', { class: 'p' }, 'ham@dusk ~ % '), line);
    const [cmd, ...args] = line.trim().split(/\s+/);
    if (!cmd) return;
    hist.push(line); hi = hist.length;
    if (C[cmd]) C[cmd](args); else print(`hamsh: command not found: ${cmd}. Type help.`, 'err');
    sfx.tick(520, 0.05);
  };
  input.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') { run(input.value); input.value = ''; }
    else if (e.key === 'ArrowUp') { if (hi > 0) input.value = hist[--hi]; e.preventDefault(); }
    else if (e.key === 'ArrowDown') { input.value = hist[++hi] || ''; hi = Math.min(hi, hist.length); }
    else if (e.key === 'Tab') { e.preventDefault(); const m = Object.keys(C).filter((k) => k.startsWith(input.value)); if (m.length === 1) input.value = m[0] + ' '; else if (m.length) print(m.join('  '), 'dim'); }
    else if (e.key === 'Escape') os.onExit && os.onExit();
  });
  print('Dusk OS terminal. Type help, or try: neofetch', 'dim');
  win.type = (s) => run(s);
  // types a first command by itself so the window is alive on arrival
  let i = 0; const demo = 'neofetch';
  const id = setInterval(() => { if (document.activeElement === input && input.value !== demo.slice(0, i)) return clearInterval(id); input.value = demo.slice(0, ++i); if (i === demo.length) { clearInterval(id); setTimeout(() => { if (input.value === demo) { run(demo); input.value = ''; } }, 250); } }, 70);
  win.cleanup.push(() => clearInterval(id));
  setTimeout(() => input.focus(), 50);
};

// ---- paint
APPS.paint = (win) => {
  const cols = ['#ff8a5c', '#ffd166', '#3ddc84', '#4cc9f0', '#7b5cff', '#ff5fa2', '#ffffff', '#14172a'];
  const cv = h('canvas', { class: 'fill' }), tools = h('div', { class: 'tools' });
  const st = { col: cols[0], size: 8, tool: 'glow', mirror: true, hue: 0 };
  const sw = cols.map((c) => h('div', { class: 'sw', style: `background:${c}`, onclick: () => { st.col = c; if (st.tool === 'erase' || st.tool === 'rainbow') st.tool = 'glow'; sync(); } }));
  const mk = (label, fn, key) => { const b = h('button', { class: 'tl', onclick: () => { fn(); sync(); } }, label); b.dataset.k = key || ''; return b; };
  const tl = [mk('Glow', () => st.tool = 'glow', 'glow'), mk('Ink', () => st.tool = 'ink', 'ink'), mk('Rainbow', () => st.tool = 'rainbow', 'rainbow'), mk('Erase', () => st.tool = 'erase', 'erase'),
    mk('Mirror', () => st.mirror = !st.mirror, 'mirror'), mk('Thin', () => st.size = 3, 's3'), mk('Mid', () => st.size = 8, 's8'), mk('Fat', () => st.size = 20, 's20'), mk('Clear', () => { c.fillStyle = '#14172a'; c.fillRect(0, 0, cv.width, cv.height); }),
    mk('Save', () => { const a = h('a', { href: cv.toDataURL('image/png'), download: 'dusk-paint.png' }); a.click(); })];
  tools.append(...sw, ...tl);
  const sync = () => { sw.forEach((s, i) => s.classList.toggle('sel', cols[i] === st.col && st.tool !== 'rainbow' && st.tool !== 'erase')); tl.forEach((b) => b.classList.toggle('sel', b.dataset.k === st.tool || (b.dataset.k === 'mirror' && st.mirror) || b.dataset.k === 's' + st.size)); };
  const area = h('div', { class: 'cv' }, cv);
  win.body.append(h('div', { class: 'paint' }, tools, area));
  const c = cv.getContext('2d');
  let dpr = 1;
  const fit = fitCanvas(cv, (w, hh, d) => { const tmp = document.createElement('canvas'); tmp.width = cv.width; tmp.height = cv.height; if (cv.width > 2) tmp.getContext('2d').drawImage(cv, 0, 0);
    cv.width = w; cv.height = hh; dpr = d; c.fillStyle = '#14172a'; c.fillRect(0, 0, w, hh); if (tmp.width > 2) c.drawImage(tmp, 0, 0); });
  const seg = (x0, y0, x1, y1) => {
    c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = st.size * dpr;
    let col = st.col;
    if (st.tool === 'rainbow') col = `hsl(${st.hue = (st.hue + 4) % 360} 95% 62%)`;
    if (st.tool === 'erase') col = '#14172a';
    c.strokeStyle = col; c.shadowColor = col; c.shadowBlur = (st.tool === 'glow' || st.tool === 'rainbow') ? 18 * dpr : 0;
    const draw = (a, b, cc, d) => { c.beginPath(); c.moveTo(a, b); c.lineTo(cc, d); c.stroke(); };
    draw(x0, y0, x1, y1);
    if (st.mirror) draw(cv.width - x0, y0, cv.width - x1, y1);
    c.shadowBlur = 0;
  };
  let last = null;
  const pos = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * dpr / Z, (e.clientY - r.top) * dpr / Z]; };
  cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); last = pos(e); seg(...last, last[0] + 0.01, last[1]); });
  cv.addEventListener('pointermove', (e) => { if (!last) return; const p = pos(e); seg(...last, ...p); last = p; });
  cv.addEventListener('pointerup', () => { last = null; });
  win.onResize = fit;
  requestAnimationFrame(() => {
    fit(); sync();
    // a first doodle so the canvas is not empty: a mirrored phoenix-ish flourish
    const w = cv.width, hh = cv.height, keep = { ...st };
    st.tool = 'rainbow'; st.size = 5; st.mirror = true;
    let px = w * 0.5, py = hh * 0.72;
    for (let i = 1; i <= 90; i++) { const u = i / 90, x = w * (0.5 - 0.36 * Math.sin(u * 2.4) * (0.4 + u)), y = hh * (0.72 - 0.5 * u + 0.12 * Math.sin(u * 9)); seg(px, py, x, y); px = x; py = y; }
    Object.assign(st, keep); sync();
  });
};

// ---- beat pad
APPS.pads = (win, os) => {
  const rows = [
    { n: 'Kick', c: '#ff8a5c', play: (t) => sfx.kick(t) }, { n: 'Snare', c: '#ffd166', play: (t) => sfx.snare(t) }, { n: 'Hat', c: '#4cc9f0', play: (t) => sfx.hat(t) },
    { n: 'Clap', c: '#ff5fa2', play: (t) => sfx.clap(t) }, { n: 'Bass', c: '#7b5cff', play: (t, i) => sfx.bass([55, 55, 65.4, 73.4][Math.floor(i / 4) % 4], t) }, { n: 'Pluck', c: '#3ddc84', play: (t, i) => sfx.pluck([440, 523.25, 659.25, 587.33, 783.99, 659.25, 523.25, 587.33][i % 8], t) },
  ];
  const pat = ['x...x...x..x.x..', '....x.......x..x', 'x.x.x.x.x.x.x.xx', '............x...', 'x..x..x.x..x..x.', '..x...x...x..x.x'].map((s) => [...s].map((ch) => ch === 'x'));
  const cells = [];
  const grid = h('div', { class: 'grid' });
  rows.forEach((r, ri) => { grid.append(h('div', { class: 'nm' }, r.n)); cells[ri] = [];
    for (let i = 0; i < 16; i++) { const s = h('div', { class: 'st' + (i % 4 === 0 ? ' q' : '') + (pat[ri][i] ? ' on' : ''), style: `--c:${r.c}` });
      s.addEventListener('pointerdown', () => { pat[ri][i] = !pat[ri][i]; s.classList.toggle('on', pat[ri][i]); if (pat[ri][i]) r.play(undefined, i); }); cells[ri][i] = s; grid.append(s); } });
  const keys = 'ASDFGHJK';
  const live = [(t) => sfx.kick(t), (t) => sfx.snare(t), (t) => sfx.hat(t), (t) => sfx.clap(t), () => sfx.bass(55), () => sfx.bass(73.4), () => sfx.pluck(523.25), () => sfx.pluck(783.99)];
  const padEls = [...keys].map((k, i) => { const p = h('div', { class: 'pad', style: `--c:${rows[Math.min(i, 3) === i ? i : (i < 6 ? 4 : 5)].c}` }, k); p.addEventListener('pointerdown', () => hit(i)); return p; });
  const hit = (i) => { live[i](); padEls[i].classList.add('hit'); setTimeout(() => padEls[i].classList.remove('hit'), 90); };
  const warn = h('span', { class: 'warn' });
  const playBtn = h('button', { class: 'btn pri', onclick: () => { playing = !playing; playBtn.textContent = playing ? 'Stop' : 'Play'; next = performance.now(); } }, 'Stop');
  const tempo = h('input', { type: 'range', min: '70', max: '160', value: '112', style: 'width:110px' });
  const top = h('div', { class: 'top' }, playBtn,
    h('button', { class: 'btn', onclick: () => pat.forEach((p, ri) => p.forEach((_, i) => { p[i] = Math.random() < [0.3, 0.18, 0.55, 0.1, 0.3, 0.25][ri]; cells[ri][i].classList.toggle('on', p[i]); })) }, 'Shuffle'),
    h('button', { class: 'btn', onclick: () => pat.forEach((p, ri) => p.forEach((_, i) => { p[i] = false; cells[ri][i].classList.remove('on'); })) }, 'Clear'),
    h('span', {}, 'Tempo'), tempo, h('span', { class: 'sp', style: 'flex:1' }), warn);
  win.body.append(h('div', { class: 'pads' }, top, grid, h('div', { class: 'keys' }, padEls)));
  const syncWarn = () => { warn.textContent = ''; if (!sfx.on) warn.append('Sound is off. ', h('button', { class: 'btn', onclick: () => sfx.enable() }, 'Enable sound')); };
  sfx.onChange(syncWarn); syncWarn();
  let playing = true, step = 0, next = performance.now();
  os.ticker(win, () => {
    if (!playing) return;
    const now = performance.now();
    if (now >= next) {
      const s = step % 16;
      rows.forEach((r, ri) => { cells[ri][(s + 15) % 16].classList.remove('now'); cells[ri][s].classList.add('now'); if (pat[ri][s]) r.play(undefined, s); });
      step++; next += 60000 / (+tempo.value) / 4; if (now - next > 300) next = now;
    }
  });
  const kd = (e) => { if (os.wins.pads !== win || !win.el.classList.contains('front') || e.repeat) return; const i = keys.indexOf(e.key.toUpperCase()); if (i >= 0) hit(i); if (e.key === ' ') { e.preventDefault(); playBtn.click(); } };
  addEventListener('keydown', kd); win.cleanup.push(() => removeEventListener('keydown', kd));
};

// ---- game: Backlog breaker
APPS.game = (win, os) => {
  const cv = h('canvas', { class: 'fill', style: 'cursor:none' });
  win.body.append(cv);
  const c = cv.getContext('2d');
  const fit = fitCanvas(cv);
  const LABELS = ['BUG', 'P0', 'TASK', 'SPIKE', 'CHORE', 'EPIC', 'TODO', 'FIX'];
  const COLS = ['#ff5f6d', '#ff8a5c', '#ffd166', '#3ddc84', '#4cc9f0', '#7b5cff'];
  const G = { px: 0.5, auto: true, balls: [], bricks: [], parts: [], score: 0, lives: 3, level: 1, shake: 0, msg: 'Move the mouse to take over', msgT: 4, wide: 0 };
  const build = () => { G.bricks = []; const rows = 5, n = 9; for (let r = 0; r < rows; r++) for (let i = 0; i < n; i++) G.bricks.push({ x: (i + 0.5) / n, y: 0.12 + r * 0.062, w: 1 / n - 0.012, h: 0.048, col: COLS[r % COLS.length], label: LABELS[(r * 3 + i * 5) % LABELS.length], hp: r === 0 ? 2 : 1 }); };
  const serve = () => { G.balls = [{ x: G.px, y: 0.82, vx: (Math.random() - 0.5) * 0.5, vy: -0.62 - G.level * 0.06, r: 0.012 }]; };
  build(); serve();
  cv.addEventListener('pointermove', (e) => { const r = cv.getBoundingClientRect(); G.px = clamp((e.clientX - r.left) / r.width, 0.08, 0.92); if (G.auto) { G.auto = false; G.msg = 'You have the paddle. Clear the backlog.'; G.msgT = 2.5; } });
  const kd = (e) => { if (!win.el.classList.contains('front')) return; if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { G.auto = false; G.px = clamp(G.px + (e.key === 'ArrowLeft' ? -0.06 : 0.06), 0.08, 0.92); e.stopPropagation(); } };
  addEventListener('keydown', kd, true); win.cleanup.push(() => removeEventListener('keydown', kd, true));
  let lt = 0;
  os.ticker(win, (t) => {
    const d = fit(), W = cv.width, H = cv.height, dt = Math.min(0.033, t - lt || 0.016); lt = t;
    const pw = G.wide > 0 ? 0.26 : 0.17; G.wide -= dt;
    if (G.auto && G.balls[0]) { const b = G.balls.reduce((a, x) => (x.y > a.y ? x : a)); G.px += clamp(b.x + Math.sin(t * 2) * 0.04 - G.px, -dt * 1.6, dt * 1.6); G.px = clamp(G.px, 0.08, 0.92); }
    for (const b of G.balls) {
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx); } if (b.x > 1 - b.r) { b.x = 1 - b.r; b.vx = -Math.abs(b.vx); }
      if (b.y < 0.06) { b.y = 0.06; b.vy = Math.abs(b.vy); }
      if (b.vy > 0 && b.y > 0.9 && b.y < 0.94 && Math.abs(b.x - G.px) < pw / 2 + b.r) { b.vy = -Math.abs(b.vy); b.vx = (b.x - G.px) / (pw / 2) * 0.7; sfx.tick(330, 0.1); }
      for (const k of G.bricks) {
        if (k.hp <= 0) continue;
        if (Math.abs(b.x - k.x) < k.w / 2 + b.r && Math.abs(b.y - k.y) < k.h / 2 + b.r) {
          if (Math.abs(b.x - k.x) / k.w > Math.abs(b.y - k.y) / k.h) b.vx *= -1; else b.vy *= -1;
          k.hp--; G.shake = 0.15; sfx.tick(520 + Math.random() * 400, 0.1);
          if (k.hp <= 0) { G.score++; for (let i = 0; i < 12; i++) G.parts.push({ x: k.x, y: k.y, vx: (Math.random() - 0.5) * 0.7, vy: (Math.random() - 0.7) * 0.6, life: 0.7, col: k.col });
            if (Math.random() < 0.12) { G.balls.push({ x: k.x, y: k.y, vx: -b.vx, vy: Math.abs(b.vy), r: 0.012 }); G.msg = 'Hotfix: extra ball'; G.msgT = 1.5; }
            else if (Math.random() < 0.1) { G.wide = 8; G.msg = 'Extra dev: wider paddle'; G.msgT = 1.5; } }
          break;
        }
      }
    }
    G.balls = G.balls.filter((b) => b.y < 1.05);
    if (!G.balls.length) { if (!G.auto) G.lives--; if (G.lives <= 0) { G.msg = 'Sprint failed. Replanning.'; G.msgT = 2.5; G.lives = 3; G.score = 0; G.level = 1; build(); } serve(); }
    if (!G.bricks.some((k) => k.hp > 0)) { G.level++; G.msg = 'Sprint shipped. Next sprint is faster.'; G.msgT = 2.5; build(); serve(); sfx.note(523, 0.15); sfx.note(784, 0.3); }
    // draw
    c.setTransform(1, 0, 0, 1, 0, 0);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0d1024'); g.addColorStop(1, '#1b1233'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    G.shake = Math.max(0, G.shake - dt); c.translate((Math.random() - 0.5) * G.shake * 40 * d, (Math.random() - 0.5) * G.shake * 40 * d);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    for (const k of G.bricks) { if (k.hp <= 0) continue; c.fillStyle = k.col; c.globalAlpha = k.hp > 1 ? 1 : 0.88; c.beginPath(); c.roundRect((k.x - k.w / 2) * W, (k.y - k.h / 2) * H, k.w * W, k.h * H, 5 * d); c.fill();
      if (k.hp > 1) { c.strokeStyle = '#fff'; c.lineWidth = 2 * d; c.stroke(); }
      c.globalAlpha = 1; c.fillStyle = 'rgba(10,10,25,0.8)'; c.font = `700 ${Math.min(k.h * H * 0.48, k.w * W * 0.24)}px "Space Grotesk", sans-serif`; c.fillText(k.label, k.x * W, k.y * H + d); }
    for (const p of G.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += dt * 1.2; p.life -= dt; c.globalAlpha = Math.max(0, p.life / 0.7); c.fillStyle = p.col; c.fillRect(p.x * W, p.y * H, 5 * d, 5 * d); }
    G.parts = G.parts.filter((p) => p.life > 0); c.globalAlpha = 1;
    c.fillStyle = '#fff'; c.shadowColor = '#ff8a5c'; c.shadowBlur = 16 * d; c.beginPath(); c.roundRect((G.px - pw / 2) * W, 0.915 * H, pw * W, 0.022 * H, 8 * d); c.fill();
    for (const b of G.balls) { c.shadowColor = '#fff'; c.beginPath(); c.arc(b.x * W, b.y * H, b.r * Math.min(W, H) * 1.2, 0, 7); c.fill(); }
    c.shadowBlur = 0;
    c.font = `600 ${13 * d}px "Space Grotesk", sans-serif`; c.textAlign = 'left'; c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillText(`Shipped ${G.score}   Sprint ${G.level}`, 12 * d, 0.032 * H);
    c.textAlign = 'right'; c.fillText(G.auto ? 'Demo' : 'Lives ' + 'o'.repeat(G.lives), W - 12 * d, 0.032 * H);
    if ((G.msgT -= dt) > 0) { c.textAlign = 'center'; c.globalAlpha = Math.min(1, G.msgT * 2); c.font = `700 ${Math.min(22 * d, W * 0.045)}px "Space Grotesk", sans-serif`; c.fillStyle = '#fff'; c.fillText(G.msg, W / 2, H * 0.6); c.globalAlpha = 1; }
  });
};

// ---- notes: mostly pictures and chips; the long text is tucked behind "The longer story"
const ART = {
  sword: ['linear-gradient(160deg,#3a2a6a,#a8456a 70%,#ff9a5c)', '<path d="M12 2v14M8 16h8M12 16v5M10 21h4M9.5 6L12 2l2.5 4"/>'],
  stage: ['linear-gradient(160deg,#1c2a6a,#7b5cff 60%,#ff5fa2)', '<path d="M3 20h18M5 20V9h14v11M5 9l7-5 7 5"/><circle cx="9" cy="14" r="1.5"/><circle cx="15" cy="14" r="1.5"/>'],
};
const artOf = (w) => {
  if (w.img) return h('img', { src: w.img, alt: w.title, draggable: 'false' });
  const d = h('div', { class: 'drawn' });
  d.innerHTML = `<svg viewBox="0 0 24 24">${ART[w.art][1]}</svg>`;
  return d;
};
ART.star = ['linear-gradient(160deg,#5a2a6a,#ff5fa2 60%,#ffd166)', '<path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-3-5.3 3 1.1-6L3.4 9.4l6-.8z"/>'];
ART.chart = ['linear-gradient(160deg,#0f3a4a,#1c8f8a 60%,#3ddc84)', '<path d="M4 20V11M9 20V6M14 20v-7M19 20V4M2 20h20"/>'];
// the picture at the top of a card in the room: game art, a drawn tile, or the certificate logos
export function cardArt(w) {
  if (w.badge) { // an official round badge, shown whole on the shared tile; if the file is missing the drawn tile stays
    const d = artOf(w), i = h('img', { class: 'badge', loading: 'eager', src: w.badge, alt: w.title, draggable: 'false' });
    i.addEventListener('load', () => { d.replaceChildren(i); d.classList.add('hasbadge'); });
    return d;
  }
  if (w.art === 'logos') return h('div', { class: 'logorow' }, CERTS.map((x) => h('img', { src: x.img, alt: x.by, title: x.by, draggable: 'false' })));
  return artOf(w);
}
// one recommendation: a big brass quote mark, the line with its key phrase lit, then who said it
export function quoteCard(x, cls = '', whole = false) {
  const q = whole ? x.full : x.q, hi = whole ? x.fhi : x.hi;
  const i = q.indexOf(hi), bq = h('blockquote', {});
  if (hi && i >= 0) bq.append(q.slice(0, i), h('em', {}, hi), q.slice(i + hi.length)); else bq.append(q);
  return h('figure', { class: 'qc ' + cls }, bq,
    h('figcaption', {}, h('img', { src: x.img, alt: '', draggable: 'false' }), h('div', {}, h('b', {}, x.by), h('small', {}, x.role)), h('span', {}, x.rel)));
}
export function crewHead() { return h('div', { class: 'crewhead' }, h('b', {}, HELLO.crew), h('small', {}, HELLO.crewSub)); }
const chips = (list, cls = '') => h('div', { class: 'chips ' + cls }, list.map((t) => h('span', {}, t)));
APPS.notes = (win, os) => {
  const wig = WORKS.find((x) => x.id === 'wig');
  const pages = [
    { t: 'About me', s: 'Start here', html: () => [
      h('div', { class: 'hero' }, PROFILE.portrait ? h('div', { class: 'emblem pic' }, h('img', { src: PROFILE.portrait, alt: 'Portrait of ' + PROFILE.name, draggable: 'false' })) : h('div', { class: 'emblem' }, 'HJ'), h('div', {}, h('h3', {}, PROFILE.name), h('div', { class: 'role' }, PROFILE.role), h('p', { class: 'line' }, PROFILE.line))),
      h('div', { class: 'facts' }, PROFILE.facts.map(([k, v]) => h('div', {}, h('small', {}, k), h('b', {}, v)))),
      chips(PROFILE.interests),
      h('h4', {}, 'Studios'),
      h('div', { class: 'logos' }, STUDIOS.map((x) => h('div', { class: 'lg' }, h('img', { src: x.img, alt: x.name, draggable: 'false' }), h('b', {}, x.name), h('small', {}, x.role)))),
      h('details', {}, h('summary', {}, 'The longer story'), ...ABOUT.map((p) => h('p', {}, p))),
    ] },
    { t: 'Shipped', s: 'Five games', html: () => [h('h3', {}, 'Shipped'), h('p', { class: 'hint' }, 'Tap a game for the story.'),
      h('div', { class: 'games' }, WORKS.slice(0, 5).map((w) => { const c = h('div', { class: 'gc', onclick: () => c.classList.toggle('open') }, h('div', { class: 'art' }, artOf(w), h('span', { class: 'kind' }, w.kind)), h('b', {}, w.title), chips(w.tags || [], 'sm'), h('p', {}, w.text)); return c; }))] },
    { t: 'Loadout', s: 'Tools I carry', html: () => [h('h3', {}, 'Loadout'),
      h('div', { class: 'load' }, LOADOUT.map((l) => h('div', { class: 'ld', style: `--c:${l.color}` }, h('b', {}, l.name), h('small', {}, l.sub), chips(l.items, 'sm'))))] },
    { t: 'Badges', s: 'Certificates', html: () => [h('h3', {}, 'Badges'),
      h('div', { class: 'logos certs' }, CERTS.map((x) => h('div', { class: 'lg' }, h('img', { src: x.img, alt: x.by, draggable: 'false' }), h('b', {}, x.name), h('small', {}, x.by)))),
      h('div', { class: 'wig' }, (() => { const s = h('div', { class: 'star' }, '★'), i = h('img', { loading: 'eager', src: wig.badge, alt: '', draggable: 'false' }); i.addEventListener('load', () => { s.replaceChildren(i); s.classList.add('hasbadge'); }); return s; })(), h('div', {}, h('b', {}, wig.title), h('small', {}, 'International Women in Games')))] },
    { t: 'Kind words', s: 'From the crew', html: () => [crewHead(), h('div', { class: 'qgrid' }, QUOTES.map((x) => quoteCard(x, '', true)))] },
    { t: 'How I work', s: 'Systems, not heroics', html: () => [h('h3', {}, 'How I work'), h('blockquote', {}, METHOD),
      h('div', { class: 'load' }, TOPICS.map((t) => h('div', { class: 'ld click', style: '--c:var(--accent)', onclick: () => os.open('playbook') }, h('b', {}, t.title), h('small', {}, t.blurb)))),
      h('p', { class: 'hint' }, 'Each one plays as a short explainer in Playbook.')] },
    { t: 'Things to try', s: 'Around this computer', html: () => [h('h3', {}, 'Things to try'),
      h('div', { class: 'load' }, TRY.map((x) => { const a = os.apps.find((k) => k.id === x.app); return h('div', { class: 'ld click', style: `--c:${a.color}`, onclick: () => os.open(x.app) }, h('b', {}, x.t), h('small', {}, x.d)); })),
      h('p', { class: 'hint' }, 'Press Escape to walk back out to the studio.')] },
    { t: 'Scratchpad', s: 'Type anything', edit: true, html: () => [h('h3', {}, 'Scratchpad'), h('p', {}, 'This page is yours. Click and type.')] },
  ];
  const pg = h('div', { class: 'pg' }), side = h('div', { class: 'side' });
  const items = pages.map((p, i) => h('div', { class: 'it', onclick: () => show(i) }, p.t, h('small', {}, p.s)));
  const cache = {};
  let cur = -1;
  const show = (i) => { if (cur >= 0 && pages[cur].edit) cache[cur] = [...pg.childNodes]; cur = i; items.forEach((e, k) => e.classList.toggle('sel', k === i)); pg.replaceChildren(...(cache[i] || pages[i].html())); pg.contentEditable = pages[i].edit ? 'true' : 'false'; pg.scrollTop = 0; fitWin(); };
  // the window is as tall as its page needs (never shorter than the page list), unless the visitor has sized it themself
  const fitWin = () => { if (win.max || win.userSized || innerWidth < 700 || !win.el) return; requestAnimationFrame(() => { const el = win.el; el.style.height = '220px'; const want = Math.max(side.scrollHeight, pg.scrollHeight) + 40; el.style.height = clamp(want, 300, VH() - el.offsetTop - 110) + 'px'; }); };
  win.onResize = () => { win.userSized = true; };
  pg.addEventListener('keydown', (e) => { if (e.key !== 'Escape') e.stopPropagation(); });
  side.append(...items);
  win.body.append(h('div', { class: 'notes' }, side, pg));
  win.show = show;
  show(0);
};

// ---- playbook: short explainers drawn in code
const REEL = {
  sprint(c, w, hh, t) { const n = 10; for (let i = 0; i < n; i++) { const v = 0.35 + 0.3 * Math.sin(i * 0.9 + 1) + 0.25 * (i / n); const k = clamp(t * 1.5 - i * 0.18, 0, 1), bh = hh * 0.6 * v * (1 - Math.pow(1 - k, 3)); c.fillStyle = i === Math.floor(t * 2) % n ? '#ffd166' : '#ff8a5c'; c.beginPath(); c.roundRect(w * (0.1 + i * 0.082), hh * 0.85 - bh, w * 0.055, bh, 4); c.fill(); }
    c.strokeStyle = '#3ddc84'; c.lineWidth = 3; c.beginPath(); for (let i = 0; i < n; i++) { const y = hh * (0.5 - 0.03 * i - 0.04 * Math.sin(i + t)); i ? c.lineTo(w * (0.127 + i * 0.082), y) : c.moveTo(w * 0.127, y); } c.stroke(); },
  risk(c, w, hh, t) { const cx = w / 2, cy = hh / 2, R = hh * 0.4; c.strokeStyle = 'rgba(255,255,255,0.2)'; c.lineWidth = 1.5; for (let i = 1; i <= 3; i++) { c.beginPath(); c.arc(cx, cy, R * i / 3, 0, 7); c.stroke(); }
    const a = t * 1.6; const g = c.createConicGradient(a, cx, cy); g.addColorStop(0, 'rgba(255,138,92,0.55)'); g.addColorStop(0.2, 'rgba(255,138,92,0)'); g.addColorStop(1, 'rgba(255,138,92,0)'); c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill();
    for (let i = 0; i < 7; i++) { const pa = i * 2.4, pr = R * (0.3 + 0.6 * ((i * 37) % 10) / 10); const da = ((a - pa) % 6.283 + 6.283) % 6.283; c.globalAlpha = clamp(1 - da / 4, 0.12, 1); c.fillStyle = i % 3 ? '#ffd166' : '#ff5f6d'; c.beginPath(); c.arc(cx + Math.cos(pa) * pr, cy + Math.sin(pa) * pr, 6, 0, 7); c.fill(); } c.globalAlpha = 1; },
  stake(c, w, hh, t) { const pts = [[0.5, 0.5], [0.2, 0.25], [0.8, 0.25], [0.18, 0.75], [0.82, 0.75], [0.5, 0.14]]; c.lineWidth = 2;
    for (let i = 1; i < pts.length; i++) { c.strokeStyle = 'rgba(255,255,255,0.25)'; c.beginPath(); c.moveTo(pts[0][0] * w, pts[0][1] * hh); c.lineTo(pts[i][0] * w, pts[i][1] * hh); c.stroke();
      const k = (t * 0.6 + i * 0.2) % 1; c.fillStyle = '#4cc9f0'; c.beginPath(); c.arc(w * (pts[0][0] + (pts[i][0] - pts[0][0]) * k), hh * (pts[0][1] + (pts[i][1] - pts[0][1]) * k), 5, 0, 7); c.fill(); }
    pts.forEach((p, i) => { c.fillStyle = i ? '#7b5cff' : '#ff8a5c'; c.beginPath(); c.arc(p[0] * w, p[1] * hh, (i ? 13 : 20) + Math.sin(t * 2 + i) * 2, 0, 7); c.fill(); }); },
  retro(c, w, hh, t) { c.lineWidth = 3; [['#3ddc84', 0], ['#ffd166', 2], ['#ff5fa2', 4]].forEach(([col, ph]) => { c.strokeStyle = col; c.beginPath(); const n = 40, k = clamp(t * 0.5, 0, 1) || 1;
      for (let i = 0; i <= n * Math.min(1, (t * 0.6) % 1.6); i++) { const u = i / n, y = hh * (0.7 - 0.35 * u * (ph === 0 ? 1 : ph === 2 ? 0.4 : -0.3) - 0.07 * Math.sin(u * 9 + ph)); i ? c.lineTo(w * (0.1 + 0.8 * u), y) : c.moveTo(w * 0.1, y); } c.stroke(); });
    c.strokeStyle = 'rgba(255,255,255,0.3)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(w * 0.1, hh * 0.12); c.lineTo(w * 0.1, hh * 0.88); c.lineTo(w * 0.92, hh * 0.88); c.stroke(); },
};
APPS.playbook = (win, os) => {
  const root = h('div', { class: 'play' });
  win.body.append(root);
  const thumbs = [];
  let stage = null;
  const home = () => { stage = null; thumbs.length = 0;
    root.replaceChildren(h('h3', {}, 'Playbook'), h('p', { class: 'sub' }, 'How I run production. Four short explainers, drawn in code.'),
      h('div', { class: 'grid' }, TOPICS.map((tp) => { const cv = h('canvas', { width: '320', height: '180' }); thumbs.push({ cv, id: tp.id }); return h('div', { class: 'cd', onclick: () => play(tp) }, cv, h('b', {}, tp.title), h('small', {}, tp.blurb)); }))); };
  const play = (tp) => {
    const cv = h('canvas'), cap = h('p'), tr = h('i'), chap = h('b');
    const pause = h('button', { class: 'btn', onclick: () => { stage.paused = !stage.paused; pause.textContent = stage.paused ? 'Play' : 'Pause'; } }, 'Pause');
    stage = { tp, cv, cap, tr, chap, t: 0, paused: false };
    root.replaceChildren(h('div', { class: 'stage' }, cv, h('div', { class: 'cap' }, chap, cap), h('div', { class: 'ctl' }, h('button', { class: 'btn', onclick: home }, 'All topics'), pause, h('div', { class: 'tr' }, tr))));
    sfx.tick(600, 0.08);
  };
  let lt = 0;
  os.ticker(win, (t) => {
    const dt = Math.min(0.05, t - lt || 0.016); lt = t;
    const bg = (c, w, hh) => { c.setTransform(1, 0, 0, 1, 0, 0); const g = c.createLinearGradient(0, 0, w, hh); g.addColorStop(0, '#12152a'); g.addColorStop(1, '#1d1233'); c.fillStyle = g; c.fillRect(0, 0, w, hh); };
    if (stage) {
      const { cv, tp } = stage; const d = Math.min(devicePixelRatio || 1, 2), w = Math.round(cv.clientWidth * d), hh = Math.round(cv.clientHeight * d);
      if (cv.width !== w || cv.height !== hh) { cv.width = w; cv.height = hh; }
      if (!stage.paused) stage.t += dt;
      const per = 3.4, total = per * tp.lines.length, tt = stage.t % total, i = Math.floor(tt / per);
      const c = cv.getContext('2d'); bg(c, w, hh); c.save(); c.scale(d, d); REEL[tp.id](c, w / d, hh / d, stage.t); c.restore();
      stage.chap.textContent = `${tp.title} · ${i + 1} of ${tp.lines.length}`; if (stage.cap.textContent !== tp.lines[i]) stage.cap.textContent = tp.lines[i];
      stage.tr.style.width = (tt / total * 100) + '%';
    } else for (const th of thumbs) { const c = th.cv.getContext('2d'); bg(c, 320, 180); REEL[th.id](c, 320, 180, t); }
  });
  home();
};

// ---- settings
APPS.settings = (win, os) => {
  const walls = h('div', { class: 'walls' }, Object.keys(WALLS).map((id) => { const cv = h('canvas', { width: '240', height: '150' }); paintWallpaper(cv.getContext('2d'), 240, 150, id);
    const e = h('div', { class: 'wl' + (os.state.wallpaper === id ? ' sel' : ''), onclick: () => { os.setWallpaper(id); walls.querySelectorAll('.wl').forEach((x) => x.classList.remove('sel')); e.classList.add('sel'); sfx.tick(700); } }, cv, h('small', {}, WALLS[id].name)); return e; }));
  const accs = ['#ff8a5c', '#ffd166', '#3ddc84', '#4cc9f0', '#b08cff', '#ff5fa2'];
  const acc = h('div', { class: 'acc' }, accs.map((c) => { const e = h('i', { class: os.state.accent === c ? 'sel' : '', style: `background:${c}`, onclick: () => { os.setAccent(c); acc.querySelectorAll('i').forEach((x) => x.classList.remove('sel')); e.classList.add('sel'); sfx.tick(800); } }); return e; }));
  const scanBtn = h('button', { class: 'btn', onclick: () => { os.state.scan = !os.state.scan; os.el.classList.toggle('noscan', !os.state.scan); scanBtn.textContent = os.state.scan ? 'On' : 'Off'; } }, 'On');
  const sndBtn = h('button', { class: 'btn', onclick: () => sfx.toggle() }, sfx.on ? 'On' : 'Off');
  sfx.onChange((on) => { sndBtn.textContent = on ? 'On' : 'Off'; });
  win.body.append(h('div', { class: 'set' }, h('h4', {}, 'Wallpaper'), walls, h('h4', {}, 'Accent colour'), acc,
    h('div', { class: 'rowt' }, 'Screen lines', scanBtn), h('div', { class: 'rowt' }, 'Sound', sndBtn),
    h('div', { class: 'about' }, 'Dusk OS runs inside a monitor, inside a room. The room is drawn with three.js and its light was baked in Blender with Cycles. The wallpaper you choose here also lights the real desk outside.')));
};
