// Les Ombrelles : petites ombres coiffées d'une ombrelle violette, qui aiment le noir.
// Elles errent sur les planètes éteintes et poursuivent Fanal pour lui voler une braise.
// On les chasse en leur sautant dessus ; la vague de couleur du phare rallumé les dissout.
import * as THREE from 'three';

const VUE = 7, VITESSE_ERRE = 1.4, VITESSE_CHASSE = 3.8, PLANE = 0.28;
const Y = new THREE.Vector3(0, 1, 0);

function rng(seed) { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); }
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
};
const M = {
  corps: new THREE.MeshLambertMaterial({ color: 0x2a1846, emissive: 0x160828 }),
  dome: new THREE.MeshLambertMaterial({ color: 0x5b2d8f, emissive: 0x1d0b33, side: THREE.DoubleSide }),
  pointe: new THREE.MeshLambertMaterial({ color: 0x8a5cd6 }),
  bord: new THREE.MeshLambertMaterial({ color: 0xb48cff, emissive: 0x5b2d8f }),
  flaque: new THREE.MeshBasicMaterial({ color: 0x14081f, transparent: true, opacity: 0.35, depthWrite: false }),
};
const OEIL_CALME = new THREE.Color(0xd9ccff), OEIL_CHASSE = new THREE.Color(0xff5fa2);

function fabriquer() {
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
  const dome = new THREE.Mesh(G.dome, M.dome); dome.scale.y = 0.6; ombrelle.add(dome);
  const pointe = new THREE.Mesh(G.pointe, M.pointe); pointe.position.y = 0.38; ombrelle.add(pointe);
  const bord = new THREE.Mesh(G.bord, M.bord); bord.position.y = 0.02; ombrelle.add(bord);
  const oeilMat = new THREE.MeshBasicMaterial({ color: OEIL_CALME.clone() });
  for (const x of [-0.14, 0.14]) { const o = new THREE.Mesh(G.oeil, oeilMat); o.position.set(x, 0.5, 0.36); o.scale.y = 1.4; corps.add(o); }
  return { g, corps, ombrelle, franges, oeilMat };
}

export function createOmbrelles(scene, planets) {
  const liste = [];
  for (const P of planets) {
    const r = rng(P.seed * 7 + 5);
    for (let i = 0; i < (P.ombrelles || 0); i++) {
      // loin du point d'arrivée de Fanal et du phare
      let dir = randomDir(r);
      for (let k = 0; k < 200 && (dir.angleTo(Y) < 1.0 || dir.angleTo(P.beacon.dir) < 0.6); k++) dir = randomDir(r);
      const f = fabriquer(); scene.add(f.g);
      const cap = projectOnPlane(randomDir(r), dir).normalize();
      liste.push({ ...f, P, dir, maison: dir.clone(), cap, but: dir.clone(), etat: 'erre', t: r() * 6, pause: 0, fin: 0, r });
    }
  }

  const mat = new THREE.Matrix4(), x = new THREE.Vector3(), tmp = new THREE.Vector3();
  function placer(o, dt) {
    const pos = o.P.surfacePoint(o.dir);
    o.g.position.copy(pos);
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
  function avancer(o, vitesse, dt) {
    o.dir.addScaledVector(o.cap, vitesse * dt / o.P.radius).normalize();
    const b = o.P.beacon.dir;                            // le phare : on le contourne
    if (o.dir.angleTo(b) < 0.25) o.dir.addScaledVector(projectOnPlane(o.dir.clone().sub(b), o.dir).normalize(), 0.02).normalize();
  }

  // joueur : { pos, up, vel, current, actif } — renvoie la liste des évènements de l'image
  function update(dt, joueur) {
    const evts = [];
    for (const o of liste) {
      if (o.etat === 'fini') continue;
      if (o.etat === 'disparait') {
        o.fin += dt * 2.2;
        const s = Math.max(0.001, 1 - o.fin);
        o.g.scale.set(s * (1 + o.fin), s, s * (1 + o.fin)); o.g.rotateY(dt * 12);
        if (o.fin >= 1) { o.etat = 'fini'; o.g.visible = false; }
        continue;
      }
      // la vague de couleur du phare rallumé les balaie
      if (o.P.lit && o.dir.angleTo(o.P.beacon.dir) < o.P.U.uWave.value) {
        o.etat = 'disparait'; evts.push({ type: 'balaye', o, pos: o.g.position.clone() }); continue;
      }

      const ici = joueur.actif && joueur.current === o.P.index;
      const vers = ici ? tmp.copy(joueur.pos).sub(o.g.position) : null;
      const loin = ici ? vers.length() : Infinity;
      if (o.pause > 0) o.pause -= dt;

      if (ici && loin < VUE && o.pause <= 0) {
        if (o.etat !== 'chasse') { o.etat = 'chasse'; evts.push({ type: 'repere', o }); }
        const voulu = projectOnPlane(vers.clone(), o.dir).normalize();
        o.cap.lerp(voulu, 1 - Math.exp(-6 * dt)).normalize();
        avancer(o, VITESSE_CHASSE, dt);
      } else {
        if (o.etat === 'chasse' && loin > VUE * 1.4) o.etat = 'erre';
        if (o.etat !== 'chasse') {
          if (o.dir.angleTo(o.but) < 0.08 || o.r() < dt * 0.25) {
            o.but.copy(o.maison).addScaledVector(randomDir(o.r), 0.7).normalize();
          }
          const voulu = projectOnPlane(o.but.clone().sub(o.dir), o.dir);
          if (voulu.lengthSq() > 1e-6) o.cap.lerp(voulu.normalize(), 1 - Math.exp(-2 * dt)).normalize();
          if (o.pause <= 0) avancer(o, VITESSE_ERRE, dt);
        }
      }
      o.oeilMat.color.copy(o.etat === 'chasse' ? OEIL_CHASSE : OEIL_CALME);
      placer(o, dt);

      // contact avec Fanal
      if (!ici) continue;
      const h = tmp.copy(joueur.pos).sub(o.g.position).dot(joueur.up);
      const cote = projectOnPlane(tmp.copy(joueur.pos).sub(o.g.position), joueur.up).length();
      if (joueur.vel.dot(joueur.up) < 0 && h > 0.45 && h < 1.6 && cote < 0.95) {
        o.etat = 'disparait'; evts.push({ type: 'ecrase', o, pos: o.g.position.clone().addScaledVector(o.dir, 0.6) });
      } else if (h <= 0.45 && cote < 0.85 && o.pause <= 0) {
        o.pause = 1.2;
        evts.push({ type: 'touche', o, pos: o.g.position.clone() });
      }
    }
    return evts;
  }

  return { liste, update };
}
