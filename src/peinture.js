// Textures peintes par le code, dans le style « peint à la main » d'un platformer cartoon.
// Chaque planète a les siennes, à ses couleurs : un sol (herbe, sable, neige, bonbon…) et une roche
// pour les falaises. Elles se répètent sans raccord (tout ce qui dépasse d'un bord est redessiné de l'autre côté).
import * as THREE from 'three';
import { rng } from './univers.js';

const T = 512;
const col = (hex, l = 0, s = 0) => { const c = new THREE.Color(hex); if (l || s) c.offsetHSL(0, s, l); return c; };
const css = (c, a = 1) => `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${a})`;

// bruit de valeur périodique (se raccorde sur les bords de la tuile)
function bruitPeriodique(r, P) {
  const g = new Float32Array(P * P).map(() => r());
  const v = (x, y) => g[((y % P + P) % P) * P + ((x % P + P) % P)];
  return (x, y) => {                                           // x, y en cellules
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = v(xi, yi) + (v(xi + 1, yi) - v(xi, yi)) * sx, b = v(xi, yi + 1) + (v(xi + 1, yi + 1) - v(xi, yi + 1)) * sx;
    return a + (b - a) * sy;
  };
}

// fond : marbrure douce entre deux couleurs (bruit sur plusieurs échelles, calculé en petit puis agrandi en douceur)
function fond(x, r, c1, c2, echelles = [4, 8, 16], contraste = 1) {
  const N = 128, img = new ImageData(N, N), bruits = echelles.map(P => [bruitPeriodique(r, P), P]);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    let t = 0, w = 0, k = 1;
    for (const [b, P] of bruits) { t += b(i / N * P, j / N * P) * k; w += k; k *= 0.5; }
    t = Math.min(1, Math.max(0, (t / w - 0.5) * contraste + 0.5));
    const o = (j * N + i) * 4;
    img.data[o] = (c1.r + (c2.r - c1.r) * t) * 255; img.data[o + 1] = (c1.g + (c2.g - c1.g) * t) * 255; img.data[o + 2] = (c1.b + (c2.b - c1.b) * t) * 255; img.data[o + 3] = 255;
  }
  const petit = document.createElement('canvas'); petit.width = petit.height = N; petit.getContext('2d').putImageData(img, 0, 0);
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
  for (const dx of [-T, 0, T]) for (const dy of [-T, 0, T]) x.drawImage(petit, dx, dy, T, T);   // agrandi, raccordé
}

// dessine une forme à (px, py) et ses copies de l'autre côté des bords
function autour(px, py, marge, f) {
  for (const dx of [-T, 0, T]) for (const dy of [-T, 0, T]) {
    const X = px + dx, Y = py + dy;
    if (X > -marge && X < T + marge && Y > -marge && Y < T + marge) f(X, Y);
  }
}
function taches(x, r, couleurs, n, rMin, rMax, alpha) {
  for (let i = 0; i < n; i++) {
    const px = r() * T, py = r() * T, rr = rMin + r() * (rMax - rMin), c = couleurs[Math.floor(r() * couleurs.length)];
    autour(px, py, rr, (X, Y) => {
      const g = x.createRadialGradient(X, Y, 0, X, Y, rr);
      g.addColorStop(0, css(c, alpha)); g.addColorStop(1, css(c, 0));
      x.fillStyle = g; x.fillRect(X - rr, Y - rr, rr * 2, rr * 2);
    });
  }
}

// ---------- les styles de sol ----------
const STYLES = {
  herbe(x, r, P) {
    const base = col(P.sol.base), sombre = col(P.sol.base, -0.12, 0.05), clair = col(P.sol.haut, 0.05);
    fond(x, r, sombre, clair, [4, 8, 16], 1.6);
    taches(x, r, [col(P.sol.haut, 0.08), col(P.sol.bas, -0.04)], 26, 30, 80, 0.22);
    // brins : petits coups de pinceau courbes, du sombre au clair
    x.lineCap = 'round';
    for (let i = 0; i < 5200; i++) {
      const px = r() * T, py = r() * T, l = 5 + r() * 9, a = -Math.PI / 2 + (r() - 0.5) * 0.9, t = r();
      const c = sombre.clone().lerp(clair, t).lerp(base, 0.2);
      x.strokeStyle = css(c, 0.75); x.lineWidth = 1.4 + r() * 1.6;
      autour(px, py, 16, (X, Y) => { x.beginPath(); x.moveTo(X, Y); x.quadraticCurveTo(X + Math.cos(a) * l * 0.5 + 2, Y + Math.sin(a) * l * 0.5, X + Math.cos(a) * l, Y + Math.sin(a) * l); x.stroke(); });
    }
    // trèfles et petites fleurs
    for (let i = 0; i < 70; i++) {
      const px = r() * T, py = r() * T, fl = r() < 0.55, c = fl ? col(P.fleurs[Math.floor(r() * 3)]) : col(P.sol.haut, 0.12), rr = fl ? 2.6 + r() * 1.6 : 3 + r() * 2;
      autour(px, py, 12, (X, Y) => {
        for (let k = 0; k < (fl ? 5 : 3); k++) { const a = k / (fl ? 5 : 3) * Math.PI * 2; x.fillStyle = css(c); x.beginPath(); x.arc(X + Math.cos(a) * rr, Y + Math.sin(a) * rr, rr * 0.8, 0, 7); x.fill(); }
        x.fillStyle = fl ? '#fff3a8' : css(col(P.sol.base, -0.05)); x.beginPath(); x.arc(X, Y, rr * 0.55, 0, 7); x.fill();
      });
    }
  },
  sable(x, r, P) {
    const clair = col(P.sol.haut, 0.08), sombre = col(P.sol.base, -0.04);
    fond(x, r, sombre, clair, [3, 6, 12], 1.3);
    // ondulations du vent (nombre de vagues entier : raccord parfait)
    for (let k = 0; k < 18; k++) {
      const y0 = (k / 18) * T, amp = 5 + r() * 5, ph = r() * 6, freq = 2 + Math.floor(r() * 2);
      for (const [dy, c, a] of [[0, col(P.sol.haut, 0.15), 0.45], [3, col(P.sol.bas, -0.05), 0.35]]) {
        x.strokeStyle = css(c, a); x.lineWidth = 2.2; x.beginPath();
        for (let i = 0; i <= T; i += 4) { const y = y0 + dy + Math.sin(i / T * Math.PI * 2 * freq + ph) * amp; i ? x.lineTo(i, y) : x.moveTo(i, y); }
        x.stroke();
      }
    }
    for (let i = 0; i < 2500; i++) { const c = r() < 0.5 ? col(P.sol.haut, 0.2) : col(P.sol.bas, -0.1); x.fillStyle = css(c, 0.5); x.fillRect(r() * T, r() * T, 1.5, 1.5); }
    for (let i = 0; i < 14; i++) {                                  // coquillages et galets
      const px = r() * T, py = r() * T, c = r() < 0.5 ? col(P.fleurs[0], 0.15) : col(P.pierre);
      autour(px, py, 10, (X, Y) => { x.fillStyle = css(c); x.beginPath(); x.ellipse(X, Y, 5, 3.5, r() * 3, 0, 7); x.fill(); x.fillStyle = 'rgba(255,255,255,.6)'; x.beginPath(); x.arc(X - 1.5, Y - 1.2, 1.4, 0, 7); x.fill(); });
    }
  },
  neige(x, r, P) {
    fond(x, r, col(0xd8ecff), col(0xffffff), [3, 6, 12], 1.2);
    taches(x, r, [col(0xb8d8ff), col(P.sol.base, 0.1)], 30, 25, 70, 0.25);
    for (let i = 0; i < 260; i++) {                                 // paillettes
      const px = r() * T, py = r() * T, s = 1 + r() * 2.2;
      autour(px, py, 6, (X, Y) => { x.fillStyle = 'rgba(255,255,255,.95)'; x.fillRect(X - s, Y - 0.6, s * 2, 1.2); x.fillRect(X - 0.6, Y - s, 1.2, s * 2); });
    }
  },
  basalte(x, r, P) {                                                // dalles de roche volcanique (les fissures brillantes viennent du shader)
    const c1 = col(P.sol.bas, -0.2), c2 = col(P.sol.base, -0.08);
    fond(x, r, c1, c2, [4, 8], 1.4);
    const pts = Array.from({ length: 40 }, () => [r() * T, r() * T]);
    for (const [px, py] of pts) autour(px, py, 50, (X, Y) => {
      const rr = 22 + r() * 22; x.fillStyle = css(col(P.sol.base, -0.02 + r() * 0.08), 0.5);
      x.beginPath(); for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2, q = rr * (0.75 + r() * 0.3); x.lineTo(X + Math.cos(a) * q, Y + Math.sin(a) * q); } x.closePath(); x.fill();
    });
    for (let i = 0; i < 900; i++) { x.fillStyle = css(col(P.sol.haut, 0.1), 0.35); x.fillRect(r() * T, r() * T, 1.5, 1.5); }
  },
  poussiere(x, r, P) {                                              // poussière d'étoiles
    fond(x, r, col(P.sol.base, -0.08), col(P.sol.haut, 0.05), [4, 8, 16], 1.5);
    taches(x, r, [col(P.accent, 0.1), col(P.sol.haut, 0.15)], 24, 20, 60, 0.18);
    for (let i = 0; i < 500; i++) { const c = r() < 0.3 ? col(P.accent, 0.2) : col(0xffffff); x.fillStyle = css(c, 0.4 + r() * 0.5); const s = 0.8 + r() * 1.6; x.beginPath(); x.arc(r() * T, r() * T, s, 0, 7); x.fill(); }
  },
  bonbon(x, r, P) {                                                 // glaçage rose et vermicelles
    fond(x, r, col(P.sol.base), col(P.sol.haut, 0.08), [3, 6], 1.3);
    for (let i = 0; i < 26; i++) {                                  // tourbillons de glaçage
      const px = r() * T, py = r() * T, rr = 18 + r() * 26;
      autour(px, py, rr + 4, (X, Y) => { x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 4; x.beginPath(); for (let a = 0; a < 9; a += 0.2) x.lineTo(X + Math.cos(a) * rr * a / 9, Y + Math.sin(a) * rr * a / 9); x.stroke(); });
    }
    const couleurs = ['#ff5f7a', '#ffd23f', '#5fd3ff', '#8f6bff', '#6fe08a', '#ffffff'];
    for (let i = 0; i < 420; i++) {
      const px = r() * T, py = r() * T, a = r() * Math.PI, c = couleurs[Math.floor(r() * couleurs.length)];
      autour(px, py, 8, (X, Y) => { x.strokeStyle = c; x.lineWidth = 2.6; x.lineCap = 'round'; x.beginPath(); x.moveTo(X, Y); x.lineTo(X + Math.cos(a) * 6, Y + Math.sin(a) * 6); x.stroke(); });
    }
  },
  mousse(x, r, P) {                                                 // marais, forêt hantée : mousse et feuilles mortes
    fond(x, r, col(P.sol.bas, -0.06), col(P.sol.base, 0.04), [4, 8, 16], 1.6);
    taches(x, r, [col(P.sol.haut, 0.05), col(P.herbe, -0.05)], 40, 14, 40, 0.35);
    for (let i = 0; i < 160; i++) {
      const px = r() * T, py = r() * T, a = r() * 6, c = col(P.fleurs[Math.floor(r() * 3)], -0.15);
      autour(px, py, 10, (X, Y) => { x.fillStyle = css(c, 0.8); x.beginPath(); x.ellipse(X, Y, 6, 3, a, 0, 7); x.fill(); x.strokeStyle = css(c.clone().offsetHSL(0, 0, -0.15), 0.8); x.lineWidth = 1; x.beginPath(); x.moveTo(X - Math.cos(a) * 6, Y - Math.sin(a) * 6); x.lineTo(X + Math.cos(a) * 6, Y + Math.sin(a) * 6); x.stroke(); });
    }
  },
  nuage(x, r, P) {
    fond(x, r, col(P.sol.base, 0.05), col(0xffffff), [3, 6], 1.2);
    taches(x, r, [col(0xffffff), col(P.sol.haut, 0.1)], 60, 20, 55, 0.45);
  },
};
const STYLE_DU_MONDE = {
  menthe: 'herbe', verdoyance: 'herbe', royaume: 'herbe', bourg: 'herbe', corail: 'herbe', lagon: 'sable', ocean: 'sable',
  dunes: 'sable', pirate: 'sable', givre: 'neige', fetes: 'neige', lave: 'basalte', volcan: 'basalte',
  'étoilée': 'poussiere', gourmande: 'bonbon', marais: 'mousse', hantee: 'mousse', nuages: 'nuage',
};

// roche des falaises : strates horizontales et pierres arrondies cernées, façon peinture
function roche(x, r, P) {
  const c = col(P.terre);
  fond(x, r, c.clone().offsetHSL(0, -0.05, -0.1), c.clone().offsetHSL(0, 0, 0.06), [4, 8], 1.3);
  for (let k = 0; k < 8; k++) {                                     // strates
    const y0 = (k / 8) * T, h = 10 + r() * 16, ph = r() * 6;
    x.fillStyle = css(c.clone().offsetHSL(0, 0, (r() - 0.5) * 0.14), 0.45);
    x.beginPath(); x.moveTo(0, y0);
    for (let i = 0; i <= T; i += 8) x.lineTo(i, y0 + Math.sin(i / T * Math.PI * 4 + ph) * 4);
    for (let i = T; i >= 0; i -= 8) x.lineTo(i, y0 + h + Math.sin(i / T * Math.PI * 4 + ph) * 4);
    x.fill();
  }
  for (let i = 0; i < 70; i++) {                                    // pierres : ombre en bas, lumière en haut
    const px = r() * T, py = r() * T, w = 12 + r() * 22, h = 8 + r() * 12;
    autour(px, py, 40, (X, Y) => {
      x.fillStyle = css(c.clone().offsetHSL(0, 0, -0.2), 0.55); x.beginPath(); x.ellipse(X + 1.5, Y + 2.5, w, h, 0, 0, 7); x.fill();
      x.fillStyle = css(c.clone().offsetHSL(0, 0, (r() - 0.3) * 0.12)); x.beginPath(); x.ellipse(X, Y, w, h, 0, 0, 7); x.fill();
      x.fillStyle = css(c.clone().offsetHSL(0, 0, 0.14), 0.6); x.beginPath(); x.ellipse(X - w * 0.2, Y - h * 0.35, w * 0.55, h * 0.3, 0, 0, 7); x.fill();
    });
  }
}

const cache = new Map();
function peindre(cle, f) {
  if (cache.has(cle)) return cache.get(cle);
  const c = document.createElement('canvas'); c.width = c.height = T;
  f(c.getContext('2d'));
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  t.generateMipmaps = true; t.userData.partage = true;
  if (cache.size > 8) { const [k, v] = cache.entries().next().value; v.dispose(); cache.delete(k); }   // on garde les dernières planètes
  cache.set(cle, t);
  return t;
}
export function peindreSol(L) {
  const style = STYLE_DU_MONDE[L.biome] || 'herbe';
  return peindre('sol-' + L.seed, x => STYLES[style](x, rng(L.seed * 19 + 7), L.palette));
}
export function peindreRoche(L) {
  return peindre('roche-' + L.seed, x => roche(x, rng(L.seed * 23 + 5), L.palette));
}
