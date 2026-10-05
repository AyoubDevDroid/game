// Fanal, le petit gardien de phare : une lanterne vivante.
// Construit avec des formes simples (graphismes provisoires) : origine aux pieds, regarde vers +Z.
import * as THREE from 'three';

export function createFanal(glowTexture) {
  const g = new THREE.Group();
  const bronze = new THREE.MeshStandardMaterial({ color: 0x8a5a2b, roughness: 0.5, metalness: 0.6 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2a1d14, roughness: 0.8 });

  // Corps en verre
  const glass = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 24, 18),
    new THREE.MeshStandardMaterial({ color: 0xfff0c8, transparent: true, opacity: 0.38, roughness: 0.1, emissive: 0xffa040, emissiveIntensity: 0.15 })
  );
  glass.position.y = 0.88;
  g.add(glass);

  // Flamme intérieure
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffb347 }));
  flame.scale.set(1, 1.5, 1);
  flame.position.y = 0.82;
  g.add(flame);
  const flameCore = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff6d0 }));
  flameCore.position.y = 0.78;
  g.add(flameCore);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color: 0xffa040, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.setScalar(2.2);
  halo.position.y = 0.85;
  g.add(halo);

  // Chapeau, socle et poignée
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.46, 0.22, 16), bronze);
  cap.position.y = 1.43;
  g.add(cap);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), bronze);
  knob.position.y = 1.58;
  g.add(knob);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.045, 8, 20, Math.PI), bronze);
  handle.position.y = 1.6;
  g.add(handle);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.34, 0.2, 16), bronze);
  base.position.y = 0.36;
  g.add(base);

  // Yeux
  const eyes = new THREE.Group();
  for (const x of [-0.17, 0.17]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), dark);
    eye.position.set(x, 0.98, 0.5);
    eye.scale.set(1, 1.35, 0.6);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    shine.position.set(x + 0.025, 1.02, 0.545);
    eyes.add(eye, shine);
  }
  g.add(eyes);

  // Jambes
  const legs = [];
  for (const x of [-0.16, 0.16]) {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.3, 0);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.16, 4, 8), dark);
    leg.position.y = -0.17;
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), bronze);
    foot.scale.set(1, 0.6, 1.4);
    foot.position.set(0, -0.28, 0.05);
    pivot.add(leg, foot);
    g.add(pivot);
    legs.push(pivot);
  }

  const light = new THREE.PointLight(0xffa040, 6, 9, 1.6);
  light.position.y = 0.9;
  g.add(light);

  let t = 0, blink = 2;
  return {
    object: g,
    // speed : vitesse au sol (0 à 1), air : en l'air, power : nombre de braises (fait briller la flamme)
    animate(dt, speed, air, power) {
      t += dt;
      const p = 1 + power * 0.06;
      const flick = 1 + Math.sin(t * 23) * 0.05 + Math.sin(t * 37) * 0.04;
      flame.scale.set(p * flick, 1.5 * p * flick, p * flick);
      halo.material.opacity = 0.45 + power * 0.03 + Math.sin(t * 9) * 0.05;
      light.intensity = 5 + power * 0.8;
      const swing = air ? 0.6 : Math.sin(t * 16) * 0.9 * speed;
      legs[0].rotation.x = air ? -0.6 : swing;
      legs[1].rotation.x = air ? 0.4 : -swing;
      // petit rebond de course
      const bob = air ? 0 : Math.abs(Math.sin(t * 16)) * 0.08 * speed;
      for (const o of [glass, flame, flameCore, halo, cap, knob, handle, base, eyes]) o.userData.y0 ??= o.position.y;
      for (const o of [glass, flame, flameCore, halo, cap, knob, handle, base, eyes]) o.position.y = o.userData.y0 + bob;
      // clignement des yeux
      blink -= dt;
      eyes.scale.y = blink < 0.12 ? 0.15 : 1;
      if (blink < 0) blink = 2 + Math.random() * 3;
    },
  };
}
