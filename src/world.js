// L'Archipel du Ciel : planètes, braises, phares, tremplins d'aurore, décor.
import * as THREE from 'three';

export const LEVELS = [
  { name: 'Brumelune', center: [0, 0, 0], radius: 8, grey: 0x7c86a6, lit: 0x4fc9a0, deco: 0x8fd8ff, decoGrey: 0x9aa2bb, embers: 6, beacon: [0.15, 0.1, 1], tremplin: [-0.5, 0.15, 0.85], seed: 3 },
  { name: 'Cendrine', center: [46, 20, -26], radius: 11, grey: 0x8a8292, lit: 0xe0865a, deco: 0xffd36e, decoGrey: 0xa39aa6, embers: 8, beacon: [-0.6, 0.6, 0.5], tremplin: [-0.2, 0.75, 0.6], seed: 11 },
  { name: 'Le Grand Phare', center: [8, 54, -66], radius: 6, grey: 0x7d8aa0, lit: 0xf2cf5b, deco: 0xff9ad5, decoGrey: 0x9ca6b8, embers: 5, beacon: [0.2, 1, 0.2], tremplin: null, seed: 21, final: true },
];

// Générateur pseudo-aléatoire reproductible : le même niveau à chaque partie
function rng(seed) { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); }
function randomDir(r) {
  const u = r() * 2 - 1, a = r() * Math.PI * 2, s = Math.sqrt(1 - u * u);
  return new THREE.Vector3(s * Math.cos(a), u, s * Math.sin(a));
}

// Place un objet sur la surface : position + orientation (son « haut » = la verticale de la planète)
const Y = new THREE.Vector3(0, 1, 0);
export function placeOn(obj, planet, dir, height = 0) {
  obj.position.copy(planet.center).addScaledVector(dir, planet.radius + height);
  obj.quaternion.setFromUnitVectors(Y, dir);
}

export function makeGlowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d');
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export function createSky(scene, glow) {
  const n = 1800, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  const r = rng(99), c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const d = randomDir(r).multiplyScalar(350 + r() * 100);
    pos.set([d.x, d.y, d.z], i * 3);
    c.setHSL(0.55 + r() * 0.2, 0.6, 0.6 + r() * 0.4);
    col.set([c.r, c.g, c.b], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const stars = new THREE.Points(geo, new THREE.PointsMaterial({ size: 2.2, map: glow, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: false }));
  scene.add(stars);
  return stars;
}

export function createWorld(scene, glow) {
  return LEVELS.map((L, index) => {
    const r = rng(L.seed);
    const planet = { ...L, index, center: new THREE.Vector3(...L.center), mats: [], litT: 0, lit: false, obstacles: [], group: new THREE.Group() };
    scene.add(planet.group);

    // Sol : sphère facettée
    const groundMat = new THREE.MeshStandardMaterial({ color: L.grey, flatShading: true, roughness: 0.95 });
    planet.mats.push({ mat: groundMat, grey: new THREE.Color(L.grey), lit: new THREE.Color(L.lit) });
    const ground = new THREE.Mesh(new THREE.IcosahedronGeometry(L.radius, 3), groundMat);
    ground.position.copy(planet.center);
    planet.group.add(ground);
    // Atmosphère légère
    const atmo = new THREE.Mesh(new THREE.SphereGeometry(L.radius * 1.18, 32, 24), new THREE.MeshBasicMaterial({ color: L.lit, transparent: true, opacity: 0.0, side: THREE.BackSide, depthWrite: false }));
    atmo.position.copy(planet.center);
    planet.group.add(atmo);
    planet.atmo = atmo;

    const used = [new THREE.Vector3(0, 1, 0), new THREE.Vector3(...L.beacon).normalize()];
    if (L.tremplin) used.push(new THREE.Vector3(...L.tremplin).normalize());
    const freeDir = (minAngle) => {
      for (let k = 0; k < 200; k++) {
        const d = randomDir(r);
        if (used.every(u => u.angleTo(d) > minAngle)) return d;
      }
      return randomDir(r);
    };

    // Phare
    const bDir = new THREE.Vector3(...L.beacon).normalize();
    const beacon = new THREE.Group();
    const towerMat = new THREE.MeshStandardMaterial({ color: 0xbfc4d6, roughness: 0.6, flatShading: true });
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.62, 2.6, 8), towerMat);
    tower.position.y = 1.3;
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.22, 8), new THREE.MeshStandardMaterial({ color: 0xc24d3d, flatShading: true }));
    ring.position.y = 1.0;
    const ring2 = ring.clone(); ring2.position.y = 1.9;
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x3a3f55, emissive: 0xffb347, emissiveIntensity: 0, roughness: 0.3 });
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.48, 16, 12), lampMat);
    lamp.position.y = 2.95;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.6, 8), new THREE.MeshStandardMaterial({ color: 0xc24d3d, flatShading: true }));
    roof.position.y = 3.6;
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xffc65a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    halo.position.y = 2.95; halo.scale.setScalar(7);
    const light = new THREE.PointLight(0xffc65a, 0, 45, 1.2);
    light.position.y = 3;
    beacon.add(tower, ring, ring2, lamp, roof, halo, light);
    placeOn(beacon, planet, bDir);
    planet.group.add(beacon);
    planet.beacon = { group: beacon, lamp: lampMat, halo, light, dir: bDir, pos: beacon.position.clone(), ready: false };
    planet.obstacles.push({ dir: bDir, radius: 0.75, height: 3.8 });

    // Tremplin d'aurore (caché jusqu'au phare rallumé)
    if (L.tremplin) {
      const tDir = new THREE.Vector3(...L.tremplin).normalize();
      const tr = new THREE.Group();
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.15, 0.18, 24), new THREE.MeshStandardMaterial({ color: 0x2c3150, emissive: 0x7cf0ff, emissiveIntensity: 0.0 }));
      disc.position.y = 0.09;
      const swirl = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.07, 8, 32), new THREE.MeshBasicMaterial({ color: 0x9ff6ff, transparent: true, opacity: 0 }));
      swirl.rotation.x = Math.PI / 2; swirl.position.y = 0.35;
      const col = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0x7cf0ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      col.position.y = 1.4; col.scale.set(2.2, 4, 1);
      tr.add(disc, swirl, col);
      placeOn(tr, planet, tDir);
      planet.group.add(tr);
      planet.tremplin = { group: tr, disc: disc.material, swirl, col, dir: tDir, pos: tr.position.clone(), active: false };
    }

    // Braises
    planet.embers = [];
    for (let i = 0; i < L.embers; i++) {
      const d = freeDir(0.45); used.push(d);
      const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.26), new THREE.MeshBasicMaterial({ color: 0xffb347 }));
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xff8a3d, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
      s.scale.setScalar(1.4);
      const e = new THREE.Group(); e.add(m, s);
      const holder = new THREE.Group(); holder.add(e);
      placeOn(holder, planet, d, 0.9);
      planet.group.add(holder);
      planet.embers.push({ holder, inner: e, gem: m, dir: d, taken: false, phase: r() * 6 });
    }

    // Décor : cristaux, rochers, touffes (sans collision, couleur qui revient avec la lumière)
    const decoMat = new THREE.MeshStandardMaterial({ color: L.decoGrey, flatShading: true, roughness: 0.7 });
    planet.mats.push({ mat: decoMat, grey: new THREE.Color(L.decoGrey), lit: new THREE.Color(L.deco) });
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x4a4f63, flatShading: true, roughness: 1 });
    const count = Math.round(L.radius * 3.2);
    for (let i = 0; i < count; i++) {
      const d = freeDir(0.22);
      const kind = r();
      let mesh;
      if (kind < 0.45) { mesh = new THREE.Mesh(new THREE.ConeGeometry(0.18 + r() * 0.2, 0.7 + r() * 1.1, 5), decoMat); mesh.position.y = 0.4; }
      else if (kind < 0.75) { mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25 + r() * 0.35), rockMat); mesh.position.y = 0.1; }
      else { mesh = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.45, 4), decoMat); mesh.position.y = 0.2; mesh.scale.x = 1.6; }
      mesh.rotation.y = r() * 6;
      const h = new THREE.Group(); h.add(mesh);
      placeOn(h, planet, d);
      planet.group.add(h);
    }
    return planet;
  });
}

// Rallume progressivement les couleurs d'une planète (t de 0 à 1)
export function applyLight(planet, t) {
  for (const m of planet.mats) m.mat.color.copy(m.grey).lerp(m.lit, t);
  planet.atmo.material.opacity = 0.12 * t;
}
