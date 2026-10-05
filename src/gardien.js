// Les petits gardiens : des copains de Fanal, enfermés par les Ombrelles dans une cage d'ombre.
// Quand le phare de leur planète se rallume, la cage fond, le gardien saute de joie et rejoint la Luciole.
import * as THREE from 'three';
import { createFanal } from './fanal.js';

const barreGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.9, 6);
const anneauGeo = new THREE.TorusGeometry(0.75, 0.07, 6, 24).rotateX(Math.PI / 2);
const capeGeo = new THREE.SphereGeometry(0.8, 16, 6, 0, Math.PI * 2, 0, Math.PI / 2);

export function createGardien(glow, planet, [cadre, foulard]) {
  const dir = planet.freeDir(0.6);
  const g = new THREE.Group();
  planet.placeOn(g, dir);
  planet.group.add(g);

  const petit = createFanal(glow, {}, { cadre, foulard, lumiere: false });
  petit.object.scale.setScalar(0.75);
  petit.setMood('peur');
  g.add(petit.object);

  // cage d'ombre
  const ombre = new THREE.MeshLambertMaterial({ color: 0x3b1f5c, emissive: 0x2a0d4a, transparent: true, opacity: 1 });
  const cage = new THREE.Group(); g.add(cage);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2, b = new THREE.Mesh(barreGeo, ombre);
    b.position.set(Math.sin(a) * 0.75, 0.95, Math.cos(a) * 0.75); cage.add(b);
  }
  for (const y of [0.05, 1.9]) { const a = new THREE.Mesh(anneauGeo, ombre); a.position.y = y; cage.add(a); }
  const cape = new THREE.Mesh(capeGeo, ombre); cape.position.y = 1.9; cape.scale.y = 0.45; cage.add(cape);

  // petit appel à l'aide qui flotte au-dessus de la cage
  const appel = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0x7cf0ff, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }));
  appel.position.y = 2.7; appel.scale.setScalar(1.4); g.add(appel);

  const obstacle = { dir, radius: 0.85, height: 2.1 };
  planet.obstacles.push(obstacle);

  let t = 0, libre = -1, saut = 0, parti = false;
  return {
    dir, object: g,
    get position() { return g.position; },
    liberer() {
      if (libre >= 0) return;
      libre = 0; petit.setMood('ravi');
      planet.obstacles.splice(planet.obstacles.indexOf(obstacle), 1);
    },
    // renvoie true une seule fois, quand le gardien s'envole vers la Luciole
    update(dt) {
      t += dt;
      appel.material.opacity = libre < 0 ? 0.45 + Math.sin(t * 4) * 0.25 : 0;
      if (libre < 0) { petit.animate(dt, 0.3 + Math.sin(t * 6) * 0.3, false, 0); return false; }
      libre += dt;
      // la cage fond
      const fonte = Math.min(1, libre / 0.9);
      cage.scale.set(1 + fonte * 0.4, 1 - fonte, 1 + fonte * 0.4); ombre.opacity = 1 - fonte; cage.visible = fonte < 1;
      // sauts de joie, puis envol
      saut = Math.max(0, Math.sin(libre * 7)) * 0.7;
      if (libre > 2.6) petit.object.position.y += dt * (libre - 2.6) * 18;
      else petit.object.position.y = saut;
      petit.object.rotation.y += dt * 4;
      petit.animate(dt, 0, saut > 0.05, 0);
      if (libre > 3.6 && !parti) { parti = true; g.visible = false; return true; }
      return false;
    },
  };
}
