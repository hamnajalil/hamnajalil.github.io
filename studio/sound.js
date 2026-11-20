// All sound is made in code and stays silent until the visitor enables it.
export const sfx = {
  on: false, ctx: null, master: null, listeners: [],
  enable() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      const comp = this.ctx.createDynamicsCompressor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(comp); comp.connect(this.ctx.destination);
      const n = this.ctx.sampleRate, buf = this.ctx.createBuffer(1, n, n), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      this.noise = buf;
    }
    // No background sound: Ham found both generated ambiences synthetic, tiring and out of place (2026-11-14). Clicks only.
    const woke = this.ctx.resume();
    this.on = true;
    this.listeners.forEach((f) => f(true));
    // wait until the browser has really started the sound before playing: notes asked for while it is still waking are lost
    if (woke && woke.then) woke.then(() => this.chime(), () => {}); else this.chime();
  },
  disable() { this.on = false;  this.listeners.forEach((f) => f(false)); },
  toggle() { this.on ? this.disable() : this.enable(); },
  onChange(f) { this.listeners.push(f); },
  _env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); },
  _osc(type, f, t, dur, peak, f2) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    this._env(g, t, 0.004, peak, dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.05);
  },
  _noise(t, dur, peak, type, freq, q = 1) {
    const s = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    s.buffer = this.noise; f.type = type; f.frequency.value = freq; f.Q.value = q;
    this._env(g, t, 0.002, peak, dur);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + dur + 0.05);
    return f;
  },
  tick(f = 880, v = 0.12) { if (this.on) this._osc('sine', f * 0.5, this.ctx.currentTime, 0.07, v * 0.3); },
  note(f, dur = 0.25, type = 'triangle', v = 0.2, when) { if (this.on) this._osc(type, f, when || this.ctx.currentTime, dur, v); },
  // switching sound on answers with two soft rising notes (Ham, 2026-11-17: "a very subtle sfx"), about a third as loud as the beat pad's kick
  chime() { if (!this.on) return; const t = this.ctx.currentTime + 0.03; this._osc('sine', 523.25, t, 0.34, 0.3); this._osc('sine', 783.99, t + 0.12, 0.5, 0.24); },
  // a plaque or the monitor lighting up in the room: barely there, and never more than eight a second
  hover() { if (!this.on) return; const t = this.ctx.currentTime; if (t - (this._hov || 0) < 0.12) return; this._hov = t; this._osc('sine', 392, t, 0.06, 0.08); },
  whoosh() { this.tick(520, 0.1); }, // was a long sweep; now the same soft click as everything else
  kick(when) { if (this.on) { const t = when || this.ctx.currentTime; this._osc('sine', 150, t, 0.32, 0.9, 42); } },
  snare(when) { if (this.on) { const t = when || this.ctx.currentTime; this._noise(t, 0.16, 0.5, 'highpass', 1500); this._osc('triangle', 190, t, 0.1, 0.3, 120); } },
  hat(when, open) { if (this.on) this._noise(when || this.ctx.currentTime, open ? 0.25 : 0.045, 0.22, 'highpass', 7000); },
  clap(when) { if (this.on) { const t = when || this.ctx.currentTime; for (let i = 0; i < 3; i++) this._noise(t + i * 0.012, 0.09, 0.3, 'bandpass', 1400, 1.5); } },
  bass(f, when) { if (this.on) { const t = when || this.ctx.currentTime; this._osc('sawtooth', f, t, 0.22, 0.22); this._osc('sine', f / 2, t, 0.26, 0.3); } },
  pluck(f, when) { if (this.on) { const t = when || this.ctx.currentTime; this._osc('square', f, t, 0.3, 0.08); this._osc('triangle', f * 2, t, 0.2, 0.08); } },
};
