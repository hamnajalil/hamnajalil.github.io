// The Orrery room: baked Cycles lighting drawn unlit, plus a few live parts (screens, glowing bits, floor sheen, scenery).
// This is the Orrery copy of the studio. The original room lives untouched in ../studio-portfolio.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { WORKS, PROFILE, INTRO, HELLO, QUOTES, LINKS, SKILLS, TOUR } from './content.js';
import { OS, paintWallpaper, wallpaperTint, cardArt, quoteCard, crewHead } from './os.js';
import { sfx } from './sound.js';

const Q = new URLSearchParams(location.search);
const FROZEN = Q.has('t') ? parseFloat(Q.get('t')) : null;
const VIEW = Q.get('view') || 'room';
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.LinearSRGBColorSpace; // we tonemap + encode ourselves
renderer.autoClear = true;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(76, 16 / 9, 0.02, 7000);

// ---------------------------------------------------------------- shared GLSL
const SKY_GLSL = /* glsl */`
vec3 ramp5(float t, vec3 a, vec3 b, vec3 c, vec3 d, vec3 e){
  vec3 r = mix(a, b, clamp(t / 0.1, 0., 1.));
  r = mix(r, c, clamp((t - 0.1) / 0.18, 0., 1.));
  r = mix(r, d, clamp((t - 0.28) / 0.32, 0., 1.));
  r = mix(r, e, clamp((t - 0.6) / 0.4, 0., 1.));
  return r;
}
vec3 skyColor(vec3 d){
  d = normalize(d);
  float z = clamp(d.y / 0.7, 0., 1.);
  vec3 sun = ramp5(z, vec3(1.0,0.36,0.1), vec3(0.9,0.28,0.22), vec3(0.36,0.17,0.4), vec3(0.06,0.08,0.26), vec3(0.012,0.025,0.1));
  vec3 far = mix(vec3(0.22,0.17,0.3), vec3(0.08,0.09,0.24), clamp(z / 0.3, 0., 1.));
  far = mix(far, vec3(0.012,0.025,0.1), clamp((z - 0.3) / 0.7, 0., 1.));
  float f = pow(clamp(dot(d, normalize(vec3(0.3, 0.0, -0.954))), 0., 1.), 2.0);
  return mix(far, sun, f) * 1.25;
}
float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(hash21(i), hash21(i+vec2(1,0)), f.x), mix(hash21(i+vec2(0,1)), hash21(i+vec2(1,1)), f.x), f.y); }
`;

// ---------------------------------------------------------------- materials
const U = {
  uTime: { value: 0 },
  uMon: { value: new THREE.Color(0, 0, 0) },
  tPano: { value: null },
  uWake: { value: 1 }, // the opening: 0.3 = the room before its lamps come on, 1 = lit
  tRefl: { value: null }, uReflM: { value: new THREE.Matrix4() }, uReflOn: { value: 0 }, uReflPx: { value: new THREE.Vector2() },
};
// the dusk scenery is one 360 picture rendered in Blender from the middle of the room (studio/pano.jpg)
const PANO_GLSL = /* glsl */`
uniform sampler2D tPano;
vec3 pano(vec3 d){
  d = normalize(d);
  vec2 uv = vec2(0.5 + atan(d.x, -d.z) / 6.2831853, 0.5 + asin(clamp(d.y, -1., 1.)) / 3.14159265);
  return pow(texture2D(tPano, uv).rgb, vec3(2.2)) * 4.0;
}`;
// the dark polished floor: baked light plus a live mirror image of the windows, so it shifts as you move
function floorMaterial(tA, tB) {
  return new THREE.ShaderMaterial({
    uniforms: { tA: { value: tA }, tB: { value: tB }, uMon: U.uMon, uWake: U.uWake, tPano: U.tPano, tRefl: U.tRefl, uReflM: U.uReflM, uReflOn: U.uReflOn, uReflPx: U.uReflPx },
    side: THREE.DoubleSide,
    vertexShader: `varying vec2 vUv; varying vec3 vW; varying vec3 vNw;
      void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vNw = mat3(modelMatrix) * normal; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      varying vec2 vUv; varying vec3 vW; varying vec3 vNw;
      uniform sampler2D tA, tB, tRefl; uniform vec3 uMon; uniform float uWake; uniform mat4 uReflM; uniform float uReflOn; uniform vec2 uReflPx;
      ${PANO_GLSL}
      vec3 dec(vec3 c){ return pow(c, vec3(2.2)) * 4.0; }
      void main(){
        vec3 c = dec(texture2D(tA, vUv).rgb) * uWake + dec(texture2D(tB, vUv).rgb) * uMon;
        vec3 n = normalize(vNw);
        if (n.y > 0.9) {
          vec3 v = normalize(vW - cameraPosition);
          vec3 r = reflect(v, n);
          float fr = 0.05 + 0.95 * pow(1.0 - max(dot(-v, n), 0.0), 5.0);
          // where the mirrored ray meets the round wall (radius 4.4): glass shows the scenery; sill, dome and timber stay dark
          vec2 o = vW.xz, d = r.xz;
          float a = max(dot(d, d), 1e-5), b = dot(o, d), cc = dot(o, o) - 19.36;
          float t = (-b + sqrt(max(b * b - a * cc, 0.0))) / a;
          float h = vW.y + r.y * t; vec2 hit = o + d * t;
          float ang = degrees(atan(hit.x, -hit.y));
          float win = smoothstep(0.32, 0.38, h) * (1.0 - smoothstep(2.64, 2.7, h)) * (1.0 - smoothstep(127.0, 129.0, abs(ang)));
          float mul = abs(fract((ang + 128.0) / 12.8 + 0.5) - 0.5) * 12.8;
          win *= smoothstep(0.25, 0.4, mul);
          vec3 env = pano(r) * win + vec3(0.02, 0.016, 0.014) * (1.0 - win);
          if (uReflOn > 0.0) { // the room's contents, drawn upside down from under the floor (see "floor mirror" in the loop)
            vec4 rc = uReflM * vec4(vW, 1.0); vec2 ruv = rc.xy / rc.w;
            vec4 rf = texture2D(tRefl, ruv) * 0.4;
            rf += (texture2D(tRefl, ruv + uReflPx * vec2(1.0, 0.6)) + texture2D(tRefl, ruv + uReflPx * vec2(-1.0, -0.6))
                 + texture2D(tRefl, ruv + uReflPx * vec2(0.6, -1.0)) + texture2D(tRefl, ruv + uReflPx * vec2(-0.6, 1.0))) * 0.15;
            rf *= uReflOn; env *= 1.0 - rf.a; // the picture is black where nothing stands, so this lays it over the scenery
            c += rf.rgb * max(fr, 0.2) * 0.85; // a polished floor: the room's contents stay readable even looking steeply down
          }
          env += vec3(5.0, 3.1, 1.5) * smoothstep(0.035, 0.0, abs(h - 2.72));
          c += env * fr * 0.85;
        }
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
}
function bakedMaterial(tA, tB, opts = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      tA: { value: tA }, tB: { value: tB }, uMon: U.uMon, uTime: U.uTime, uWake: U.uWake,
      uHi: { value: 0 }, uGhost: { value: 0 }, uSway: { value: new THREE.Vector4(0, 0, 0, 0) },
    },
    side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying vec3 vL; varying float vFlat;
      uniform float uTime; uniform vec4 uSway; // xz = pivot, y = base height, w = amplitude
      void main(){
        vUv = uv;
        vec3 p = position;
        if (uSway.w > 0.0) {
          float h = max(0.0, p.y - uSway.y);
          float ph = p.x * 9.0 + p.z * 7.0;
          float k = h * h * uSway.w;
          p.x += sin(uTime * 0.9 + ph) * k + sin(uTime * 2.3 + ph * 1.7) * k * 0.3;
          p.z += cos(uTime * 0.7 + ph * 1.3) * k * 0.6;
        }
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vN = normalMatrix * normal; vV = -mv.xyz;
        vFlat = abs(normalize(mat3(modelMatrix) * normal).y); // 1 on level surfaces (ledge, desk and tray tops)
        vL = (viewMatrix * vec4(0.0, 2.9, 0.0, 1.0)).xyz - mv.xyz; // towards the lamp at the heart of the orrery
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying vec3 vL; varying float vFlat;
      uniform sampler2D tA, tB; uniform vec3 uMon; uniform float uHi, uWake, uGhost;
      vec3 dec(vec3 c){ return pow(c, vec3(2.2)) * 4.0; }
      void main(){
        if (uGhost > 0.0) { vec2 q = floor(gl_FragCoord.xy); if (fract(sin(dot(q, vec2(12.9898, 78.233))) * 43758.5453) < uGhost) discard; } // dissolves a piece the camera stands right behind
        vec3 c = dec(texture2D(tA, vUv).rgb) * uWake + dec(texture2D(tB, vUv).rgb) * uMon;
        c = mix(c, vec3(1.3) + (c - 1.3) * 0.28, step(1.3, c)); // soft knee: lit screens keep their colour instead of burning to white
        { // a painted-on highlight from the lamp: warm metal (brass, the phoenix) and lit glass catch it; matte things do not
          vec3 n = normalize(vN), v = normalize(vV); if (dot(n, v) < 0.0) n = -n;
          float sp = pow(max(dot(n, normalize(normalize(vL) + v)), 0.0), 42.0);
          float fr = pow(1.0 - max(dot(n, v), 0.0), 3.0);
          float lum = dot(c, vec3(0.3, 0.6, 0.1));
          float metal = smoothstep(0.05, 0.22, c.r - c.b) * smoothstep(0.02, 0.1, c.r - c.g) * smoothstep(0.05, 0.3, lum);
          metal *= 1.0 - smoothstep(0.8, 0.95, vFlat); // not on level wood: the lamp's mirror spot on the ledge burned out to a white patch in some card views
          float glass = smoothstep(0.1, 0.4, c.b - c.r) * smoothstep(0.3, 0.9, lum);
          c += vec3(1.0, 0.8, 0.5) * (sp * 1.1 + fr * 0.1) * metal + vec3(0.9, 0.95, 1.0) * (sp * 0.9 + fr * 0.25) * glass;
        }
        if (uHi > 0.0) {
          float rim = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.0);
          c += uHi * (c * 0.22 + vec3(1.0, 0.72, 0.42) * (0.04 + rim * 0.4));
        }
        gl_FragColor = vec4(c, 1.0);
      }`,
    ...opts,
  });
}

// monitor screen: a canvas texture with a tube-style turn on
const screenCanvas = document.createElement('canvas');
screenCanvas.width = 1280; screenCanvas.height = 564;
const screenTex = new THREE.CanvasTexture(screenCanvas);
screenTex.flipY = false; screenTex.colorSpace = THREE.NoColorSpace; screenTex.anisotropy = 8;
const screenMat = new THREE.ShaderMaterial({
  uniforms: { tMap: { value: screenTex }, uOn: { value: 0 }, uTime: U.uTime, uFlick: { value: 1 }, uHi: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    varying vec2 vUv; uniform sampler2D tMap; uniform float uOn, uTime, uFlick, uHi;
    ${SKY_GLSL}
    void main(){
      vec2 uv = vUv;
      // tube turn-on: a bright line that opens vertically, then horizontally settles
      float open = smoothstep(0.0, 0.55, uOn);
      float hy = mix(0.004, 0.5, pow(open, 2.2));
      float hx = mix(0.02, 0.5, smoothstep(0.0, 0.22, uOn));
      vec2 c = abs(uv - 0.5);
      float inside = step(c.y, hy) * step(c.x, hx);
      vec2 suv = vec2(0.5 + (uv.x - 0.5) * 0.5 / hx, 0.5 + (uv.y - 0.5) * 0.5 / hy);
      vec3 img = pow(texture2D(tMap, clamp(suv, 0., 1.)).rgb, vec3(2.2));
      float settle = smoothstep(0.5, 1.0, uOn);
      vec3 white = vec3(0.85, 0.93, 1.0) * 3.0;
      vec3 col = mix(white, img * 1.9, settle);
      float line = 0.93 + 0.07 * sin(uv.y * 564.0 * 3.14159);
      float roll = 1.0 + 0.05 * smoothstep(0.02, 0.0, abs(fract(uv.y - uTime * 0.11) - 0.5) - 0.02) * settle;
      col *= line * roll * uFlick;
      col *= inside * step(0.001, uOn);
      // glass: faint reflection of the dusk window
      col += vec3(0.012, 0.011, 0.014) + 0.02 * vec3(1.0, 0.5, 0.4) * smoothstep(0.9, 0.0, vUv.x) * smoothstep(1.0, 0.0, vUv.y);
      col += uHi * vec3(0.03, 0.04, 0.06);
      gl_FragColor = vec4(col, 1.0);
    }`,
});
const lapCanvas = document.createElement('canvas');
lapCanvas.width = 512; lapCanvas.height = 330;
const lapTex = new THREE.CanvasTexture(lapCanvas);
lapTex.flipY = false; lapTex.colorSpace = THREE.NoColorSpace;
const lapMat = new THREE.ShaderMaterial({
  uniforms: { tMap: { value: lapTex } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `varying vec2 vUv; uniform sampler2D tMap; void main(){ gl_FragColor = vec4(pow(texture2D(tMap, vUv).rgb, vec3(2.2)) * 1.5, 1.0); }`,
});
function paintLaptop() {
  const c = lapCanvas.getContext('2d');
  c.fillStyle = '#10151f'; c.fillRect(0, 0, 512, 330);
  c.fillStyle = '#1b2333'; c.fillRect(0, 0, 512, 22); c.fillRect(0, 22, 96, 308);
  const cols = ['#7fd1ff', '#ffb86b', '#c3e88d', '#f78c9f', '#b9c2d9'];
  let s = 11;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 20; i++) {
    let x = 110 + Math.floor(rnd() * 3) * 16;
    const n = 1 + Math.floor(rnd() * 4);
    for (let k = 0; k < n; k++) {
      const w = 20 + rnd() * 80;
      c.fillStyle = cols[Math.floor(rnd() * cols.length)];
      c.globalAlpha = 0.85; c.fillRect(x, 34 + i * 14, w, 5); x += w + 8;
    }
  }
  c.globalAlpha = 0.5; c.fillStyle = '#b9c2d9';
  for (let i = 0; i < 12; i++) c.fillRect(10 + (i % 3) * 6, 34 + i * 16, 50 + rnd() * 24, 4);
  c.globalAlpha = 1;
  lapTex.needsUpdate = true;
}
// the tall second screen (G12, 2026-11-16): one recommendation at a time from QUOTES, changing every SIDE_EVERY seconds.
// It used to be a made-up roadmap board; her strongest proof was two clicks away. Clicking it opens the say-hello panel.
const sideCanvas = document.createElement('canvas');
sideCanvas.width = 396; sideCanvas.height = 672;
const sideTex = new THREE.CanvasTexture(sideCanvas);
sideTex.flipY = false; sideTex.colorSpace = THREE.NoColorSpace;
const sideMat = new THREE.ShaderMaterial({ uniforms: { tMap: { value: sideTex } }, vertexShader: lapMat.vertexShader, fragmentShader: lapMat.fragmentShader });
const SIDE_EVERY = 9, sideQuotes = QUOTES.filter((q) => q.q).slice(0, 5), sideFaces = {};
let sideIdx = 0, sideAlpha = 1, sideDrawn = '';
for (const q of sideQuotes) if (q.img) { const im = new Image(); im.onload = () => { sideFaces[q.by] = im; sideDrawn = ''; }; im.src = q.img; }
function wrapText(c, text, maxW) {
  const out = []; let line = '';
  for (const word of text.split(' ')) { const tryL = line ? line + ' ' + word : word; if (c.measureText(tryL).width > maxW && line) { out.push(line); line = word; } else line = tryL; }
  if (line) out.push(line); return out;
}
function paintSide() {
  const c = sideCanvas.getContext('2d'), w = 396, h = 672, q = sideQuotes[sideIdx], SX = 50; // SX: left margin; from the desk the main monitor hides the screen's left edge
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#191535'); g.addColorStop(1, '#2a1a44');
  c.globalAlpha = 1; c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.fillStyle = 'rgba(255,255,255,0.07)'; c.fillRect(0, 0, w, 54);
  c.textBaseline = 'middle'; c.textAlign = 'left';
  c.fillStyle = '#f4dfb6'; c.font = '700 19px "Space Grotesk", system-ui, sans-serif';
  c.fillText(HELLO.crew, SX, 28);
  if (q) {
    c.globalAlpha = sideAlpha;
    c.fillStyle = '#dea85c'; c.font = '700 110px Georgia, serif'; c.fillText('“', SX - 6, 138);
    c.fillStyle = '#fff'; c.font = '600 28px "Space Grotesk", system-ui, sans-serif';
    const lines = wrapText(c, q.q, w - SX - 20); let y = 196;
    for (const ln of lines) { c.fillText(ln, SX, y); y += 39; }
    const fy = 548, face = sideFaces[q.by];
    c.fillStyle = 'rgba(222,168,92,0.55)'; c.fillRect(SX, fy - 52, 60, 2);
    if (face) { c.save(); c.beginPath(); c.arc(SX + 34, fy, 34, 0, 6.2832); c.clip(); const sz = Math.min(face.width, face.height); c.drawImage(face, (face.width - sz) / 2, (face.height - sz) / 2, sz, sz, SX, fy - 34, 68, 68); c.restore(); c.strokeStyle = '#dea85c'; c.lineWidth = 2; c.beginPath(); c.arc(SX + 34, fy, 34, 0, 6.2832); c.stroke(); }
    const tx = face ? SX + 82 : SX;
    c.fillStyle = '#fff'; c.font = '700 22px "Space Grotesk", system-ui, sans-serif'; c.fillText(q.by, tx, fy - 13);
    c.fillStyle = 'rgba(244,223,182,0.85)'; c.font = '500 15px "Space Grotesk", system-ui, sans-serif';
    wrapText(c, q.role, w - tx - 18).slice(0, 2).forEach((ln, k) => c.fillText(ln, tx, fy + 13 + k * 19));
    c.globalAlpha = 1;
  }
  sideQuotes.forEach((_, k) => { c.fillStyle = k === sideIdx ? '#dea85c' : 'rgba(255,255,255,0.28)'; c.beginPath(); c.arc(w / 2 + (k - (sideQuotes.length - 1) / 2) * 20, 636, k === sideIdx ? 5 : 4, 0, 6.2832); c.fill(); });
  sideTex.needsUpdate = true;
}
function sideStep(t) { // called every frame; repaints only while a quote fades in or out
  if (!sideQuotes.length) return;
  const ph = ((t % SIDE_EVERY) + SIDE_EVERY) % SIDE_EVERY, idx = Math.floor(t / SIDE_EVERY) % sideQuotes.length;
  const a = Math.round(THREE.MathUtils.smoothstep(ph, 0, 0.7) * (1 - THREE.MathUtils.smoothstep(ph, SIDE_EVERY - 0.7, SIDE_EVERY)) * 20) / 20;
  const key = idx + ':' + a;
  if (key !== sideDrawn) { sideDrawn = key; sideIdx = (idx + sideQuotes.length) % sideQuotes.length; sideAlpha = a; paintSide(); }
}

// the arcade cabinet's game and the festival stage's backdrop, drawn once
function liveScreen(w, h, gain, paint) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const tx = new THREE.CanvasTexture(cv); tx.flipY = false; tx.colorSpace = THREE.NoColorSpace;
  paint(cv.getContext('2d'), w, h); tx.needsUpdate = true;
  return new THREE.ShaderMaterial({ uniforms: { tMap: { value: tx } }, side: THREE.DoubleSide, vertexShader: lapMat.vertexShader,
    fragmentShader: `varying vec2 vUv; uniform sampler2D tMap; void main(){ gl_FragColor = vec4(pow(texture2D(tMap, vUv).rgb, vec3(2.2)) * ${gain.toFixed(1)}, 1.0); }` });
}
// the Women in Games ambassador badge on the hanging award: the official picture on a white disc
const wigTex = new THREE.TextureLoader().load('studio/img/women-in-games.webp', (t) => { t.flipY = false; t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8; });
const wigMat = new THREE.ShaderMaterial({ uniforms: { tMap: { value: wigTex } }, side: THREE.DoubleSide, vertexShader: lapMat.vertexShader,
  fragmentShader: `varying vec2 vUv; uniform sampler2D tMap; void main(){ if (distance(vUv, vec2(0.5)) > 0.5) discard; vec4 c = texture2D(tMap, vUv); vec3 col = mix(vec3(1.0), c.rgb, c.a); gl_FragColor = vec4(pow(col, vec3(2.2)) * 0.95, 1.0); }` });
const arcadeMat = liveScreen(320, 220, 2.6, (c, w, h) => {
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0b1140'); g.addColorStop(0.7, '#3a1a6a'); g.addColorStop(1, '#a8456a');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  let s = 5; const r = () => (s = (s * 16807) % 2147483647) / 2147483647, P = 10;
  c.fillStyle = '#fff'; for (let i = 0; i < 26; i++) c.fillRect(Math.floor(r() * w / 4) * 4, Math.floor(r() * h * 0.6 / 4) * 4, 4, 4);
  c.fillStyle = '#ffd166'; c.beginPath(); c.arc(w * 0.78, h * 0.3, 22, 0, 7); c.fill();
  const px = (x, y, col) => { c.fillStyle = col; c.fillRect(x * P, y * P, P, P); };
  for (let x = 0; x < 32; x++) { const top = 17 + (x % 9 < 3 ? -2 : 0) + (x % 13 === 5 ? -3 : 0); for (let y = top; y < 22; y++) px(x, y, y === top ? '#3ddc84' : '#1c6b55'); }
  [[5, 0], [4, 1], [5, 1], [6, 1], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [4, 3], [6, 3]].forEach(([x, y]) => px(x + 6, y + 9, '#ff8a5c')); // a small bird in flight
  px(11, 10, '#fff');
  [[20, 12], [21, 11], [22, 12]].forEach(([x, y]) => px(x, y, '#ffd166'));
  c.fillStyle = '#fff'; c.font = 'bold 18px monospace'; c.fillText('PRESS START', 96, 26);
});
const festivalMat = liveScreen(360, 270, 2.2, (c, w, h) => {
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1a0f3a'); g.addColorStop(0.6, '#7b2d7a'); g.addColorStop(1, '#ff5f8a');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.globalCompositeOperation = 'lighter';
  [['#ffd166', -0.55], ['#4cc9f0', -0.2], ['#ff5fa2', 0.18], ['#b08cff', 0.5]].forEach(([col, a]) => { c.fillStyle = col + '55'; c.beginPath(); c.moveTo(w / 2 + a * 60, 0); c.lineTo(w / 2 + a * 420 - 46, h); c.lineTo(w / 2 + a * 420 + 46, h); c.fill(); });
  c.globalCompositeOperation = 'source-over';
  const n = 18; for (let i = 0; i < n; i++) { const bh = h * (0.12 + 0.3 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6))); c.fillStyle = i % 3 ? '#ffe9c2' : '#ffd166'; c.fillRect(24 + i * ((w - 48) / n), h * 0.62 - bh, (w - 48) / n - 5, bh); }
  c.fillStyle = '#12091f'; c.beginPath(); c.moveTo(0, h);
  for (let x = 0; x <= w; x += 6) c.lineTo(x, h * (0.8 - 0.05 * Math.abs(Math.sin(x * 0.21)) - 0.03 * Math.abs(Math.sin(x * 0.07 + 1))));
  c.lineTo(w, h); c.fill();
});

// ---------------------------------------------------------------- exterior: the 360 dusk picture on a huge sphere
function buildExterior() {
  const dome = new THREE.Mesh(new THREE.SphereGeometry(3000, 48, 32), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, uniforms: { uTime: U.uTime, tPano: U.tPano },
    vertexShader: `varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      varying vec3 vD; uniform float uTime;
      ${SKY_GLSL}
      ${PANO_GLSL}
      void main(){
        vec3 d = normalize(vD); float glint = 0.0;
        if (d.y < -0.004) { // a little life on the water
          float dist = 1.0 / max(0.02, -d.y);
          vec2 w = d.xz * dist;
          float rip = vnoise(w * vec2(1.4, 4.0) + vec2(uTime * 0.2, uTime * 0.5)) - 0.5;
          float rip2 = vnoise(w * vec2(3.1, 9.0) - vec2(uTime * 0.13, uTime * 0.8)) - 0.5;
          float k = clamp(-d.y * 8.0, 0.0, 1.0);
          d.y += (rip * 0.012 + rip2 * 0.006) * k;
          d.x += rip2 * 0.004 * k;
          glint = pow(max(0.0, vnoise(w * vec2(5.0, 22.0) + vec2(uTime * 0.35, uTime * 1.1))), 9.0) * k * smoothstep(0.5, 0.02, -d.y);
        }
        vec3 col = pano(d);
        { // straight up, the 360 picture is one flat blue; fade it into a deep night sky with a few stars
          float zen = smoothstep(0.3, 0.68, d.y);
          vec2 sq = d.xz * 90.0; float star = step(0.992, hash21(floor(sq))) * smoothstep(0.35, 0.0, length(fract(sq) - 0.5));
          col = mix(col, vec3(0.018, 0.026, 0.085) + vec3(1.6, 1.4, 1.1) * star, zen);
        }
        col += vec3(1.0, 0.78, 0.6) * glint * (0.25 + 1.6 * dot(col, vec3(0.33)));
        gl_FragColor = vec4(col, 1.0);
      }`,
  }));
  dome.renderOrder = -10;
  dome.position.set(0, 1.6, 0);
  return dome;
}

// glass pane: fake reflections of the room lights that move like real ones
const glassMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { uP: { value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] }, uC: { value: [new THREE.Color(), new THREE.Color(), new THREE.Color()] }, uS: { value: new THREE.Vector3(0.3, 0.1, 0.3) } },
  vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: /* glsl */`
    varying vec3 vW; uniform vec3 uP[3]; uniform vec3 uC[3]; uniform vec3 uS;
    void main(){
      vec3 c = vec3(0.004, 0.004, 0.006);
      for (int i = 0; i < 3; i++) {
        float s = i == 0 ? uS.x : (i == 1 ? uS.y : uS.z);
        vec2 d = (vW.xy - uP[i].xy) / s;
        float box = smoothstep(1.0, 0.75, max(abs(d.x), abs(d.y)));
        float soft = exp(-dot(d, d) * 1.2);
        c += uC[i] * (i == 1 ? soft : mix(soft * 0.35, box, 0.6));
      }
      gl_FragColor = vec4(c, 1.0);
    }`,
});
const GLASS_Z = -(2.2 + 0.17);
const glassLights = [
  { p: new THREE.Vector3(1.93, 1.36, -1.52), c: new THREE.Color(1.0, 0.82, 0.62).multiplyScalar(0.16), s: 0.34 },  // softbox
  { p: new THREE.Vector3(-0.82, 0.54, -1.93), c: new THREE.Color(1.0, 0.5, 0.2).multiplyScalar(0.3), s: 0.1 },      // orb
  { p: new THREE.Vector3(1.0, 1.185, -1.9), c: new THREE.Color(0.6, 0.75, 1.0), s: 0.3 },                           // monitor
];

// dust in the light of the sun lamp
function buildDust() {
  const n = 900, pos = new Float32Array(n * 3), seed = new Float32Array(n);
  let s = 3;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) {
    const a = rnd() * 6.2832, r = Math.sqrt(rnd()) * 4.0;
    pos[i * 3] = Math.sin(a) * r; pos[i * 3 + 1] = 0.2 + rnd() * 3.6; pos[i * 3 + 2] = Math.cos(a) * r; seed[i] = rnd();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: U.uTime, uScale: { value: 1 } },
    vertexShader: /* glsl */`
      attribute float aSeed; uniform float uTime, uScale; varying vec3 vC;
      void main(){
        vec3 p = position;
        float t = uTime * 0.05;
        p.x += sin(t * 3.0 + aSeed * 40.0) * 0.12; p.z += cos(t * 2.3 + aSeed * 31.0) * 0.12;
        p.y = 0.2 + mod(p.y - 0.2 + t * (0.15 + aSeed * 0.25), 3.6);
        vec3 v = p - vec3(0.0, 2.9, 0.0);
        vC = vec3(1.0, 0.72, 0.45) * (0.5 / (0.5 + dot(v, v))) * (0.4 + 0.6 * sin(uTime * (0.5 + aSeed) + aSeed * 50.0));
        vec4 mvp = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uScale * (1.0 + aSeed * 1.6) / max(0.3, -mvp.z);
        gl_Position = projectionMatrix * mvp;
      }`,
    fragmentShader: `varying vec3 vC; void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(vC * smoothstep(0.5, 0.1, d) * 0.9, 1.0); }`,
  });
  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false;
  return pts;
}

// ---------------------------------------------------------------- post: bloom + tonemap + grain
const fsGeo = new THREE.BufferGeometry();
fsGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
const fsScene = new THREE.Scene();
const fsCam = new THREE.Camera();
const fsMesh = new THREE.Mesh(fsGeo, null);
fsMesh.frustumCulled = false;
fsScene.add(fsMesh);
const FSV = `varying vec2 vUv; void main(){ vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const rtOpts = { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false };
let rtScene, rtA1, rtA2, rtB1, rtB2, rtRefl;
// floor mirror: the room's contents are drawn a second time from a camera mirrored under the floor, at reduced size,
// and the floor lays that picture over its scenery reflection. ?refl=0 turns it off; a slow device turns it off by itself.
const REFL_LAYER = 1;
const reflCam = new THREE.PerspectiveCamera();
reflCam.layers.set(REFL_LAYER);
const reflBias = new THREE.Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
let reflOn = Q.get('refl') !== '0';

const reflScale = () => (matchMedia('(pointer: coarse)').matches || innerWidth < 700) ? 0.35 : 0.5;
const preMat = new THREE.ShaderMaterial({
  uniforms: { t: { value: null }, px: { value: new THREE.Vector2() } }, vertexShader: FSV, depthTest: false,
  fragmentShader: `varying vec2 vUv; uniform sampler2D t; uniform vec2 px;
    void main(){ vec3 c = vec3(0.0); for (int i = 0; i < 4; i++) { vec2 o = vec2(i < 2 ? -1.0 : 1.0, mod(float(i), 2.0) < 0.5 ? -1.0 : 1.0); c += texture2D(t, vUv + o * px).rgb; }
      c *= 0.25; float l = max(c.r, max(c.g, c.b)); c *= smoothstep(0.75, 1.7, l); gl_FragColor = vec4(min(c, vec3(12.0)), 1.0); }`,
});
const blurMat = new THREE.ShaderMaterial({
  uniforms: { t: { value: null }, d: { value: new THREE.Vector2() } }, vertexShader: FSV, depthTest: false,
  fragmentShader: `varying vec2 vUv; uniform sampler2D t; uniform vec2 d;
    void main(){ vec3 c = texture2D(t, vUv).rgb * 0.227; c += (texture2D(t, vUv + d * 1.385).rgb + texture2D(t, vUv - d * 1.385).rgb) * 0.316;
      c += (texture2D(t, vUv + d * 3.231).rgb + texture2D(t, vUv - d * 3.231).rgb) * 0.0703; gl_FragColor = vec4(c, 1.0); }`,
});
const finalMat = new THREE.ShaderMaterial({
  uniforms: { t: { value: null }, b1: { value: null }, b2: { value: null }, uTime: U.uTime, uExp: { value: 0.82 }, uFade: { value: 1 } },
  vertexShader: FSV, depthTest: false,
  fragmentShader: /* glsl */`
    varying vec2 vUv; uniform sampler2D t, b1, b2; uniform float uTime, uExp, uFade;
    vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec3 c = texture2D(t, vUv).rgb;
      vec3 bl = texture2D(b1, vUv).rgb * 0.55 + texture2D(b2, vUv).rgb * 0.75;
      c += bl * 0.36;
      vec2 q = vUv - 0.5;
      c *= mix(1.0, 0.55, smoothstep(0.25, 0.95, dot(q, q) * 2.2));
      c = aces(c * uExp);
      float lum = dot(c, vec3(0.2126, 0.7152, 0.0722)); c = mix(vec3(lum), c, 0.74); // softer colour, closer to the Blender still
      c = pow(c, vec3(1.0 / 2.2));
      c += (h(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) * 0.022;
      gl_FragColor = vec4(c * uFade, 1.0);
    }`,
});
function pass(mat, target) { fsMesh.material = mat; renderer.setRenderTarget(target); renderer.render(fsScene, fsCam); }

let quality = 1, W = 0, H = 0, BASE_FOV = 76, zoomK = 0;
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2) * quality;
  W = Math.max(2, Math.floor(innerWidth * dpr)); H = Math.max(2, Math.floor(innerHeight * dpr));
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  for (const r of [rtScene, rtA1, rtA2, rtB1, rtB2, rtRefl]) r && r.dispose();
  const rs = reflScale(), rw = Math.max(2, Math.floor(W * rs)), rh = Math.max(2, Math.floor(H * rs));
  rtRefl = new THREE.WebGLRenderTarget(rw, rh, { ...rtOpts, depthBuffer: true });
  U.tRefl.value = rtRefl.texture; U.uReflPx.value.set(1.3 / rw, 1.3 / rh);
  rtScene = new THREE.WebGLRenderTarget(W, H, { ...rtOpts, depthBuffer: true, samples: 4 });
  const w4 = Math.max(2, W >> 2), h4 = Math.max(2, H >> 2), w8 = Math.max(2, W >> 3), h8 = Math.max(2, H >> 3);
  rtA1 = new THREE.WebGLRenderTarget(w4, h4, rtOpts); rtA2 = new THREE.WebGLRenderTarget(w4, h4, rtOpts);
  rtB1 = new THREE.WebGLRenderTarget(w8, h8, rtOpts); rtB2 = new THREE.WebGLRenderTarget(w8, h8, rtOpts);
  camera.aspect = W / H;
  BASE_FOV = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(38)) * Math.max(1, (16 / 9) / camera.aspect)));
  BASE_FOV = Math.min(BASE_FOV, 84);
  camera.fov = BASE_FOV * (1 - 0.3 * zoomK);
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);

// ---------------------------------------------------------------- camera rig
// the camera of the chosen still: Blender (x, y, z) is three (x, z, -y)
const CALM = Q.has('calm') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
const HOME = { pos: new THREE.Vector3(-1.0, 1.62, 3.75), tgt: new THREE.Vector3(0.35, 1.62, -1.0) };
const SCREEN_C = new THREE.Vector3(0, 1.195, -0.38); // replaced by the real screen centre once the room has loaded
let MW = 0.84, MH = 0.37;
const rig = {
  mode: 'room', // room | focus | screen | os
  pos: HOME.pos.clone(), tgt: HOME.tgt.clone(),
  mouse: new THREE.Vector2(0, 0), yaw: 0, pitch: 0, dolly: 0,
  tween: null, focus: null,
};
function screenPose() {
  const tan = Math.tan(THREE.MathUtils.degToRad(BASE_FOV / 2));
  const d = Math.min((MH / 2) / tan, (MW / 2) / (tan * camera.aspect)) * 0.93;
  return { pos: new THREE.Vector3(SCREEN_C.x, SCREEN_C.y, SCREEN_C.z + d + 0.03), tgt: SCREEN_C.clone() };
}
// Moving around (2026-11-13): dragging walks the camera in a circle around the desk (rig.yaw, radians), scrolling
// steps closer (rig.dolly, 0..1) and narrows the lens so nothing stretches. The start view is the still's camera.
const ORBIT = new THREE.Vector3(0, 0, -0.2); // the desk
const tmpP = new THREE.Vector3();
const KEEP = 0.8;
function roomPose(t) {
  // Calm camera (Ham reported motion sickness, 2026-11-13): no idle drift, and the room only leans
  // a few centimetres with the pointer. With "reduce motion" set on the device it does not lean at all.
  const m = rig.mouse, lean = CALM ? 0 : 1, d = rig.dolly;
  const pos = HOME.pos.clone(), tgt = HOME.tgt.clone();
  const ca = Math.cos(rig.yaw), sa = Math.sin(rig.yaw);
  for (const v of [pos, tgt]) { const x = v.x - ORBIT.x, z = v.z - ORBIT.z; v.x = ORBIT.x + x * ca - z * sa; v.z = ORBIT.z + x * sa + z * ca; }
  pos.lerp(tmpP.set(ORBIT.x, 1.5, ORBIT.z), 0.55 * d);
  tgt.lerp(tmpP.set(ORBIT.x, 1.05, ORBIT.z), d);
  tgt.y += rig.pitch * 4.2 * (1 - 0.6 * d);
  if (tall()) tgt.y -= 0.22; // phone: look a little lower, so the desk fills the screen and the lamp is not a white disc in the top third
  pos.x += ca * m.x * 0.05 * lean; pos.z += sa * m.x * 0.05 * lean; pos.y += m.y * 0.02 * lean;
  // never walk through a hanging piece: within KEEP metres of one (seen from above) the path bends around it
  for (const w of works) {
    const dx = pos.x - w.center.x, dz = pos.z - w.center.z, l = Math.hypot(dx, dz);
    if (l < KEEP && l > 1e-4) { pos.x = w.center.x + dx / l * KEEP; pos.z = w.center.z + dz / l * KEEP; }
  }
  return { pos, tgt };
}
const tall = () => innerWidth < innerHeight * 0.8;
const UP = new THREE.Vector3(0, 1, 0), FOCUS_ZOOM = 0.8;
const FOCUS = { arcade: { turn: -0.3, dist: 0.8 }, festival: { turn: 0.6 }, wig: { turn: -0.6 } }; // clear of the chair and the telescope // per piece: { turn: radians round the piece, dist: multiplier, up: metres }
function focusPose(w) {
  // stand between the piece and the starting spot, with the piece a little left of centre (the card is on the right)
  const c = w.center;
  // Card views use a narrower lens (FOCUS_ZOOM) from further back, so the room behind the piece stays level instead of
  // bending, and FOCUS can turn the standpoint around a piece where furniture would otherwise stand in the way.
  const f = FOCUS[w.id] || {};
  const dist = THREE.MathUtils.clamp(w.box.getSize(new THREE.Vector3()).length() * 1.25, 0.75, 1.6) * (tall() ? 1 : 1.42) * (f.dist || 1);
  const dir = new THREE.Vector3(HOME.pos.x - c.x, 0, HOME.pos.z - c.z).normalize().applyAxisAngle(UP, f.turn || 0);
  const right = new THREE.Vector3(dir.z, 0, -dir.x);
  if (tall()) { // phone: the card is a sheet over the lower half, so stand further back and put the piece in the upper half
    const d = dist * 1.9, p = c.clone().addScaledVector(dir, d); p.y += 0.05;
    const t = c.clone(); t.y -= d * 0.3;
    return { pos: p, tgt: t };
  }
  const pos = c.clone().addScaledVector(dir, dist).addScaledVector(right, -0.17 * dist); pos.y += 0.08 + (f.up || 0);
  return { pos, tgt: c.clone().addScaledVector(right, 0.21 * dist) };
}
const ease = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
// cut = true: no flight. The picture dips to dark, the camera changes place while nothing can be seen, and it fades back up.
// Used for the cards, because swinging across the room with a wide lens is what makes people queasy.
let cutFade = 1;
function tweenTo(pose, dur, done, cut = false) {
  rig.tween = { p0: rig.pos.clone(), t0: rig.tgt.clone(), p1: pose.pos, t1: pose.tgt, dur, k: 0, done, cut };
}

// ---------------------------------------------------------------- the opening (R3, 2026-11-15)
// The room wakes up over about three seconds: the lamp warms, the eight tray rings light one after another round the
// orrery (each piece glows as its ring comes on), the monitor flickers on, then the name. Only light changes; the camera
// does not move. Skipped with ?calm / "reduce motion", with ?t= and any ?view=, and by the first click, scroll or key.
const wake = {
  on: FROZEN === null && !CALM && VIEW === 'room' && !Q.has('zoom') && !Q.has('yaw') && !Q.has('nowake'),
  lamp: { value: 1 }, trays: Array.from({ length: 8 }, () => new THREE.Vector3(0, 99, 1)), glows: [], order: [], pulse: [],
  T_LAMP: 0.8, T_TRAY: 1.6, STEP: 0.2, T_MON: 3.3, T_NAME: 3.0, END: 4.6,
};
if (wake.on) document.body.classList.add('wake');
function wakeSkip() { if (wake.on) { wake.on = false; document.body.classList.remove('wake'); wakeStep(99); } }
function wakeStep(t) {
  const sm = THREE.MathUtils.smoothstep;
  const L = sm(t, wake.T_LAMP, wake.T_LAMP + 1.3);
  let sum = 0;
  wake.order.forEach((wi, n) => {
    const x = t - (wake.T_TRAY + n * wake.STEP), k = sm(x, 0, 0.35);
    wake.trays[wi].z = k; sum += k;
    wake.pulse[wi] = x > 0 && x < 0.9 ? Math.sin(Math.PI * x / 0.9) : 0;
  });
  const all = wake.order.length ? sum / wake.order.length : 1;
  wake.lamp.value = L;
  U.uWake.value = 0.3 + 0.7 * (0.55 * L + 0.45 * all);
  for (const g of wake.glows) g.mat.color.copy(g.base).multiplyScalar(0.1 + 0.9 * L);
  if (t > wake.END) wake.on = false;
}

// ---------------------------------------------------------------- load
const works = []; // { id, meshes, center, box, proxy, mat }
const liveOf = {}; // the live screen that belongs to a piece, if it has one
let screenMesh = null, sideMesh = null, glass = null, dust = null;
const loader = new GLTFLoader();
const tl = new THREE.TextureLoader();
function tex(name) {
  return new Promise((res) => tl.load(`studio/${name}.webp`, (t) => { tick();
    t.flipY = false; t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8; t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter; res(t);
  }));
}
// loading progress: eight files; the room model reports its own bytes
let loadedN = 0, glbK = 0;
const LOAD_N = 8;
function report() { window.__progress && window.__progress((loadedN + glbK) / LOAD_N); }
function tick() { loadedN++; report(); }
async function load() {
  const names = ['shell', 'furn', 'props'];
  const [gltf, ...texs] = await Promise.all([
    new Promise((res, rej) => loader.load('studio/room.glb', (g) => { glbK = 0; tick(); res(g); }, (ev) => { if (ev.total) { glbK = Math.min(0.99, ev.loaded / ev.total); report(); } }, rej)),
    ...names.flatMap((n) => [tex(`bake_${n}_A`), tex(`bake_${n}_B`)]),
    new Promise((res) => tl.load(Q.get('pano') && /^[a-z]+$/.test(Q.get('pano')) ? `studio/pano-${Q.get('pano')}.jpg` : 'studio/pano.jpg', (t) => { t.colorSpace = THREE.NoColorSpace; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.wrapS = THREE.RepeatWrapping; U.tPano.value = t; tick(); res(t); })),
  ]);
  texs.pop();
  const mats = {};
  names.forEach((n, i) => { mats[n] = bakedMaterial(texs[i * 2], texs[i * 2 + 1]); });
  const groups = {};
  const swayMats = {};
  gltf.scene.updateMatrixWorld(true);
  const list = [];
  gltf.scene.traverse((o) => { if (o.isMesh) list.push(o); });
  for (const o of list) {
    const grp = o.userData.grp;
    const name = o.name;
    if (name.includes('live_screen')) {
      o.material = screenMat; screenMesh = o;
      o.geometry.computeBoundingBox();
      const b = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld), sz = b.getSize(new THREE.Vector3());
      b.getCenter(SCREEN_C); MW = sz.x; MH = sz.y;
      continue;
    }
    if (grp === 'glow') { // lamps, light strips, stars, floor rings: plain bright colour, the bloom does the rest
      if (name.includes('sunlamp')) { // the lamp: a warm globe with a bright heart and an amber edge, not a flat white disc
        o.material = new THREE.ShaderMaterial({
          uniforms: { uK: wake.lamp },
          vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
          fragmentShader: `varying vec3 vN; varying vec3 vV; uniform float uK; void main(){ float f = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);
            vec3 c = mix(vec3(0.95, 0.42, 0.14), vec3(1.9, 1.25, 0.7), pow(f, 1.6)); gl_FragColor = vec4(c * (0.06 + 0.94 * uK), 1.0); }`,
        });
        continue;
      }
      let e = o.userData.ec || [1, 0.7, 0.4];
      if (name.includes('brass_glow')) e = [0.36, 0.25, 0.15]; // floor rings: kept dim so they do not out-shout the desk
      else { // keep the colour: scale so the brightest channel is about 1.7 instead of 6, which bloomed to white
        const m = Math.max(e[0], e[1], e[2]), cap = name.includes('dstar') ? 3.0 : 1.7;
        if (m > cap) e = e.map((v) => v * cap / m);
        if (name.includes('warm_led')) e = [e[0], e[1] * 0.86, e[2] * 0.7]; // tray rims and the ceiling line read as brass light, not white
      }
      if (name.includes('warm_led')) { // tray rims, floor studs and the ceiling line: each tray's ring has its own level, for the opening
        o.material = new THREE.ShaderMaterial({
          uniforms: { uC: { value: new THREE.Vector3(e[0], e[1], e[2]) }, uTray: { value: wake.trays }, uAll: wake.lamp }, side: THREE.DoubleSide,
          vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
          fragmentShader: `varying vec3 vW; uniform vec3 uC; uniform vec3 uTray[8]; uniform float uAll;
            void main(){ float k = uAll, best = 0.9; for (int i = 0; i < 8; i++) { float d = distance(vW.xz, uTray[i].xy); if (d < best) { best = d; k = uTray[i].z; } }
              gl_FragColor = vec4(uC * (0.04 + 0.96 * k), 1.0); }`,
        });
        continue;
      }
      if (name.includes('brass_glow')) { // floor rings: brightest round the desk, fading towards the wall, so they frame the desk instead of striping the floor
        o.material = new THREE.ShaderMaterial({
          uniforms: { uC: { value: new THREE.Vector3(e[0], e[1], e[2]) }, uK: wake.lamp }, side: THREE.DoubleSide,
          vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
          fragmentShader: `varying vec3 vW; uniform vec3 uC; uniform float uK;
            void main(){ float r = length(vW.xz - vec2(0.0, -0.2)); gl_FragColor = vec4(uC * mix(1.0, 0.32, smoothstep(1.9, 4.0, r)) * (0.1 + 0.9 * uK), 1.0); }`,
        });
        continue;
      }
      o.material = new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(e[0], e[1], e[2]), side: THREE.DoubleSide });
      if (!name.includes('dstar')) wake.glows.push({ mat: o.material, base: o.material.color.clone() });
      continue;
    }
    if (name.startsWith('refl__')) { o.material = floorMaterial(texs[0], texs[1]); continue; }
    if (name.includes('live_laptop')) { o.material = lapMat; continue; }
    if (name.includes('live_side')) { o.material = sideMat; sideMesh = o; continue; }
    if (name.includes('live_arcade')) { o.material = arcadeMat; liveOf.arcade = o; continue; }
    if (name.includes('live_wig')) { o.material = wigMat; liveOf.wig = o; continue; }
    if (name.includes('live_festival')) { o.material = festivalMat; liveOf.festival = o; continue; }
    if (!mats[grp]) { o.visible = false; continue; }
    o.material = mats[grp];
    const tag = name.includes('__') ? name.split('__')[0] : '';
    if (tag.startsWith('work_')) {
      const id = tag.slice(5);
      if (!groups[id]) groups[id] = { id, meshes: [], box: new THREE.Box3(), mat: bakedMaterial(mats.props.uniforms.tA.value, mats.props.uniforms.tB.value) };
      o.material = groups[id].mat;
      groups[id].meshes.push(o);
      o.geometry.computeBoundingBox();
      groups[id].box.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));
    } else if (tag.startsWith('sway_')) {
      if (!swayMats[tag]) swayMats[tag] = { mat: bakedMaterial(mats.props.uniforms.tA.value, mats.props.uniforms.tB.value), box: new THREE.Box3(), top: tag === 'sway_trail' };
      o.material = swayMats[tag].mat;
      o.geometry.computeBoundingBox();
      swayMats[tag].box.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));
      o.frustumCulled = false;
    }
  }
  for (const k in swayMats) {
    const s = swayMats[k], c = s.box.getCenter(new THREE.Vector3());
    // floor plant sways from its base; the trailing plant swings from the pot
    if (s.top) s.mat.uniforms.uSway.value.set(c.x, s.box.max.y, c.z, -0.0);
    else s.mat.uniforms.uSway.value.set(c.x, s.box.min.y, c.z, 0.018);
    if (s.top) s.mat.vertexShader = s.mat.vertexShader.replace('float h = max(0.0, p.y - uSway.y);', 'float h = max(0.0, uSway.y - p.y) * 1.4;').replace('if (uSway.w > 0.0)', 'if (true)').replace('float k = h * h * uSway.w;', 'float k = h * h * 0.03;');
  }
  // what the floor mirrors: everything in the room except the floor itself and its rings. The walls and ledge are needed
  // so that things standing on the ledge are hidden behind it; the scenery still comes from the 360 picture, through the windows.
  for (const o of list) {
    if (o.name.startsWith('refl__') || o.name.includes('brass_glow') || o.name.includes('dstar') || o.visible === false) continue; // dome stars read as specks of dirt on the floor
    o.layers.enable(REFL_LAYER);
  }
  scene.add(gltf.scene);
  for (const id in groups) {
    const g = groups[id];
    const meta = WORKS.find((w) => w.id === id);
    if (!meta) continue;
    g.meta = meta;
    g.center = g.box.getCenter(new THREE.Vector3());
    const size = g.box.getSize(new THREE.Vector3()).addScalar(0.06);
    g.proxy = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), new THREE.MeshBasicMaterial({ visible: false }));
    g.proxy.position.copy(g.center);
    g.proxy.userData.work = g;
    scene.add(g.proxy);
    works.push(g);
  }
  works.sort((a, b) => WORKS.findIndex((w) => w.id === a.id) - WORKS.findIndex((w) => w.id === b.id));
  works.slice(0, 8).forEach((w, i) => wake.trays[i].set(w.center.x, w.center.z, 1));
  wake.order = works.slice(0, 8).map((w, i) => i).sort((a, b) => Math.atan2(works[a].center.x, works[a].center.z) - Math.atan2(works[b].center.x, works[b].center.z)); // round the room, starting front left
  wakeStep(wake.on ? 0 : 99);
  scene.add(buildExterior());
  scene.add(buildConstellations());
  scene.add(buildArms());
  dust = buildDust();
  dust.renderOrder = 6;
  scene.add(dust);
  paintLaptop();
  paintSide();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { sideDrawn = ''; });
}

// ---------------------------------------------------------------- the orrery routes light (R4, 2026-11-16)
// Pointing at a piece sends a pulse of light from the hub, out along that piece's arm and down to its tray, and the arm
// stays softly lit while the piece is pointed at or open. Nothing is baked: each arm gets a thin glowing sleeve drawn
// over the brass rod. Heights and order are those of orrery1() (arm k hangs at 3.37 + 0.045 k metres).
const ARM_ORDER = ['phoenix', 'arcade', 'genesis', 'dastaan', 'festival', 'wig', 'certs', 'sprint'];
function buildArms() {
  const g = new THREE.Group();
  for (const w of works) {
    const k = ARM_ORDER.indexOf(w.id); if (k < 0) continue;
    const hz = 3.37 + k * 0.045, x = w.center.x, z = w.center.z;
    const path = new THREE.CurvePath();
    path.add(new THREE.LineCurve3(new THREE.Vector3(0, hz, 0), new THREE.Vector3(x, hz, z)));
    path.add(new THREE.LineCurve3(new THREE.Vector3(x, hz, z), new THREE.Vector3(x, w.box.max.y + 0.3, z)));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uHead: { value: 0 }, uOn: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `varying float vS; void main(){ vS = uv.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `varying float vS; uniform float uHead, uOn;
        void main(){ float d = vS - uHead; float pulse = exp(-d * d * 260.0) * step(uHead, 1.15) + exp(-max(-d, 0.0) * 5.0) * step(d, 0.0) * 0.35;
          float lit = step(vS, uHead) * 0.55 * uOn; gl_FragColor = vec4(vec3(1.5, 0.95, 0.45) * (pulse * 1.3 * uOn + lit), 1.0); }`,
    });
    const m = new THREE.Mesh(new THREE.TubeGeometry(path, 72, 0.016, 6, false), mat);
    m.frustumCulled = false; m.visible = false; g.add(m);
    w.arm = { mesh: m, mat, head: 0 };
  }
  return g;
}

// ---------------------------------------------------------------- the dome: her skills drawn as constellations
const skillNames = [];
function buildConstellations() {
  const g = new THREE.Group();
  const R = 4.4, Z0 = 3.0, DH = 2.4, vmax = 1 - (2 / Math.PI) * 0.22, K = 0.965;
  const dome = (az, v) => { const ph = v * vmax * Math.PI / 2, a = THREE.MathUtils.degToRad(az); return new THREE.Vector3(K * R * Math.cos(ph) * Math.sin(a), Z0 + DH * Math.sin(ph) - 0.04, -K * R * Math.cos(ph) * Math.cos(a)); };
  // [azimuth from the lake side, height 0..1] of each constellation's centre, and its shape as offsets
  const spots = [[-52, 0.3], [-24, 0.5], [6, 0.3], [40, 0.56], [60, 0.28]];
  const shapes = [[[-7, -0.06], [-3, 0.05], [2, -0.02], [7, 0.07]], [[-6, 0.05], [-1, -0.05], [4, 0.04], [1, 0.12], [-6, 0.05]], [[-7, 0.02], [-2, -0.06], [3, 0.03], [8, -0.03]], [[-5, -0.05], [0, 0.06], [5, -0.04], [0, -0.1], [-5, -0.05]], [[-6, 0.06], [-1, -0.03], [3, 0.06], [8, 0.0]]];
  const pts = [], segs = [];
  SKILLS.forEach((name, i) => {
    const [az, v] = spots[i], sh = shapes[i].map(([da, dv]) => dome(az + da, v + dv));
    sh.forEach((p, k) => { pts.push(p); if (k) segs.push(sh[k - 1], p); });
    const cv = document.createElement('canvas'); cv.width = 1400; cv.height = 64;
    const c = cv.getContext('2d');
    const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.NoColorSpace;
    const draw = () => { // the engraved display face, once it has arrived
      c.clearRect(0, 0, 1400, 64); c.font = '600 30px "Cinzel", "Space Grotesk", serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      try { c.letterSpacing = '7px'; } catch (e) { /* older browsers: plain spacing */ }
      c.shadowColor = 'rgba(0, 0, 0, 1)'; c.shadowBlur = 9; c.fillStyle = '#000'; // a soft dark halo: rods and ribs behind a name fade out instead of cutting through it
      for (let k = 0; k < 4; k++) c.fillText(name.toUpperCase(), 700, 34);
      c.shadowBlur = 0; c.fillStyle = '#fff'; c.fillText(name.toUpperCase(), 700, 34); tx.needsUpdate = true;
    };
    draw(); if (document.fonts && document.fonts.load) document.fonts.load('600 30px Cinzel').then(draw);
    // sizeAttenuation off: every name is the same size on screen wherever it hangs in the dome (they used to be five sizes)
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, transparent: true, opacity: 0, depthWrite: false, depthTest: false, sizeAttenuation: false }));
    sp.material.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', 'vec4 tm = texture2D( map, vMapUv ); diffuseColor = vec4( vec3(0.95, 0.74, 0.5) * tm.r, tm.a * opacity );'); }; // white letters become brass, the halo stays dark
    sp.position.copy(dome(az + [0, 0, -5, 7, 6][i], v - 0.15)).multiplyScalar(0.86); // nudged so no name touches another or the lamp from the start view
    sp.renderOrder = 5; skillNames.push(sp);
    g.add(sp);
  });
  g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(segs), new THREE.LineBasicMaterial({ color: new THREE.Color(0.75, 0.52, 0.3), transparent: true, opacity: 0.55 })));
  const dots = new THREE.Points(new THREE.BufferGeometry().setFromPoints(pts), new THREE.PointsMaterial({ color: new THREE.Color(2.4, 1.9, 1.3), size: 0.05, sizeAttenuation: true }));
  g.add(dots);
  return g;
}

// ---------------------------------------------------------------- monitor: content + turn-on
let lastMinute = -1, lastWall = null;
function paintScreen(force) {
  const now = new Date();
  if (!force && now.getMinutes() === lastMinute && OS.state.wallpaper === lastWall) return;
  lastMinute = now.getMinutes(); lastWall = OS.state.wallpaper;
  const c = screenCanvas.getContext('2d'), w = screenCanvas.width, h = screenCanvas.height;
  paintWallpaper(c, w, h, OS.state.wallpaper);
  // menubar
  c.fillStyle = 'rgba(10,12,20,0.55)'; c.fillRect(0, 0, w, 26);
  c.fillStyle = '#fff'; c.font = '600 14px "Space Grotesk", system-ui, sans-serif'; c.textBaseline = 'middle';
  c.fillText('Dusk OS', 16, 14);
  c.textAlign = 'right';
  c.fillText(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), w - 16, 14);
  c.textAlign = 'left';
  // dock
  const n = OS.apps.length, s = 44, gap = 12, dw = n * s + (n - 1) * gap + 28, dx = (w - dw) / 2, dy = h - 70;
  c.fillStyle = 'rgba(14,16,26,0.6)';
  c.beginPath(); c.roundRect(dx, dy, dw, 58, 16); c.fill();
  OS.apps.forEach((a, i) => {
    c.fillStyle = a.color; c.beginPath(); c.roundRect(dx + 14 + i * (s + gap), dy + 7, s, s, 11); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.arc(dx + 14 + i * (s + gap) + s / 2, dy + 7 + s / 2, 9, 0, 7); c.fill();
  });
  // a welcome window
  const ww = 640, wh = 290, wx = (w - ww) / 2, wy = 90;
  c.fillStyle = 'rgba(16,18,30,0.82)'; c.beginPath(); c.roundRect(wx, wy, ww, wh, 14); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.08)'; c.beginPath(); c.roundRect(wx, wy, ww, 34, [14, 14, 0, 0]); c.fill();
  ['#ff6b5e', '#ffc145', '#3ddc84'].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(wx + 20 + i * 18, wy + 17, 5.5, 0, 7); c.fill(); });
  c.fillStyle = '#fff'; c.font = '700 64px "Space Grotesk", system-ui, sans-serif';
  c.fillText('Hamna Jalil', wx + 36, wy + 108);
  c.font = '500 27px "Space Grotesk", system-ui, sans-serif'; c.fillStyle = 'rgba(255,255,255,0.8)';
  c.fillText('Game producer and product manager', wx + 36, wy + 166);
  c.fillStyle = '#ffb46b'; c.font = '600 26px "Space Grotesk", system-ui, sans-serif';
  c.fillText('Click the screen to step inside', wx + 36, wy + 232);
  screenTex.needsUpdate = true;
}
// 0..1 turn-on progress and a flicker multiplier, as functions of time since load
function monitorState(t) {
  const t0 = wake.on || monitorState.late ? (monitorState.late = true, wake.T_MON) : 1.1;
  if (t < t0) return { on: 0, flick: 1, light: 0 };
  const x = t - t0;
  // two false starts, then it holds
  if (x < 0.09) return { on: 0.12, flick: 1.6, light: 0.5 };
  if (x < 0.3) return { on: 0, flick: 1, light: 0 };
  if (x < 0.38) return { on: 0.2, flick: 1.3, light: 0.4 };
  if (x < 0.52) return { on: 0, flick: 1, light: 0 };
  const y = Math.min(1, (x - 0.52) / 1.1);
  const fl = 1 + (y < 1 ? (Math.sin(x * 90) * 0.12 + Math.sin(x * 37) * 0.1) * (1 - y) : 0) + Math.sin(t * 13.7) * 0.012 + (Math.sin(t * 0.9) > 0.995 ? -0.12 : 0);
  return { on: y, flick: fl, light: (0.25 + 0.75 * y) * fl };
}

// ---------------------------------------------------------------- interaction
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let hover = null, hoverScreen = false, dragging = false, dragMoved = 0, lastX = 0, lastY = 0, pointerIn = false;
// Lighter hand (Ham, 2026-11-16: moving felt hard and resistant): more travel per pixel, a short glide after letting go,
// and the camera answers the wheel and keys quickly. glide = turning speed in radians a second; lastInput = when she last steered.
let glide = 0, lastMoveT = 0, lastInput = -1e9, hoverSide = false;
const YAW_GAIN = 0.0016, PITCH_GAIN = 0.0012, WHEEL_GAIN = 0.0014;
const label = document.getElementById('label');
const card = document.getElementById('card');
function pick(ev) {
  ndc.set((ev.clientX / innerWidth) * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  let best = null, bd = 1e9, scr = false;
  for (const w of works) { if (w.ghost > 0.5) continue; const h = ray.intersectObject(w.proxy)[0]; if (h && h.distance < bd) { bd = h.distance; best = w; } }
  let side = false;
  if (screenMesh) { const h = ray.intersectObject(screenMesh)[0]; if (h && h.distance < bd) { bd = h.distance; best = null; scr = true; } }
  if (sideMesh) { const h = ray.intersectObject(sideMesh)[0]; if (h && h.distance < bd) { best = null; scr = false; side = true; } }
  return { work: best, screen: scr, side };
}
canvas.addEventListener('pointermove', (ev) => {
  pointerIn = true;
  rig.mouse.set((ev.clientX / innerWidth) * 2 - 1, -((ev.clientY / innerHeight) * 2 - 1));
  if (touches.has(ev.pointerId)) touches.set(ev.pointerId, [ev.clientX, ev.clientY]);
  if (touches.size === 2) {
    const [a, b] = [...touches.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
    if (pinch !== null && rig.mode === 'room') rig.dolly = THREE.MathUtils.clamp(rig.dolly + (d - pinch) * 0.0045, 0, 1);
    pinch = d; dragMoved += 10;
  } else if (dragging) {
    const dx = (ev.clientX - lastX) * dragGain(), dy = ev.clientY - lastY;
    dragMoved += Math.abs(dx) + Math.abs(dy);
    rig.yaw = THREE.MathUtils.clamp(rig.yaw + dx * YAW_GAIN, -1.6, 1.6);
    rig.pitch = THREE.MathUtils.clamp(rig.pitch + dy * PITCH_GAIN, -0.2, 0.35);
    { const now = performance.now(), gap = Math.max(4, now - lastMoveT); lastMoveT = now; lastInput = now; // remember how fast the hand is turning the room
      glide = gap > 80 ? 0 : glide * 0.6 + (dx * YAW_GAIN / (gap / 1000)) * 0.4; }
    lastX = ev.clientX; lastY = ev.clientY;
  }
  if (rig.mode === 'room' || rig.mode === 'focus') {
    const p = pick(ev);
    hover = p.work; hoverScreen = p.screen; hoverSide = p.side && rig.mode === 'room';
    // one rule for the cursor: a hand while dragging, a pointing finger over anything clickable (a piece, its name, the monitor), an open hand otherwise
    canvas.style.cursor = dragging && dragMoved > 6 ? 'grabbing' : (hover || hoverScreen || hoverSide || tagHover) ? 'pointer' : 'grab';
    // a piece already has its brass plaque, which lights up; a second label at the pointer was a duplicate (Ham, 2026-11-15)
    if (hoverScreen && rig.mode === 'room') {
      label.textContent = 'Step inside'; label.style.opacity = 1;
      label.style.transform = `translate(${ev.clientX + 16}px, ${ev.clientY - 30}px)`;
    } else if (hoverSide) {
      label.textContent = INTRO.crewHint; label.style.opacity = 1;
      label.style.transform = `translate(${ev.clientX + 16}px, ${ev.clientY - 30}px)`;
    } else label.style.opacity = 0;
  }
});
const touches = new Map(); let pinch = null;
const dragGain = () => THREE.MathUtils.clamp(1300 / innerWidth, 1, 3);
const endTouch = (ev) => { touches.delete(ev.pointerId); pinch = null; };
canvas.addEventListener('pointercancel', (ev) => { endTouch(ev); dragging = false; });
canvas.addEventListener('pointerdown', (ev) => { if (ev.pointerType === 'touch') touches.set(ev.pointerId, [ev.clientX, ev.clientY]); dragging = true; dragMoved = 0; glide = 0; lastX = ev.clientX; lastY = ev.clientY; canvas.setPointerCapture(ev.pointerId); });
canvas.addEventListener('pointerup', (ev) => {
  endTouch(ev); lastX = ev.clientX; lastY = ev.clientY;
  dragging = false;
  if (performance.now() - lastMoveT > 60 || dragMoved <= 6 || CALM || rig.mode !== 'room') glide = 0; // only a hand that was still moving lets the room glide
  glide = THREE.MathUtils.clamp(glide, -1.4, 1.4);
  if (dragMoved > 6) return;
  const p = pick(ev);
  if (p.screen) enterScreen();
  else if (p.side && rig.mode === 'room') { label.style.opacity = 0; openHello(); }
  else if (p.work) openCard(p.work);
  else if (rig.mode === 'focus') closeCard();
});
canvas.addEventListener('pointerleave', () => { pointerIn = false; label.style.opacity = 0; });
canvas.addEventListener('wheel', (ev) => {
  ev.preventDefault();
  if (rig.mode !== 'room') return;
  const big = Math.abs(ev.deltaX) > Math.abs(ev.deltaY) * 1.5; // a sideways swipe on a trackpad walks round the desk
  if (big) rig.yaw = THREE.MathUtils.clamp(rig.yaw + ev.deltaX * 0.0012, -1.6, 1.6);
  else rig.dolly = THREE.MathUtils.clamp(rig.dolly - ev.deltaY * WHEEL_GAIN, 0, 1);
  lastInput = performance.now(); glide = 0;
}, { passive: false });
addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape') {
    if (rig.mode === 'os' || rig.mode === 'screen') exitScreen();
    else if (rig.mode === 'focus') closeCard();
  }
  if (rig.mode === 'room' || rig.mode === 'focus') {
    if (ev.key.startsWith('Arrow')) { lastInput = performance.now(); glide = 0; }
    if (ev.key === 'ArrowLeft') rig.yaw = Math.max(-1.6, rig.yaw - 0.12);
    if (ev.key === 'ArrowRight') rig.yaw = Math.min(1.6, rig.yaw + 0.12);
    if (ev.key === 'ArrowUp') rig.dolly = Math.min(1, rig.dolly + 0.15);
    if (ev.key === 'ArrowDown') rig.dolly = Math.max(0, rig.dolly - 0.15);
    if (ev.key === 'Enter') enterScreen();
  }
});

// ---------------------------------------------------------------- arrival, name tags, and the way to reach her
const $ = (q) => document.querySelector(q);
const mk = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };
const introEl = $('#intro'), whoEl = $('#who'), helloEl = $('#hello'), tagsEl = $('#tags'), howEl = $('#how');
introEl.querySelector('h1').textContent = PROFILE.name; introEl.querySelector('.role').textContent = PROFILE.role; introEl.querySelector('p').textContent = INTRO.hint;
whoEl.querySelector('b').textContent = PROFILE.name; whoEl.querySelector('small').textContent = PROFILE.role;
introEl.querySelector('.motto').textContent = INTRO.motto;
if (INTRO.proof) { const row = mk('div', 'proof'); for (const [n, what] of INTRO.proof) { const it = mk('span'); it.append(mk('b', '', n), ' ' + what); row.append(it); } introEl.querySelector('.role').after(row); }
howEl.textContent = matchMedia('(pointer: coarse)').matches ? INTRO.howTouch : INTRO.how;
$('#cta .status').textContent = INTRO.status;
helloEl.querySelector('h2').textContent = HELLO.title; if (HELLO.open) helloEl.querySelector('h2').after(mk('div', 'open', HELLO.open)); if (PROFILE.portrait) { const im = mk('img', 'me'); im.src = PROFILE.portrait; im.alt = 'Portrait of ' + PROFILE.name; helloEl.querySelector('h2').before(im); } helloEl.querySelector('p').textContent = HELLO.text; helloEl.querySelector('h4').replaceWith(crewHead());
for (const [label, href, pri] of [['Contact me', LINKS.contact, true], ['LinkedIn', LINKS.linkedin], ['Résumé (PDF)', LINKS.resume], ['Full portfolio', LINKS.site]]) {
  const a = mk('a', pri ? 'pri' : '', label); a.href = href; a.target = '_blank'; a.rel = 'noopener'; helloEl.querySelector('.links').append(a);
}
for (const x of QUOTES.filter((x) => x.q)) helloEl.querySelector('.quotes').append(quoteCard(x));
{ const more = mk('button', 'more', 'Read the full recommendations'); more.addEventListener('click', () => { closeHello(); enterScreen(); setTimeout(() => OS.openNote(4), 2400); }); helloEl.querySelector('.quotes').append(more); }
function openHello() { if (rig.mode === 'focus') closeCard(); helloEl.classList.add('open'); endIntro(); }
function closeHello() { helloEl.classList.remove('open'); }
whoEl.addEventListener('click', openHello); $('#cta .hello').addEventListener('click', openHello); helloEl.querySelector('.close').addEventListener('click', closeHello);
// the tour: the eight cards in order at the visitor's own pace, ending on "say hello"
let touring = false;
// during the tour the pieces come in story order (TOUR in content.js); otherwise in their usual order
const seq = () => touring ? TOUR.map((t) => works.find((w) => w.id === t.id)).filter(Boolean) : works;
const navEl = $('#nav'), tourBtn = navEl.querySelector('.tour'), homeBtn = navEl.querySelector('.home');
tourBtn.textContent = INTRO.tour; homeBtn.textContent = INTRO.home;
tourBtn.addEventListener('click', () => { endIntro(); touring = true; openCard(seq()[0]); });
function goHome() { rig.yaw = 0; rig.pitch = 0; rig.dolly = tall() ? 0.55 : 0; }
homeBtn.addEventListener('click', goHome);
addEventListener('keydown', (ev) => { if (ev.key === 'Home' && rig.mode === 'room') goHome(); });
let introDone = false;
function endIntro() {
  if (introDone) return; introDone = true; document.body.classList.add('met');
  // after a few seconds the plaques settle into small brass dots; pointing at a piece (or its dot) brings its name back.
  // Touch screens have no pointing, so there the names stay.
  if (!matchMedia('(pointer: coarse)').matches) setTimeout(() => tagsEl.classList.add('rest'), 6500);
}
function startIntro() { document.body.classList.add('intro'); if (FROZEN !== null || VIEW !== 'room' || Q.has('zoom') || Q.has('yaw')) endIntro(); else setTimeout(endIntro, 7000 + (wake.on ? wake.T_NAME * 1000 : 0)); }
for (const ev of ['pointerdown', 'wheel', 'keydown']) addEventListener(ev, () => { wakeSkip(); endIntro(); }, { passive: true });
// one small tag above each piece, so nobody has to guess what a bird or a star stands for; they are buttons, so Tab reaches them
let tagHover = null;
function buildTags() {
  for (const w of works) {
    const b = mk('button', 'tag', w.meta.short || w.meta.title);
    b.addEventListener('click', () => openCard(w));
    // pointing at the plaque counts the same as pointing at the piece; kept separate from the room's own hover so the two cannot fight
    b.addEventListener('pointerenter', () => { tagHover = w; }); b.addEventListener('pointerleave', () => { if (tagHover === w) tagHover = null; });
    tagsEl.append(b); w.tag = b; w.anchor = new THREE.Vector3(w.center.x, w.box.max.y + 0.09, w.center.z);
  }
}
const tagV = new THREE.Vector3();
let tagRects = []; // where the plaques are this frame (empty while they rest as dots); skill names give way to them
function placeTags() {
  const show = rig.mode === 'room' && !rig.tween;
  tagsEl.classList.toggle('on', show);
  if (!show) return;
  const placed = [];
  for (const w of works) {
    tagV.copy(w.anchor).project(camera);
    const ok = tagV.z < 1 && Math.abs(tagV.x) < 1.05 && Math.abs(tagV.y) < 1.05;
    w.tag.style.display = ok ? '' : 'none';
    if (ok) placed.push({ w, x: (tagV.x + 1) / 2 * innerWidth, y: (1 - tagV.y) / 2 * innerHeight, hw: (w.tagW || (w.tagW = w.tag.offsetWidth || 90)) / 2, lift: 0 });
  }
  // plaques may not sit on top of each other: the lower one keeps its place, the other rides up on a longer wire
  placed.sort((p, q) => q.y - p.y);
  const resting = tagsEl.classList.contains('rest');
  for (let i = 1; i < placed.length && !resting; i++) {
    const p = placed[i];
    for (let pass = 0; pass < 4; pass++) {
      const hit = placed.slice(0, i).find((q) => Math.abs(q.x - p.x) < q.hw + p.hw + 8 && Math.abs((q.y - q.lift) - (p.y - p.lift)) < 26);
      if (!hit) break;
      p.lift = p.y - (hit.y - hit.lift) + 28;
    }
  }
  tagRects = resting ? [] : placed;
  for (const p of placed) {
    p.x = Math.min(innerWidth - p.hw - 8, Math.max(p.hw + 8, p.x)); // keep the whole plaque on screen
    // a name stays lit for a moment after the pointer leaves, so it cannot flicker at the edge of a piece
    if (p.w === hover || p.w === tagHover) p.w.litUntil = performance.now() + 350;
    p.w.tag.classList.toggle('lit', performance.now() < (p.w.litUntil || 0));
    p.w.tag.style.transform = `translate(${p.x.toFixed(1)}px, ${(p.y - p.lift).toFixed(1)}px) translate(-50%, -100%) translateY(-16px)`;
    p.w.tag.style.setProperty('--wire', (14 + p.lift).toFixed(0) + 'px');
  }
}

function openCard(w) {
  closeHello();
  rig.mode = 'focus'; rig.focus = w;
  tweenTo(focusPose(w), 0.7, null, true);
  card.querySelector('.kind').textContent = w.meta.kind;
  card.querySelector('h2').textContent = w.meta.title;
  card.querySelector('p').textContent = w.meta.text;
  card.querySelector('.art').replaceChildren(cardArt(w.meta));
  card.querySelector('.tags').replaceChildren(...(w.meta.tags || []).map((t) => { const e = document.createElement('span'); e.textContent = t; return e; }));
  // results (always shown) and the story behind them (folded), from the case studies on the live site
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };
  const wins = card.querySelector('.wins'), story = card.querySelector('.story');
  wins.replaceChildren(...(w.meta.wins || []).map((t) => el('span', '', t))); wins.style.display = w.meta.wins ? '' : 'none';
  story.open = false; story.style.display = w.meta.story ? '' : 'none';
  if (w.meta.story) story.querySelector('.st').replaceChildren(el('b', '', 'The challenge'), el('span', '', w.meta.story.challenge), el('b', '', 'What I did'), el('span', '', w.meta.story.did));
  card.scrollTop = 0;
  const a = card.querySelector('a');
  if (w.meta.link) { a.style.display = ''; a.href = w.meta.link; a.textContent = w.meta.linkText; } else a.style.display = 'none';
  const list = seq(), i = list.indexOf(w);
  card.querySelector('.count').textContent = `${touring ? 'Tour · ' : ''}${i + 1} / ${list.length}`;
  card.querySelector('.next').textContent = touring ? (i === list.length - 1 ? 'Finish' : 'Next stop') : 'Next';
  const lead = card.querySelector('.lead'), tl = touring && TOUR.find((t) => t.id === w.id);
  lead.textContent = tl ? tl.line : ''; lead.style.display = tl ? '' : 'none';
  card.classList.add('open');
  label.style.opacity = 0;
  sfx.tick(660);
}
function closeCard() {
  touring = false;
  if (rig.mode !== 'focus') return;
  rig.mode = 'room'; rig.focus = null;
  card.classList.remove('open');
  tweenTo(roomPose(clock()), 0.7, null, true);
}
card.querySelector('.close').addEventListener('click', closeCard);
card.querySelector('.next').addEventListener('click', () => {
  const list = seq(), i = list.indexOf(rig.focus);
  if (touring && i === list.length - 1) { closeCard(); openHello(); return; }
  const keep = touring; openCard(list[(i + 1) % list.length]); touring = keep;
});
card.querySelector('.prev').addEventListener('click', () => { const list = seq(), keep = touring; openCard(list[(list.indexOf(rig.focus) + list.length - 1) % list.length]); touring = keep; });

const osEl = document.getElementById('os');
function enterScreen(instant) {
  if (rig.mode === 'screen' || rig.mode === 'os') return;
  card.classList.remove('open'); label.style.opacity = 0; hover = null; hoverScreen = false;
  rig.mode = 'screen';
  document.body.classList.add('in-os');
  sfx.whoosh(true);
  const fin = () => { rig.mode = 'os'; osEl.style.opacity = 1; OS.enter(); };
  if (instant) { const p = screenPose(); rig.pos.copy(p.pos); rig.tgt.copy(p.tgt); rig.tween = null; osEl.classList.add('on'); fin(); return; }
  osEl.classList.add('on'); osEl.style.opacity = 0;
  tweenTo(screenPose(), 1.7, fin);
}
function exitScreen() {
  if (rig.mode !== 'os' && rig.mode !== 'screen') return;
  OS.leave();
  rig.mode = 'room';
  document.body.classList.remove('in-os');
  sfx.whoosh(false);
  paintScreen(true);
  const p = screenPose(); rig.pos.copy(p.pos); rig.tgt.copy(p.tgt);
  tweenTo(roomPose(clock()), 1.6, () => { osEl.classList.remove('on'); });
}
OS.onExit = exitScreen;
OS.onWallpaper = () => paintScreen(true);

// ---------------------------------------------------------------- loop
let tStart = performance.now(); // restarted when the room is ready, so the opening and the monitor's turn-on are seen, not spent behind the loading screen
function clock() { return FROZEN !== null ? FROZEN : (performance.now() - tStart) / 1000; }
let lastT = 0, frames = 0, acc = 0, slow = 0;
window.__stats = { fps: 0, quality: 1, ready: false, refl: reflOn };
const tmpV = new THREE.Vector3();
function frame() {
  requestAnimationFrame(frame);
  const t = clock();
  const dt = Math.min(0.05, Math.max(0.001, FROZEN !== null ? 0.016 : t - lastT));
  lastT = t;
  // fps + adaptive resolution
  const now = performance.now();
  if (frame.prev) {
    acc += now - frame.prev; frames++;
    if (acc > 1000) {
      const fps = frames * 1000 / acc; window.__stats.fps = fps;
      if (fps < 50 && (reflOn || quality > 0.55) && rig.mode !== 'os') { if (++slow >= 2) { if (reflOn) reflOn = false; else { quality = Math.max(0.55, quality - 0.15); resize(); } window.__stats.quality = quality; window.__stats.refl = reflOn; slow = 0; } } else slow = 0;
      acc = 0; frames = 0;
    }
  }
  frame.prev = now;
  if (rig.mode === 'os' && !rig.tween) return; // the OS is plain DOM on top; nothing to draw behind it

  U.uTime.value = t;
  if (wake.on) wakeStep(t);
  paintScreen(false);
  const ms = monitorState(t);
  screenMat.uniforms.uOn.value = ms.on; screenMat.uniforms.uFlick.value = ms.flick;
  const tint = wallpaperTint(OS.state.wallpaper);
  U.uMon.value.setRGB(tint[0], tint[1], tint[2]).multiplyScalar(ms.light * 0.95);

  // camera
  if (rig.tween) {
    const tw = rig.tween;
    tw.k = Math.min(1, tw.k + dt / tw.dur);
    if (FROZEN !== null || CALM) tw.k = 1; // reduce motion: cut to the new view instead of flying
    const e = tw.cut ? (tw.k < 0.5 ? 0 : 1) : ease(tw.k);
    cutFade = tw.cut ? 0.06 + 0.94 * THREE.MathUtils.smoothstep(Math.abs(tw.k * 2 - 1), 0.0, 1.0) : 1;
    if (tw.cut && tw.k >= 0.5) zoomK = rig.mode === 'room' ? rig.dolly : (rig.mode === 'focus' && !tall() ? FOCUS_ZOOM : 0);
    if (tw.k >= 1) cutFade = 1;
    rig.pos.lerpVectors(tw.p0, tw.p1, e); rig.tgt.lerpVectors(tw.t0, tw.t1, e);
    if (rig.mode === 'screen') osEl.style.opacity = THREE.MathUtils.smoothstep(tw.k, 0.82, 1.0);
    if (rig.mode === 'room' && osEl.classList.contains('on')) osEl.style.opacity = 1 - THREE.MathUtils.smoothstep(tw.k, 0.0, 0.16);
    if (tw.k >= 1) { rig.tween = null; tw.done && tw.done(); }
  } else if (rig.mode === 'room') {
    if (!dragging && glide) { // a short glide after letting go (about a third of a second), so the room does not stop dead
      rig.yaw = THREE.MathUtils.clamp(rig.yaw + glide * dt, -1.6, 1.6); glide *= Math.exp(-dt * 7); lastInput = performance.now();
      if (Math.abs(glide) < 0.02 || Math.abs(rig.yaw) >= 1.6) glide = 0;
    }
    const steering = dragging || performance.now() - lastInput < 500; // her hand, wheel or keys: answer at once; the Back to start button stays gentle
    const p = roomPose(t), k = FROZEN !== null ? 1 : 1 - Math.exp(-dt * (dragging ? 16 : steering ? 10 : 5)); // follows the hand closely: lag is what makes people queasy
    rig.pos.lerp(p.pos, k); rig.tgt.lerp(p.tgt, k);
  } else if (rig.mode === 'focus') {
    const p = focusPose(rig.focus), k = 1 - Math.exp(-dt * 3.2);
    if (!CALM) { p.pos.x += rig.mouse.x * 0.02; p.pos.y += rig.mouse.y * 0.01; }
    rig.pos.lerp(p.pos, k); rig.tgt.lerp(p.tgt, k);
  }
  const zt = (rig.mode === 'room' && !rig.tween) ? rig.dolly : (rig.mode === 'focus' && !tall() ? (rig.tween ? zoomK : FOCUS_ZOOM) : 0);
  zoomK += (zt - zoomK) * (FROZEN !== null ? 1 : 1 - Math.exp(-dt * 5));
  camera.fov = BASE_FOV * (1 - 0.3 * zoomK); camera.updateProjectionMatrix();
  camera.position.copy(rig.pos); camera.lookAt(rig.tgt);
  camera.updateMatrixWorld(); placeTags();
  navEl.classList.toggle('on', rig.mode === 'room' && !rig.tween);
  homeBtn.classList.toggle('on', Math.abs(rig.yaw) > 0.04 || Math.abs(rig.dolly - (tall() ? 0.55 : 0)) > 0.04 || Math.abs(rig.pitch) > 0.02);

  // highlights: hovered object glows; when nobody is pointing, a slow pulse walks along the shelves
  works.forEach((w, i) => {
    let target = (w === hover || w === tagHover || w === rig.focus) ? 1 : 0;
    if (!hover && rig.mode === 'room' && !wake.on) { const ph = (t * 0.45 - i * 0.55) % (works.length * 0.55 + 2.5); target = Math.max(target, 0.55 * Math.max(0, 1 - Math.abs(ph - 0.5) * 2)); }
    if (wake.on && wake.pulse[i]) target = Math.max(target, wake.pulse[i]);
    const u = w.mat.uniforms.uHi; u.value += (target - u.value) * Math.min(1, dt * 8);
    { // walking round the desk can put the camera right behind a piece; within about 1.5 m (seen from above) it dissolves
      // on or off, never left half way (a half-dissolved piece looks like glitter): gone inside 1.4 m, back beyond 1.65 m
      const gd = Math.hypot(camera.position.x - w.center.x, camera.position.z - w.center.z);
      if (rig.mode !== 'room') w.gone = false; else if (gd < 1.4) w.gone = true; else if (gd > 1.65) w.gone = false;
      const near = w.gone ? 1 : 0;
      w.ghost = (w.ghost || 0) + (near - (w.ghost || 0)) * Math.min(1, dt * 9);
      if (Math.abs(near - w.ghost) < 0.03) w.ghost = near;
      w.mat.uniforms.uGhost.value = w.ghost < 0.01 ? 0 : w.ghost;
      if (liveOf[w.id]) liveOf[w.id].visible = w.ghost < 0.5;
      if (!wake.on && i < 8) wake.trays[i].z = 1 - w.ghost; // its tray ring dims with it, so no bright hoop is left hanging in front of the view
      if (w.tag) w.tag.style.opacity = w.ghost > 0.5 ? 0 : '';
    }
    if (w.arm) { // light runs out along the arm to the piece being pointed at (or lit in the opening, or open as a card)
      const a = w.arm, live = w === hover || w === tagHover || w === rig.focus || (wake.on && wake.pulse[i] > 0);
      const on = a.mat.uniforms.uOn; on.value += ((live ? 1 : 0) - on.value) * Math.min(1, dt * (live ? 12 : 3));
      if (live) a.head = Math.min(1.3, a.head + dt / (CALM ? 0.001 : 0.55)); else if (on.value < 0.02) a.head = 0;
      a.mat.uniforms.uHead.value = a.head; a.mesh.visible = on.value > 0.01;
    }
  });
  sideStep(t);
  screenMat.uniforms.uHi.value += (((hoverScreen && rig.mode === 'room') ? 1 : 0) - screenMat.uniforms.uHi.value) * Math.min(1, dt * 8);

  // glass reflections
  if (glass) {
    glassLights.forEach((L, i) => {
      // mirror the light through the glass plane, then find where the eye sees it on the pane
      tmpV.set(L.p.x, L.p.y, 2 * GLASS_Z - L.p.z);
      const k = (GLASS_Z - camera.position.z) / (tmpV.z - camera.position.z);
      glassMat.uniforms.uP.value[i].set(camera.position.x + (tmpV.x - camera.position.x) * k, camera.position.y + (tmpV.y - camera.position.y) * k, GLASS_Z);
      glassMat.uniforms.uC.value[i].copy(L.c);
      if (i === 2) glassMat.uniforms.uC.value[i].copy(U.uMon.value).multiplyScalar(0.5);
    });
    glassMat.uniforms.uS.value.set(glassLights[0].s, glassLights[1].s, glassLights[2].s).multiplyScalar(0.55);
  }
  if (dust) dust.material.uniforms.uScale.value = H / 1080 * 2.2;
  { // skill names: shown while looking round the room, gone while a card or the monitor has the view; smaller on phones
    const want = rig.mode === 'room' && !rig.tween ? 0.9 : 0, k = innerWidth < 700 ? 0.72 : 1;
    const pxPer = innerHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))), hw = 0.46 * k * pxPer + 6;
    for (const sp of skillNames) {
      let w2 = want;
      if (w2 > 0 && tagRects.length) { // a name that would sit behind a plaque gives way to it
        tmpV.copy(sp.position).project(camera);
        const sx = (tmpV.x + 1) / 2 * innerWidth, sy = (1 - tmpV.y) / 2 * innerHeight;
        if (tagRects.some((q) => Math.abs(q.x - sx) < q.hw + hw && Math.abs((q.y - q.lift - 30) - sy) < 34)) w2 = 0;
      }
      sp.material.opacity += (w2 - sp.material.opacity) * Math.min(1, dt * 6); sp.visible = sp.material.opacity > 0.01; sp.scale.set(0.92 * k, 0.042 * k, 1);
    }
  }

  // floor mirror: same camera, mirrored through the floor (y = 0)
  U.uReflOn.value = reflOn ? 1 : 0;
  if (reflOn) {
    reflCam.fov = camera.fov; reflCam.aspect = camera.aspect; reflCam.near = camera.near; reflCam.far = 60; reflCam.updateProjectionMatrix();
    reflCam.position.set(camera.position.x, -camera.position.y, camera.position.z);
    reflCam.up.set(0, -1, 0);
    camera.getWorldDirection(tmpV); tmpV.y = -tmpV.y;
    reflCam.lookAt(tmpV.add(reflCam.position));
    reflCam.updateMatrixWorld();
    U.uReflM.value.copy(reflBias).multiply(reflCam.projectionMatrix).multiply(reflCam.matrixWorldInverse);
    renderer.setRenderTarget(rtRefl);
    renderer.setClearColor(0x000000, 0); renderer.clear();
    renderer.render(scene, reflCam);
    renderer.setClearColor(0x000000, 1);
  }
  renderer.setRenderTarget(rtScene);
  renderer.render(scene, camera);
  preMat.uniforms.t.value = rtScene.texture; preMat.uniforms.px.value.set(1 / W, 1 / H);
  pass(preMat, rtA1);
  blurMat.uniforms.t.value = rtA1.texture; blurMat.uniforms.d.value.set(1 / rtA1.width, 0); pass(blurMat, rtA2);
  blurMat.uniforms.t.value = rtA2.texture; blurMat.uniforms.d.value.set(0, 1 / rtA1.height); pass(blurMat, rtA1);
  blurMat.uniforms.t.value = rtA1.texture; blurMat.uniforms.d.value.set(1.6 / rtB1.width, 0); pass(blurMat, rtB1);
  blurMat.uniforms.t.value = rtB1.texture; blurMat.uniforms.d.value.set(0, 1.6 / rtB1.height); pass(blurMat, rtB2);
  blurMat.uniforms.t.value = rtB2.texture; blurMat.uniforms.d.value.set(2.4 / rtB1.width, 0); pass(blurMat, rtB1);
  blurMat.uniforms.t.value = rtB1.texture; blurMat.uniforms.d.value.set(0, 2.4 / rtB1.height); pass(blurMat, rtB2);
  finalMat.uniforms.t.value = rtScene.texture; finalMat.uniforms.b1.value = rtA1.texture; finalMat.uniforms.b2.value = rtB2.texture;
  finalMat.uniforms.uFade.value = Math.min(1, FROZEN !== null ? 1 : t / 0.9) * cutFade;
  pass(finalMat, null);
}

resize();
OS.init(osEl);
load().then(() => {
  window.__stats.ready = true;
  tStart = performance.now(); lastT = 0;
  if (Q.has('wake')) { wake.on = false; wakeStep(parseFloat(Q.get('wake'))); } // ?t=20&wake=2.1 freezes the opening at that moment, for screenshots
  if (wake.on) setTimeout(() => document.body.classList.remove('wake'), wake.T_NAME * 1000);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => paintScreen(true));
  document.body.classList.add('ready');
  buildTags(); startIntro();
  const p = roomPose(clock()); rig.pos.copy(p.pos); rig.tgt.copy(p.tgt);
  if (VIEW === 'desk') { rig.dolly = 1; }
  if (tall() && VIEW === 'room') { rig.dolly = 0.55; zoomK = 0.55; const q = roomPose(clock()); rig.pos.copy(q.pos); rig.tgt.copy(q.tgt); } // phone: start a few steps in, looking at the desk, instead of at half a screen of dome
  if (Q.has('yaw')) rig.yaw = parseFloat(Q.get('yaw')) || 0; // for screenshots: ?yaw=0.8&zoom=0.5
  if (Q.has('zoom')) rig.dolly = THREE.MathUtils.clamp(parseFloat(Q.get('zoom')) || 0, 0, 1);
  if (VIEW === 'shelf') { rig.pitch = 0.3; }
  if (VIEW === 'window') { rig.yaw = -0.7; rig.dolly = 0.5; }
  if (VIEW.startsWith('card')) { const w = works.find((x) => x.id === VIEW.split(':')[1]) || works[0]; openCard(w); }
  if (VIEW === 'screen') { const s = screenPose(); HOME.pos.copy(s.pos).add(new THREE.Vector3(0, 0, 0.5)); HOME.tgt.copy(s.tgt); }
  if (VIEW.startsWith('os')) { OS.skipBoot(); enterScreen(true); const app = VIEW.split(':')[1]; if (app) OS.open(app); }
  frame();
}).catch((e) => { console.error(e); document.body.classList.add('failed'); });
