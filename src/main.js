// Astres éteints — boucle de jeu : planète (gravité sphérique, braises, phare, Ombrelles, gardien),
// la Luciole (décollage, univers 3D, atterrissage). 15 galaxies de 15 planètes (univers.js).
import * as THREE from 'three';
import { createControls } from './controls.js';
import { initAudio, sfx, startMusic, stopMusic, toggleMute, pauseAudio, resumeAudio } from './audio.js';
import { vibre, pleinEcran, ecranAllume } from './mobile.js';
import { createFanal } from './fanal.js';
import { createPlanet, createSky, makeGlowTexture, animatePlanet } from './world.js';
import { chargerModeles, chargerTextures } from './modeles.js';
import { createOmbrelles } from './ombrelles.js';
import { createGardien } from './gardien.js';
import { createVaisseau } from './vaisseau.js';
import { createCosmos } from './cosmos.js';
import { chargerDecors, enregistrerDecors } from './amenagement.js';
import { chargerFaune, peuplerFaune } from './faune.js';
import { allumable } from './lumiere.js';
import { createDialogue } from './dialogue.js';
import { INTRO, ASTUCES, MERCIS, MEMOIRES } from './histoire.js';
import { installerMission, updateMission } from './missions.js';
import { installerPieces } from './pieces.js';
import { GALAXIES, NB_GALAXIES, NB_PLANETES, planete, lireSauvegarde, nouvellePartie, sauver, cle, phareAllume } from './univers.js';

// ---------- réglages du gameplay ----------
const GRAVITY = 28, JUMP = 11.5, JUMP2 = 10, COYOTE = 0.12, RUN = 7.5, ACC_GROUND = 14, ACC_AIR = 4;
const CAM_DIST = 7.5, CAM_HEIGHT = 3.2, PORTEE_VAISSEAU = 4.2;

// ---------- rendu ----------
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1200);
function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

const hemi = new THREE.HemisphereLight(0xffe2f4, 0x4a2f86, 1.35); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0dc, 1.6); sun.position.set(30, 60, 25); scene.add(sun);
const fill = new THREE.DirectionalLight(0xb48cff, 0.6); fill.position.set(-40, -20, -30); scene.add(fill);

const glow = makeGlowTexture();
const sky = createSky(scene, glow);
const [modeles] = await Promise.all([chargerModeles(), chargerTextures()]);          // modèles .glb de public/modeles (s'il y en a)
await Promise.all([chargerDecors(), chargerFaune()]);   // objets 3D et animaux des planètes (public/decors, packs CC0)
enregistrerDecors(modeles);                      // vos décors (public/modeles/decor-<monde>-<rôle>.glb) remplacent ceux de Kenney
const fanal = createFanal(glow, modeles);
scene.add(fanal.object);
// ombre douce sous Fanal : on voit toujours où il va retomber
const ombreFanal = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 2, 32, 32, 31); g.addColorStop(0, 'rgba(20,10,40,.55)'); g.addColorStop(0.6, 'rgba(20,10,40,.3)'); g.addColorStop(1, 'rgba(20,10,40,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  const o = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  o.renderOrder = 1; scene.add(o); return o;
})();
function placerOmbre() {
  const P = planet; ombreFanal.visible = !!P && (S.state === 'jeu' || S.state === 'titre') && fanal.object.visible;
  if (!ombreFanal.visible) return;
  const n = S.pos.clone().sub(P.center), dist = n.length(); n.normalize();
  let sol = P.surface(n);
  for (const o of P.solides) {                                   // au-dessus d'un rocher ou d'un îlot : l'ombre se pose dessus
    const rel = S.pos.clone().addScaledVector(o.dir, -P.surface(o.dir)), h = rel.dot(o.dir);
    if (h < o.haut - 0.5) continue;
    if (projectOnPlane(rel, o.dir).length() > o.radius) continue;
    sol = Math.max(sol, P.surface(o.dir) + o.haut);
  }
  if (P.mer && dist > P.radius + P.mer - 0.2) sol = Math.max(sol, P.radius + P.mer);
  const haut = Math.max(0, dist - sol), k = THREE.MathUtils.clamp(1 - haut / 9, 0.25, 1);
  ombreFanal.position.copy(P.center).addScaledVector(n, sol + 0.04);
  ombreFanal.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
  ombreFanal.scale.setScalar(0.6 + k * 0.5); ombreFanal.material.opacity = k;
}
const vaisseau = createVaisseau(glow, modeles);
scene.add(vaisseau.object);
const ombrelles = createOmbrelles(scene, modeles);
const controls = createControls();

// ---------- particules (étincelles) ----------
const PN = 400, pPos = new Float32Array(PN * 3), pCol = new Float32Array(PN * 3), parts = [];
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
const pts = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.45, map: glow, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
pts.frustumCulled = false; scene.add(pts);
for (let i = 0; i < PN; i++) parts.push({ p: new THREE.Vector3(), v: new THREE.Vector3(), life: 0, max: 1, c: new THREE.Color() });
let pNext = 0;
function burst(at, n, color, speed = 5, up = null) {
  for (let k = 0; k < n; k++) {
    const q = parts[pNext = (pNext + 1) % PN];
    q.p.copy(at);
    q.v.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(speed * (0.4 + Math.random()));
    if (up) q.v.addScaledVector(up, speed * 0.6);
    q.max = q.life = 0.6 + Math.random() * 0.8;
    q.c.set(color);
  }
}
function updateParts(dt) {
  for (let i = 0; i < PN; i++) {
    const q = parts[i];
    if (q.life > 0) { q.life -= dt; q.p.addScaledVector(q.v, dt); q.v.multiplyScalar(1 - 1.5 * dt); }
    const k = Math.max(0, q.life / q.max);
    pPos.set(k > 0 ? [q.p.x, q.p.y, q.p.z] : [0, -9999, 0], i * 3);
    pCol.set([q.c.r * k, q.c.g * k, q.c.b * k], i * 3);
  }
  pGeo.attributes.position.needsUpdate = true;
  pGeo.attributes.color.needsUpdate = true;
}

// ---------- onde de choc lumineuse (quand on ramasse un cristal) ----------
const ondes = [];
const ondeGeo = new THREE.RingGeometry(0.7, 1, 40);
function onde(at, up, couleur = 0xffc56b) {
  const m = new THREE.Mesh(ondeGeo, new THREE.MeshBasicMaterial({ color: couleur, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  m.position.copy(at); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), up);
  scene.add(m); ondes.push({ m, t: 0 });
}
function updateOndes(dt) {
  for (let i = ondes.length - 1; i >= 0; i--) {
    const o = ondes[i]; o.t += dt;
    o.m.scale.setScalar(0.3 + o.t * 7); o.m.material.opacity = Math.max(0, 0.9 - o.t * 1.8);
    if (o.t > 0.5) { scene.remove(o.m); o.m.material.dispose(); ondes.splice(i, 1); }
  }
}

// ---------- état ----------
const Y = new THREE.Vector3(0, 1, 0);
const S = {
  state: 'titre',              // titre | jeu | decollage | cosmos | atterrissage | fin
  pos: new THREE.Vector3(), vel: new THREE.Vector3(),
  up: new THREE.Vector3(0, 1, 0), face: new THREE.Vector3(0, 0, 1), camHeading: new THREE.Vector3(0, 0, 1),
  onGround: false, airJumps: 1, coyote: 0, invuln: 0, power: 0, time: 0,
  g: 0, i: 0,                  // galaxie et planète où se trouve Fanal
};
let save = lireSauvegarde();
let planet = null, gardien = null, faune = null;
const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), tmp3 = new THREE.Vector3(), mat = new THREE.Matrix4();

// ---------- interface ----------
const $ = id => document.getElementById(id);
let msgTimer = 0;
function message(text, sub = '', ms = 2600) {
  $('msg').innerHTML = text + (sub ? `<small>${sub}</small>` : '');
  $('msg').classList.add('on');
  clearTimeout(msgTimer); msgTimer = setTimeout(() => $('msg').classList.remove('on'), ms);
}
function hud() {
  if (!planet) return;
  $('planete').textContent = planet.nom;
  $('planeteNum').textContent = `Galaxie ${S.g + 1} · Planète ${S.i + 1} / ${NB_PLANETES}`;
  const got = planet.embers.filter(e => e.taken).length;
  $('braises').textContent = planet.lit ? '✓' : `${got} / ${planet.embers.length}`;
  const res = planet.ressources;
  $('pillRessource').hidden = !(res && res.items.length);
  if (res && res.items.length) {
    $('ressourceIcone').textContent = planet.ressource.icone;
    $('ressource').textContent = `${res.items.filter(x => x.pris).length} / ${res.items.length}`;
  }
  $('pieces').textContent = S.nbPieces || 0;
  $('pillVies').textContent = '❤️'.repeat(Math.max(0, S.vies)) + '🤍'.repeat(3 - Math.max(0, S.vies));
  const pc = planet.parcours;
  $('pillHabitants').hidden = !(pc && pc.habitants.length);
  if (pc && pc.habitants.length) $('habitants').textContent = `${pc.habitants.filter(x => x.libre).length} / ${pc.habitants.length}`;
  const M = S.mission;
  $('pillMission').hidden = !M;
  if (M) $('mission').textContent = `${M.icone} ${M.progres || '…'}`;
  const boss = ombrelles.boss();
  $('bossBarre').hidden = !boss;
  if (boss) $('bossVie').style.width = (100 * boss.vie / planet.bossVie) + '%';
}
function modeInterface(mode) {
  document.body.dataset.mode = mode;          // le CSS montre ou cache les commandes selon le mode
}

if (save && Object.keys(save.allumes).length) {
  $('continuer').hidden = false;
  $('jouer').textContent = 'Nouvelle partie';
}
function lancer(nouvelle) {
  initAudio(); pleinEcran(); ecranAllume(true);
  $('titre').hidden = true;
  if (nouvelle || !save) {
    save = nouvellePartie(); sauver(save);
    charger(0, 0);
    setTimeout(() => dire('mamie', INTRO), 400);
  } else {
    const ici = save.ici || { g: 0, i: 0 };
    charger(ici.g, ici.i);
    message(planet.nom, GALAXIES[ici.g].nom, 2500);
    setTimeout(annoncerMission, 900);
  }
}
$('jouer').onclick = () => lancer(true);
$('continuer').onclick = () => lancer(false);
$('rejouer').onclick = () => location.reload();

// appli mise en arrière-plan (appel, autre appli…) : tout se met en pause
let enPause = false;
document.addEventListener('visibilitychange', () => {
  enPause = document.hidden;
  if (enPause) { pauseAudio(); controls.reset(); } else { resumeAudio(); last = performance.now(); }
});
$('son').onclick = () => { $('son').textContent = toggleMute() ? '🔇' : '🔊'; };

// ---------- planètes : chargement ----------
const projectOnPlane = (v, n) => v.addScaledVector(n, -v.dot(n));

function decharger() {
  ombrelles.vider();
  if (planet) planet.dispose();
  planet = null; gardien = null; faune = null;
}

// ciel et lumière aux couleurs de la planète (son humeur)
function ambiancePlanete(L) {
  const p = L.palette;
  if (!p) { sky.couleurs(GALAXIES[L.g].ciel, L.g * 0.7); return; }
  sky.couleurs(p.ciel, L.g * 0.7 + L.i * 0.4);
  hemi.color.setHex(0xffffff).lerp(new THREE.Color(p.feuillage), 0.18);
  hemi.groundColor.setHex(p.sol.bas).multiplyScalar(0.55);
  sun.color.setHex(0xfff4e6).lerp(new THREE.Color(p.accent), 0.15);
}

// pose Fanal et la Luciole sur la planète (g, i) ; arrivee : la Luciole se pose en cinématique
function charger(g, i, arrivee = false) {
  decharger();
  const L = planete(g, i), allume = phareAllume(save || nouvellePartie(), g, i);
  S.g = g; S.i = i;
  ambiancePlanete(L);
  const k = cle(g, i);
  planet = createPlanet(scene, glow, modeles, L, allume, (save && save.ramasse[k]) || [], { coffres: (save && save.coffres[k]) || [], liberes: (save && save.liberes[k]) || [] });
  if (!allume) ombrelles.peupler(planet);
  gardien = !allume && L.gardien ? createGardien(glow, planet, L.gardien) : null;
  faune = peuplerFaune(planet, allumable);
  S.pieces = installerPieces(planet); S.nbPieces = 0;
  S.mission = save ? installerMission(planet, glow, save, cle(g, i)) : null;
  afficherPouvoirs();
  // la Luciole est garée en haut de la planète
  garerVaisseau();
  planet.obstacles.push({ dir: Y.clone(), radius: 1.3, height: 2.2 });
  // Fanal descend juste à côté, de profil : la Luciole reste visible sur le côté de l'écran
  const a = 3.4 / planet.radius;
  S.up.set(0, Math.cos(a), Math.sin(a));
  S.pos.copy(planet.surfacePoint(S.up)); S.vel.set(0, 0, 0);
  S.face.set(1, 0, 0); projectOnPlane(S.face, S.up).normalize(); S.camHeading.copy(S.face);
  S.onGround = true; S.invuln = 0; S.vies = 3; S.reprise = null; S.sur = null; S.support = null;
  S.power = planet.embers.filter(e => e.taken).length;
  fanal.object.visible = true; fanal.setMood(allume ? 'content' : 'surpris', 1);
  if (save) { save.ici = { g, i }; save.galaxie = g; sauver(save); }
  S.state = 'jeu'; modeInterface('jeu'); controls.setActif(true);
  startMusic(g * 3 + i);
  updateCamera(0, true);
  hud();
  if (arrivee) atterrir();
}

// ---------- la Luciole : décollage, univers 3D, atterrissage ----------
const fondu = on => document.body.classList.toggle('fondu', on);   // voile blanc entre deux scènes
const posVaisseau = new THREE.Vector3();
function garerVaisseau() {
  scene.add(vaisseau.object); vaisseau.object.scale.setScalar(1); vaisseau.object.visible = true;
  planet.placeOn(vaisseau.object, Y, -0.1);
  posVaisseau.copy(vaisseau.object.position);
}
const pretAEmbarquer = () => planet && S.pos.distanceTo(posVaisseau) < PORTEE_VAISSEAU;

const cosmos = createCosmos({
  scene, glow, camera, canvas, sky, vaisseau,
  onArrivee: (g, i) => { cosmos.fermer(); charger(g, i, true); },
  onFermer: () => { cosmos.fermer(); ambiancePlanete(planet); garerVaisseau(); atterrir(); },
});

// Fanal monte à bord, la Luciole décolle, puis l'univers s'ouvre
function decoller() {
  S.state = 'decollage'; S.anim = 0; modeInterface('cinematique'); controls.setActif(false);
  S.depart = S.pos.clone();
  sfx.ready(); vibre('moyen');
}
function updateDecollage(dt) {
  S.anim += dt;
  const k = Math.min(1, S.anim / 0.5);
  S.pos.copy(S.depart).lerp(posVaisseau.clone().addScaledVector(Y, 1), k);          // Fanal file dans le hublot
  fanal.object.scale.setScalar(1 - k);
  if (S.anim > 0.5) {
    if (!S.lance) { S.lance = true; sfx.launch(); vibre('fort'); burst(posVaisseau, 40, 0x9ff6ff, 6, Y); }
    const m = S.anim - 0.5;
    vaisseau.object.position.copy(posVaisseau).addScaledVector(Y, m * m * 9);
    vaisseau.animate(dt, 1, 0);
    if (Math.random() < 0.7) burst(vaisseau.object.position, 2, 0x9ff6ff, 1.5);
  }
  if (S.anim > 1.6) fondu(true);
  camera.lookAt(vaisseau.object.position);
  if (S.anim > 2.0) {
    S.lance = false; fanal.object.visible = false; fanal.object.scale.setScalar(1);
    S.state = 'cosmos'; modeInterface('cosmos');
    cosmos.ouvrir(save, S.g, S.i);
    fondu(false);
  }
}

// la Luciole descend du ciel et se pose, Fanal en sort
function atterrir() {
  S.state = 'atterrissage'; S.anim = 0; modeInterface('cinematique'); controls.setActif(false);
  fanal.object.visible = false;
  updateCamera(0, true);
  setTimeout(() => fondu(false), 60);
}
function updateAtterrissage(dt) {
  S.anim += dt;
  const k = Math.min(1, S.anim / 1.8), h = Math.pow(1 - k, 3) * 28;
  vaisseau.object.position.copy(posVaisseau).addScaledVector(Y, h);
  vaisseau.animate(dt, 1 - k * 0.8, 0);
  if (Math.random() < 0.5 && k < 1) burst(vaisseau.object.position, 2, 0x9ff6ff, 1.5);
  camera.lookAt(vaisseau.object.position.clone().lerp(S.pos, 0.4));
  if (S.anim > 1.8 && !S.pose) {
    S.pose = true; sfx.land(); vibre('moyen'); burst(posVaisseau, 30, 0xffd6f0, 4, Y);
    fanal.object.visible = true; fanal.land(); fanal.setMood('ravi', 1);
  }
  if (S.pose) fanal.object.scale.setScalar(Math.min(1, (S.anim - 1.8) / 0.3));
  if (S.anim > 2.3) {
    S.pose = false; fanal.object.scale.setScalar(1);
    S.state = 'jeu'; modeInterface('jeu'); controls.setActif(true);
    if (planet.boss) astuce('boss'); else setTimeout(annoncerMission, 300);
    message(planet.nom, planet.lit ? 'Phare déjà rallumé ✓' : planet.boss ? 'La Grande Ombrelle garde le Grand Phare ! Saute-lui dessus 👑' : 'Un petit gardien est prisonnier ici… Rallume le phare !', 3200);
  }
}

$('embarquer').onclick = () => { if (S.state === 'jeu' && pretAEmbarquer()) decoller(); };
addEventListener('keydown', e => { if (e.code === 'KeyE') $('embarquer').onclick(); });

// ---------- repère de la Luciole : colonne de lumière + flèche au bord de l'écran ----------
const colonne = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.9, 60, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0x7cf0ff, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
colonne.geometry.translate(0, 30, 0);
scene.add(colonne);
function reperer(t) {
  const voir = S.state === 'jeu' && planet;
  colonne.visible = !!voir;
  if (!voir) { $('versVaisseau').hidden = true; return; }
  colonne.position.copy(posVaisseau); colonne.quaternion.setFromUnitVectors(Y, Y);
  colonne.material.opacity = 0.16 + Math.sin(t * 3) * 0.06;
  // flèche quand la Luciole est loin ou hors de l'écran
  const d = S.pos.distanceTo(posVaisseau), p = posVaisseau.clone().addScaledVector(Y, 1.2).project(camera);
  const derriere = p.z > 1, dedans = !derriere && Math.abs(p.x) < 0.9 && Math.abs(p.y) < 0.85;
  const el = $('versVaisseau');
  el.hidden = d < 8 || (dedans && d < 25);
  if (el.hidden) return;
  let x = p.x, y = p.y;
  if (derriere) { x = -x; y = -y; }
  const a = Math.atan2(y, x), m = Math.max(Math.abs(x) / 0.88, Math.abs(y) / 0.8, dedans ? 0 : 1);
  if (!dedans) { x /= m; y /= m; }
  el.style.left = ((x + 1) / 2 * innerWidth) + 'px'; el.style.top = ((1 - y) / 2 * innerHeight) + 'px';
  el.querySelector('b').style.transform = `rotate(${-a}rad)`;
  el.querySelector('span').textContent = Math.round(d) + ' m';
}

// ---------- logique sur la planète ----------
function updatePlayer(dt) {
  const P = planet;
  if (S.support && S.onGround) S.pos.add(S.support.deplacement);   // posé sur une plateforme qui bouge : elle l'emporte
  const up = tmp.copy(S.pos).sub(P.center).normalize();
  S.up.copy(up);

  // repère de la caméra, transporté le long de la surface
  projectOnPlane(S.camHeading, up);
  if (S.camHeading.lengthSq() < 1e-4) S.camHeading.copy(S.face);
  S.camHeading.normalize();
  const fwd = S.camHeading, right = tmp2.copy(fwd).cross(up).normalize();

  controls.update();
  const m = controls.move, mag = Math.min(1, Math.hypot(m.x, m.y));
  const wish = new THREE.Vector3().addScaledVector(fwd, m.y).addScaledVector(right, m.x);
  if (wish.lengthSq() > 1e-4) wish.normalize();

  // vitesse : composante tangentielle (course) + radiale (saut/gravité)
  let vr = S.vel.dot(up);
  const vt = projectOnPlane(S.vel.clone(), up);
  const target = wish.clone().multiplyScalar(RUN * mag);
  vt.lerp(target, 1 - Math.exp(-(S.onGround ? ACC_GROUND : ACC_AIR) * dt));
  // dans l'eau (monde océan) : on flotte, l'eau freine, et le saut donne un coup de nage
  const prof = P.mer ? P.radius + P.mer - S.pos.distanceTo(P.center) : -1;
  const nage = prof > 0.15;
  if (nage) astuce('eau');
  if (nage !== !!S.nage) { S.nage = nage; burst(S.pos, 14, 0xbff4ff, 3, up); if (nage) sfx.land(); }
  if (nage) {
    vr += (prof > 0.5 ? 7 : 2) * dt - GRAVITY * 0.12 * dt;
    vr *= Math.exp(-2.2 * dt); vt.multiplyScalar(Math.exp(-1.2 * dt));
    S.airJumps = 1;
    if (Math.random() < 0.08) burst(S.pos.clone().addScaledVector(up, 0.8), 1, 0xdff8ff, 1, up);
  } else vr -= GRAVITY * (P.gravite || 1) * dt;
  // courants d'air (monde de nuages) : ils soulèvent Fanal
  S.courant = false;
  for (const c of P.courants || []) {
    const rel = tmp3.copy(S.pos).addScaledVector(c.dir, -P.surface(c.dir)), h = rel.dot(c.dir);
    if (h < -0.5 || h > c.haut) continue;
    if (projectOnPlane(rel, c.dir).length() > c.rayon + 0.4) continue;
    vr = Math.min(9, vr + 45 * dt); S.courant = true; S.onGround = false; S.airJumps = 1;
  }
  // saut, puis double saut en l'air (petit délai de grâce juste après avoir quitté le sol)
  S.coyote = S.onGround ? COYOTE : Math.max(0, S.coyote - dt);
  if (controls.consumeJump()) {
    if (S.nage) {
      vr = Math.max(vr, 6.5); sfx.jump(); fanal.spin(); burst(S.pos, 12, 0xbff4ff, 2, up);
    } else if (S.onGround || S.coyote > 0) {
      if (S.surNuage) { vr = JUMP * 1.35; sfx.jump2(); burst(S.pos, 16, 0xffffff, 3, up); } else
      vr = JUMP; S.onGround = false; S.coyote = 0; sfx.jump(); vibre('leger'); burst(S.pos, 8, 0xbfd0ff, 2, up);
    } else if (S.airJumps > 0) {
      S.airJumps--; vr = Math.max(vr, JUMP2); sfx.jump2(); vibre('leger'); fanal.spin(); burst(S.pos, 18, 0xff8ad8, 3, up);
    }
  }
  // planer : saut maintenu en tombant, l'écharpe freine la chute
  S.plane = !!(save && save.pouvoirs && save.pouvoirs.planer) && !S.onGround && !S.nage && vr < 0 && controls.tenu('saut');
  if (S.plane) { vr = Math.max(vr, -2.2); vt.lerp(wish.clone().multiplyScalar(RUN * mag), 1 - Math.exp(-6 * dt)); if (Math.random() < 0.4) burst(S.pos.clone().addScaledVector(up, 0.6), 1, 0x9ff6ff, 1); }
  S.vel.copy(vt).addScaledVector(up, vr);
  S.pos.addScaledVector(S.vel, dt);

  // sol
  const n = tmp2.copy(S.pos).sub(P.center);
  const dist = n.length(); n.normalize();
  const snap = S.onGround && vr <= 0 ? 0.35 : 0, sol = P.surface(n);
  if (dist <= sol + snap && !(P.abime && dist < sol - 1.2)) {          // archipel : tombé sous le bord d'une île, on ne remonte pas d'un coup dessus
    S.pos.copy(P.center).addScaledVector(n, sol);
    const vrNow = S.vel.dot(n);
    if (vrNow < 0) S.vel.addScaledVector(n, -vrNow);
    if (!S.onGround && vrNow < -8) { sfx.land(); vibre('moyen'); fanal.land(); if (vrNow < -14) fanal.setMood('surpris', 0.6); burst(S.pos, 6, 0xffd6f0, 2, n); }
    S.onGround = true; S.airJumps = 1;
  } else if (dist > sol + 0.4) S.onGround = false;

  S.surNuage = false; S.support = null;
  // archipel : on retient la dernière île touchée ; tombé dans les nuages, on y revient
  if (P.abime) {
    if (S.onGround && P.terre(n)) { S.sur = n.clone(); astuce('archipel'); }
    if (dist < P.abime) chute();
  }
  // objets solides (rochers, blocs, îlots flottants, troncs) : on monte dessus, ils bloquent sur le côté
  for (const o of P.solides) {
    const rel = tmp3.copy(S.pos).addScaledVector(o.dir, -P.surface(o.dir));
    const h = rel.dot(o.dir);
    if (h > o.haut + 0.6 || h + 1.6 < o.bas) continue;
    projectOnPlane(rel, o.dir);
    const d = rel.length(), rayon = o.radius + 0.3;
    if (d > rayon) continue;
    const vrO = S.vel.dot(o.dir);
    if (h >= o.haut - 0.45) {
      if (vrO > 0.5) continue;                                // il monte encore : on le laisse passer au-dessus
      S.pos.addScaledVector(o.dir, o.haut - h);                // posé sur le dessus
      if (o.rebond) { S.surNuage = true; astuce('nuages'); }
      if (o.mobile) S.support = o;
      if (o.caisse && vrO < -3) {                              // on saute sur une caisse : elle casse, on rebondit
        casserCaisses(P.center.clone().addScaledVector(o.dir, P.surface(o.dir) + 0.45), 0.2);
        S.vel.addScaledVector(o.dir, -vrO + JUMP * 0.75); S.onGround = false; S.airJumps = 1;
        continue;
      }
      if (o.ressort && vrO < -1) {                             // nuage-ressort : il renvoie toujours bien haut
        S.vel.addScaledVector(o.dir, -vrO + 15); S.onGround = false; S.airJumps = 1; sfx.jump2(); fanal.spin(); burst(S.pos, 16, 0xffd6f6, 4, o.dir);
        continue;
      }
      if (o.rebond && vrO < -5) {                              // un nuage : ça rebondit !
        S.vel.addScaledVector(o.dir, -vrO * 1.6); S.onGround = false; sfx.jump(); fanal.land(); burst(S.pos, 10, 0xffffff, 3, o.dir);
        continue;
      }
      if (vrO < 0) {
        if (!S.onGround && vrO < -8) { sfx.land(); fanal.land(); burst(S.pos, 6, 0xffd6f0, 2, o.dir); }
        S.vel.addScaledVector(o.dir, -vrO);
      }
      S.onGround = true; S.airJumps = 1;
    } else if (o.rebond) {
      continue;                                                // un nuage se traverse par-dessous et par les côtés
    } else if (o.bas > 0.2 && h < o.bas && vrO > 0) {
      S.vel.addScaledVector(o.dir, -vrO);                      // la tête cogne le dessous d'un îlot
    } else if (d > 1e-4) {
      S.pos.addScaledVector(rel.normalize(), rayon - d);       // contre le côté
    }
  }

  // obstacles (phare, Luciole, cages) : on est repoussé sur le côté
  for (const o of P.obstacles) {
    const base = P.surfacePoint(o.dir);
    const rel = S.pos.clone().sub(base);
    const h = rel.dot(o.dir);
    if (h > o.height) continue;
    const side = projectOnPlane(rel, o.dir);
    const d = side.length(), min = o.radius + 0.4;
    if (d < min && d > 1e-4) S.pos.addScaledVector(side.normalize(), min - d);
  }

  // orientation de Fanal
  if (mag > 0.1) S.face.lerp(wish, 1 - Math.exp(-12 * dt));
  projectOnPlane(S.face, S.up).normalize();
  // la caméra se recale doucement derrière Fanal quand il court
  if (mag > 0.1 && wish.dot(S.camHeading) > -0.3) S.camHeading.lerp(wish, (1 - Math.exp(-1.6 * dt)) * mag).normalize();

  // sécurité : perdu dans l'espace → retour sur la planète
  if (S.pos.length() > P.radius * 4) respawn();
}

function respawn() {
  const a = 3.4 / planet.radius;
  S.up.set(0, Math.cos(a), Math.sin(a));
  S.pos.copy(planet.surfacePoint(S.up)).addScaledVector(S.up, 1);
  S.vel.set(0, 0, 0); sfx.respawn(); fanal.setMood('peur', 1.5);
}

// le phare peut être rallumé quand toutes les braises sont là… et que le boss est vaincu
function verifierPhare() {
  const P = planet;
  if (P.lit || P.beacon.ready || P.embers.some(e => !e.taken)) return;
  if (ombrelles.boss()) { message('Toutes les braises !', 'Mais la Grande Ombrelle garde encore le phare 👑'); return; }
  P.beacon.ready = true; sfx.ready(); setTimeout(() => astuce('phare'), 1200);
  message('Toutes les braises !', 'Va rallumer le phare 🏮');
}

function updateGame(dt) {
  const P = planet;
  const chest = S.pos.clone().addScaledVector(S.up, 0.7);

  // braises
  for (const e of P.embers) {
    if (e.taken) continue;
    if (chest.distanceTo(e.holder.position) < 1.25) {
      e.taken = true; e.holder.visible = false; S.power++;
      const got = P.embers.filter(x => x.taken).length;
      astuce('cristal');
      sfx.cristal(got); vibre('moyen'); fanal.setMood('ravi', 0.9);
      burst(e.holder.position, 40, 0xffb347, 6); burst(e.holder.position, 16, 0xfff3c4, 3, e.dir); onde(e.holder.position, e.dir);
      $('braises').parentElement.classList.remove('pop'); void $('braises').offsetWidth; $('braises').parentElement.classList.add('pop');
      verifierPhare();
      hud();
    }
  }

  // la ressource de la planète, en traînées
  const res = P.ressources;
  if (res && res.items.length) {
    for (const it of res.items) {
      if (it.pris || chest.distanceTo(it.pos) > 1.25) continue;
      it.pris = true; S.serie = S.serieT > 0 ? S.serie + 1 : 0; S.serieT = 0.8;
      const nom = P.ressource.nom;
      (save.ramasse[cle(S.g, S.i)] ||= []).push(it.n);
      save.ressources[nom] = (save.ressources[nom] || 0) + 1;
      sfx.piece(S.serie); burst(it.pos, 10, P.palette.accent, 3);
      if (res.items.every(x => x.pris)) { sfx.ready(); message(`${P.ressource.icone} ${nom} : tout ramassé !`, 'Planète entièrement explorée', 2400); }
      S.aSauver = true; hud();
    }
  }
  S.serieT = Math.max(0, (S.serieT || 0) - dt);
  if (S.aSauver && S.serieT <= 0) { S.aSauver = false; sauver(save); }

  // pièces d'étincelle : toutes les 50, une flamme de vie revient
  if (S.pieces) {
    const n = S.pieces.update(dt, S.time, chest);
    if (n) {
      S.nbPieces += n; save.pieces = (save.pieces || 0) + n; S.aSauver = true;
      S.seriePieces = S.seriePieceT > 0 ? Math.min(12, (S.seriePieces || 0) + 1) : 0; S.seriePieceT = 0.6;
      sfx.piece(S.seriePieces); burst(chest, 6, 0xffd23f, 2.5);
      if (Math.floor(S.nbPieces / 50) > Math.floor((S.nbPieces - n) / 50)) {
        if (S.vies < 3) { S.vies++; message('✨ 50 pièces !', 'Une flamme de vie revient ❤️', 1800); } else message('✨ 50 pièces !', 'Continue comme ça !', 1500);
        sfx.ready(); burst(chest, 40, 0xffd23f, 6);
      }
      hud();
    }
    S.seriePieceT = Math.max(0, (S.seriePieceT || 0) - dt);
  }

  // rallumer le phare
  if (P.beacon.ready && !P.lit && chest.distanceTo(P.beacon.pos) < P.beacon.portee + (P.boss ? 1.5 : 0)) {
    setTimeout(() => { astuce('allume'); verifierPouvoirs(); }, 3000);
    P.lit = true; sfx.beacon(); vibre('fort'); fanal.setMood('super', 3);
    save.allumes[cle(S.g, S.i)] = true;
    burst(P.beacon.pos.clone().addScaledVector(P.beacon.dir, 3), 90, 0xffd27a, 9);
    if (P.boss) {
      if (S.g + 1 >= NB_GALAXIES) {
        S.state = 'fin'; ecranAllume(false); sauver(save);
        setTimeout(() => { sfx.victory(); stopMusic(); $('temps').textContent = `${save.gardiens} gardiens libérés · ${save.eclats} éclats d'étoile`; $('fin').hidden = false; }, 2600);
        message('Le dernier Grand Phare brille !', '', 2600);
      } else {
        save.debloquee = Math.max(save.debloquee, S.g + 1); setTimeout(() => astuce('galaxie'), 4600);
        message(`${GALAXIES[S.g].nom} est libérée !`, `Remonte dans la Luciole : cap sur ${GALAXIES[S.g + 1].nom} 🚀`, 4500);
      }
    } else {
      if (gardien) { gardien.liberer(); save.gardiens++; }
      message('Phare rallumé !', 'Le petit gardien est libre 🧡', 3000);
    }
    sauver(save);
    hud();
  }

  if (gardien && gardien.update(dt)) {
    burst(gardien.position.clone().addScaledVector(S.up, 4), 30, 0x7cf0ff, 5);
    message('Un gardien a rejoint la Luciole !', `${save.gardiens} gardiens à bord · remonte à bord pour continuer 🚀`, 3200);
  }

  // bouton « Embarquer » quand Fanal revient près de la Luciole
  $('embarquer').hidden = !pretAEmbarquer();
}

// ---------- le parcours : relais, coffres, flammèches, habitants ----------
// plus de vie : Fanal se rallume à la dernière lanterne-relais (ou près de la Luciole)
function chute() {
  secouer(0.35); sfx.touche(); vibre('fort'); fanal.setMood('peur', 1.2); burst(S.pos, 30, 0xffffff, 4);
  const d = (S.sur || new THREE.Vector3(0, 1, 0)).clone();
  S.up.copy(d); S.pos.copy(planet.surfacePoint(d)).addScaledVector(d, 0.6); S.vel.set(0, 0, 0); S.onGround = false; S.invuln = 1.2;
  updateCamera(0, true);
  S.vies--; hud();
  if (S.vies <= 0) reprendre(); else message('Plouf dans les nuages !', 'Fanal perd une flamme', 1300);
}
function reprendre() {
  fondu(true);
  setTimeout(() => {
    const d = S.reprise ? S.reprise.clone() : new THREE.Vector3(0, Math.cos(3.4 / planet.radius), Math.sin(3.4 / planet.radius));
    S.up.copy(d); S.pos.copy(planet.surfacePoint(d)).addScaledVector(d, 0.5); S.vel.set(0, 0, 0);
    S.vies = 3; S.invuln = 2; hud(); updateCamera(0, true);
    fanal.setMood('surpris', 1.2); sfx.respawn();
    message('Fanal se rallume…', S.reprise ? 'à la dernière lanterne-relais' : 'près de la Luciole', 2000);
    fondu(false);
  }, 380);
}
function ouvrirCoffre(c) {
  c.ouvert = true;
  const k = cle(S.g, S.i), nom = planet.ressource ? planet.ressource.nom : null;
  (save.coffres[k] ||= []).push(c.n);
  if (nom) save.ressources[nom] = (save.ressources[nom] || 0) + 15;
  const premier = save.coffres[k].length === 1;
  if (premier) { save.memoires = (save.memoires || 0) + 1; setTimeout(() => astuce('coffre'), 900); }
  sfx.coffre(); vibre('moyen'); fanal.setMood('ravi', 1.2);
  burst(c.pos, 50, 0xffd36b, 7, c.dir); onde(c.pos, c.dir, 0xffd36b);
  message(premier ? '📜 Éclat de mémoire trouvé !' : 'Coffre ouvert !', premier ? 'Un souvenir de ce qui s\'est passé… (journal bientôt)' : `+15 ${planet.ressource ? planet.ressource.icone : ''}`, 2600);
  sauver(save);
}
function updateParcours(dt) {
  const pc = planet.parcours; if (!pc) return;
  const chest = S.pos.clone().addScaledVector(S.up, 0.7), k = cle(S.g, S.i);
  for (const rl of pc.relais) if (!rl.allume && chest.distanceTo(rl.g.position) < 2.2) {
    rl.allume = true; S.reprise = rl.reprise; sfx.ready(); vibre('leger'); setTimeout(() => astuce('relais'), 700);
    burst(rl.g.position.clone().addScaledVector(rl.dir, 1.5), 24, 0xffb347, 4);
    message('Lanterne-relais allumée ✨', 'Tu repartiras d\'ici', 1600);
  }
  for (const c of pc.coffres) if (!c.ouvert && chest.distanceTo(c.pos) < 1.4) ouvrirCoffre(c);
  for (const f of pc.flammeches) if (!f.pris && chest.distanceTo(f.pos) < 1.3) {
    f.pris = true; S.vies = Math.min(3, S.vies + 1); sfx.piece(6); burst(f.pos, 16, 0xff5fa2, 3); hud();
  }
  for (const h of pc.habitants) if (!h.libre && chest.distanceTo(h.pos) < 1.6) {
    h.libre = true; h.t = 0;
    (save.liberes[k] ||= []).push(h.n); save.habitants = (save.habitants || 0) + 1;
    const n = pc.habitants.filter(x => x.libre).length;
    sfx.joie(); vibre('moyen'); fanal.setMood('ravi', 1.2); burst(h.pos, 40, 0xb48cff, 5); onde(h.pos, h.dir, 0xd9b8ff);
    message(n === pc.habitants.length ? `Tous les ${pc.peuple.nom} sont libres ! 🎉` : `Un des ${pc.peuple.nom} est libre !`, `${n} / ${pc.habitants.length} · il rejoint la Luciole`, 2200);
    sauver(save); hud();
    if (save.astuces && save.astuces.habitant && Math.random() < 0.35) peupleParle(MERCIS[Math.floor(Math.random() * MERCIS.length)]);
    setTimeout(() => astuce('habitant'), 800);
  }
}

// ---------- les pouvoirs de Fanal : planer, tir de braise, décharge électrique ----------
// ils se débloquent au fil des phares rallumés (Mamie Mèche les explique)
const POUVOIRS = [
  { nom: 'planer', phares: 1, titre: 'Planer', aide: 'Maintiens SAUT en tombant : ton écharpe te fait planer.' },
  { nom: 'tir', phares: 3, titre: 'Tir de braise 🔸', aide: 'Bouton 🔸 (touche G) : une braise file droit devant.' },
  { nom: 'eclair', phares: 6, titre: 'Décharge électrique ⚡', aide: 'Bouton ⚡ (touche H) : une décharge autour de toi, même à travers les piquants.' },
];
function verifierPouvoirs() {
  save.pouvoirs ||= {};
  const n = Object.keys(save.allumes).length;
  for (const p of POUVOIRS) if (!save.pouvoirs[p.nom] && n >= p.phares) {
    save.pouvoirs[p.nom] = true; sauver(save);
    setTimeout(() => dire('mamie', [`Bravo mon petit Fanal ! Tu as gagné un nouveau pouvoir : ${p.titre}.`, p.aide]), 3200);
  }
  afficherPouvoirs();
}
function afficherPouvoirs() {
  const p = (save && save.pouvoirs) || {};
  document.body.classList.toggle('pouvoir-tir', !!p.tir);
  document.body.classList.toggle('pouvoir-eclair', !!p.eclair);
}
const braises = [];
const braiseMat = new THREE.MeshBasicMaterial({ color: 0xffc56b });
const braiseGeo = new THREE.OctahedronGeometry(0.22);
const eclairMat = new THREE.LineBasicMaterial({ color: 0x9ff6ff, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false });
const eclairs = [];
// caisses : elles éclatent en pièces (et parfois une flamme de vie)
function casserCaisses(centre, rayon) {
  const cs = S.pieces ? S.pieces.casser(centre, rayon) : [];
  for (const c of cs) {
    burst(c.pos, 26, 0xd99a52, 5); burst(c.pos, 14, 0xffe066, 4, c.d); onde(c.pos, c.d, 0xffd23f);
    sfx.coffre(); vibre('moyen'); secouer(0.22); geler(0.05);
    if (c.flamme) { S.vies = Math.min(3, S.vies + 1); burst(c.pos, 20, 0xff5fa2, 4, c.d); message('❤️', 'Une flamme de vie cachée dans la caisse !', 1400); hud(); }
  }
  return cs.length;
}
function secouer(f) { S.secousse = Math.max(S.secousse || 0, f); }
function geler(t) { S.gel = Math.max(S.gel || 0, t); }
function updatePouvoirs(dt) {
  const evts = [], p = (save && save.pouvoirs) || {};
  S.rechTir = Math.max(0, (S.rechTir || 0) - dt); S.rechEclair = Math.max(0, (S.rechEclair || 0) - dt);
  if (S.state !== 'jeu') { controls.consume('tir'); controls.consume('eclair'); }
  // tir de braise : file au ras du sol en suivant la courbe de la planète
  if (S.state === 'jeu' && controls.consume('tir') && p.tir && S.rechTir <= 0) {
    S.rechTir = 0.5;
    const m = new THREE.Mesh(braiseGeo, braiseMat);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xff8a3d, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); halo.scale.setScalar(1.4); m.add(halo);
    scene.add(m);
    braises.push({ m, n: S.pos.clone().normalize(), cap: projectOnPlane(S.face.clone(), S.up).normalize(), t: 0 });
    sfx.tir(); fanal.setMood('super', 0.3); vibre('leger');
  }
  for (let i = braises.length - 1; i >= 0; i--) {
    const b = braises[i]; b.t += dt;
    b.n.addScaledVector(b.cap, 17 * dt / planet.radius).normalize(); projectOnPlane(b.cap, b.n).normalize();
    b.m.position.copy(planet.surfacePoint(b.n)).addScaledVector(b.n, 0.9); b.m.rotation.y += dt * 12;
    if (Math.random() < 0.6) burst(b.m.position, 1, 0xff8a3d, 0.8);
    const touche = ombrelles.frapper(b.m.position, 0.6);
    if (casserCaisses(b.m.position, 0.5)) touche.push({ type: 'caisse' });
    const coffre = planet.parcours && planet.parcours.coffres.find(c => !c.ouvert && c.pos.distanceTo(b.m.position) < 1.2);
    if (coffre) ouvrirCoffre(coffre);
    const mur = planet.solides.some(s => s.bas < 0.5 && s.haut > 0.8 && s.dir.angleTo(b.n) * planet.radius < s.radius);
    if (touche.length || coffre || mur || b.t > 0.85) {
      evts.push(...touche); burst(b.m.position, 18, 0xffa040, 4); scene.remove(b.m); b.m.children[0].material.dispose(); braises.splice(i, 1);
    }
  }
  // décharge électrique : zone autour de Fanal, traverse les piquants
  if (S.state === 'jeu' && controls.consume('eclair') && p.eclair && S.rechEclair <= 0) {
    S.rechEclair = 3.5;
    const centre = S.pos.clone().addScaledVector(S.up, 0.8);
    evts.push(...ombrelles.frapper(centre, 4.5, { electrique: true }));
    casserCaisses(centre, 4.5);
    onde(centre, S.up, 0x7cf0ff); onde(S.pos.clone().addScaledVector(S.up, 0.2), S.up, 0x9ff6ff); burst(centre, 50, 0x9ff6ff, 8);
    sfx.onde(); vibre('fort'); fanal.setMood('super', 0.8);
    for (let k = 0; k < 7; k++) {                                     // arcs électriques en zigzag
      const pts = [centre.clone()], dirk = projectOnPlane(new THREE.Vector3().randomDirection(), S.up).normalize();
      for (let j = 1; j <= 6; j++) pts.push(centre.clone().addScaledVector(dirk, j * 0.75).add(new THREE.Vector3().randomDirection().multiplyScalar(0.3)));
      const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), eclairMat.clone()); scene.add(l); eclairs.push({ l, t: 0 });
    }
  }
  for (let i = eclairs.length - 1; i >= 0; i--) {
    const e = eclairs[i]; e.t += dt; e.l.material.opacity = Math.max(0, 1 - e.t * 4);
    if (e.t > 0.25) { scene.remove(e.l); e.l.geometry.dispose(); e.l.material.dispose(); eclairs.splice(i, 1); }
  }
  return evts;
}

// ---------- l'histoire : dialogues, conseils de Mamie Mèche, mission, journal ----------
const dialogue = createDialogue({
  quandOuvert: () => controls.setActif(false),
  quandFerme: () => controls.setActif(S.state === 'jeu'),
  son: () => sfx.parole(),
});
const dire = (qui, lignes) => dialogue.dire(qui, lignes);
// un conseil de Mamie Mèche, une seule fois dans toute la partie
function astuce(cleAstuce) {
  if (!save) return;
  save.astuces ||= {};
  if (save.astuces[cleAstuce]) return;
  save.astuces[cleAstuce] = true; sauver(save);
  dire('mamie', ASTUCES[cleAstuce]);
}
function peupleParle(ligne) {
  const pe = planet.parcours.peuple;
  dire({ nom: pe.nom, portrait: '🙋', couleur: '#' + pe.deco.toString(16).padStart(6, '0') }, ligne);
}
function annoncerMission() {
  const M = S.mission; if (!M || M.faite) return;
  const pc = planet.parcours;
  dire('mamie', `Mission : ${M.titre} ${M.icone}. ` + M.annonce(pc.peuple.nom, planet.ressource ? planet.ressource.nom.toLowerCase() : '', M.voulu));
}
function missionEvt(e) {
  const M = S.mission;
  if (e.type === 'brasero') { sfx.ready(); burst(e.pos, 30, 0xff8a3d, 5, null); onde(e.pos, planet.surfacePoint(e.pos.clone().normalize()).normalize(), 0xff8a3d); }
  if (e.type === 'chrono_rate') { sfx.respawn(); message('Trop tard…', 'Les braseros se sont éteints. Rallume le premier pour recommencer.', 2600); }
  if (e.type === 'demande') peupleParle(`Il me faut encore ${e.il_manque} ${planet.ressource.nom.toLowerCase()} ${planet.ressource.icone}. Tu les trouveras en suivant les traînées !`);
  if (e.type === 'reussie') {
    (save.etoiles ||= {})[cle(S.g, S.i)] = true; sauver(save);
    sfx.victory(); vibre('fort'); fanal.setMood('super', 2); burst(S.pos.clone().addScaledVector(S.up, 1.5), 80, 0xffe066, 8);
    message(`⭐ Mission réussie : ${M.titre} !`, 'Une étoile de mission de plus', 3000);
    if (M.type === 'commande') peupleParle('Merci, petite flamme ! Avec ça, notre village va renaître. Prends cette étoile, elle porte bonheur.');
    else setTimeout(() => dire('mamie', 'Magnifique ! Une étoile de mission de plus pour la Luciole. ⭐'), 600);
  }
  hud();
}
// le journal : les éclats de mémoire trouvés, dans l'ordre de l'histoire
function ouvrirJournal() {
  const n = Math.min(save ? save.memoires || 0 : 0, MEMOIRES.length);
  $('journalListe').innerHTML = n ? MEMOIRES.slice(0, n).map((m, i) => `<li><b>Éclat ${i + 1}</b><p>${m}</p></li>`).join('')
    : '<li><p>Aucun éclat de mémoire pour l\'instant. Ils sont cachés dans les coffres des planètes.</p></li>';
  const etoiles = save ? Object.keys(save.etoiles || {}).length : 0;
  $('journalStats').textContent = `📜 ${n} / ${MEMOIRES.length} éclats · ⭐ ${etoiles} missions · 🙋 ${save ? save.habitants || 0 : 0} habitants libérés · 🧡 ${save ? save.gardiens : 0} gardiens`;
  $('journal').hidden = false; S.journal = true; controls.setActif(false);
}
$('btnJournal').onclick = ouvrirJournal;
$('fermerJournal').onclick = () => { $('journal').hidden = true; S.journal = false; controls.setActif(S.state === 'jeu'); };

// ---------- Ombrelles ----------
function updateOmbrelles(dt) {
  S.invuln = Math.max(0, S.invuln - dt);
  const evts = ombrelles.update(dt, { pos: S.pos, up: S.up, vel: S.vel, actif: S.state === 'jeu' });
  // coup de flamme : tourbillon autour de Fanal (chasse les Ombrelles, ouvre les coffres)
  S.recharge = Math.max(0, (S.recharge || 0) - dt);
  if (S.state === 'jeu' && controls.consumeAttaque() && S.recharge <= 0) {
    S.recharge = 0.45;
    const centre = S.pos.clone().addScaledVector(S.up, 0.8);
    fanal.spin(); fanal.setMood('super', 0.5); sfx.coup(); vibre('leger');
    onde(centre, S.up, 0xff8a3d); burst(centre, 26, 0xff8a3d, 6);
    evts.push(...ombrelles.frapper(centre, 2.1));
    for (const c of planet.parcours ? planet.parcours.coffres : []) if (!c.ouvert && c.pos.distanceTo(centre) < 2.4) ouvrirCoffre(c);
    casserCaisses(centre, 2.0);
  }
  evts.push(...updatePouvoirs(dt));
  for (const ev of evts) {
    // rebond sur une Ombrelle ; sur le boss, Fanal est aussi éjecté sur le côté pour ne pas retomber dessus
    const rebond = () => {
      if (ev.coup) return;                                          // touchée d'un coup de flamme : pas de rebond
      projectOnPlane(S.vel, S.up).addScaledVector(S.up, JUMP * 0.85); S.onGround = false; S.airJumps = 1;
      if (ev.o.boss) {
        const cote = projectOnPlane(S.pos.clone().sub(ev.o.g.position), S.up);
        if (cote.lengthSq() < 0.04) cote.copy(S.face).negate();
        S.vel.addScaledVector(cote.normalize(), 7);
      }
    };
    if (ev.type === 'rebond') { rebond(); sfx.jump(); }
    if (ev.type === 'repere') { sfx.repere(); if (!ev.o.boss) fanal.setMood('surpris', 0.5); }
    if (ev.type === 'balaye') burst(ev.pos, 20, 0xffd27a, 3);
    if (ev.type === 'tir') sfx.tir();
    if (ev.type === 'onde') sfx.onde();
    if (ev.type === 'eclat_ombre') { secouer(0.15); geler(0.04); if (S.pieces) S.pieces.jaillir(ev.pos.clone(), 3); burst(ev.pos, 22, 0x8a4fff, 4); onde(ev.pos, planet.surfacePoint(ev.pos.clone().normalize()).normalize(), 0x8a4fff); }
    if (ev.type === 'eclat_neige') { burst(ev.pos, 40, 0xffffff, 6); sfx.ecrase(); }
    if (ev.type === 'pique') { burst(ev.pos, 14, 0xffb000, 4); sfx.pique(); message('Aïe, des piquants !', 'Attends qu\'ils rentrent', 1300); }
    if (ev.type === 'ecrase') {
      rebond(); sfx.ecrase(); vibre('moyen'); fanal.setMood('ravi', 0.8); burst(ev.pos, 30, 0xb48cff, 5);
      secouer(0.18); geler(0.06); if (S.pieces) S.pieces.jaillir(ev.pos.clone(), 3);
    }
    if (ev.type === 'boss_touche') {
      secouer(0.45); geler(0.09);
      rebond(); sfx.ecrase(); vibre('fort'); fanal.setMood('ravi', 0.8); burst(ev.pos, 50, 0xffc23d, 7);
      message('Touché !', `Encore ${ev.o.vie} ${ev.o.vie > 1 ? 'coups' : 'coup'}`, 1400); hud();
    }
    if (ev.type === 'boss_vaincu') {
      rebond(); sfx.victory(); vibre('fort'); fanal.setMood('super', 2.5); burst(ev.pos, 120, 0xffc23d, 10);
      message('La Grande Ombrelle est vaincue !', planet.embers.every(e => e.taken) ? 'Va rallumer le Grand Phare 🏮' : 'Ramasse les dernières braises 🔥', 3200);
      setTimeout(() => { hud(); verifierPhare(); }, 50);
    }
    if (ev.type === 'touche' && S.invuln <= 0) {
      secouer(0.4);
      S.invuln = 1.6;
      const recul = projectOnPlane(S.pos.clone().sub(ev.pos), S.up);
      if (recul.lengthSq() < 1e-4) recul.copy(S.face).negate();
      S.vel.copy(recul.normalize().multiplyScalar(ev.o.boss ? 13 : 9)).addScaledVector(S.up, 7); S.onGround = false;
      sfx.touche(); vibre('fort'); fanal.setMood('peur', 1.4); burst(S.pos, 16, 0x5b2d8f, 3);
      // Fanal perd une flamme de vie ; plus de vie : il repart de la dernière lanterne-relais
      S.vies--; hud(); setTimeout(() => astuce('touche'), 500);
      if (S.vies <= 0) reprendre();
    }
  }
}

// ---------- caméra ----------
function updateCamera(dt, instant = false) {
  if (S.camLibre) { camera.position.copy(S.camLibre.pos); camera.up.set(0, 1, 0); camera.lookAt(S.camLibre.cible); return; }   // vue libre (captures)
  if (S.state === 'cosmos' || S.state === 'decollage') return;   // caméra pilotée par l'univers / le décollage
  if (!planet) { camera.position.set(0, 0, 30); camera.lookAt(0, 0, 0); return; }
  // en portrait, l'écran est étroit : on recule la caméra pour voir autour de Fanal
  const zoom = camera.aspect < 1 ? 1.25 + (1 - camera.aspect) * 0.9 : 1;
  const desired = S.pos.clone().addScaledVector(S.up, CAM_HEIGHT * zoom).addScaledVector(S.camHeading, -CAM_DIST * zoom);
  const k = instant ? 1 : 1 - Math.exp(-6 * dt);
  camera.position.lerp(desired, k);
  camera.up.lerp(S.up, k).normalize();
  camera.lookAt(S.pos.clone().addScaledVector(S.up, 1.3));
  // tremblement (coups, caisses, chutes) : un petit décalage qui s'éteint vite
  if (S.secousse > 0.002) {
    S.secousse *= Math.exp(-9 * dt);
    camera.position.add(new THREE.Vector3().randomDirection().multiplyScalar(S.secousse * 0.6));
  }
}

function placeFanal(dt) {
  const o = fanal.object;
  o.position.copy(S.pos);
  const cache = S.state === 'cosmos' || (S.state === 'atterrissage' && !S.pose);
  o.visible = !cache && (S.invuln <= 0 || Math.floor(S.invuln * 12) % 2 === 0);   // clignote après un coup
  const z = S.face.clone(); projectOnPlane(z, S.up).normalize();
  const x = new THREE.Vector3().crossVectors(S.up, z).normalize();
  mat.makeBasis(x, S.up, z);
  o.quaternion.setFromRotationMatrix(mat);
  const speed = Math.min(1, projectOnPlane(S.vel.clone(), S.up).length() / RUN);
  fanal.animate(dt, speed, !S.onGround, S.power);
}

// ---------- boucle ----------
let last = performance.now(), clock = 0;
// qualité automatique : si le téléphone peine, on baisse la résolution du rendu
let qPix = Math.min(devicePixelRatio, 2), qT = 0, qN = 0;
function qualite(rawDt) {
  if ((S.state !== 'jeu' && S.state !== 'cosmos') || rawDt > 0.25) return;
  qT += rawDt; qN++;
  if (qT < 3) return;
  const fps = qN / qT; qT = 0; qN = 0;
  if (fps < 45 && qPix > 0.75) { qPix = Math.max(0.75, qPix - 0.5); renderer.setPixelRatio(qPix); resize(); }
}

function frame(now) {
  requestAnimationFrame(frame);
  if (enPause) return;
  const raw = (now - last) / 1000; last = now; qualite(raw);
  let dt = Math.min(1 / 30, raw);
  if (S.gel > 0) { S.gel -= raw; dt = 0.0001; }                 // arrêt sur image après un gros coup
  clock += dt;
  const enJeu = S.state === 'jeu' && !dialogue.ouvert && !S.journal;          // pendant un dialogue ou le journal, le jeu attend
  dialogue.update(dt);
  if (enJeu) {
    S.time += dt; updatePlayer(dt); updateGame(dt); updateParcours(dt);
    const ev = updateMission(S.mission, planet, S.pos.clone().addScaledVector(S.up, 0.7), dt, clock); if (ev) missionEvt(ev);
    if (S.mission && S.mission.type === 'braseros' && S.mission.chrono > 0) hud();
  }
  else if (S.state === 'titre') { S.camHeading.applyAxisAngle(S.up, dt * 0.25); }
  if (planet && S.state !== 'cosmos') { animatePlanet(planet, dt, clock); if (!dialogue.ouvert && !S.journal) updateOmbrelles(dt); if (faune) faune.update(dt, { pos: S.pos, actif: S.state === 'jeu' }); }
  if (S.state === 'jeu' || S.state === 'titre') vaisseau.animate(dt, 0, 0);
  if (S.state !== 'jeu') $('embarquer').hidden = true;
  updateParts(dt); updateOndes(dt);
  placeFanal(dt); placerOmbre();
  updateCamera(dt);
  // cinématiques et univers : après la caméra, pour pouvoir la diriger
  if (S.state === 'decollage') updateDecollage(dt);
  else if (S.state === 'atterrissage') updateAtterrissage(dt);
  else if (S.state === 'cosmos') cosmos.update(dt);
  reperer(clock);
  sky.position.copy(camera.position);
  // ambiance : ciel de jour et soleil plus fort quand on est sur une planète, encore plus quand son phare brille
  const jour = planet && S.state !== 'cosmos' ? 0.55 + 0.45 * planet.litT : 0;
  sky.jour(jour, S.state === 'cosmos' ? null : S.up);
  sun.intensity = 1.6 + jour * 0.9; hemi.intensity = 1.35 + jour * 0.35;
  // transparence entre la caméra et Fanal (désactivée hors du jeu, pour les cinématiques)
  if (planet) {
    const voir = S.state === 'jeu' && !S.camLibre;
    planet.U.uFanal.value.copy(voir ? S.pos.clone().addScaledVector(S.up, 0.6) : new THREE.Vector3(0, 1e6, 0));
    planet.U.uCam.value.copy(voir ? camera.position : new THREE.Vector3(0, 1e6, 0));
  }
  // ce qui est caché derrière la courbure de la planète n'est pas dessiné (juste le temps du rendu)
  const caches = [];
  if (planet && S.state !== 'cosmos') {
    const R = planet.radius, cd = camera.position.distanceTo(planet.center);
    const camDir = camera.position.clone().sub(planet.center).normalize(), hCam = Math.acos(Math.min(1, R / cd)), d = new THREE.Vector3();
    for (const o of planet.group.children) {
      if (!o.visible || o.isInstancedMesh || o === planet.beacon.group) continue;
      d.copy(o.position).sub(planet.center); const lo = d.length(); if (lo < 1) continue;
      const portee = hCam + Math.acos(Math.min(1, R / (lo + 2.5))) + 0.08;
      if (d.divideScalar(lo).dot(camDir) < Math.cos(Math.min(Math.PI, portee))) { o.visible = false; caches.push(o); }
    }
  }
  renderer.render(scene, camera);
  for (const o of caches) o.visible = true;
}

// écran titre : Brumelune en fond
charger(0, 0); S.state = 'titre'; modeInterface('titre'); stopMusic();
updateCamera(0, true);
requestAnimationFrame(frame);

// accès pour les tests automatiques
window.__jeu = { renderer, dialogue, ouvrirJournal, S, get planet() { return planet; }, get save() { return save; }, get faune() { return faune; }, ombrelles, cosmos, charger, decoller };
