// Fanal, le petit gardien de phare — d'après docs/style/concepts/fanal-vues.jpg.
// Globe de verre, cadre framboise, rivets et anse dorés, écharpe turquoise, petits pieds dorés.
// Sa flamme est son visage : elle est dessinée par le code pour changer d'expression en direct.
// Si public/modeles/fanal.glb existe, il remplace le corps (la flamme reste celle du code).
import * as THREE from 'three';
import { morceaux } from './modeles.js';

// ---------- visages de la flamme ----------
const HUMEURS = {
  content:  { flamme: ['#fffbe6', '#ffd23f', '#ff7a00'], lumiere: 0xffa040 },
  ravi:     { flamme: ['#fffbe6', '#ffd23f', '#ff7a00'], lumiere: 0xffb347 },
  surpris:  { flamme: ['#fffbe6', '#ffd23f', '#ff7a00'], lumiere: 0xffa040 },
  peur:     { flamme: ['#f2fdff', '#7fe7ff', '#3a7bff'], lumiere: 0x6fc8ff },
  super:    { flamme: ['#fff0fb', '#ff8ad8', '#ff3d81'], lumiere: 0xff5fc8 },
};

function dessinerFlamme(humeur, avecVisage) {
  const W = 256, H = 320, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'), [c0, c1, c2] = HUMEURS[humeur].flamme;
  // flamme à trois pointes
  const g = x.createRadialGradient(128, 215, 10, 128, 190, 150);
  g.addColorStop(0, c0); g.addColorStop(0.45, c1); g.addColorStop(1, c2);
  x.fillStyle = g; x.beginPath();
  x.moveTo(128, 300);
  x.bezierCurveTo(30, 300, 20, 200, 60, 140);
  x.quadraticCurveTo(70, 175, 92, 170);
  x.bezierCurveTo(80, 110, 110, 60, 140, 18);
  x.bezierCurveTo(150, 80, 175, 110, 180, 150);
  x.quadraticCurveTo(195, 130, 198, 110);
  x.bezierCurveTo(240, 170, 236, 300, 128, 300);
  x.fill();
  if (!avecVisage) return new THREE.CanvasTexture(c);

  const nuit = '#3b1f5c';
  const oeil = (cx, cy, rx = 18, ry = 24) => {
    x.fillStyle = nuit; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.fill();
    x.fillStyle = '#fff'; x.beginPath(); x.arc(cx - rx * 0.3, cy - ry * 0.35, rx * 0.36, 0, 7); x.fill();
    x.beginPath(); x.arc(cx + rx * 0.3, cy + ry * 0.3, rx * 0.15, 0, 7); x.fill();
  };
  const trait = (pts, w = 7) => { x.strokeStyle = nuit; x.lineWidth = w; x.lineCap = 'round'; x.beginPath(); pts(); x.stroke(); };
  const joues = () => { x.fillStyle = 'rgba(255,95,162,.6)'; x.beginPath(); x.ellipse(72, 238, 17, 11, 0, 0, 7); x.ellipse(184, 238, 17, 11, 0, 0, 7); x.fill(); };

  if (humeur === 'content') { oeil(98, 208); oeil(158, 208); joues(); trait(() => { x.moveTo(114, 246); x.quadraticCurveTo(128, 258, 142, 246); }); }
  if (humeur === 'ravi') {
    trait(() => { x.moveTo(82, 212); x.quadraticCurveTo(98, 192, 114, 212); x.moveTo(142, 212); x.quadraticCurveTo(158, 192, 174, 212); }, 8);
    joues(); x.fillStyle = nuit; x.beginPath(); x.moveTo(108, 238); x.quadraticCurveTo(128, 272, 148, 238); x.closePath(); x.fill();
    x.fillStyle = '#ff3d81'; x.beginPath(); x.ellipse(128, 254, 10, 6, 0, 0, 7); x.fill();
  }
  if (humeur === 'surpris') { oeil(98, 204, 20, 28); oeil(158, 204, 20, 28); joues(); x.fillStyle = nuit; x.beginPath(); x.ellipse(128, 254, 10, 14, 0, 0, 7); x.fill(); }
  if (humeur === 'peur') {
    oeil(100, 212, 15, 20); oeil(156, 212, 15, 20);
    trait(() => { x.moveTo(82, 182); x.lineTo(110, 192); x.moveTo(174, 182); x.lineTo(146, 192); }, 6);
    joues(); trait(() => { x.moveTo(110, 252); x.quadraticCurveTo(119, 244, 128, 252); x.quadraticCurveTo(137, 260, 146, 252); }, 6);
  }
  if (humeur === 'super') {
    oeil(100, 212, 17, 19); oeil(156, 212, 17, 19);
    trait(() => { x.moveTo(78, 186); x.lineTo(114, 200); x.moveTo(178, 186); x.lineTo(142, 200); }, 8);
    joues(); x.fillStyle = nuit; x.beginPath(); x.moveTo(104, 238); x.quadraticCurveTo(128, 266, 152, 238); x.closePath(); x.fill();
    x.fillStyle = '#fff'; x.fillRect(110, 238, 36, 7);
  }
  return new THREE.CanvasTexture(c);
}

export function createFanal(glowTexture, modeles = {}) {
  const g = new THREE.Group();
  const corps = new THREE.Group(); g.add(corps);      // tout ce qui se dandine
  const framboise = new THREE.MeshStandardMaterial({ color: 0xd8285f, roughness: 0.35, metalness: 0.1 });
  const or = new THREE.MeshStandardMaterial({ color: 0xffc23d, roughness: 0.25, metalness: 0.7 });
  const lagon = new THREE.MeshStandardMaterial({ color: 0x2fd3c4, roughness: 0.75 });
  const verre = new THREE.MeshStandardMaterial({ color: 0xffeef6, transparent: true, opacity: 0.22, roughness: 0.05, depthWrite: false });
  const add = (geo, mat, x, y, z, parent = corps) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };

  // pieds (bottines dorées)
  const pieds = [];
  for (const sx of [-0.17, 0.17]) {
    const p = new THREE.Group(); p.position.set(sx, 0.3, 0); g.add(p);
    add(new THREE.CylinderGeometry(0.07, 0.08, 0.2, 10), or, 0, -0.12, 0, p);
    const bout = add(new THREE.SphereGeometry(0.11, 12, 8), or, 0, -0.24, 0.04, p); bout.scale.set(1, 0.6, 1.35);
    pieds.push(p);
  }

  let modeleCorps = null;
  if (modeles.fanal) {
    modeleCorps = new THREE.Group();
    for (const { geo, mat } of morceaux(modeles.fanal, 1.75)) modeleCorps.add(new THREE.Mesh(geo, mat));
    corps.add(modeleCorps);
    pieds.forEach(p => (p.visible = false));
  } else {
    // socle + rivets
    add(new THREE.CylinderGeometry(0.4, 0.42, 0.26, 24), framboise, 0, 0.42, 0);
    add(new THREE.CylinderGeometry(0.43, 0.43, 0.06, 24), framboise, 0, 0.56, 0);
    // globe de verre
    add(new THREE.SphereGeometry(0.5, 28, 20), verre, 0, 0.93, 0);
    // chapeau + rivets
    add(new THREE.CylinderGeometry(0.36, 0.44, 0.2, 24), framboise, 0, 1.4, 0);
    add(new THREE.CylinderGeometry(0.2, 0.24, 0.16, 18), framboise, 0, 1.56, 0);
    const rivet = new THREE.SphereGeometry(0.035, 8, 6);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      add(rivet, or, Math.sin(a) * 0.43, 1.42, Math.cos(a) * 0.43);
      add(rivet, or, Math.sin(a) * 0.42, 0.45, Math.cos(a) * 0.42);
    }
    // montants latéraux courbes
    for (const cote of [1, -1]) {
      const arc = Math.PI * 0.62, m = add(new THREE.TorusGeometry(0.6, 0.045, 8, 28, arc), framboise, 0, 0.93, 0);
      m.rotation.z = cote > 0 ? -arc / 2 : Math.PI - arc / 2;
    }
    // anse dorée
    add(new THREE.TorusGeometry(0.22, 0.045, 10, 24, Math.PI), or, 0, 1.62, 0);
  }

  // écharpe : un tour de cou + deux pans qui flottent
  const echarpe = add(new THREE.TorusGeometry(0.36, 0.1, 12, 32), lagon, 0, 0.55, 0);
  echarpe.rotation.x = Math.PI / 2;
  const pans = [];
  for (const [px, rz] of [[0.3, 0.25], [0.18, -0.1]]) {
    const pivot = new THREE.Group(); pivot.position.set(px - 0.24, 0.55, -0.36); corps.add(pivot);
    const pan = add(new THREE.BoxGeometry(0.13, 0.32, 0.05), lagon, 0, -0.16, 0, pivot);
    pivot.rotation.z = rz; pans.push(pivot);
  }

  // flamme : visage devant, flamme seule derrière (visible à travers le verre)
  const textures = {}, dos = {};
  for (const h of Object.keys(HUMEURS)) { textures[h] = dessinerFlamme(h, true); dos[h] = dessinerFlamme(h, false); }
  const plan = new THREE.PlaneGeometry(0.72, 0.9);
  const faceMat = new THREE.MeshBasicMaterial({ map: textures.content, transparent: true, depthWrite: false, toneMapped: false });
  const dosMat = new THREE.MeshBasicMaterial({ map: dos.content, transparent: true, depthWrite: false, toneMapped: false });
  const flamme = new THREE.Group(); flamme.position.set(0, 0.9, 0); corps.add(flamme);
  const face = new THREE.Mesh(plan, faceMat); face.position.z = 0.04; flamme.add(face);
  const arriere = new THREE.Mesh(plan, dosMat); arriere.rotation.y = Math.PI; arriere.position.z = -0.04; flamme.add(arriere);

  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color: 0xffa040, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.setScalar(2.3); halo.position.y = 0.9; corps.add(halo);
  const light = new THREE.PointLight(0xffa040, 6, 9, 1.6); light.position.y = 0.9; g.add(light);

  let humeur = 'content', retour = 0, t = 0, ecrase = 0;
  const appliquer = h => {
    humeur = h; faceMat.map = textures[h]; dosMat.map = dos[h];
    halo.material.color.setHex(HUMEURS[h].lumiere); light.color.setHex(HUMEURS[h].lumiere);
  };

  return {
    object: g,
    // change d'expression ; duree en secondes, puis retour à « content » (0 = permanent)
    setMood(h, duree = 0) { if (HUMEURS[h]) { appliquer(h); retour = duree; } },
    land() { ecrase = 1; },
    // speed : vitesse au sol (0 à 1), air : en l'air, power : nombre de braises (fait grandir la flamme)
    animate(dt, speed, air, power) {
      t += dt;
      if (retour > 0 && (retour -= dt) <= 0) appliquer('content');
      const p = (humeur === 'peur' ? 0.75 : 1) * (1 + Math.min(power, 20) * 0.025);
      flamme.scale.set(p * (1 + Math.sin(t * 19) * 0.03), p * (1 + Math.sin(t * 23) * 0.05), 1);
      flamme.rotation.z = Math.sin(t * 7) * 0.05;
      halo.material.opacity = 0.42 + Math.min(power, 20) * 0.02 + Math.sin(t * 9) * 0.05;
      light.intensity = 5 + Math.min(power, 20) * 0.6;
      // dandinement, saut, écrasement à l'atterrissage
      ecrase = Math.max(0, ecrase - dt * 5);
      const sq = air ? 1.07 : 1 - ecrase * 0.18;
      corps.scale.set(2 - sq, sq, 2 - sq);
      corps.rotation.z = air ? 0 : Math.sin(t * 15) * 0.1 * speed;
      corps.position.y = air ? 0 : Math.abs(Math.sin(t * 15)) * 0.07 * speed;
      const pas = air ? 0 : Math.sin(t * 15) * 0.7 * speed;
      pieds[0].rotation.x = air ? -0.5 : pas; pieds[1].rotation.x = air ? 0.4 : -pas;
      // l'écharpe flotte vers l'arrière quand il court ou saute
      const vent = Math.min(1, speed + (air ? 0.7 : 0));
      pans.forEach((pv, i) => { pv.rotation.x = vent * 1.1 + Math.sin(t * 13 + i) * 0.18 * (0.3 + vent); });
    },
  };
}
