// Le trajet en vaisseau entre deux planètes : la Luciole file vers sa destination,
// on esquive les astéroïdes et on ramasse les éclats d'étoile. En fin de galaxie : saut hyperespace.
import * as THREE from 'three';
import { rng } from './univers.js';

const LARGEUR = 8, HAUTEUR = 5, VITESSE = 45;

export function createTrajet(scene, glow, vaisseau) {
  const espace = new THREE.Group(); espace.visible = false; scene.add(espace);


  // astéroïdes « pâte à modeler » violets
  const roche = new THREE.MeshLambertMaterial({ color: 0x7a6a9a, flatShading: true });
  const rocheGeo = new THREE.IcosahedronGeometry(1, 0);
  const asteroides = [];
  for (let i = 0; i < 40; i++) {
    const m = new THREE.Mesh(rocheGeo, roche); espace.add(m);
    asteroides.push({ m, taille: 1, rot: new THREE.Vector3(), actif: false });
  }
  // éclats d'étoile à ramasser
  const eclatGeo = new THREE.OctahedronGeometry(0.4);
  const eclatMat = new THREE.MeshBasicMaterial({ color: 0x9ff6ff });
  const eclats = [];
  for (let i = 0; i < 14; i++) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(eclatGeo, eclatMat));
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0x7cf0ff, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
    s.scale.setScalar(2); g.add(s);
    espace.add(g); eclats.push({ g, actif: false });
  }
  // traînées d'étoiles qui défilent (sensation de vitesse)
  const NT = 300, tPos = new Float32Array(NT * 6);
  const traineesGeo = new THREE.BufferGeometry(); traineesGeo.setAttribute('position', new THREE.BufferAttribute(tPos, 3));
  const traineesMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
  const trainees = new THREE.LineSegments(traineesGeo, traineesMat); trainees.frustumCulled = false; espace.add(trainees);
  const tz = new Float32Array(NT), txy = new Float32Array(NT * 2);
  // planète d'arrivée
  const dest = new THREE.Mesh(new THREE.SphereGeometry(30, 32, 20), new THREE.MeshLambertMaterial({ color: 0xffffff }));
  const destHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }));
  destHalo.scale.setScalar(110); dest.add(destHalo);
  espace.add(dest);

  const T = { actif: false, z: 0, x: 0, y: 0, vx: 0, vy: 0, v: VITESSE, long: 800, invuln: 0, eclats: 0, coups: 0, hyper: false, r: Math.random, prochain: 0, prochainEclat: 0 };

  function poser(a, z) {
    a.actif = true; a.taille = 0.8 + T.r() * 1.6;
    a.m.position.set((T.r() * 2 - 1) * (LARGEUR + 2), (T.r() * 2 - 1) * (HAUTEUR + 1.5), z);
    a.m.scale.set(a.taille * (0.8 + T.r() * 0.4), a.taille * (0.7 + T.r() * 0.4), a.taille);
    a.rot.set(T.r() - 0.5, T.r() - 0.5, T.r() - 0.5).multiplyScalar(2);
    a.m.visible = true;
  }

  // dest : description de la planète d'arrivée (univers.js) ; hyper : saut vers une autre galaxie
  function demarrer(destination, { hyper = false, densite = 0.5 } = {}) {
    T.actif = true; T.hyper = hyper; T.z = 0; T.x = 0; T.y = 0; T.vx = T.vy = 0; T.v = hyper ? VITESSE * 3 : VITESSE;
    T.long = hyper ? 700 : 800; T.invuln = 0; T.eclats = 0; T.coups = 0; T.densite = hyper ? 0 : densite;
    T.r = rng(destination.seed + 17); T.prochain = -60; T.prochainEclat = -40;
    espace.visible = true;
    asteroides.forEach(a => { a.actif = false; a.m.visible = false; });
    eclats.forEach(e => { e.actif = false; e.g.visible = false; });
    for (let i = 0; i < NT; i++) { tz[i] = -T.r() * 300; txy[i * 2] = (T.r() * 2 - 1) * 40; txy[i * 2 + 1] = (T.r() * 2 - 1) * 30; }
    traineesMat.color.setHex(hyper ? 0x9ff6ff : 0xffffff); traineesMat.opacity = hyper ? 0.9 : 0.45;
    dest.material.color.setHex(destination.sol.base); destHalo.material.color.setHex(destination.sol.haut);
    dest.position.set(0, -8, -T.long - 60);
    espace.add(vaisseau.object); vaisseau.object.rotation.set(0, Math.PI, 0);
  }
  function arreter() { T.actif = false; espace.visible = false; scene.add(vaisseau.object); vaisseau.object.visible = true; }

  // renvoie la liste des évènements : { type: 'coup' | 'eclat' | 'arrive' }
  function update(dt, move) {
    const evts = [];
    if (!T.actif) return evts;
    // pilotage : le joystick déplace la Luciole dans le couloir
    T.vx += (move.x * 14 - T.vx) * Math.min(1, dt * 6);
    T.vy += (move.y * 10 - T.vy) * Math.min(1, dt * 6);
    T.x = THREE.MathUtils.clamp(T.x + T.vx * dt, -LARGEUR, LARGEUR);
    T.y = THREE.MathUtils.clamp(T.y + T.vy * dt, -HAUTEUR, HAUTEUR);
    T.v += ((T.hyper ? VITESSE * 3 : VITESSE) - T.v) * Math.min(1, dt * 0.8);
    T.z -= T.v * dt;
    T.invuln = Math.max(0, T.invuln - dt);
    const fin = T.z < -T.long + 40;                      // plus d'obstacles à l'approche de la planète

    // apparition des astéroïdes et des éclats devant le vaisseau
    while (!fin && T.densite > 0 && T.prochain > T.z - 160) {
      const a = asteroides.find(q => !q.actif); if (a) poser(a, T.prochain);
      T.prochain -= 9 / T.densite * (0.5 + T.r());
    }
    while (!fin && !T.hyper && T.prochainEclat > T.z - 160) {
      const e = eclats.find(q => !q.actif);
      if (e) { e.actif = true; e.g.visible = true; e.g.position.set((T.r() * 2 - 1) * LARGEUR, (T.r() * 2 - 1) * HAUTEUR, T.prochainEclat); }
      T.prochainEclat -= 25 + T.r() * 30;
    }
    const pos = vaisseau.object.position.set(T.x, T.y, T.z);
    for (const a of asteroides) {
      if (!a.actif) continue;
      a.m.rotation.x += a.rot.x * dt; a.m.rotation.y += a.rot.y * dt;
      if (a.m.position.z > T.z + 12) { a.actif = false; a.m.visible = false; continue; }
      if (T.invuln <= 0 && a.m.position.distanceTo(pos) < a.taille * 0.85 + 1.0) {
        T.invuln = 1.2; T.v = VITESSE * 0.4; T.coups++;
        T.vx = Math.sign(T.x - a.m.position.x || 1) * 12;
        evts.push({ type: 'coup', pos: pos.clone() });
      }
    }
    for (const e of eclats) {
      if (!e.actif) continue;
      e.g.rotation.y += dt * 3;
      if (e.g.position.z > T.z + 12) { e.actif = false; e.g.visible = false; continue; }
      if (e.g.position.distanceTo(pos) < 1.9) { e.actif = false; e.g.visible = false; T.eclats++; evts.push({ type: 'eclat', pos: e.g.position.clone() }); }
    }
    // traînées d'étoiles
    const lg = T.v * 0.06;
    for (let i = 0; i < NT; i++) {
      if (tz[i] > T.z + 10) { tz[i] = T.z - 200 - T.r() * 100; }
      const x = txy[i * 2], y = txy[i * 2 + 1];
      tPos.set([x, y, tz[i], x, y, tz[i] - lg], i * 6);
    }
    traineesGeo.attributes.position.needsUpdate = true;

    vaisseau.object.visible = T.invuln <= 0 || Math.floor(T.invuln * 12) % 2 === 0;
    vaisseau.object.rotation.x = -T.vy * 0.03;
    vaisseau.animate(dt, 1, T.vx / 14);
    if (T.z < -T.long) evts.push({ type: 'arrive' });
    return evts;
  }

  // caméra derrière la Luciole (avec une petite secousse quand on est touché)
  function camera(cam) {
    const secousse = T.invuln > 0.8 ? (T.invuln - 0.8) * 0.8 : 0;
    cam.position.set(T.x * 0.7 + (Math.random() - 0.5) * secousse, T.y * 0.7 + 2.6 + (Math.random() - 0.5) * secousse, T.z + 8);
    cam.up.set(0, 1, 0);
    cam.lookAt(T.x * 0.85, T.y * 0.85 + 0.6, T.z - 8);
  }

  return { T, demarrer, arreter, update, camera, get progression() { return Math.min(1, -T.z / T.long); } };
}
