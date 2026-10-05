// Le vaisseau de Fanal, « la Luciole » : coque framboise, hublot lagon, ailerons dorés, réacteur lumineux.
// Même style que Fanal (docs/style). L'avant regarde vers +Z.
import * as THREE from 'three';

export function createVaisseau(glow) {
  const g = new THREE.Group();
  const coque = new THREE.Group(); g.add(coque);            // tout ce qui tangue
  const framboise = new THREE.MeshStandardMaterial({ color: 0xd8285f, roughness: 0.35, metalness: 0.1 });
  const creme = new THREE.MeshStandardMaterial({ color: 0xfff1df, roughness: 0.5 });
  const or = new THREE.MeshStandardMaterial({ color: 0xffc23d, roughness: 0.25, metalness: 0.7 });
  const verre = new THREE.MeshStandardMaterial({ color: 0x8feaff, transparent: true, opacity: 0.55, roughness: 0.05, emissive: 0x2fd3c4, emissiveIntensity: 0.4 });
  const add = (geo, mat, x, y, z, parent = coque) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };

  // fuselage : capsule couchée, ventre crème
  const corps = add(new THREE.CapsuleGeometry(0.75, 1.5, 8, 20), framboise, 0, 0.9, 0); corps.rotation.x = Math.PI / 2;
  const ventre = add(new THREE.CapsuleGeometry(0.7, 1.3, 6, 16), creme, 0, 0.72, 0.05); ventre.rotation.x = Math.PI / 2; ventre.scale.set(1.02, 1, 0.8);
  // hublot avec une petite lueur
  const hublot = add(new THREE.SphereGeometry(0.55, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), verre, 0, 1.35, 0.35);
  hublot.scale.set(1, 0.8, 1.3);
  const lueur = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xffb347, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }));
  lueur.position.set(0, 1.45, 0.35); lueur.scale.setScalar(1.1); coque.add(lueur);
  // rivets dorés autour du hublot
  const rivet = new THREE.SphereGeometry(0.05, 8, 6);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; add(rivet, or, Math.sin(a) * 0.56, 1.36, 0.35 + Math.cos(a) * 0.72); }
  // nez doré
  const nez = add(new THREE.SphereGeometry(0.22, 14, 10), or, 0, 0.9, 1.55); nez.scale.z = 0.7;
  // ailerons
  const aileron = new THREE.BoxGeometry(0.08, 0.7, 0.8);
  for (const [x, rz] of [[0.75, -0.9], [-0.75, 0.9]]) { const a = add(aileron, or, x, 0.55, -0.75); a.rotation.z = rz; }
  const derive = add(aileron, or, 0, 1.55, -0.85); derive.rotation.x = -0.3;
  // pieds d'atterrissage
  for (const [x, z] of [[0.45, 0.6], [-0.45, 0.6], [0, -0.7]]) add(new THREE.CylinderGeometry(0.05, 0.08, 0.45, 8), or, x, 0.2, z);
  // réacteur
  const tuyere = add(new THREE.CylinderGeometry(0.32, 0.42, 0.35, 16), or, 0, 0.9, -1.35); tuyere.rotation.x = Math.PI / 2;
  const feu = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0x7cf0ff, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }));
  feu.position.set(0, 0.9, -1.7); coque.add(feu);

  let t = 0;
  return {
    object: g,
    // poussee : 0 au repos (posé), 1 en vol
    animate(dt, poussee = 0, virage = 0) {
      t += dt;
      coque.position.y = poussee * Math.sin(t * 3) * 0.08;
      coque.rotation.z = -virage * 0.5 + poussee * Math.sin(t * 1.7) * 0.04;
      feu.scale.set(0.6 + poussee * 1.2, 0.6 + poussee * 1.2 + Math.sin(t * 40) * 0.15 * poussee, 1);
      feu.material.opacity = 0.35 + poussee * 0.6;
      lueur.material.opacity = 0.55 + Math.sin(t * 5) * 0.15;
    },
  };
}
