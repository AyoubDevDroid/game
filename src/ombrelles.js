// Les Ombrelles : petites ombres coiffées d'une ombrelle violette, qui aiment le noir.
// Elles errent sur les planètes éteintes et poursuivent Fanal pour lui voler une braise.
// On les chasse en leur sautant dessus ; la vague de couleur du phare rallumé les dissout.
// Sur le Grand Phare de chaque galaxie : la Grande Ombrelle, le boss, qu'il faut écraser plusieurs fois.
import * as THREE from 'three';
import { rng } from './univers.js';
import { morceaux } from './modeles.js';

const VUE = 7, VITESSE_ERRE = 1.4, PLANE = 0.28;
const Y = new THREE.Vector3(0, 1, 0);

function randomDir(r) { const u = r() * 2 - 1, a = r() * Math.PI * 2, s = Math.sqrt(1 - u * u); return new THREE.Vector3(s * Math.cos(a), u, s * Math.sin(a)); }
const projectOnPlane = (v, n) => v.addScaledVector(n, -v.dot(n));

// géométries partagées par toutes les Ombrelles
const G = {
  corps: new THREE.SphereGeometry(0.42, 16, 12),
  frange: new THREE.SphereGeometry(0.13, 8, 6),
  dome: new THREE.SphereGeometry(0.58, 18, 6, 0, Math.PI * 2, 0, Math.PI / 2.3),
  pointe: new THREE.SphereGeometry(0.08, 8, 6),
  bord: new THREE.TorusGeometry(0.57, 0.035, 6, 32).rotateX(Math.PI / 2),
  oeil: new THREE.SphereGeometry(0.075, 10, 8),
  flaque: new THREE.CircleGeometry(0.55, 20).rotateX(-Math.PI / 2),
  piquant: new THREE.ConeGeometry(0.07, 0.3, 6),
};
const M = {
  corps: new THREE.MeshLambertMaterial({ color: 0x2a1846, emissive: 0x160828 }),
  dome: new THREE.MeshLambertMaterial({ color: 0x5b2d8f, emissive: 0x1d0b33, side: THREE.DoubleSide }),
  domeBoss: new THREE.MeshLambertMaterial({ color: 0x7a1f5c, emissive: 0x2a0820, side: THREE.DoubleSide }),
  pointe: new THREE.MeshLambertMaterial({ color: 0x8a5cd6 }),
  bord: new THREE.MeshLambertMaterial({ color: 0xb48cff, emissive: 0x5b2d8f }),
  bordBoss: new THREE.MeshLambertMaterial({ color: 0xffc23d, emissive: 0x7a4a00 }),
  flaque: new THREE.MeshBasicMaterial({ color: 0x14081f, transparent: true, opacity: 0.35, depthWrite: false }),
};
const OEIL_CALME = new THREE.Color(0xd9ccff), OEIL_CHASSE = new THREE.Color(0xff5fa2), OEIL_SONNE = new THREE.Color(0xffffff);

// toile d'ombrelle à rayures (8 pans de deux couleurs), un peu bombée
function toile(c1, c2) {
  const geo = new THREE.SphereGeometry(0.62, 32, 8, 0, Math.PI * 2, 0, Math.PI / 2.2);
  const P = geo.attributes.position, col = new Float32Array(P.count * 3), a = new THREE.Color(c1), b = new THREE.Color(c2), v = new THREE.Vector3();
  for (let i = 0; i < P.count; i++) {
    v.fromBufferAttribute(P, i);
    const ang = Math.atan2(v.z, v.x) + Math.PI, c = Math.floor(ang / (Math.PI / 4)) % 2 ? a : b;
    col.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}
// trois sortes : la marcheuse (violette), la sauteuse (sarcelle, bondit vers Fanal), la Grande Ombrelle (boss)
const STYLES = {
  marcheuse: { toile: toile(0x7a3fd6, 0x2a1450), bord: 0xd9b8ff, corps: 0x2a1846, yeux: 0xfff3c4 },
  sauteuse: { toile: toile(0x1fb5a8, 0x0d3b45), bord: 0x9ff6ff, corps: 0x10303a, yeux: 0xffe066 },
  boss: { toile: toile(0xd8285f, 0x1a0510), bord: 0xffc23d, corps: 0x2a0a1e, yeux: 0xff5f5f },
  tireuse: { toile: toile(0xc0244f, 0x1a0a14), bord: 0x8a6a5a, corps: 0x2a1846, yeux: 0xffffff },
};
const GX = {
  sclere: new THREE.SphereGeometry(0.1, 12, 10), pupille: new THREE.SphereGeometry(0.05, 10, 8),
  sourcil: new THREE.BoxGeometry(0.14, 0.03, 0.03), bouche: new THREE.SphereGeometry(0.07, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
  dent: new THREE.ConeGeometry(0.018, 0.04, 4), pied: new THREE.SphereGeometry(0.1, 10, 8),
  pompon: new THREE.SphereGeometry(0.055, 8, 6), crochet: new THREE.TorusGeometry(0.1, 0.028, 6, 16, Math.PI), manche: new THREE.CylinderGeometry(0.028, 0.028, 0.3, 6),
};
const MX = { blanc: new THREE.MeshBasicMaterial({ color: 0xffffff }), noir: new THREE.MeshBasicMaterial({ color: 0x14081f }) };

function fabriquer(type) {
  const st = STYLES[type], boss = type === 'boss';
  const lambert = (c, e = 0) => new THREE.MeshLambertMaterial({ color: c, emissive: e });
  const g = new THREE.Group();
  const flaque = new THREE.Mesh(G.flaque, M.flaque); flaque.position.y = 0.04; g.add(flaque);
  const corps = new THREE.Group(); g.add(corps);
  const matCorps = lambert(st.corps, 0x0a0414);
  const ventre = new THREE.Mesh(G.corps, matCorps); ventre.position.y = 0.42; ventre.scale.set(1, 0.85, 1); corps.add(ventre);
  const franges = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2, f = new THREE.Mesh(G.frange, matCorps);
    f.position.set(Math.sin(a) * 0.3, 0.12, Math.cos(a) * 0.3); corps.add(f); franges.push(f);
  }
  // petits pieds qui trottinent
  const pieds = [-0.13, 0.13].map(x => { const p = new THREE.Mesh(GX.pied, matCorps); p.position.set(x, 0.05, 0.12); p.scale.set(1, 0.6, 1.3); corps.add(p); return p; });
  // ombrelle : toile rayée, bord et pompons, manche et crochet
  const ombrelle = new THREE.Group(); ombrelle.position.y = 0.72; corps.add(ombrelle);
  const dome = new THREE.Mesh(st.toile, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })); dome.scale.y = 0.62; ombrelle.add(dome);
  const matBord = lambert(st.bord, boss ? 0x7a4a00 : 0x2a1450);
  const bord = new THREE.Mesh(G.bord, matBord); bord.position.y = 0.02; bord.scale.setScalar(1.08); ombrelle.add(bord);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + Math.PI / 8, p = new THREE.Mesh(GX.pompon, matBord); p.position.set(Math.cos(a) * 0.63, -0.03, Math.sin(a) * 0.63); ombrelle.add(p); }
  const manche = new THREE.Mesh(GX.manche, matBord); manche.position.y = 0.5; ombrelle.add(manche);
  if (type === 'tireuse') {                               // un petit canon à la place du crochet, des boules d'ombre dans les bras
    const canon = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.32, 10), std(0x8a8a90, 0, 0, { metalness: 0.7 })); canon.position.set(0, 0.42, 0.08); canon.rotation.x = 0.5; ombrelle.add(canon);
    for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(GX.pied, std(0x3b1f5c, 0x8a4fff, 0.9)); b.position.set((k - 1) * 0.12, 0.25, 0.4); corps.add(b); }
  } else { const crochet = new THREE.Mesh(GX.crochet, matBord); crochet.position.set(0.1, 0.65, 0); ombrelle.add(crochet); }
  if (boss) for (let i = 0; i < 6; i++) {                 // couronne de piquants dorés
    const a = (i / 6) * Math.PI * 2, p = new THREE.Mesh(G.piquant, matBord);
    p.position.set(Math.sin(a) * 0.3, 0.3, Math.cos(a) * 0.3); p.rotation.set(Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5); ombrelle.add(p);
  }
  // visage : yeux qui suivent Fanal, sourcils qui se froncent, bouche à petites dents
  const oeilMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(st.yeux) });
  const yeux = [], sourcils = [];
  for (const sx of [-1, 1]) {
    const o = new THREE.Group(); o.position.set(sx * 0.15, 0.52, 0.33); corps.add(o);
    const sc = new THREE.Mesh(GX.sclere, oeilMat); sc.scale.set(1, 1.25, 0.7); o.add(sc);
    const pu = new THREE.Mesh(GX.pupille, MX.noir); pu.position.z = 0.07; o.add(pu);
    const sr = new THREE.Mesh(GX.sourcil, MX.noir); sr.position.set(0, 0.15, 0.05); o.add(sr);
    yeux.push(pu); sourcils.push({ m: sr, sx });
  }
  const bouche = new THREE.Mesh(GX.bouche, MX.noir); bouche.position.set(0, 0.36, 0.37); bouche.rotation.x = -0.3; corps.add(bouche);
  for (const x of [-0.035, 0.035]) { const d = new THREE.Mesh(GX.dent, MX.blanc); d.position.set(x, 0.355, 0.405); d.rotation.x = Math.PI; corps.add(d); }
  return { g, corps, ombrelle, franges, oeilMat, yeux, sourcils, pieds, type };
}

// ---------- les autres ennemis (formes provisoires d'après docs/concepts/ennemis ; remplacées par les .glb) ----------
const lam = (c, e = 0, extra = {}) => new THREE.MeshLambertMaterial({ color: c, emissive: e, ...extra });
const std = (c, e = 0, i = 1, extra = {}) => new THREE.MeshStandardMaterial({ color: c, emissive: e, emissiveIntensity: i, roughness: 0.35, ...extra });
function yeuxSimples(corps, y, z, ecart, taille, couleur = 0xfff3c4) {
  const oeilMat = new THREE.MeshBasicMaterial({ color: couleur }), yeux = [];
  for (const s of [-1, 1]) {
    const o = new THREE.Mesh(GX.sclere, oeilMat); o.position.set(s * ecart, y, z); o.scale.setScalar(taille); corps.add(o);
    const p = new THREE.Mesh(GX.pupille, MX.noir); p.position.set(s * ecart, y, z + 0.07 * taille); p.scale.setScalar(taille); corps.add(p); yeux.push(p);
  }
  return { oeilMat, yeux };
}
const FORMES = {
  crabe() {
    const g = new THREE.Group(), corps = new THREE.Group(); g.add(corps);
    const carapace = std(0x4a1f4a, 0xff6f91, 0.25), patte = lam(0x6b2a5a);
    const dos = new THREE.Mesh(new THREE.SphereGeometry(0.5, 18, 12), carapace); dos.scale.set(1.15, 0.6, 0.9); dos.position.y = 0.55; corps.add(dos);
    for (let k = 0; k < 5; k++) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.025, 0.03), new THREE.MeshBasicMaterial({ color: 0xff8fb0 })); f.position.set(0, 0.79, -0.1 + k * 0.05); f.rotation.y = k * 0.7; corps.add(f); }
    const pinces = [[-1, 1.3], [1, 0.8]].map(([s, t]) => { const p = new THREE.Group(); p.position.set(s * 0.6, 0.65, 0.25); corps.add(p);
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.2 * t, 12, 10), carapace); m.scale.set(1, 1.3, 0.8); p.add(m);
      const doigt = new THREE.Mesh(new THREE.ConeGeometry(0.08 * t, 0.3 * t, 8), carapace); doigt.position.set(0, 0.28 * t, 0.05); p.add(doigt); return p; });
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const l = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.55, 6), patte); l.position.set(s * (0.45 + k * 0.05), 0.25, -0.15 + k * 0.18); l.rotation.set(Math.PI, 0, s * 0.5); corps.add(l); }
    for (const s of [-1, 1]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 6), carapace); t.position.set(s * 0.16, 0.95, 0.25); corps.add(t); }
    const y = yeuxSimples(corps, 1.12, 0.27, 0.16, 1.1, 0xffffff);
    return { g, corps, pinces, ...y };
  },
  follet() {
    const g = new THREE.Group(), corps = new THREE.Group(); g.add(corps);
    const metal = std(0x2a2430, 0, 0, { metalness: 0.6, transparent: true }), verre = std(0x7cf0d0, 0x3fe0c0, 0.8, { transparent: true, opacity: 0.55 });
    const cage = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.6, 6), verre); cage.position.y = 0.9; corps.add(cage);
    for (const y of [0.6, 1.2]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.08, 6), metal); b.position.y = y; corps.add(b); }
    const capuche = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.6, 8), lam(0x6b3fa0, 0x2a1450, { transparent: true })); capuche.position.y = 1.45; corps.add(capuche);
    const queue = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.8, 10), std(0x8ff0e0, 0x3fd0c0, 0.5, { transparent: true, opacity: 0.6 })); queue.rotation.x = Math.PI; queue.position.y = 0.2; corps.add(queue);
    const y = yeuxSimples(corps, 0.95, 0.33, 0.12, 0.9, 0xd0ff70);
    return { g, corps, queue, mats: [metal, verre, capuche.material, queue.material], ...y };
  },
  gelee() {
    const g = new THREE.Group(), corps = new THREE.Group(); g.add(corps);
    const gel = std(0xff6fae, 0xff2f7f, 0.15, { transparent: true, opacity: 0.8 });
    const bloc = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.5, 0.75, 20), gel); bloc.position.y = 0.38; corps.add(bloc);
    const haut = new THREE.Mesh(new THREE.SphereGeometry(0.38, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), gel); haut.position.y = 0.75; corps.add(haut);
    const creme = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.08, 8, 16), lam(0xffffff)); creme.rotation.x = Math.PI / 2; creme.position.y = 1.08; corps.add(creme);
    const cerise = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), std(0xd8102f, 0x400000)); cerise.position.y = 1.2; corps.add(cerise);
    const y = yeuxSimples(corps, 0.68, 0.42, 0.14, 1.2, 0xffffff);
    for (let k = -2; k <= 2; k++) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.03), MX.blanc); d.position.set(k * 0.06, 0.48, 0.47); corps.add(d); }
    return { g, corps, ...y };
  },
  herisson() {
    const g = new THREE.Group(), corps = new THREE.Group(); g.add(corps);
    const roche = std(0x2a2226, 0xff6a00, 0.12);
    const boule = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), roche); boule.position.y = 0.55; corps.add(boule);
    const piquants = new THREE.Group(); piquants.position.y = 0.55; corps.add(piquants);
    const pique = new THREE.ConeGeometry(0.07, 0.35, 5), matP = std(0xffb000, 0xff8a00, 0.9);
    for (let k = 0; k < 34; k++) {
      const v = new THREE.Vector3().randomDirection(); if (v.z > 0.35) v.z = -v.z;    // pas sur la figure
      const p = new THREE.Mesh(pique, matP); p.position.copy(v).multiplyScalar(0.5); p.quaternion.setFromUnitVectors(Y, v); piquants.add(p);
    }
    const museau = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), roche); museau.position.set(0, 0.48, 0.5); corps.add(museau);
    const y = yeuxSimples(corps, 0.66, 0.42, 0.16, 0.9, 0xffa040);
    return { g, corps, piquants, ...y };
  },
  givron() {
    const g = new THREE.Group(), corps = new THREE.Group(); g.add(corps);
    const neige = lam(0xf4f8ff, 0x203040);
    const b1 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), neige); b1.position.y = 0.5; corps.add(b1);
    const b2 = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 12), neige); b2.position.y = 1.05; corps.add(b2);
    const glace = std(0x8fdcff, 0x3fa0ff, 0.4, { flatShading: true });
    for (let k = 0; k < 7; k++) { const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.09), glace); const v = new THREE.Vector3().randomDirection(); c.position.copy(v).multiplyScalar(0.5).add(new THREE.Vector3(0, 0.5, 0)); corps.add(c); }
    const nez = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.3, 8), std(0xff8a3d, 0x401000)); nez.rotation.x = Math.PI / 2; nez.position.set(0, 1.05, 0.45); corps.add(nez);
    const echarpe = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.07, 8, 20), lam(0x6b3fa0)); echarpe.rotation.x = Math.PI / 2; echarpe.position.y = 0.82; corps.add(echarpe);
    const y = yeuxSimples(corps, 1.12, 0.32, 0.12, 0.7, 0x20202a);
    return { g, corps, ...y };
  },
  meduse() {
    const g = new THREE.Group(), corps = new THREE.Group(); g.add(corps);
    const nuage = std(0xb8a6e6, 0x5c3f99, 0.25, { transparent: true, opacity: 0.88 });
    for (const [x, y, z, s] of [[0, 0.9, 0, 0.42], [0.28, 0.82, 0.1, 0.3], [-0.28, 0.82, 0.1, 0.3], [0.15, 0.85, -0.25, 0.3], [-0.15, 0.85, -0.25, 0.3]]) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(s, 14, 10), nuage); b.position.set(x, y, z); corps.add(b);
    }
    const tentacules = new THREE.Group(); corps.add(tentacules);
    const matT = std(0xfff27a, 0xffe03f, 1.2);
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2, t = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 5), matT); t.position.set(Math.cos(a) * 0.25, 0.4, Math.sin(a) * 0.25); tentacules.add(t);
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), matT); e.position.set(Math.cos(a) * 0.25, 0.1, Math.sin(a) * 0.25); tentacules.add(e); }
    const y = yeuxSimples(corps, 0.88, 0.4, 0.15, 0.9, 0xffffff);
    return { g, corps, tentacules, ...y };
  },
};

// les ennemis de chaque monde
const ROSTER = {
  menthe: ['marcheuse', 'sauteuse'], lave: ['herisson', 'marcheuse'], volcan: ['herisson', 'sauteuse'], 'étoilée': ['follet', 'marcheuse', 'meduse'],
  givre: ['givron', 'sauteuse'], fetes: ['givron', 'marcheuse'], verdoyance: ['marcheuse', 'tireuse', 'sauteuse'], dunes: ['crabe', 'herisson'],
  corail: ['gelee', 'crabe'], marais: ['follet', 'gelee'], lagon: ['crabe', 'meduse'], ocean: ['meduse', 'crabe', 'gelee'], nuages: ['follet', 'sauteuse', 'tireuse'], hantee: ['follet', 'marcheuse'],
  pirate: ['crabe', 'tireuse'], royaume: ['tireuse', 'marcheuse'], gourmande: ['gelee', 'sauteuse'], bourg: ['tireuse', 'marcheuse'],
};
// modèles 3D (public/modeles/<nom>.glb) et leur hauteur dans le jeu
const GLB = { marcheuse: ['ombrelle', 1.3], sauteuse: ['ombrelle-sauteuse', 1.2], boss: ['boss-ombrelle', 1.4], crabe: ['crabe', 1.0], follet: ['follet', 1.4],
  gelee: ['gelee', 1.15], herisson: ['herisson', 1.1], tireuse: ['tireuse', 1.4], givron: ['givron', 1.25], meduse: ['meduse', 1.4] };
const PLANE_PAR_TYPE = { follet: 0.9, meduse: 1.3 };

export function createOmbrelles(scene, modeles = {}) {
  let liste = [], tirs = [], anneaux = [];
  const cacheGlb = {};
  // corps de l'ennemi : le modèle 3D s'il existe, sinon la forme dessinée par le code
  function construire(type) {
    const [nom, haut] = GLB[type] || [];
    if (nom && modeles[nom]) {
      cacheGlb[nom] ||= morceaux(modeles[nom], haut);
      const g = new THREE.Group(), corps = new THREE.Group(); g.add(corps);
      for (const { geo, mat } of cacheGlb[nom]) corps.add(new THREE.Mesh(geo, mat));
      return { g, corps, yeux: [], sourcils: [], pieds: [], franges: [], ombrelle: new THREE.Group(), oeilMat: new THREE.MeshBasicMaterial(), glb: true };
    }
    if (FORMES[type]) return { yeux: [], sourcils: [], pieds: [], franges: [], ombrelle: new THREE.Group(), ...FORMES[type]() };
    return fabriquer(type === 'tireuse' ? 'tireuse' : type);
  }

  // place les ennemis de la planète P
  function peupler(P) {
    vider();
    const r = rng(P.seed * 7 + 5), roster = ROSTER[P.biome] || ROSTER.menthe;
    const arenes = P.iles ? P.iles.filter(o => o.contenu && o.contenu.ennemis) : [];
    if (arenes.length && !P.boss) {                          // niveau-parcours : les ennemis gardent les arènes
      let k = 0;
      for (const ile of arenes) for (let n = 0; n < ile.contenu.ennemis; n++) {
        const a = r() * Math.PI * 2, rr = ile.rad * (0.2 + r() * 0.4), t1 = new THREE.Vector3().crossVectors(ile.d, new THREE.Vector3(1, 0, 0)).normalize(), t2 = new THREE.Vector3().crossVectors(ile.d, t1);
        ajouter(P, roster[k++ % roster.length], ile.d.clone().addScaledVector(t1, Math.cos(a) * rr / P.radius).addScaledVector(t2, Math.sin(a) * rr / P.radius).normalize(), 1, r);
      }
      return;
    }
    const loin = d => d.angleTo(Y) * P.radius > 18 && d.angleTo(P.beacon.dir) * P.radius > 13 && (!P.terre || P.terre(d));
    for (let i = 0; i < P.ombrelles; i++) {
      const tirage = () => P.dirAleatoire ? P.dirAleatoire(r) : randomDir(r);
      let dir = tirage();
      for (let k = 0; k < 400 && !loin(dir); k++) dir = tirage();
      ajouter(P, roster[i % roster.length], dir, 1, r);
    }
    if (P.boss) ajouter(P, 'boss', P.beacon.dir.clone().negate(), 3, r);     // le boss attend à l'opposé du Grand Phare
  }
  function ajouter(P, type, dir, taille, r = Math.random) {
    const boss = type === 'boss';
    const f = construire(type); scene.add(f.g);
    f.g.scale.setScalar(taille);
    const cap = projectOnPlane(randomDir(r), dir).normalize();
    const o = { ...f, type, P, dir, maison: dir.clone(), cap, but: dir.clone(), etat: 'erre', t: r() * 6, pause: 0, fin: 0, r,
      boss, taille, vie: boss ? P.bossVie : 1, vitesse: P.vitesse * (boss ? 0.8 : { sauteuse: 1.2, crabe: 0.6, follet: 0.55, gelee: 0.8, herisson: 0.7, tireuse: 0.4, givron: 0.75, meduse: 0.5 }[type] || 1),
      vue: boss ? Infinity : type === 'tireuse' ? 13 : VUE, hop: 0, vol: PLANE_PAR_TYPE[type] || 0, cycle: r() * 4,
      couleurYeux: new THREE.Color(STYLES[type] ? STYLES[type].yeux : 0xfff3c4) };
    liste.push(o);
    return o;
  }
  function vider() {
    for (const o of liste) scene.remove(o.g);
    for (const t of [...tirs, ...anneaux]) scene.remove(t.m);
    liste = []; tirs = []; anneaux = [];
  }

  const mat = new THREE.Matrix4(), x = new THREE.Vector3(), tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  const GRAV = 22;
  function placer(o, dt) {
    o.g.position.copy(o.P.surfacePoint(o.dir));
    projectOnPlane(o.cap, o.dir).normalize();
    x.crossVectors(o.dir, o.cap).normalize();
    mat.makeBasis(x, o.dir, o.cap);
    o.g.quaternion.setFromRotationMatrix(mat);
    o.t += dt;
    const vite = o.etat === 'chasse' ? 1 : 0.4, T = o.type;
    // sauts : la sauteuse bondit, la gelée rebondit sans cesse
    o.hop = T === 'sauteuse' ? Math.abs(Math.sin(o.t * (o.etat === 'chasse' ? 7 : 4))) * (o.etat === 'chasse' ? 1.1 : 0.25)
      : T === 'gelee' ? Math.abs(Math.sin(o.t * 5)) * 0.7 : 0;
    const flotte = o.vol ? Math.sin(o.t * 2.2) * 0.15 : Math.sin(o.t * 4) * 0.08;
    o.corps.position.y = (o.glb || o.vol ? 0 : PLANE) + o.vol + o.hop + flotte;
    // écrasement des gelées au sol, roulade du givron, pinces du crabe, piquants du hérisson…
    if (T === 'gelee') { const s = 1 - Math.max(0, 0.15 - o.hop) * 1.6; o.corps.scale.set(2 - s, s, 2 - s); }
    if (T === 'givron') { o.roule = (o.roule || 0) + dt * o.vitesse * (o.etat === 'chasse' ? 3 : 1); o.corps.rotation.x = o.roule; o.corps.scale.setScalar(o.grossit || 1); }
    if (T === 'crabe' && o.pinces) o.pinces.forEach((p, i) => { p.rotation.z = Math.sin(o.t * (o.charge > 0 ? 18 : 4) + i) * 0.4; });
    if (T === 'herisson' && o.piquants) { const s = o.piquant ? 1 : 0.35; o.piquants.scale.lerp(tmp2.set(s, s, s), 1 - Math.exp(-10 * dt)); if (o.roulade) o.piquants.rotation.y += dt * 12; }
    if (T === 'meduse' && o.tentacules) o.tentacules.rotation.y += dt * 0.8;
    if (T === 'follet') {
      const a = o.intouchable ? 0.22 : 1;
      o.g.traverse(m => { if (m.material) { m.material.transparent = true; if (m.material.userData.op0 === undefined) m.material.userData.op0 = m.material.opacity; m.material.opacity = m.material.userData.op0 * a; } });
      if (o.queue) o.queue.rotation.z = Math.sin(o.t * 3) * 0.3;
    }
    o.pieds.forEach((p, i) => { p.position.z = 0.12 + Math.sin(o.t * 12 + i * Math.PI) * 0.06 * vite; });
    const fache = o.etat === 'chasse' ? 0.45 : 0.05;
    o.sourcils.forEach(s => { s.m.rotation.z = -s.sx * fache; });
    o.ombrelle.rotation.x = 0.12 + vite * 0.25;
    o.ombrelle.rotation.y += dt * (1 + vite * 3);
    o.franges.forEach((f, i) => { f.position.y = 0.12 + Math.sin(o.t * 9 + i) * 0.04; });
  }

  // avance sur la sphère dans la direction du cap (le feu-follet et la méduse passent au-dessus de tout)
  const ecart = new THREE.Vector3();
  function avancer(o, vitesse, dt) {
    const avant = o.dir.clone();
    o.dir.addScaledVector(o.cap, vitesse * dt / o.P.radius).normalize();
    if (o.P.terre && !o.P.terre(o.dir) && o.type !== 'follet' && o.type !== 'meduse') { o.dir.copy(avant); o.cap.negate(); return true; }   // bord de l'île : demi-tour
    if (o.type === 'follet' || o.type === 'meduse') return false;
    const R = o.P.radius, moi = 0.45 * o.taille * (o.grossit || 1);
    let cogne = false;
    const bloque = (dir, rayon) => {
      ecart.copy(o.dir).sub(dir); projectOnPlane(ecart, dir);
      const d = ecart.length() * R, min = rayon + moi;
      if (d < min && d > 1e-5) { o.dir.addScaledVector(ecart.normalize(), (min - d) / R).normalize(); cogne = true; }
    };
    for (const s of o.P.solides || []) if (s.bas < 1 && s.haut > 0.5) bloque(s.dir, s.radius);
    for (const s of o.P.obstacles) bloque(s.dir, s.radius);
    return cogne;
  }

  // ---------- attaques à distance : boules d'ombre (tireuse), anneaux électriques (méduse) ----------
  const bouleGeo = new THREE.SphereGeometry(0.28, 12, 10), bouleMat = new THREE.MeshStandardMaterial({ color: 0x3b1f5c, emissive: 0x8a4fff, emissiveIntensity: 1.2 });
  const anneauGeo = new THREE.TorusGeometry(1, 0.06, 6, 48), anneauMat = new THREE.MeshBasicMaterial({ color: 0xfff27a, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  function tirer(o, cible) {
    // tir en cloche : vitesse calculée pour retomber sur la cible en 1,1 s
    const depart = o.g.position.clone().addScaledVector(o.dir, 1.4 * o.taille), duree = 1.1;
    const g0 = depart.clone().sub(o.P.center).normalize().multiplyScalar(-GRAV);
    const v = cible.clone().sub(depart).sub(g0.clone().multiplyScalar(0.5 * duree * duree)).divideScalar(duree);
    const m = new THREE.Mesh(bouleGeo, bouleMat); m.position.copy(depart); scene.add(m);
    tirs.push({ m, v, t: 0, P: o.P });
  }
  function lancerOnde(o) {
    const m = new THREE.Mesh(anneauGeo, anneauMat.clone()); scene.add(m);
    anneaux.push({ m, t: 0, dir: o.dir.clone(), P: o.P });
  }
  const ennemiFictif = { boss: false };
  function updateAttaques(dt, joueur, evts) {
    for (let i = tirs.length - 1; i >= 0; i--) {
      const b = tirs[i]; b.t += dt;
      const haut = b.m.position.clone().sub(b.P.center).normalize();
      b.v.addScaledVector(haut, -GRAV * dt); b.m.position.addScaledVector(b.v, dt);
      const sol = b.P.surface(haut), d = b.m.position.distanceTo(b.P.center);
      const surFanal = joueur.actif && b.m.position.distanceTo(joueur.pos.clone().addScaledVector(joueur.up, 0.7)) < 0.9;
      if (surFanal || d <= sol + 0.1 || b.t > 4) {
        evts.push({ type: 'eclat_ombre', pos: b.m.position.clone() });
        if (surFanal || (joueur.actif && b.m.position.distanceTo(joueur.pos) < 1.6)) evts.push({ type: 'touche', o: ennemiFictif, pos: b.m.position.clone() });
        scene.remove(b.m); tirs.splice(i, 1);
      }
    }
    for (let i = anneaux.length - 1; i >= 0; i--) {
      const a = anneaux[i]; a.t += dt;
      const r = 0.6 + a.t * 6.5;                                   // l'anneau s'élargit sur le sol
      a.m.position.copy(a.P.surfacePoint(a.dir)).addScaledVector(a.dir, 0.25);
      a.m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), a.dir); a.m.scale.setScalar(r);
      a.m.material.opacity = Math.max(0, 0.9 - a.t * 0.8);
      if (joueur.actif && !a.touche) {
        const rel = joueur.pos.clone().sub(a.m.position), h = rel.dot(a.dir), dist = projectOnPlane(rel, a.dir).length();
        if (h < 0.6 && Math.abs(dist - r) < 0.45) { a.touche = true; evts.push({ type: 'touche', o: ennemiFictif, pos: joueur.pos.clone(), elec: true }); }
      }
      if (a.t > 1.1) { scene.remove(a.m); a.m.material.dispose(); anneaux.splice(i, 1); }
    }
  }

  function erre(o, dt) {
    if (o.dir.angleTo(o.but) * o.P.radius < 2.7 || o.r() < dt * 0.25) o.but.copy(o.maison).addScaledVector(randomDir(o.r), 6 / o.P.radius).normalize();
    const voulu = projectOnPlane(o.but.clone().sub(o.dir), o.dir);
    if (voulu.lengthSq() > 1e-6) o.cap.lerp(voulu.normalize(), 1 - Math.exp(-2 * dt)).normalize();
    if (o.pause <= 0) avancer(o, o.type === 'tireuse' ? 0.6 : VITESSE_ERRE, dt);
  }

  // joueur : { pos, up, vel, actif } — renvoie la liste des évènements de l'image
  function update(dt, joueur) {
    const evts = [];
    for (const o of [...liste]) {
      if (o.etat === 'fini') continue;
      if (o.etat === 'disparait') {
        o.fin += dt * (o.boss ? 0.8 : 2.2);
        const s = Math.max(0.001, 1 - o.fin) * o.taille;
        o.g.scale.set(s * (1 + o.fin), s, s * (1 + o.fin)); o.g.rotateY(dt * 12);
        if (o.fin >= 1) { o.etat = 'fini'; o.g.visible = false; }
        continue;
      }
      // la vague de couleur du phare rallumé les balaie
      if (o.P.lit && o.dir.angleTo(o.P.beacon.dir) < o.P.U.uWave.value) {
        o.etat = 'disparait'; evts.push({ type: 'balaye', o, pos: o.g.position.clone() }); continue;
      }

      const ici = joueur.actif;
      const vers = ici ? tmp.copy(joueur.pos).sub(o.g.position).clone() : null;
      const loin = ici ? vers.length() : Infinity;
      if (o.pause > 0) o.pause -= dt;
      o.cycle += dt;
      const versFanal = () => { const v = projectOnPlane(vers.clone(), o.dir); if (v.lengthSq() > 1e-6) o.cap.lerp(v.normalize(), 1 - Math.exp(-6 * dt)).normalize(); };
      const voit = ici && loin < o.vue && o.pause <= 0;
      if (voit && o.etat !== 'chasse') { o.etat = 'chasse'; evts.push({ type: 'repere', o }); }
      if (!voit && o.etat === 'chasse' && loin > o.vue * 1.4) o.etat = 'erre';

      // ---- le cerveau de chaque espèce ----
      switch (o.type) {
        case 'crabe':                         // repère Fanal, charge et pince ; vulnérable pendant sa pause
          if (o.charge > 0) { o.charge -= dt; avancer(o, 6.5, dt); if (o.charge <= 0) o.pause = 1.3; }
          else if (voit) { versFanal(); o.charge = 0.9; }
          else erre(o, dt);
          break;
        case 'follet':                        // flotte vers Fanal à travers tout ; intouchable une partie du temps
          o.intouchable = (o.cycle % 4) > 2.6;
          if (voit) { versFanal(); avancer(o, o.vitesse, dt); } else erre(o, dt);
          break;
        case 'herisson':                      // piquants dehors 2 s, dedans 1,6 s ; roule vers Fanal piquants dehors
          o.piquant = (o.cycle % 3.6) < 2;
          o.roulade = o.piquant && voit;
          if (o.roulade) { versFanal(); avancer(o, o.vitesse * 1.6, dt); } else if (!voit) erre(o, dt);
          break;
        case 'tireuse':                       // reste près de chez elle, se tourne vers Fanal et tire en cloche
          if (voit) { versFanal(); o.tir = (o.tir ?? 1) - dt; if (o.tir <= 0) { o.tir = 2.4; tirer(o, joueur.pos.clone()); evts.push({ type: 'tir', pos: o.g.position.clone() }); } }
          else erre(o, dt);
          break;
        case 'givron':                        // roule vers Fanal en grossissant ; éclate s'il percute un obstacle
          if (voit) {
            versFanal(); o.grossit = Math.min(1.9, (o.grossit || 1) + dt * 0.18);
            if (avancer(o, o.vitesse * o.grossit, dt) && o.grossit > 1.4) { o.etat = 'disparait'; evts.push({ type: 'eclat_neige', pos: o.g.position.clone() }); continue; }
          } else { o.grossit = Math.max(1, (o.grossit || 1) - dt * 0.3); erre(o, dt); }
          break;
        case 'meduse':                        // flotte, et toutes les 3 s une onde électrique part sur le sol
          if (voit) { versFanal(); avancer(o, o.vitesse, dt); o.onde = (o.onde ?? 1.5) - dt; if (o.onde <= 0) { o.onde = 3; lancerOnde(o); evts.push({ type: 'onde', pos: o.g.position.clone() }); } }
          else erre(o, dt);
          break;
        default:                              // les Ombrelles (marcheuse, sauteuse, boss)
          if (voit) { versFanal(); avancer(o, o.vitesse, dt); } else erre(o, dt);
      }
      const sonne = o.boss && o.pause > 0;
      if (o.oeilMat) o.oeilMat.color.copy(sonne ? OEIL_SONNE : o.etat === 'chasse' && STYLES[o.type] ? OEIL_CHASSE : o.couleurYeux);
      placer(o, dt);
      if (sonne) o.ombrelle.rotation.y += dt * 14;

      // ---- contacts avec Fanal ----
      if (!ici || o.intouchable) continue;
      const T = o.taille * (o.grossit || 1);
      const vu = o.g.worldToLocal(tmp.copy(joueur.pos)).normalize();
      o.yeux.forEach(p => { if (p.userData.x0 === undefined) p.userData.x0 = p.position.x; p.position.x = p.userData.x0 + vu.x * 0.035; });   // les pupilles suivent Fanal
      const h = tmp.copy(joueur.pos).sub(o.g.position).dot(joueur.up) - (o.vol + o.hop) * o.taille;
      const cote = projectOnPlane(tmp.copy(joueur.pos).sub(o.g.position), joueur.up).length();
      if (joueur.vel.dot(joueur.up) < 0 && h > 0.45 * T && h < 1.6 * T && cote < 0.95 * T) {
        if (o.boss && o.pause > 0) { evts.push({ type: 'rebond', o }); continue; }
        if (o.piquant) { evts.push({ type: 'rebond', o }, { type: 'touche', o, pos: o.g.position.clone(), pique: true }); continue; }   // aïe, les piquants !
        toucherEnnemi(o, evts, false);
      } else if (h <= 0.45 * T && cote < 0.85 * T && o.pause <= 0) {
        o.pause = o.type === 'crabe' ? 0.8 : 1.2; o.charge = 0;
        evts.push({ type: 'touche', o, pos: o.g.position.clone() });
      }
    }
    updateAttaques(dt, joueur, evts);
    return evts;
  }

  // un ennemi est touché (sauté dessus ou coup de flamme)
  function toucherEnnemi(o, evts, coup) {
    const p = o.g.position.clone().addScaledVector(o.dir, 0.6 * o.taille);
    if (--o.vie <= 0) {
      o.etat = 'disparait';
      evts.push({ type: o.boss ? 'boss_vaincu' : 'ecrase', o, pos: p, coup });
      // la grosse gelée se divise en deux petites
      if (o.type === 'gelee' && o.taille >= 1) for (const s of [-1, 1]) {
        const d = o.dir.clone().addScaledVector(x.crossVectors(o.dir, o.cap).normalize(), s * 1.4 / o.P.radius).normalize();
        const n = ajouter(o.P, 'gelee', d, 0.6); n.pause = 0.7; n.etat = 'chasse';
      }
    } else {
      o.pause = 1.6; o.vitesse *= 1.12;
      evts.push({ type: 'boss_touche', o, pos: p, coup });
    }
  }

  // coup de flamme de Fanal : les ennemis dans le rayon sont touchés
  // opts.electrique : la décharge traverse les piquants du hérisson
  function frapper(pos, rayon, opts = {}) {
    const evts = [];
    for (const o of [...liste]) {
      if (o.etat === 'fini' || o.etat === 'disparait' || o.intouchable) continue;
      const centre = tmp.copy(o.g.position).addScaledVector(o.dir, (0.5 + o.vol + o.hop) * o.taille);
      if (centre.distanceTo(pos) > rayon + 0.45 * o.taille) continue;
      if (o.boss && o.pause > 0) continue;
      if (o.piquant && !opts.electrique) { evts.push({ type: 'pique', pos: centre.clone() }); continue; }      // le coup rebondit sur les piquants
      toucherEnnemi(o, evts, true);
    }
    // le coup détruit aussi les boules d'ombre proches
    for (let i = tirs.length - 1; i >= 0; i--) if (tirs[i].m.position.distanceTo(pos) < rayon + 0.4) { evts.push({ type: 'eclat_ombre', pos: tirs[i].m.position.clone() }); scene.remove(tirs[i].m); tirs.splice(i, 1); }
    return evts;
  }

  return { get liste() { return liste; }, peupler, vider, update, frapper, boss: () => liste.find(o => o.boss && o.etat !== 'fini') };
}

