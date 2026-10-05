// L'Archipel du Ciel : planètes rondes « pâte à modeler », phares, braises, tremplins, décors, ciel.
// Style : docs/style/CONCEPTS.md — éteint = gris-bleu fade, rallumé = couleurs vives qui partent du phare.
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { allumable, uniformsPlanete, regleVague } from './lumiere.js';
import { DECORS, MATIERES } from './decor.js';
import { morceaux } from './modeles.js';

export const LEVELS = [
  {
    name: 'Brumelune', center: [0, 0, 0], radius: 8, seed: 3, embers: 6, ombrelles: 2,
    beacon: [0.15, 0.1, 1], tremplin: [-0.5, 0.15, 0.85],
    relief: 0.55, freq: 1.3, bosse: { h: 1.2, w: 0.42 },
    sol: { bas: 0x34bf8f, base: 0x5fe0b0, haut: 0x9af2cc, bosse: 0x6fe6b8 }, motif: 1, motifCol: 0xffffff, herbe: 0x2aa77a,
    decors: [['champiRose', 12], ['champiJaune', 9], ['maison', 3], ['touffe', 34], ['rocher', 5]],
  },
  {
    name: 'Cendrine', center: [46, 20, -26], radius: 11, seed: 11, embers: 8, ombrelles: 4,
    beacon: [-0.6, 0.6, 0.5], tremplin: [-0.2, 0.75, 0.6],
    relief: 0.8, freq: 1.1, bosse: { h: 2.4, w: 0.36 },
    sol: { bas: 0xd9601f, base: 0xff8a3d, haut: 0xffad66, bosse: 0x7a4a3a }, motif: 2, motifCol: 0xffd23f, scale: 3.6, herbe: 0xb8471a,
    decors: [['cristalRose', 16], ['cristalJaune', 12], ['rocher', 12]],
  },
  {
    name: 'Le Grand Phare', center: [8, 54, -66], radius: 6, seed: 21, embers: 5, ombrelles: 3, final: true,
    beacon: [0.2, 1, 0.2], tremplin: null,
    relief: 0.4, freq: 1.5, bosse: { h: 0.9, w: 0.5 },
    sol: { bas: 0x8f6ee6, base: 0xb89cff, haut: 0xdcccff, bosse: 0xc7b2ff }, motif: 3, motifCol: 0xfff2a8, scale: 5, herbe: 0x7a58d6,
    decors: [['cristalBleu', 8], ['champiRose', 6], ['touffe', 18], ['rocher', 3]],
  },
];

// ---------- hasard reproductible et bruit (relief) ----------
function rng(seed) { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); }
function randomDir(r) { const u = r() * 2 - 1, a = r() * Math.PI * 2, s = Math.sqrt(1 - u * u); return new THREE.Vector3(s * Math.cos(a), u, s * Math.sin(a)); }
function h3(x, y, z) { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); }
function bruit(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  let fx = x - ix, fy = y - iy, fz = z - iz;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); fz = fz * fz * (3 - 2 * fz);
  const L = (a, b, t) => a + (b - a) * t;
  return L(L(L(h3(ix, iy, iz), h3(ix + 1, iy, iz), fx), L(h3(ix, iy + 1, iz), h3(ix + 1, iy + 1, iz), fx), fy),
           L(L(h3(ix, iy, iz + 1), h3(ix + 1, iy, iz + 1), fx), L(h3(ix, iy + 1, iz + 1), h3(ix + 1, iy + 1, iz + 1), fx), fy), fz);
}

const Y = new THREE.Vector3(0, 1, 0);
export function makeGlowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

// ---------- ciel : dégradé violet → rose, étoiles, galaxie ----------
export function createSky(scene, glow) {
  const sky = new THREE.Mesh(new THREE.SphereGeometry(700, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec3 vD; void main(){
      float t = vD.y * 0.5 + 0.5;
      vec3 rose = vec3(1.0, 0.44, 0.68), violet = vec3(0.36, 0.17, 0.78), nuit = vec3(0.11, 0.05, 0.31);
      vec3 c = mix(rose, violet, smoothstep(0.0, 0.5, t)); c = mix(c, nuit, smoothstep(0.5, 1.0, t));
      gl_FragColor = vec4(c, 1.0); }`,
  }));
  sky.frustumCulled = false; sky.renderOrder = -2;
  scene.add(sky);

  const r = rng(99), n = 1600, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const d = randomDir(r).multiplyScalar(380 + r() * 120); pos.set([d.x, d.y, d.z], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 2.4, map: glow, color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: false })));

  // étoiles à 5 branches colorées
  const starTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 12 : 30; x.lineTo(32 + Math.cos(a) * rr, 32 + Math.sin(a) * rr); }
    x.closePath(); x.shadowColor = '#fff'; x.shadowBlur = 8; x.fill();
    return new THREE.CanvasTexture(c);
  })();
  const couleurs = [0xffe066, 0xff8ad8, 0x8feaff, 0xffffff, 0xc9a7ff];
  for (let i = 0; i < 46; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, color: couleurs[i % couleurs.length], transparent: true, depthWrite: false }));
    s.position.copy(randomDir(r).multiplyScalar(420)); s.scale.setScalar(5 + r() * 7);
    scene.add(s);
  }

  // galaxie spirale
  const gc = document.createElement('canvas'); gc.width = gc.height = 512; const gx = gc.getContext('2d');
  gx.globalCompositeOperation = 'lighter';
  const halo = gx.createRadialGradient(256, 256, 0, 256, 256, 240);
  halo.addColorStop(0, 'rgba(255,240,200,.9)'); halo.addColorStop(0.2, 'rgba(255,150,220,.35)'); halo.addColorStop(1, 'rgba(120,80,255,0)');
  gx.fillStyle = halo; gx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) {
    const bras = i % 2, t = r() * 1, a = t * 7 + bras * Math.PI + (r() - 0.5) * 0.5, d = 18 + t * 220;
    const x = 256 + Math.cos(a) * d, y = 256 + Math.sin(a) * d * 0.55;
    const c = new THREE.Color().setHSL(0.83 - t * 0.35, 0.9, 0.7);
    gx.fillStyle = `rgba(${c.r * 255 | 0},${c.g * 255 | 0},${c.b * 255 | 0},${0.25 * (1 - t)})`;
    gx.beginPath(); gx.arc(x, y, 2 + r() * 5 * (1 - t), 0, 7); gx.fill();
  }
  const gal = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(gc), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.85 }));
  gal.position.set(1, 0.35, -0.6).normalize().multiplyScalar(450); gal.scale.setScalar(260); gal.material.rotation = 0.4;
  scene.add(gal);
  return sky;
}

// dégradé du faisceau : lumineux près de la lampe, transparent au bout
const degradeFaisceau = (() => {
  const c = document.createElement('canvas'); c.width = 4; c.height = 128;
  const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 128);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 4, 128);
  return new THREE.CanvasTexture(c);
})();

// ---------- planètes ----------
export function createWorld(scene, glow, modeles = {}) {
  return LEVELS.map((L, index) => {
    const r = rng(L.seed);
    const center = new THREE.Vector3(...L.center);
    const bDir = new THREE.Vector3(...L.beacon).normalize();
    const U = uniformsPlanete(center, bDir);
    const planet = { ...L, index, center, U, lit: false, litT: 0, obstacles: [], group: new THREE.Group(), anim: [] };
    scene.add(planet.group);

    // relief : collines douces + butte sous le phare
    const seedV = new THREE.Vector3(L.seed * 1.7, L.seed * 2.3, L.seed * 0.9);
    const hauteur = d => {
      const p = d.clone().multiplyScalar(L.freq * 2).add(seedV);
      const n = bruit(p.x, p.y, p.z) * 0.65 + bruit(p.x * 2.3, p.y * 2.3, p.z * 2.3) * 0.35 - 0.5;
      const a = d.angleTo(bDir);
      return L.relief * 2 * n + L.bosse.h * Math.exp(-((a / L.bosse.w) ** 2));
    };
    planet.surface = d => L.radius + hauteur(d);
    planet.surfacePoint = d => center.clone().addScaledVector(d, planet.surface(d));

    // sol : sphère déformée, couleurs selon l'altitude
    let geo = new THREE.IcosahedronGeometry(1, 14);
    geo.deleteAttribute('normal'); geo.deleteAttribute('uv');
    geo = mergeVertices(geo);
    const P = geo.attributes.position, col = new Float32Array(P.count * 3), d = new THREE.Vector3(), c = new THREE.Color();
    const cBas = new THREE.Color(L.sol.bas), cBase = new THREE.Color(L.sol.base), cHaut = new THREE.Color(L.sol.haut), cBosse = new THREE.Color(L.sol.bosse);
    for (let i = 0; i < P.count; i++) {
      d.fromBufferAttribute(P, i).normalize();
      const h = hauteur(d);
      P.setXYZ(i, d.x * (L.radius + h), d.y * (L.radius + h), d.z * (L.radius + h));
      const t = THREE.MathUtils.clamp((h + L.relief) / (2 * L.relief), 0, 1);
      if (t < 0.5) c.copy(cBas).lerp(cBase, t * 2); else c.copy(cBase).lerp(cHaut, (t - 0.5) * 2);
      if (L.motif === 1) {                       // herbe : taches douces, calculées une fois pour toutes
        const q = d.clone().multiplyScalar(7).add(seedV);
        c.multiplyScalar(0.88 + 0.24 * (bruit(q.x, q.y, q.z) * 0.6 + bruit(q.x * 3, q.y * 3, q.z * 3) * 0.4));
      }
      c.lerp(cBosse, Math.exp(-((d.angleTo(bDir) / (L.bosse.w * 0.8)) ** 2)) * 0.85);
      col.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    const groundMat = allumable(new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x000000 }), U, { motif: L.motif, motifCol: L.motifCol, scale: L.scale || 6 });
    const ground = new THREE.Mesh(geo, groundMat);
    ground.position.copy(center);
    planet.group.add(ground);

    const placeOn = (obj, dir, h = 0) => { obj.position.copy(planet.surfacePoint(dir)).addScaledVector(dir, h); obj.quaternion.setFromUnitVectors(Y, dir); };
    planet.placeOn = placeOn;

    // ---- phare blanc à rayures roses ----
    const phare = new THREE.Group();
    const mk = (g, couleur, opts = {}) => new THREE.Mesh(g, allumable(new THREE.MeshLambertMaterial({ color: couleur, ...opts }), U));
    let lampMat;
    if (modeles.phare) {
      for (const { geo: g, mat } of morceaux(modeles.phare, 3.6)) phare.add(new THREE.Mesh(g, allumable(mat.clone(), U)));
      lampMat = new THREE.MeshStandardMaterial({ color: 0xfff4c2, emissive: 0xffd36b, emissiveIntensity: 0, transparent: true, opacity: 0.0 });
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 10), lampMat); l.position.y = 3.05; phare.add(l);
    } else {
      for (let i = 0; i < 6; i++) {
        const r0 = 0.62 - i * 0.035, r1 = 0.62 - (i + 1) * 0.035;
        const b = mk(new THREE.CylinderGeometry(r1, r0, 0.47, 20), i % 2 ? 0xff7eb6 : 0xfff4f8); b.position.y = 0.235 + i * 0.47; phare.add(b);
      }
      const gal = mk(new THREE.CylinderGeometry(0.6, 0.6, 0.1, 20), 0xb7a2e8); gal.position.y = 2.86; phare.add(gal);
      lampMat = new THREE.MeshStandardMaterial({ color: 0xfff4c2, emissive: 0xffd36b, emissiveIntensity: 0, roughness: 0.2 });
      const lampe = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.5, 16), lampMat); lampe.position.y = 3.16; phare.add(lampe);
      const dome = mk(new THREE.SphereGeometry(0.42, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), 0xb7a2e8); dome.position.y = 3.4; phare.add(dome);
      const pointe = mk(new THREE.SphereGeometry(0.09, 8, 6), 0xffd36b); pointe.position.y = 3.86; phare.add(pointe);
      const porte = mk(new THREE.CapsuleGeometry(0.14, 0.2, 4, 8), 0x9a6fd6); porte.position.set(0, 0.28, 0.6); porte.scale.z = 0.5; phare.add(porte);
    }
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xffd36b, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    halo.position.y = 3.16; halo.scale.setScalar(6); phare.add(halo);
    // faisceau qui tourne quand le phare est rallumé
    const beamGeo = new THREE.ConeGeometry(1.5, 11, 24, 1, true); beamGeo.rotateZ(-Math.PI / 2); beamGeo.translate(-5.5, 0, 0);
    const beamMat = new THREE.MeshBasicMaterial({ color: 0xffe9a8, map: degradeFaisceau, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    const beam = new THREE.Group(); beam.add(new THREE.Mesh(beamGeo, beamMat)); beam.position.y = 3.16; beam.visible = false; phare.add(beam);
    const light = new THREE.PointLight(0xffd36b, 0, 40, 1.2); light.position.y = 3.2; phare.add(light);
    placeOn(phare, bDir, -0.05);
    planet.group.add(phare);
    planet.beacon = { group: phare, lamp: lampMat, halo, light, beam, beamMat, dir: bDir, pos: phare.position.clone(), ready: false };
    planet.obstacles.push({ dir: bDir, radius: 0.7, height: 3.9 });

    const used = [Y.clone(), bDir.clone()];
    if (L.tremplin) used.push(new THREE.Vector3(...L.tremplin).normalize());
    const freeDir = minA => { for (let k = 0; k < 300; k++) { const dd = randomDir(r); if (used.every(u => u.angleTo(dd) > minA)) return dd; } return randomDir(r); };

    // ---- tremplin d'aurore ----
    if (L.tremplin) {
      const tDir = new THREE.Vector3(...L.tremplin).normalize();
      const tr = new THREE.Group();
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.15, 0.2, 28), allumable(new THREE.MeshStandardMaterial({ color: 0xff8ad8, emissive: 0x00d2ff, emissiveIntensity: 0, roughness: 0.4 }), U));
      disc.position.y = 0.1;
      const swirl = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.07, 8, 32), new THREE.MeshBasicMaterial({ color: 0x9ff6ff, transparent: true, opacity: 0 }));
      swirl.rotation.x = Math.PI / 2; swirl.position.y = 0.35;
      const colonne = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0x7cf0ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      colonne.position.y = 1.4; colonne.scale.set(2.2, 4, 1);
      tr.add(disc, swirl, colonne);
      placeOn(tr, tDir, -0.05);
      planet.group.add(tr);
      planet.tremplin = { group: tr, disc: disc.material, swirl, col: colonne, dir: tDir, pos: tr.position.clone(), active: false };
    }

    // ---- braises ----
    planet.embers = [];
    for (let i = 0; i < L.embers; i++) {
      const dd = freeDir(0.45); used.push(dd);
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.26), new THREE.MeshBasicMaterial({ color: 0xffb347 }));
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xff8a3d, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
      sp.scale.setScalar(1.5);
      const inner = new THREE.Group(); inner.add(gem, sp);
      const holder = new THREE.Group(); holder.add(inner);
      placeOn(holder, dd, 0.9);
      planet.group.add(holder);
      planet.embers.push({ holder, inner, gem, dir: dd, taken: false, phase: r() * 6 });
    }

    // ---- décors : regroupés par matière (un seul objet par matière = rapide) ----
    const lots = {};
    const ajoute = (cle, g) => (lots[cle] ||= []).push(g);
    const glb = { champiRose: 'champignon', champiJaune: 'champignon', maison: 'maison', cristalRose: 'cristal', cristalJaune: 'cristal', cristalBleu: 'cristal', rocher: 'rocher', touffe: 'touffe' };
    const tailles = { champignon: 0.8, maison: 1.7, cristal: 0.9, rocher: 0.45, touffe: 0.35 };
    const glbMorceaux = {};
    const Mx = new THREE.Matrix4(), Qx = new THREE.Quaternion(), Qy = new THREE.Quaternion(), Sx = new THREE.Vector3();
    for (const [type, nb] of L.decors) {
      for (let i = 0; i < nb; i++) {
        const dd = freeDir(type === 'touffe' ? 0.12 : 0.24);
        if (type !== 'touffe') used.push(dd);
        const s = type === 'maison' ? 1 : 0.8 + r() * 0.5;
        Qy.setFromAxisAngle(Y, r() * Math.PI * 2);
        Qx.setFromUnitVectors(Y, dd).multiply(Qy);
        Mx.compose(planet.surfacePoint(dd).sub(center).addScaledVector(dd, -0.04), Qx, Sx.set(s, s, s));
        const nomGlb = glb[type];
        if (nomGlb && modeles[nomGlb]) {
          glbMorceaux[nomGlb] ||= morceaux(modeles[nomGlb], tailles[nomGlb]);
          glbMorceaux[nomGlb].forEach((m, k) => ajoute(`glb:${nomGlb}:${k}`, m.geo.clone().applyMatrix4(Mx)));
        } else {
          for (const [g, cle] of DECORS[type](r, 'herbe')) ajoute(cle, g.applyMatrix4(Mx));
        }
      }
    }
    for (const [cle, geos] of Object.entries(lots)) {
      let mat;
      if (cle.startsWith('glb:')) {
        const [, nom, k] = cle.split(':');
        mat = allumable(glbMorceaux[nom][+k].mat.clone(), U);
      } else {
        const [couleur, lum = 0, intensite = 0, facettes = false] = cle === 'herbe' ? [L.herbe] : MATIERES[cle];
        mat = allumable(new THREE.MeshLambertMaterial({ color: couleur, emissive: lum, emissiveIntensity: intensite, flatShading: facettes }), U);
      }
      const mesh = new THREE.Mesh(mergeGeometries(geos, false), mat);
      mesh.position.copy(center);
      planet.group.add(mesh);
    }

    // ---- brume des planètes éteintes ----
    planet.brume = [];
    for (let i = 0; i < 7; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xb8c4ee, transparent: true, opacity: 0.32, depthWrite: false }));
      s.position.copy(center).addScaledVector(randomDir(r), L.radius * 0.9);
      s.scale.setScalar(L.radius * 1.6);
      planet.group.add(s); planet.brume.push(s);
    }

    planet.setLight = t => {
      regleVague(U, t);
      for (const s of planet.brume) s.material.opacity = 0.32 * (1 - t);
    };
    planet.setLight(0);
    return planet;
  });
}

// Animation de chaque planète (appelée à chaque image)
export function animatePlanet(p, dt, clock) {
  for (const e of p.embers) {
    if (e.taken) continue;
    e.inner.position.y = Math.sin(clock * 2.5 + e.phase) * 0.15;
    e.gem.rotation.y += dt * 2;
  }
  const b = p.beacon;
  if (p.lit) {
    if (p.litT < 1) { p.litT = Math.min(1, p.litT + dt / 2.6); p.setLight(p.litT); }
    b.lamp.emissiveIntensity = 2.4 + Math.sin(clock * 3) * 0.3;
    b.halo.material.opacity = 0.9 * p.litT;
    b.light.intensity = 50 * p.litT;
    b.beam.visible = true; b.beamMat.opacity = 0.5 * p.litT; b.beam.rotation.y += dt * 0.9;
  } else if (b.ready) {
    b.lamp.emissiveIntensity = 0.7 + Math.sin(clock * 6) * 0.6;   // le phare clignote : « viens me rallumer »
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
