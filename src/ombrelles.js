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

function fabriquer(boss) {
  const g = new THREE.Group();
  const flaque = new THREE.Mesh(G.flaque, M.flaque); flaque.position.y = 0.04; g.add(flaque);
  const corps = new THREE.Group(); g.add(corps);
  const ventre = new THREE.Mesh(G.corps, M.corps); ventre.position.y = 0.42; ventre.scale.set(1, 0.85, 1); corps.add(ventre);
  const franges = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2, f = new THREE.Mesh(G.frange, M.corps);
    f.position.set(Math.sin(a) * 0.3, 0.12, Math.cos(a) * 0.3); corps.add(f); franges.push(f);
  }
  const ombrelle = new THREE.Group(); ombrelle.position.y = 0.72; corps.add(ombrelle);
  const dome = new THREE.Mesh(G.dome, boss ? M.domeBoss : M.dome); dome.scale.y = 0.6; ombrelle.add(dome);
  const pointe = new THREE.Mesh(G.pointe, M.pointe); pointe.position.y = 0.38; ombrelle.add(pointe);
  const bord = new THREE.Mesh(G.bord, boss ? M.bordBoss : M.bord); bord.position.y = 0.02; ombrelle.add(bord);
  if (boss) for (let i = 0; i < 6; i++) {                 // couronne de piquants dorés
    const a = (i / 6) * Math.PI * 2, p = new THREE.Mesh(G.piquant, M.bordBoss);
    p.position.set(Math.sin(a) * 0.3, 0.3, Math.cos(a) * 0.3); p.rotation.set(Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5); ombrelle.add(p);
  }
  const oeilMat = new THREE.MeshBasicMaterial({ color: OEIL_CALME.clone() });
  for (const x of [-0.14, 0.14]) { const o = new THREE.Mesh(G.oeil, oeilMat); o.position.set(x, 0.5, 0.36); o.scale.y = boss ? 1 : 1.4; corps.add(o); }
  return { g, corps, ombrelle, franges, oeilMat };
}

export function createOmbrelles(scene) {
  let liste = [];

  // place les Ombrelles de la planète P (description venant de univers.js)
  function peupler(P) {
    vider();
    const r = rng(P.seed * 7 + 5);
    const loin = d => d.angleTo(Y) > 0.3 + 8 / P.radius && d.angleTo(P.beacon.dir) > 0.4;
    const ajoute = (boss, dir) => {
      const f = fabriquer(boss); scene.add(f.g);
      const taille = boss ? 3 : 1;
      f.g.scale.setScalar(taille);
      const cap = projectOnPlane(randomDir(r), dir).normalize();
      liste.push({ ...f, P, dir, maison: dir.clone(), cap, but: dir.clone(), etat: 'erre', t: r() * 6, pause: 0, fin: 0, r,
        boss, taille, vie: boss ? P.bossVie : 1, vitesse: P.vitesse * (boss ? 0.8 : 1), vue: boss ? Infinity : VUE });
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
    o.corps.position.y = PLANE + Math.sin(o.t * 4) * 0.08;
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
      o.oeilMat.color.copy(sonne ? OEIL_SONNE : o.etat === 'chasse' ? OEIL_CHASSE : OEIL_CALME);
      placer(o, dt);
      if (sonne) o.ombrelle.rotation.y += dt * 14;        // le boss tourne sur lui-même, sonné

      // contact avec Fanal (les seuils grandissent avec la taille de l'Ombrelle)
      if (!ici) continue;
      const T = o.taille;
      const h = tmp.copy(joueur.pos).sub(o.g.position).dot(joueur.up);
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

  return { get liste() { return liste; }, peupler, vider, update, boss: () => liste.find(o => o.boss && o.etat !== 'fini') };
}
