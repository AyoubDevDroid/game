// Astres éteints — boucle de jeu : planète (gravité sphérique, braises, phare, Ombrelles, gardien),
// carte de la galaxie, trajet en vaisseau. 15 galaxies de 15 planètes (univers.js).
import * as THREE from 'three';
import { createControls } from './controls.js';
import { initAudio, sfx, startMusic, stopMusic, toggleMute, pauseAudio, resumeAudio } from './audio.js';
import { vibre, pleinEcran, ecranAllume } from './mobile.js';
import { createFanal } from './fanal.js';
import { createPlanet, createSky, makeGlowTexture, animatePlanet } from './world.js';
import { chargerModeles } from './modeles.js';
import { createOmbrelles } from './ombrelles.js';
import { createGardien } from './gardien.js';
import { createVaisseau } from './vaisseau.js';
import { createTrajet } from './trajet.js';
import { createCarte } from './carte.js';
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

scene.add(new THREE.HemisphereLight(0xffe2f4, 0x4a2f86, 1.35));
const sun = new THREE.DirectionalLight(0xfff0dc, 1.6); sun.position.set(30, 60, 25); scene.add(sun);
const fill = new THREE.DirectionalLight(0xb48cff, 0.6); fill.position.set(-40, -20, -30); scene.add(fill);

const glow = makeGlowTexture();
const sky = createSky(scene, glow);
const modeles = await chargerModeles();          // modèles .glb de public/modeles (s'il y en a)
const fanal = createFanal(glow, modeles);
scene.add(fanal.object);
const vaisseau = createVaisseau(glow);
scene.add(vaisseau.object);
const ombrelles = createOmbrelles(scene);
const trajet = createTrajet(scene, glow, vaisseau);
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

// ---------- état ----------
const Y = new THREE.Vector3(0, 1, 0);
const S = {
  state: 'titre',              // titre | jeu | carte | trajet | fin
  pos: new THREE.Vector3(), vel: new THREE.Vector3(),
  up: new THREE.Vector3(0, 1, 0), face: new THREE.Vector3(0, 0, 1), camHeading: new THREE.Vector3(0, 0, 1),
  onGround: false, airJumps: 1, coyote: 0, invuln: 0, power: 0, time: 0,
  g: 0, i: 0,                  // galaxie et planète où se trouve Fanal
};
let save = lireSauvegarde();
let planet = null, gardien = null;
const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), mat = new THREE.Matrix4();

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
  $('braises').textContent = planet.lit ? '✓ phare rallumé' : `${got} / ${planet.embers.length}`;
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
    message('Brumelune', 'Ramasse les braises 🔥 pour rallumer le phare', 3500);
  } else {
    const ici = save.ici || { g: 0, i: 0 };
    charger(ici.g, ici.i);
    message(planet.nom, GALAXIES[ici.g].nom, 2500);
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

// ---------- planètes : chargement, carte, trajet ----------
const projectOnPlane = (v, n) => v.addScaledVector(n, -v.dot(n));

function decharger() {
  ombrelles.vider();
  if (planet) planet.dispose();
  planet = null; gardien = null;
}

// pose Fanal et la Luciole sur la planète (g, i)
function charger(g, i) {
  decharger();
  const L = planete(g, i), allume = phareAllume(save || nouvellePartie(), g, i);
  S.g = g; S.i = i;
  sky.couleurs(GALAXIES[g].ciel, g * 0.7);
  planet = createPlanet(scene, glow, modeles, L, allume);
  if (!allume) ombrelles.peupler(planet);
  gardien = !allume && L.gardien ? createGardien(glow, planet, L.gardien) : null;
  // la Luciole est garée en haut de la planète
  scene.add(vaisseau.object);
  planet.placeOn(vaisseau.object, Y, -0.1);
  vaisseau.object.visible = true;
  planet.obstacles.push({ dir: Y.clone(), radius: 1.3, height: 2.2 });
  // Fanal descend juste à côté, de profil : la Luciole reste visible sur le côté de l'écran
  const a = 3.4 / planet.radius;
  S.up.set(0, Math.cos(a), Math.sin(a));
  S.pos.copy(planet.surfacePoint(S.up)); S.vel.set(0, 0, 0);
  S.face.set(1, 0, 0); projectOnPlane(S.face, S.up).normalize(); S.camHeading.copy(S.face);
  S.onGround = true; S.invuln = 0;
  S.power = planet.embers.filter(e => e.taken).length;
  fanal.object.visible = true; fanal.setMood(allume ? 'content' : 'surpris', 1);
  if (save) { save.ici = { g, i }; save.galaxie = g; sauver(save); }
  S.state = 'jeu'; modeInterface('jeu');
  startMusic(g * 3 + i);
  updateCamera(0, true);
  hud();
}

const carte = createCarte({ onAller: aller });
function ouvrirCarte() {
  S.state = 'carte'; modeInterface('carte'); controls.reset();
  carte.afficher(save, S.g, S.i);
}
$('embarquer').onclick = () => { if (S.state === 'jeu' && pretAEmbarquer()) { sfx.ready(); ouvrirCarte(); } };
addEventListener('keydown', e => { if (e.code === 'KeyE') $('embarquer').onclick(); });
$('carteFermer').onclick = () => { carte.cacher(); S.state = 'jeu'; modeInterface('jeu'); };

function aller(g, i) {
  carte.cacher();
  if (g === S.g && i === S.i) { S.state = 'jeu'; modeInterface('jeu'); return; }
  const hyper = g !== S.g;
  decharger();
  fanal.object.visible = false;
  sky.couleurs(GALAXIES[g].ciel, g * 0.7);
  trajet.demarrer(planete(g, i), { hyper, densite: 0.35 + g * 0.05 });
  S.state = 'trajet'; S.dest = { g, i }; modeInterface('trajet');
  sfx.launch(); vibre('fort');
  message(hyper ? 'Saut hyperespace !' : planete(g, i).nom, hyper ? GALAXIES[g].nom : 'Esquive les astéroïdes, attrape les éclats ✨', 2600);
}

function updateTrajet(dt) {
  controls.update();
  for (const ev of trajet.update(dt, controls.move)) {
    if (ev.type === 'coup') { sfx.touche(); vibre('fort'); burst(ev.pos, 24, 0xb48cff, 6); }
    if (ev.type === 'eclat') { save.eclats++; sfx.ember(trajet.T.eclats); vibre('leger'); burst(ev.pos, 14, 0x9ff6ff, 4); }
    if (ev.type === 'arrive') {
      trajet.arreter(); sauver(save);
      charger(S.dest.g, S.dest.i);
      sfx.land(); vibre('moyen'); fanal.land();
      message(planet.nom, planet.boss ? 'La Grande Ombrelle garde le Grand Phare ! Saute-lui dessus 👑' : 'Un petit gardien est prisonnier ici… Rallume le phare !', 3200);
      return;
    }
  }
  $('trajetBarre').style.width = (trajet.progression * 100) + '%';
  $('trajetEclats').textContent = save.eclats;
}

const pretAEmbarquer = () => planet && S.pos.distanceTo(vaisseau.object.position) < PORTEE_VAISSEAU;

// ---------- logique sur la planète ----------
function updatePlayer(dt) {
  const P = planet;
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
  vr -= GRAVITY * dt;
  // saut, puis double saut en l'air (petit délai de grâce juste après avoir quitté le sol)
  S.coyote = S.onGround ? COYOTE : Math.max(0, S.coyote - dt);
  if (controls.consumeJump()) {
    if (S.onGround || S.coyote > 0) {
      vr = JUMP; S.onGround = false; S.coyote = 0; sfx.jump(); vibre('leger'); burst(S.pos, 8, 0xbfd0ff, 2, up);
    } else if (S.airJumps > 0) {
      S.airJumps--; vr = Math.max(vr, JUMP2); sfx.jump2(); vibre('leger'); fanal.spin(); burst(S.pos, 18, 0xff8ad8, 3, up);
    }
  }
  S.vel.copy(vt).addScaledVector(up, vr);
  S.pos.addScaledVector(S.vel, dt);

  // sol
  const n = tmp2.copy(S.pos).sub(P.center);
  const dist = n.length(); n.normalize();
  const snap = S.onGround && vr <= 0 ? 0.35 : 0, sol = P.surface(n);
  if (dist <= sol + snap) {
    S.pos.copy(P.center).addScaledVector(n, sol);
    const vrNow = S.vel.dot(n);
    if (vrNow < 0) S.vel.addScaledVector(n, -vrNow);
    if (!S.onGround && vrNow < -8) { sfx.land(); vibre('moyen'); fanal.land(); if (vrNow < -14) fanal.setMood('surpris', 0.6); burst(S.pos, 6, 0xffd6f0, 2, n); }
    S.onGround = true; S.airJumps = 1;
  } else if (dist > sol + 0.4) S.onGround = false;

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
  P.beacon.ready = true; sfx.ready();
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
      sfx.ember(got); vibre('leger'); fanal.setMood('ravi', 0.9); burst(e.holder.position, 26, 0xffa040, 4);
      verifierPhare();
      hud();
    }
  }

  // rallumer le phare
  if (P.beacon.ready && !P.lit && chest.distanceTo(P.beacon.pos) < P.beacon.portee + (P.boss ? 1.5 : 0)) {
    P.lit = true; sfx.beacon(); vibre('fort'); fanal.setMood('super', 3);
    save.allumes[cle(S.g, S.i)] = true;
    burst(P.beacon.pos.clone().addScaledVector(P.beacon.dir, 3), 90, 0xffd27a, 9);
    if (P.boss) {
      if (S.g + 1 >= NB_GALAXIES) {
        S.state = 'fin'; ecranAllume(false); sauver(save);
        setTimeout(() => { sfx.victory(); stopMusic(); $('temps').textContent = `${save.gardiens} gardiens libérés · ${save.eclats} éclats d'étoile`; $('fin').hidden = false; }, 2600);
        message('Le dernier Grand Phare brille !', '', 2600);
      } else {
        save.debloquee = Math.max(save.debloquee, S.g + 1);
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

// ---------- Ombrelles ----------
function updateOmbrelles(dt) {
  S.invuln = Math.max(0, S.invuln - dt);
  const evts = ombrelles.update(dt, { pos: S.pos, up: S.up, vel: S.vel, actif: S.state === 'jeu' });
  for (const ev of evts) {
    // rebond sur une Ombrelle ; sur le boss, Fanal est aussi éjecté sur le côté pour ne pas retomber dessus
    const rebond = () => {
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
    if (ev.type === 'ecrase') {
      rebond(); sfx.ecrase(); vibre('moyen'); fanal.setMood('ravi', 0.8); burst(ev.pos, 30, 0xb48cff, 5);
    }
    if (ev.type === 'boss_touche') {
      rebond(); sfx.ecrase(); vibre('fort'); fanal.setMood('ravi', 0.8); burst(ev.pos, 50, 0xffc23d, 7);
      message('Touché !', `Encore ${ev.o.vie} ${ev.o.vie > 1 ? 'coups' : 'coup'}`, 1400); hud();
    }
    if (ev.type === 'boss_vaincu') {
      rebond(); sfx.victory(); vibre('fort'); fanal.setMood('super', 2.5); burst(ev.pos, 120, 0xffc23d, 10);
      message('La Grande Ombrelle est vaincue !', planet.embers.every(e => e.taken) ? 'Va rallumer le Grand Phare 🏮' : 'Ramasse les dernières braises 🔥', 3200);
      setTimeout(() => { hud(); verifierPhare(); }, 50);
    }
    if (ev.type === 'touche' && S.invuln <= 0) {
      S.invuln = 1.6;
      const recul = projectOnPlane(S.pos.clone().sub(ev.pos), S.up);
      if (recul.lengthSq() < 1e-4) recul.copy(S.face).negate();
      S.vel.copy(recul.normalize().multiplyScalar(ev.o.boss ? 13 : 9)).addScaledVector(S.up, 7); S.onGround = false;
      sfx.touche(); vibre('fort'); fanal.setMood('peur', 1.4); burst(S.pos, 16, 0x5b2d8f, 3);
      // l'Ombrelle souffle une braise, qui retourne à sa place
      const P = planet, prise = P.lit ? null : P.embers.filter(e => e.taken).pop();
      if (prise) {
        prise.taken = false; prise.holder.visible = true; S.power--; P.beacon.ready = false;
        burst(prise.holder.position, 20, 0xffa040, 3);
        message('Une Ombrelle a soufflé une braise !', 'Elle est retournée à sa place', 2200);
        hud();
      }
    }
  }
}

// ---------- caméra ----------
function updateCamera(dt, instant = false) {
  if (S.camLibre) { camera.position.copy(S.camLibre.pos); camera.up.set(0, 1, 0); camera.lookAt(S.camLibre.cible); return; }   // vue libre (captures)
  if (S.state === 'trajet') { trajet.camera(camera); return; }
  if (!planet) { camera.position.set(0, 0, 30); camera.lookAt(0, 0, 0); return; }
  // en portrait, l'écran est étroit : on recule la caméra pour voir autour de Fanal
  const zoom = camera.aspect < 1 ? 1.25 + (1 - camera.aspect) * 0.9 : 1;
  const desired = S.pos.clone().addScaledVector(S.up, CAM_HEIGHT * zoom).addScaledVector(S.camHeading, -CAM_DIST * zoom);
  const k = instant ? 1 : 1 - Math.exp(-6 * dt);
  camera.position.lerp(desired, k);
  camera.up.lerp(S.up, k).normalize();
  camera.lookAt(S.pos.clone().addScaledVector(S.up, 1.3));
}

function placeFanal(dt) {
  const o = fanal.object;
  o.position.copy(S.pos);
  o.visible = S.state !== 'trajet' && (S.invuln <= 0 || Math.floor(S.invuln * 12) % 2 === 0);   // clignote après un coup
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
  if ((S.state !== 'jeu' && S.state !== 'trajet') || rawDt > 0.25) return;
  qT += rawDt; qN++;
  if (qT < 3) return;
  const fps = qN / qT; qT = 0; qN = 0;
  if (fps < 45 && qPix > 0.75) { qPix = Math.max(0.75, qPix - 0.5); renderer.setPixelRatio(qPix); resize(); }
}

function frame(now) {
  requestAnimationFrame(frame);
  if (enPause) return;
  const raw = (now - last) / 1000; last = now; qualite(raw);
  const dt = Math.min(1 / 30, raw);
  clock += dt;
  if (S.state === 'jeu') { S.time += dt; updatePlayer(dt); updateGame(dt); }
  else if (S.state === 'trajet') { S.time += dt; updateTrajet(dt); }
  else if (S.state === 'titre') { S.camHeading.applyAxisAngle(S.up, dt * 0.25); }
  if (planet) { animatePlanet(planet, dt, clock); updateOmbrelles(dt); }
  if (S.state !== 'trajet' && planet) vaisseau.animate(dt, 0, 0);
  if (S.state !== 'jeu') $('embarquer').hidden = true;
  updateParts(dt);
  placeFanal(dt);
  updateCamera(dt);
  sky.position.copy(camera.position);
  renderer.render(scene, camera);
}

// écran titre : Brumelune en fond
charger(0, 0); S.state = 'titre'; modeInterface('titre'); stopMusic();
updateCamera(0, true);
requestAnimationFrame(frame);

// accès pour les tests automatiques
window.__jeu = { S, get planet() { return planet; }, get save() { return save; }, ombrelles, trajet, aller, charger, ouvrirCarte };
