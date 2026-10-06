// La faune des planètes : des animaux animés (pack Kenney Cube Pets, CC0) qui vivent leur vie.
// Chaque espèce a un caractère : craintive (s'enfuit), amicale (vient voir Fanal et fait la fête),
// paisible (broute), volante (plane). Sur une planète éteinte, ils sont gris et tristes ;
// quand la vague de couleur du phare les atteint, ils dansent.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { rng } from './univers.js';

const ESPECES = {
  bunny: 'craintif', deer: 'craintif', fox: 'craintif', chick: 'craintif', cat: 'craintif',
  dog: 'amical', panda: 'amical', penguin: 'amical', pig: 'amical', monkey: 'amical', koala: 'amical',
  cow: 'paisible', elephant: 'paisible', giraffe: 'paisible', lion: 'paisible', polar: 'paisible', hog: 'paisible',
  beaver: 'paisible', caterpillar: 'paisible', crab: 'paisible', tiger: 'paisible',
  bee: 'volant', parrot: 'volant',
};
// quelles bêtes vivent sur quel monde
const FAUNE = {
  menthe: ['bunny', 'deer', 'fox', 'bee'], lave: ['caterpillar', 'hog', 'crab'], 'étoilée': ['cat', 'koala', 'bee'],
  givre: ['penguin', 'polar', 'deer'], verdoyance: ['cow', 'pig', 'chick', 'bunny'], dunes: ['lion', 'giraffe', 'elephant'],
  corail: ['pig', 'cat', 'chick', 'crab'], marais: ['beaver', 'caterpillar', 'hog'], lagon: ['crab', 'parrot', 'monkey'],
  volcan: ['hog', 'crab', 'beaver'], hantee: ['cat', 'caterpillar', 'beaver'], pirate: ['parrot', 'crab', 'monkey'],
  royaume: ['cow', 'dog', 'deer'], gourmande: ['bunny', 'chick', 'pig', 'bee'], fetes: ['penguin', 'polar', 'deer'],
  bourg: ['dog', 'cat', 'chick', 'cow'],
};
const VITESSE = { craintif: [1.2, 6.2], amical: [1.3, 4.5], paisible: [0.8, 2.5], volant: [1.6, 3.5] };
const ECHELLE = 0.78;

const MODELES = {};
export async function chargerFaune() {
  const loader = new GLTFLoader();
  await Promise.all(Object.keys(ESPECES).map(n =>
    loader.loadAsync(`./decors/a/animal-${n}.glb`).then(g => { MODELES[n] = g; }).catch(e => console.warn('Animal illisible :', n, e))));
}

const Y = new THREE.Vector3(0, 1, 0);
function randomDir(r) { const u = r() * 2 - 1, a = r() * Math.PI * 2, s = Math.sqrt(1 - u * u); return new THREE.Vector3(s * Math.cos(a), u, s * Math.sin(a)); }
const projectOnPlane = (v, n) => v.addScaledVector(n, -v.dot(n));

// peuple la planète ; renvoie { update(dt, joueur, clock) } ; allumable : effet éteint → coloré
export function peuplerFaune(planet, allumable) {
  const L = planet, r = rng(L.seed * 3 + 11), liste = [];
  const especes = (FAUNE[L.biome] || FAUNE.menthe).filter(n => MODELES[n]);
  if (!especes.length) return { update() {}, liste };
  const matsPlanete = new Map();                       // une matière « allumable » par matière d'origine, partagée sur la planète
  const habiller = obj => obj.traverse(o => {
    if (!o.isMesh) return;
    o.userData.partage = true;                          // géométrie du modèle chargé : ne pas la libérer avec la planète
    o.frustumCulled = false;
    if (!matsPlanete.has(o.material)) matsPlanete.set(o.material, allumable(o.material.clone(), L.U));
    o.material = matsPlanete.get(o.material);
  });

  const nbGroupes = 4 + Math.floor(L.radius / 7);
  for (let gI = 0; gI < nbGroupes; gI++) {
    const espece = especes[gI % especes.length], caractere = ESPECES[espece];
    const centre = planet.freeDir(0.5), nb = caractere === 'volant' ? 2 : 2 + Math.floor(r() * 2);
    for (let k = 0; k < nb; k++) {
      const gltf = MODELES[espece], obj = gltf.scene.clone();
      habiller(obj);
      obj.scale.setScalar(ECHELLE * (0.85 + r() * 0.3));
      const g = new THREE.Group(); g.add(obj); planet.group.add(g);
      const mixer = new THREE.AnimationMixer(obj), actions = {};
      for (const c of gltf.animations) actions[c.name] = mixer.clipAction(c);
      const dir = centre.clone().addScaledVector(randomDir(r), 2.5 / L.radius).normalize();
      liste.push({ espece, caractere, g, mixer, actions, actuelle: null, dir, maison: dir.clone(), but: dir.clone(),
        cap: projectOnPlane(randomDir(r), dir).normalize(), etat: 'flane', t: r() * 10, pause: r() * 3, danse: 0, joyeux: false, r,
        vol: caractere === 'volant' ? 1.6 + r() * 1.2 : 0 });
    }
  }

  const jouer = (a, nom, vitesse = 1) => {
    const act = a.actions[nom] || a.actions.idle; if (!act) return;
    act.timeScale = vitesse;
    if (act === a.actuelle) return;
    act.reset().fadeIn(0.25).play();
    if (a.actuelle) a.actuelle.fadeOut(0.25);
    a.actuelle = act;
  };
  const M = new THREE.Matrix4(), X = new THREE.Vector3(), tmp = new THREE.Vector3(), ecart = new THREE.Vector3();
  const avancer = (a, v, dt) => {
    a.dir.addScaledVector(a.cap, v * dt / L.radius).normalize();
    if (a.vol) return;
    for (const s of planet.solides || []) {                          // les bêtes contournent les rochers et les troncs
      if (s.bas > 1 || s.haut < 0.5) continue;
      ecart.copy(a.dir).sub(s.dir); projectOnPlane(ecart, s.dir);
      const d = ecart.length() * L.radius, min = s.radius + 0.5;
      if (d < min && d > 1e-5) a.dir.addScaledVector(ecart.normalize(), (min - d) / L.radius).normalize();
    }
    for (const s of planet.obstacles) {
      ecart.copy(a.dir).sub(s.dir); projectOnPlane(ecart, s.dir);
      const d = ecart.length() * L.radius, min = s.radius + 0.6;
      if (d < min && d > 1e-5) a.dir.addScaledVector(ecart.normalize(), (min - d) / L.radius).normalize();
    }
  };
  const tourner = (a, voulu, vite, dt) => { if (voulu.lengthSq() > 1e-6) a.cap.lerp(voulu.normalize(), 1 - Math.exp(-vite * dt)).normalize(); };

  function update(dt, joueur) {
    for (const a of liste) {
      a.t += dt;
      const allumee = planet.lit && a.dir.angleTo(planet.beacon.dir) < planet.U.uWave.value;
      // la vague de couleur arrive : il danse de joie
      if (allumee && !a.joyeux) { a.joyeux = true; a.danse = 4 + a.r() * 2; }
      const vers = joueur.actif ? tmp.copy(joueur.pos).sub(a.g.position) : null;
      const loin = vers ? vers.length() : Infinity;
      const [lent, vite] = VITESSE[a.caractere];

      if (a.danse > 0) { a.danse -= dt; jouer(a, 'dance'); }
      else if (a.caractere === 'craintif' && loin < 5) {            // il détale
        tourner(a, projectOnPlane(vers.clone().negate(), a.dir), 8, dt);
        avancer(a, vite, dt); jouer(a, 'run', 1.3);
      } else if (a.caractere === 'amical' && loin < 7) {            // il vient voir Fanal et fait la fête
        tourner(a, projectOnPlane(vers.clone(), a.dir), 6, dt);
        if (loin > 2.2) { avancer(a, vite, dt); jouer(a, 'walk', 1.4); }
        else jouer(a, planet.lit ? 'gesture-positive' : 'gesture-negative');
      } else {                                                       // il flâne, broute, se repose
        if (a.pause > 0) {
          a.pause -= dt;
          jouer(a, a.caractere === 'paisible' && a.r() < 0.5 ? 'eat' : (!planet.lit && a.t % 9 < 1.5 ? 'gesture-negative' : 'idle'));
          if (a.pause <= 0) a.but.copy(a.maison).addScaledVector(randomDir(a.r), 7 / L.radius).normalize();
        } else {
          tourner(a, projectOnPlane(a.but.clone().sub(a.dir), a.dir), 3, dt);
          avancer(a, lent, dt); jouer(a, 'walk');
          if (a.dir.angleTo(a.but) < 0.5 / L.radius || a.r() < dt * 0.1) a.pause = 2 + a.r() * 4;
        }
      }
      // posé sur le sol (ou en vol), tourné vers sa direction
      const h = a.vol ? a.vol + Math.sin(a.t * 2.2) * 0.3 : 0;
      a.g.position.copy(planet.surfacePoint(a.dir)).addScaledVector(a.dir, h - 0.05);
      projectOnPlane(a.cap, a.dir).normalize();
      X.crossVectors(a.dir, a.cap).normalize();
      M.makeBasis(X, a.dir, a.cap); a.g.quaternion.setFromRotationMatrix(M);
      a.mixer.update(dt);
    }
  }
  return { update, liste };
}
