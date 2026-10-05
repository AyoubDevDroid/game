// L'univers du jeu : 15 galaxies de 15 planètes. Les 14 premières ont un phare et un petit gardien
// prisonnier ; la 15e est le Grand Phare, gardé par le boss de la galaxie.
// Tout est généré à partir d'une graine : une planète est identique à chaque partie.
import * as THREE from 'three';

export const NB_GALAXIES = 15, NB_PLANETES = 15;
export const BOSS_REQUIS = 8;            // phares à rallumer dans la galaxie pour ouvrir le Grand Phare
export const OUVERTES_AU_DEPART = 3;     // chaque phare rallumé ouvre une planète de plus

export function rng(seed) { let s = (seed * 9301 + 49297) % 233280; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); }

// ciel : [bas, milieu, haut]
export const GALAXIES = [
  { nom: 'Archipel du Ciel',      ciel: [0xff70ae, 0x5c2bc7, 0x1c0d4f] },
  { nom: 'Nébuleuse Framboise',   ciel: [0xff8a9a, 0xb0246a, 0x2d0a2e] },
  { nom: 'Spirale Menthe',        ciel: [0x9af2cc, 0x2a8f8a, 0x0b2a33] },
  { nom: 'Voile d\'Ambre',        ciel: [0xffc46b, 0xc2552a, 0x3a1020] },
  { nom: 'Nuée Lagon',            ciel: [0x8feaff, 0x2b6fd6, 0x0d1747] },
  { nom: 'Couronne de Givre',     ciel: [0xe8fbff, 0x7aa7e6, 0x1b2550] },
  { nom: 'Jardin des Comètes',    ciel: [0xd4ff7a, 0x3f9a5a, 0x0e2a24] },
  { nom: 'Mer de Lucioles',       ciel: [0xffe066, 0x4a3fa0, 0x0c0b30] },
  { nom: 'Anneau Mandarine',      ciel: [0xffad66, 0xd8402f, 0x2e0b1c] },
  { nom: 'Brume Violette',        ciel: [0xd9b8ff, 0x7a3fd6, 0x1a0a3d] },
  { nom: 'Ruche d\'Étoiles',      ciel: [0xfff2a8, 0xb07a1f, 0x231405] },
  { nom: 'Cascade Aurore',        ciel: [0x7cf0c0, 0x8a4fe0, 0x120a35] },
  { nom: 'Forge Céleste',         ciel: [0xff9b5a, 0x8a1f2c, 0x1a0508] },
  { nom: 'Abysse Nacré',          ciel: [0xffd0dc, 0x5a7fbf, 0x0a1230] },
  { nom: 'Cœur de l\'Ombre',      ciel: [0xb48cff, 0x3b1f5c, 0x07020f] },
];

// biomes : couleurs du sol, motif (1 herbe, 2 fissures lumineuses, 3 poussière d'étoiles), décors pour une planète de rayon 9
export const BIOMES = [
  { nom: 'menthe', sol: { bas: 0x34bf8f, base: 0x5fe0b0, haut: 0x9af2cc, bosse: 0x6fe6b8 }, motif: 1, motifCol: 0xffffff, herbe: 0x2aa77a,
    decors: [['champiRose', 12], ['champiJaune', 9], ['maison', 3], ['touffe', 34], ['rocher', 5]] },
  { nom: 'lave', sol: { bas: 0xd9601f, base: 0xff8a3d, haut: 0xffad66, bosse: 0x7a4a3a }, motif: 2, motifCol: 0xffd23f, scale: 3.6, herbe: 0xb8471a,
    decors: [['cristalRose', 16], ['cristalJaune', 12], ['rocher', 12]] },
  { nom: 'étoilée', sol: { bas: 0x8f6ee6, base: 0xb89cff, haut: 0xdcccff, bosse: 0xc7b2ff }, motif: 3, motifCol: 0xfff2a8, scale: 5, herbe: 0x7a58d6,
    decors: [['cristalBleu', 8], ['champiRose', 6], ['touffe', 18], ['rocher', 3]] },
  { nom: 'givre', sol: { bas: 0x5ec8e6, base: 0x9fe6ff, haut: 0xe8fbff, bosse: 0xc9f3ff }, motif: 3, motifCol: 0xffffff, scale: 6, herbe: 0x4fb0d6,
    decors: [['cristalBleu', 14], ['rocher', 6], ['maison', 2]] },
  { nom: 'verdoyance', sol: { bas: 0x6cc22a, base: 0xa7f432, haut: 0xd4ff7a, bosse: 0xb9f75a }, motif: 1, motifCol: 0xffffff, herbe: 0x4f9a1f,
    decors: [['champiJaune', 10], ['touffe', 50], ['maison', 4], ['champiRose', 4]] },
  { nom: 'dunes', sol: { bas: 0xe0a93a, base: 0xffd27a, haut: 0xfff0b8, bosse: 0xffc85a }, motif: 0, motifCol: 0xffffff, herbe: 0xc9922a,
    decors: [['rocher', 14], ['cristalJaune', 8], ['touffe', 10]] },
  { nom: 'corail', sol: { bas: 0xff6f91, base: 0xff9bb5, haut: 0xffd0dc, bosse: 0xffb3c6 }, motif: 1, motifCol: 0xffffff, herbe: 0xff4f86,
    decors: [['champiRose', 14], ['cristalRose', 8], ['touffe', 20], ['maison', 2]] },
  { nom: 'marais', sol: { bas: 0x5a3fa0, base: 0x7f63c9, haut: 0xa991e6, bosse: 0x9277d9 }, motif: 2, motifCol: 0x00d2ff, scale: 4.2, herbe: 0x4a2f86,
    decors: [['champiJaune', 12], ['cristalBleu', 8], ['rocher', 6]] },
  { nom: 'lagon', sol: { bas: 0x1aa6b7, base: 0x2fd3c4, haut: 0x8ff0e0, bosse: 0x5fe0d0 }, motif: 1, motifCol: 0xffffff, herbe: 0x138f86,
    decors: [['rocher', 8], ['maison', 3], ['touffe', 30], ['cristalBleu', 4]] },
  { nom: 'volcan', sol: { bas: 0x8a1f2c, base: 0xc23a3a, haut: 0xff6b4a, bosse: 0x5e2a2a }, motif: 2, motifCol: 0xffd23f, scale: 3.2, herbe: 0x7a1a22,
    decors: [['rocher', 16], ['cristalJaune', 10]] },
];

const DEBUT = ['Bru', 'Cen', 'Givr', 'Ver', 'Sab', 'Cor', 'Lag', 'Vol', 'Ast', 'Lum', 'Mir', 'Pla', 'Nim', 'Fla', 'Bri', 'Sel', 'Ond', 'Pom', 'Zé', 'Cal', 'Oré', 'Til', 'Mou', 'Pé'];
const MILIEU = ['me', 'dri', 'a', 'lu', 'o', 'ri', 'ne', 'ba', 'vi', 'to', 'li', 'su'];
const FIN = ['lune', 'ne', 'lle', 'ria', 'don', 'mine', 'sia', 'tte', 'ra', 'brume', 'nelle', 'line'];

// couleurs des petits gardiens à libérer : [cadre, écharpe]
const GARDIENS = [[0x3fa0ff, 0xffd23f], [0x3ee6a8, 0xff3d81], [0xb44dff, 0xa7f432], [0xff7a00, 0x00d2ff], [0xffd23f, 0xb44dff], [0x2fd3c4, 0xff7a00]];

const decale = (hex, dh) => { const c = new THREE.Color(hex), h = {}; c.getHSL(h); return c.setHSL((h.h + dh + 1) % 1, h.s, h.l).getHex(); };

// une planète : g (0 à 14), i (0 à 14)
export function planete(g, i) {
  const seed = 1000 + g * 37 + i * 11, r = rng(seed);
  const boss = i === NB_PLANETES - 1;
  const biome = BIOMES[g === 0 && i < 2 ? i : (g * 3 + i * 7) % BIOMES.length];
  const teinte = g === 0 ? 0 : (r() - 0.5) * 0.08;      // petites variations de couleur d'une galaxie à l'autre
  const sol = Object.fromEntries(Object.entries(biome.sol).map(([k, v]) => [k, decale(v, teinte)]));
  const nom = boss ? 'Le Grand Phare'
    : g === 0 && i === 0 ? 'Brumelune' : g === 0 && i === 1 ? 'Cendrine'
    : DEBUT[Math.floor(r() * DEBUT.length)] + (r() < 0.5 ? MILIEU[Math.floor(r() * MILIEU.length)] : '') + FIN[Math.floor(r() * FIN.length)];
  const radius = boss ? 13 : Math.round(15 + r() * 7 + g * 0.3);
  const dir = () => { const u = r() * 2 - 1, a = r() * Math.PI * 2, s = Math.sqrt(1 - u * u); return [s * Math.cos(a), u, s * Math.sin(a)]; };
  let beacon = dir();
  while (beacon[1] > 0.2) beacon = dir();                 // le phare n'est jamais juste à côté du vaisseau
  return {
    g, i, seed, nom, boss, radius, biome: biome.nom,
    sol, motif: biome.motif, motifCol: biome.motifCol, scale: biome.scale, herbe: decale(biome.herbe, teinte), decors: biome.decors,
    beacon, relief: 0.5 + r() * 0.5, freq: 1 + r() * 0.6, bosse: { h: 1.2 + r() * 1.2, w: 0.25 + r() * 0.12 },
    embers: boss ? 4 : 7 + Math.floor(r() * 4) + Math.floor(g / 4),
    ombrelles: boss ? 2 + Math.floor(g / 3) : Math.min(12, 2 + Math.floor(radius / 6) + Math.floor(g * 0.6)),
    vitesse: 3.4 + g * 0.12,                               // vitesse des Ombrelles (Fanal court à 7,5)
    bossVie: 3 + Math.floor(g / 4),
    gardien: boss ? null : GARDIENS[Math.floor(r() * GARDIENS.length)],
    // position sur la carte de la galaxie (spirale)
    carte: { a: i * 1.0 + g, d: 0.08 + Math.sqrt(i / (NB_PLANETES - 1)) * 0.88 },
  };
}

// ---------- sauvegarde ----------
const CLE = 'astres_eteints_v2';
export function lireSauvegarde() {
  try { const s = JSON.parse(localStorage.getItem(CLE)); if (s && s.allumes) return s; } catch {}
  return null;
}
export function nouvellePartie() { return { galaxie: 0, debloquee: 0, allumes: {}, gardiens: 0, eclats: 0, temps: 0 }; }
export function sauver(s) { try { localStorage.setItem(CLE, JSON.stringify(s)); } catch {} }
export const cle = (g, i) => `${g}-${i}`;
export function phareAllume(s, g, i) { return !!s.allumes[cle(g, i)]; }
export function allumesDans(s, g) { let n = 0; for (let i = 0; i < NB_PLANETES - 1; i++) if (s.allumes[cle(g, i)]) n++; return n; }
export function planeteOuverte(s, g, i) {
  if (g > s.debloquee) return false;
  if (i === NB_PLANETES - 1) return allumesDans(s, g) >= BOSS_REQUIS;
  return i < OUVERTES_AU_DEPART + allumesDans(s, g);
}
