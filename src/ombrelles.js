// Les Ombrelles : petites ombres coiffées d'une ombrelle violette, qui aiment le noir.
// Elles errent sur les planètes éteintes et poursuivent Fanal pour lui voler une braise.
// On les chasse en leur sautant dessus ; la vague de couleur du phare rallumé les dissout.
// Sur le Grand Phare de chaque galaxie : la Grande Ombrelle, le boss, qu'il faut écraser plusieurs fois.
import * as THREE from 'three';
import { rng } from './univers.js';

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
  const crochet = new THREE.Mesh(GX.crochet, matBord); crochet.position.set(0.1, 0.65, 0); ombrelle.add(crochet);
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

export function createOmbrelles(scene) {
  let liste = [];

  // place les Ombrelles de la planète P (description venant de univers.js)
  function peupler(P) {
    vider();
    const r = rng(P.seed * 7 + 5);
    const loin = d => d.angleTo(Y) > 0.3 + 8 / P.radius && d.angleTo(P.beacon.dir) > 0.4;
    const ajoute = (boss, dir) => {
      const type = boss ? 'boss' : r() < 0.35 ? 'sauteuse' : 'marcheuse';
      const f = fabriquer(type); scene.add(f.g);
      const taille = boss ? 3 : 1;
      f.g.scale.setScalar(taille);
      const cap = projectOnPlane(randomDir(r), dir).normalize();
      liste.push({ ...f, P, dir, maison: dir.clone(), cap, but: dir.clone(), etat: 'erre', t: r() * 6, pause: 0, fin: 0, r,
        boss, taille, vie: boss ? P.bossVie : 1, vitesse: P.vitesse * (boss ? 0.8 : type === 'sauteuse' ? 1.2 : 1), vue: boss ? Infinity : VUE, hop: 0,
        couleurYeux: new THREE.Color(STYLES[type].yeux) });
    };
    for (let i = 0; i < P.ombrelles; i++) {
      let dir = randomDir(r);
      for (let k = 0; k < 200 && !loin(dir); k++) dir = randomDir(r);
      ajoute(false, dir);
    }
    if (P.boss) ajoute(true, P.beacon.dir.clone().negate());     // le boss attend à l'opposé du Grand Phare
  }
  function vider() { for (const o of liste) scene.remove(o.g); liste = []; }

  const mat = new THREE.Matrix4(), x = new THREE.Vector3(), tmp = new THREE.Vector3();
  function placer(o, dt) {
    o.g.position.copy(o.P.surfacePoint(o.dir));
    projectOnPlane(o.cap, o.dir).normalize();
    x.crossVectors(o.dir, o.cap).normalize();
    mat.makeBasis(x, o.dir, o.cap);
    o.g.quaternion.setFromRotationMatrix(mat);
    o.t += dt;
    const vite = o.etat === 'chasse' ? 1 : 0.4;
    // la sauteuse bondit (haut quand elle chasse), les autres se dandinent
    o.hop = o.type === 'sauteuse' ? Math.abs(Math.sin(o.t * (o.etat === 'chasse' ? 7 : 4))) * (o.etat === 'chasse' ? 1.1 : 0.25) : 0;
    o.corps.position.y = PLANE + o.hop + Math.sin(o.t * 4) * 0.08;
    o.pieds.forEach((p, i) => { p.position.z = 0.12 + Math.sin(o.t * 12 + i * Math.PI) * 0.06 * vite; });
    const fache = o.etat === 'chasse' ? 0.45 : 0.05;     // sourcils froncés quand elle chasse
    o.sourcils.forEach(s => { s.m.rotation.z = -s.sx * fache; });
    o.ombrelle.rotation.x = 0.12 + vite * 0.25;          // l'ombrelle penche quand elle fonce
    o.ombrelle.rotation.y += dt * (1 + vite * 3);
    o.franges.forEach((f, i) => { f.position.y = 0.12 + Math.sin(o.t * 9 + i) * 0.04; });
  }

  // avance sur la sphère dans la direction du cap
  const ecart = new THREE.Vector3();
  function avancer(o, vitesse, dt) {
    o.dir.addScaledVector(o.cap, vitesse * dt / o.P.radius).normalize();
    // rochers, troncs, blocs, cage, Luciole : l'Ombrelle glisse le long au lieu de les traverser
    const R = o.P.radius, moi = 0.45 * o.taille;
    const bloque = (dir, rayon) => {
      ecart.copy(o.dir).sub(dir); projectOnPlane(ecart, dir);
      const d = ecart.length() * R, min = rayon + moi;
      if (d < min && d > 1e-5) o.dir.addScaledVector(ecart.normalize(), (min - d) / R).normalize();
    };
    for (const s of o.P.solides || []) if (s.bas < 1 && s.haut > 0.5) bloque(s.dir, s.radius);
    for (const s of o.P.obstacles) bloque(s.dir, s.radius);
  }

  // joueur : { pos, up, vel, actif } — renvoie la liste des évènements de l'image
  function update(dt, joueur) {
    const evts = [];
    for (const o of liste) {
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
      const vers = ici ? tmp.copy(joueur.pos).sub(o.g.position) : null;
      const loin = ici ? vers.length() : Infinity;
      if (o.pause > 0) o.pause -= dt;

      if (ici && loin < o.vue && o.pause <= 0) {
        if (o.etat !== 'chasse') { o.etat = 'chasse'; evts.push({ type: 'repere', o }); }
        const voulu = projectOnPlane(vers.clone(), o.dir).normalize();
        o.cap.lerp(voulu, 1 - Math.exp(-6 * dt)).normalize();
        avancer(o, o.vitesse, dt);
      } else {
        if (o.etat === 'chasse' && loin > o.vue * 1.4) o.etat = 'erre';
        if (o.etat !== 'chasse') {
          if (o.dir.angleTo(o.but) < 0.08 || o.r() < dt * 0.25) {
            o.but.copy(o.maison).addScaledVector(randomDir(o.r), 6 / o.P.radius).normalize();
          }
          const voulu = projectOnPlane(o.but.clone().sub(o.dir), o.dir);
          if (voulu.lengthSq() > 1e-6) o.cap.lerp(voulu.normalize(), 1 - Math.exp(-2 * dt)).normalize();
          if (o.pause <= 0) avancer(o, VITESSE_ERRE, dt);
        }
      }
      const sonne = o.boss && o.pause > 0;
      o.oeilMat.color.copy(sonne ? OEIL_SONNE : o.etat === 'chasse' ? OEIL_CHASSE : o.couleurYeux);
      placer(o, dt);
      if (sonne) o.ombrelle.rotation.y += dt * 14;        // le boss tourne sur lui-même, sonné

      // contact avec Fanal (les seuils grandissent avec la taille de l'Ombrelle)
      if (!ici) continue;
      const T = o.taille;
      // les pupilles suivent Fanal
      const vu = o.g.worldToLocal(tmp.copy(joueur.pos)).normalize();
      o.yeux.forEach(p => p.position.set(vu.x * 0.035, Math.max(-0.03, Math.min(0.03, vu.y * 0.03)), 0.07));
      const h = tmp.copy(joueur.pos).sub(o.g.position).dot(joueur.up) - o.hop * T;
      const cote = projectOnPlane(tmp.copy(joueur.pos).sub(o.g.position), joueur.up).length();
      if (joueur.vel.dot(joueur.up) < 0 && h > 0.45 * T && h < 1.6 * T && cote < 0.95 * T) {
        if (o.boss && o.pause > 0) { evts.push({ type: 'rebond', o }); continue; }   // sonné : il sert de trampoline
        if (--o.vie <= 0) {
          o.etat = 'disparait'; evts.push({ type: o.boss ? 'boss_vaincu' : 'ecrase', o, pos: o.g.position.clone().addScaledVector(o.dir, 0.6 * T) });
        } else {
          o.pause = 1.6; o.vitesse *= 1.12;                 // sonné, puis plus rapide
          evts.push({ type: 'boss_touche', o, pos: o.g.position.clone().addScaledVector(o.dir, 0.6 * T) });
        }
      } else if (h <= 0.45 * T && cote < 0.85 * T && o.pause <= 0) {
        o.pause = 1.2;
        evts.push({ type: 'touche', o, pos: o.g.position.clone() });
      }
    }
    return evts;
  }

  // coup de flamme de Fanal : les Ombrelles dans le rayon sont chassées (le boss perd une vie)
  function frapper(pos, rayon) {
    const evts = [];
    for (const o of liste) {
      if (o.etat === 'fini' || o.etat === 'disparait') continue;
      const centre = tmp.copy(o.g.position).addScaledVector(o.dir, (0.5 + o.hop) * o.taille);
      if (centre.distanceTo(pos) > rayon + 0.45 * o.taille) continue;
      const p = centre.clone();
      if (o.boss) {
        if (o.pause > 0) continue;
        if (--o.vie <= 0) { o.etat = 'disparait'; evts.push({ type: 'boss_vaincu', o, pos: p, coup: true }); }
        else { o.pause = 1.6; o.vitesse *= 1.12; evts.push({ type: 'boss_touche', o, pos: p, coup: true }); }
      } else { o.etat = 'disparait'; evts.push({ type: 'ecrase', o, pos: p, coup: true }); }
    }
    return evts;
  }

  return { get liste() { return liste; }, peupler, vider, update, frapper, boss: () => liste.find(o => o.boss && o.etat !== 'fini') };
}
