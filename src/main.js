// Astres éteints — boucle de jeu : gravité sphérique, caméra, braises, phares, tremplins.
import * as THREE from 'three';
import { createControls } from './controls.js';
import { initAudio, sfx, startMusic, stopMusic, toggleMute, pauseAudio, resumeAudio } from './audio.js';
import { vibre, pleinEcran, ecranAllume } from './mobile.js';
import { createFanal } from './fanal.js';
import { createWorld, createSky, makeGlowTexture, applyLight } from './world.js';

// ---------- réglages du gameplay ----------
const GRAVITY = 28, JUMP = 11.5, RUN = 7.5, ACC_GROUND = 14, ACC_AIR = 4;
const FLIGHT_TIME = 2.6, CAM_DIST = 7.5, CAM_HEIGHT = 3.2;

// ---------- rendu ----------
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0d22);
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

scene.add(new THREE.HemisphereLight(0xaab8ff, 0x2c2242, 1.25));
const sun = new THREE.DirectionalLight(0xfff2dd, 1.3); sun.position.set(30, 60, 25); scene.add(sun);

const glow = makeGlowTexture();
createSky(scene, glow);
const planets = createWorld(scene, glow);
const fanal = createFanal(glow);
scene.add(fanal.object);
const controls = createControls();

// ---------- particules (étincelles) ----------
const PN = 400, pPos = new Float32Array(PN * 3), pCol = new Float32Array(PN * 3), parts = [];
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.45, map: glow, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));
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

// ---------- état du joueur ----------
const S = {
  state: 'titre',              // titre | jeu | vol | fin
  pos: new THREE.Vector3(), vel: new THREE.Vector3(),
  up: new THREE.Vector3(0, 1, 0), face: new THREE.Vector3(0, 0, 1), camHeading: new THREE.Vector3(0, 0, -1),
  onGround: false, planet: planets[0], current: 0, power: 0, time: 0,
  flight: null,
};
const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), mat = new THREE.Matrix4();
S.pos.copy(planets[0].center).add(new THREE.Vector3(0, planets[0].radius, 0));

// ---------- interface ----------
const $ = id => document.getElementById(id);
let msgTimer = 0;
function message(text, sub = '', ms = 2600) {
  $('msg').innerHTML = text + (sub ? `<small>${sub}</small>` : '');
  $('msg').classList.add('on');
  clearTimeout(msgTimer); msgTimer = setTimeout(() => $('msg').classList.remove('on'), ms);
}
function hud() {
  const p = planets[S.current];
  $('planete').textContent = p.name;
  $('planeteNum').textContent = `Planète ${S.current + 1} / ${planets.length}`;
  const got = p.embers.filter(e => e.taken).length;
  $('braises').textContent = p.lit ? '✓ phare rallumé' : `${got} / ${p.embers.length}`;
}
// ---------- sauvegarde : on reprend à la dernière planète atteinte ----------
const SAVE = 'astres_eteints_sauvegarde';
const lireSauvegarde = () => { try { return JSON.parse(localStorage.getItem(SAVE)) || null; } catch { return null; } };
const sauver = d => { try { d ? localStorage.setItem(SAVE, JSON.stringify(d)) : localStorage.removeItem(SAVE); } catch {} };
const sauvegarde = lireSauvegarde();
if (sauvegarde && sauvegarde.planete > 0 && sauvegarde.planete < planets.length) {
  $('continuer').hidden = false;
  $('continuer').textContent = `Continuer — ${planets[sauvegarde.planete].name}`;
  $('jouer').textContent = 'Nouvelle partie';
}
function demarrer(n, temps) {
  initAudio(); pleinEcran(); ecranAllume(true);
  for (let k = 0; k < n; k++) {             // planètes déjà rallumées
    const p = planets[k];
    p.lit = true; p.litT = 1; applyLight(p, 1); p.beacon.ready = true;
    p.embers.forEach(e => { e.taken = true; e.holder.visible = false; S.power++; });
  }
  if (n > 0) {
    const p = planets[n];
    S.current = n; S.up.set(0, 1, 0);
    S.pos.copy(p.center).addScaledVector(S.up, p.radius);
    S.camHeading.set(0, 0, -1); S.face.set(0, 0, 1);
    updateCamera(0, true);
  }
  startMusic(n);
  $('titre').hidden = true; S.state = 'jeu'; S.time = temps || 0;
  hud();
  message(planets[n].name, n ? 'Encore des braises à trouver…' : 'Ramasse les braises 🔥 pour rallumer le phare', 3500);
}
$('jouer').onclick = () => { sauver(null); demarrer(0); };
$('continuer').onclick = () => demarrer(sauvegarde.planete, sauvegarde.temps);
$('rejouer').onclick = () => { sauver(null); location.reload(); };

// appli mise en arrière-plan (appel, autre appli…) : tout se met en pause
let enPause = false;
document.addEventListener('visibilitychange', () => {
  enPause = document.hidden;
  if (enPause) { pauseAudio(); controls.reset(); } else { resumeAudio(); last = performance.now(); }
});
$('son').onclick = () => { $('son').textContent = toggleMute() ? '🔇' : '🔊'; };

// ---------- outils ----------
const projectOnPlane = (v, n) => v.addScaledVector(n, -v.dot(n));
function nearestPlanet(pos) {
  let best = null, bd = Infinity;
  for (const p of planets) { const d = pos.distanceTo(p.center) - p.radius; if (d < bd) { bd = d; best = p; } }
  return best;
}

// ---------- logique ----------
function updatePlayer(dt) {
  const P = S.planet = nearestPlanet(S.pos);
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
  if (controls.consumeJump() && S.onGround) { vr = JUMP; S.onGround = false; sfx.jump(); vibre('leger'); burst(S.pos, 8, 0xbfd0ff, 2, up); }
  S.vel.copy(vt).addScaledVector(up, vr);
  S.pos.addScaledVector(S.vel, dt);

  // sol
  const n = tmp2.copy(S.pos).sub(P.center);
  const dist = n.length(); n.normalize();
  const snap = S.onGround && vr <= 0 ? 0.35 : 0;
  if (dist <= P.radius + snap) {
    S.pos.copy(P.center).addScaledVector(n, P.radius);
    const vrNow = S.vel.dot(n);
    if (vrNow < 0) S.vel.addScaledVector(n, -vrNow);
    if (!S.onGround && vrNow < -8) { sfx.land(); vibre('moyen'); burst(S.pos, 6, 0xaab0d8, 2, n); }
    S.onGround = true;
  } else if (dist > P.radius + 0.4) S.onGround = false;

  // obstacles (phares) : on est repoussé sur le côté
  for (const o of P.obstacles) {
    const base = tmp.copy(P.center).addScaledVector(o.dir, P.radius);
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
  if (S.pos.distanceTo(P.center) > P.radius * 5) respawn();
}

function respawn() {
  const P = planets[S.current];
  S.pos.copy(P.center).addScaledVector(S.up.set(0, 1, 0), P.radius + 1);
  S.vel.set(0, 0, 0); sfx.respawn();
}

function updateGame(dt) {
  const P = planets[S.current];
  const chest = S.pos.clone().addScaledVector(S.up, 0.7);

  // braises
  for (const e of P.embers) {
    if (e.taken) continue;
    if (chest.distanceTo(e.holder.position) < 1.25) {
      e.taken = true; e.holder.visible = false; S.power++;
      const got = P.embers.filter(x => x.taken).length;
      sfx.ember(got); vibre('leger'); burst(e.holder.position, 26, 0xffa040, 4);
      if (got === P.embers.length) {
        P.beacon.ready = true; sfx.ready();
        message('Toutes les braises !', 'Va rallumer le phare 🏮');
      }
      hud();
    }
  }

  // rallumer le phare
  if (P.beacon.ready && !P.lit && chest.distanceTo(P.beacon.pos) < 2.2) {
    P.lit = true; sfx.beacon(); vibre('fort');
    sauver(P.final ? null : { planete: S.current + 1, temps: Math.round(S.time) });
    burst(P.beacon.pos.clone().addScaledVector(P.beacon.dir, 3), 90, 0xffd27a, 9);
    if (P.final) {
      S.state = 'fin'; ecranAllume(false);
      setTimeout(() => { sfx.victory(); stopMusic(); $('temps').textContent = `Temps : ${Math.floor(S.time / 60)} min ${String(Math.floor(S.time % 60)).padStart(2, '0')} s`; $('fin').hidden = false; }, 2200);
      message('Le Grand Phare brille !', '', 2200);
    } else {
      P.tremplin.active = true;
      message('Phare rallumé !', 'Le tremplin d\'aurore t\'attend ✨', 3000);
    }
    hud();
  }

  // tremplin d'aurore → planète suivante
  if (P.tremplin && P.tremplin.active && S.pos.distanceTo(P.tremplin.pos) < 1.3) launch(P, planets[S.current + 1]);
}

function launch(from, to) {
  const start = S.pos.clone();
  const landDir = start.clone().sub(to.center).normalize();
  const end = to.center.clone().addScaledVector(landDir, to.radius);
  const mid = start.clone().add(end).multiplyScalar(0.5);
  const lift = from.tremplin.dir.clone().add(landDir).normalize().multiplyScalar(start.distanceTo(end) * 0.35);
  S.flight = { t: 0, curve: new THREE.QuadraticBezierCurve3(start, mid.add(lift), end), to };
  S.state = 'vol'; S.vel.set(0, 0, 0); S.onGround = false;
  sfx.launch(); vibre('fort'); burst(start, 50, 0x9ff6ff, 7, from.tremplin.dir);
}

function updateFlight(dt) {
  const F = S.flight;
  F.t = Math.min(1, F.t + dt / FLIGHT_TIME);
  const k = F.t < 0.5 ? 2 * F.t * F.t : 1 - Math.pow(-2 * F.t + 2, 2) / 2;
  const prev = S.pos.clone();
  S.pos.copy(F.curve.getPoint(k));
  const dir = S.pos.clone().sub(prev);
  if (dir.lengthSq() > 1e-6) S.face.copy(dir.normalize());
  S.up.lerp(S.pos.clone().sub(F.to.center).normalize(), 1 - Math.exp(-3 * dt)).normalize();
  if (Math.random() < 0.6) burst(S.pos, 2, 0x9ff6ff, 1);
  if (F.t >= 1) {
    S.current = F.to.index; S.state = 'jeu'; S.flight = null; S.onGround = true;
    S.up.copy(S.pos).sub(F.to.center).normalize();
    projectOnPlane(S.camHeading.copy(S.face), S.up);
    if (S.camHeading.lengthSq() < 1e-4) S.camHeading.set(1, 0, 0).cross(S.up);
    S.camHeading.normalize();
    sfx.land(); vibre('moyen'); startMusic(S.current); hud();
    message(F.to.name, F.to.final ? 'Le dernier phare de l\'archipel' : 'Encore des braises à trouver…', 3000);
  }
}

// ---------- animation du monde ----------
let clock = 0;
function animateWorld(dt) {
  clock += dt;
  for (const p of planets) {
    for (const e of p.embers) {
      if (e.taken) continue;
      e.inner.position.y = Math.sin(clock * 2.5 + e.phase) * 0.15;
      e.gem.rotation.y += dt * 2;
    }
    const b = p.beacon;
    if (p.lit) {
      p.litT = Math.min(1, p.litT + dt / 2.2);
      applyLight(p, p.litT);
      b.lamp.emissiveIntensity = 2.2 + Math.sin(clock * 3) * 0.3;
      b.halo.material.opacity = 0.9 * p.litT;
      b.light.intensity = 60 * p.litT;
    } else if (b.ready) {
      b.lamp.emissiveIntensity = 0.6 + Math.sin(clock * 6) * 0.5;   // le phare clignote : « viens me rallumer »
      b.halo.material.opacity = 0.25 + Math.sin(clock * 6) * 0.2;
    }
    if (p.tremplin && p.tremplin.active) {
      const t = p.tremplin;
      t.disc.emissiveIntensity = 1.2 + Math.sin(clock * 4) * 0.4;
      t.swirl.material.opacity = 0.9;
      t.swirl.rotation.z += dt * 3;
      t.swirl.position.y = 0.35 + (clock * 1.2 % 1) * 1.6;
      t.col.material.opacity = 0.55 + Math.sin(clock * 5) * 0.15;
    }
  }
}

// ---------- caméra ----------
function updateCamera(dt, instant = false) {
  // en portrait, l'écran est étroit : on recule la caméra pour voir autour de Fanal
  const zoom = camera.aspect < 1 ? 1.25 + (1 - camera.aspect) * 0.9 : 1;
  const desired = S.pos.clone().addScaledVector(S.up, CAM_HEIGHT * zoom).addScaledVector(S.camHeading, -CAM_DIST * zoom);
  if (S.state === 'vol') desired.copy(S.pos).addScaledVector(S.up, 6).addScaledVector(S.face, -12);
  const k = instant ? 1 : 1 - Math.exp(-(S.state === 'vol' ? 3 : 6) * dt);
  camera.position.lerp(desired, k);
  camera.up.lerp(S.up, k).normalize();
  camera.lookAt(S.pos.clone().addScaledVector(S.up, 1.3));
}

function placeFanal(dt) {
  const o = fanal.object;
  o.position.copy(S.pos);
  const z = S.face.clone(); projectOnPlane(z, S.up).normalize();
  const x = new THREE.Vector3().crossVectors(S.up, z).normalize();
  mat.makeBasis(x, S.up, z);
  o.quaternion.setFromRotationMatrix(mat);
  const speed = Math.min(1, projectOnPlane(S.vel.clone(), S.up).length() / RUN);
  fanal.animate(dt, speed, !S.onGround, S.power);
}

// ---------- boucle ----------
let last = performance.now();
// qualité automatique : si le téléphone peine, on baisse la résolution du rendu
let qPix = Math.min(devicePixelRatio, 2), qT = 0, qN = 0;
function qualite(rawDt) {
  if (S.state !== 'jeu' || rawDt > 0.25) return;
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
  if (S.state === 'jeu') { S.time += dt; updatePlayer(dt); updateGame(dt); }
  else if (S.state === 'vol') { S.time += dt; updateFlight(dt); }
  else if (S.state === 'titre') { S.camHeading.applyAxisAngle(S.up, dt * 0.25); }
  animateWorld(dt);
  updateParts(dt);
  placeFanal(dt);
  updateCamera(dt);
  renderer.render(scene, camera);
}
updateCamera(0, true);
requestAnimationFrame(frame);

// accès pour les tests automatiques
window.__jeu = { S, planets, launch };
