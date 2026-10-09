// Pièces d'étincelle ✨ et caisses à casser : on en trouve partout, comme dans un bon platformer.
// Pièces : en lignes sur le chemin, en arcs au-dessus des trous (elles montrent où sauter), en cercles.
// Caisses : un coup de flamme, un tir, une décharge ou un saut dessus les cassent → une pluie de pièces.
import * as THREE from 'three';
import { allumable } from './lumiere.js';
import { rng } from './univers.js';

const Y = new THREE.Vector3(0, 1, 0);
const partage = g => { g.userData.partage = true; return g; };
// une étoile dorée bombée, aux bords biseautés : elle accroche la lumière en tournant
const pieceGeo = partage((() => {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.16 : 0.36; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.06, bevelSegments: 3, curveSegments: 1 });
  g.center(); g.computeVertexNormals(); return g;
})());
const pieceMat = new THREE.MeshStandardMaterial({ color: 0xffcc33, emissive: 0xff9a00, emissiveIntensity: 0.35, metalness: 0.35, roughness: 0.22 });
pieceMat.userData.partage = true;
const caisseGeo = partage(new THREE.BoxGeometry(0.9, 0.9, 0.9));

// face de caisse peinte : planches, cadre, étoile
const caisseTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  x.fillStyle = '#d99a52'; x.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 4; i++) { x.fillStyle = i % 2 ? '#cf8f48' : '#e0a55e'; x.fillRect(14, 14 + i * 25, 100, 25); x.fillStyle = 'rgba(90,50,20,.35)'; x.fillRect(14, 14 + i * 25, 100, 2); }
  x.strokeStyle = '#8a4f22'; x.lineWidth = 14; x.strokeRect(7, 7, 114, 114);
  x.lineWidth = 10; x.beginPath(); x.moveTo(14, 14); x.lineTo(114, 114); x.stroke();
  x.fillStyle = '#ffe066'; x.strokeStyle = '#8a4f22'; x.lineWidth = 3; x.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 9 : 21; x.lineTo(64 + Math.cos(a) * rr, 64 + Math.sin(a) * rr); }
  x.closePath(); x.fill(); x.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.userData.partage = true; return t;
})();

export function installerPieces(planet) {
  const P = planet, R = P.radius, r = rng(P.seed * 29 + 1), items = [];
  const surTerre = d => !P.terre || P.terre(d);
  const hauteurSol = d => {                                        // sur un rocher ? la pièce passe au-dessus
    let h = 0.95;
    for (const s of P.solides) if (!s.mobile && !s.rebond && s.bas < 0.5 && d.angleTo(s.dir) * R < s.radius + 0.4) { if (s.haut >= 3.2) return -1; h = Math.max(h, s.haut + 0.9); }
    return h;
  };
  const loinDe = d => d.angleTo(Y) * R > 3 && d.angleTo(P.beacon.dir) * R > 3;
  const poser = (d, abs) => abs > P.radius - 50 && items.push({ pos: d.clone().multiplyScalar(abs).add(P.center), pris: false, vol: null, ph: r() * 6 });

  // 1. le long du chemin
  const pts = (P.parcours && P.parcours.points) || [];
  for (let i = 2; i < pts.length; i += 3) { const d = pts[i]; if (surTerre(d) && loinDe(d)) { const h = hauteurSol(d); if (h > 0) poser(d, P.surface(d) + h); } }
  // 2. en arc au-dessus des trous : elles montrent la trajectoire du saut
  for (const l of P.liens || []) {
    if (l.secret || l.gap < 2) continue;
    const a = l.a.d.clone().lerp(l.b.d, l.a.rad / (l.a.d.angleTo(l.b.d) * R)).normalize();
    const b = l.b.d.clone().lerp(l.a.d, l.b.rad / (l.a.d.angleTo(l.b.d) * R)).normalize();
    const n = Math.max(3, Math.ceil(l.gap / 1.5)), h0 = R + l.a.h, h1 = R + l.b.h;
    for (let k = 1; k < n; k++) { const t = k / n; poser(a.clone().lerp(b, t).normalize(), h0 + (h1 - h0) * t + 1.2 + Math.sin(t * Math.PI) * (l.long ? 1.4 : 2.6)); }
  }
  // 3. des cercles de pièces, et quelques lignes droites
  for (let c = 0; c < 7; c++) {
    const d = P.freeDir(0.5), t1 = new THREE.Vector3().crossVectors(d, Math.abs(d.y) < 0.9 ? Y : new THREE.Vector3(1, 0, 0)).normalize(), t2 = new THREE.Vector3().crossVectors(d, t1);
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, dd = d.clone().addScaledVector(t1, Math.cos(a) * 1.7 / R).addScaledVector(t2, Math.sin(a) * 1.7 / R).normalize(); if (surTerre(dd)) { const h = hauteurSol(dd); if (h > 0) poser(dd, P.surface(dd) + h); } }
  }
  for (let c = 0; c < 6; c++) {
    const d = P.freeDir(0.5), cap = new THREE.Vector3().crossVectors(d, new THREE.Vector3().randomDirection()).normalize();
    for (let k = 0; k < 6; k++) { const dd = d.clone().applyAxisAngle(cap, k * 1.3 / R); if (surTerre(dd)) { const h = hauteurSol(dd); if (h > 0) poser(dd, P.surface(dd) + h); } }
  }
  items.splice(220);
  const nbFixes = items.length;

  // caisses
  const caisses = [], nbCaisses = Math.min(16, 8 + Math.floor((P.taille || R) / 5));
  for (let k = 0; k < nbCaisses; k++) {
    const d = P.freeDir(0.45), sol = P.surface(d);
    if (P.solides.some(s => !s.rebond && s.bas < 0.5 && d.angleTo(s.dir) * R < s.radius + 0.7)) continue;   // pas de caisse dans un rocher
    const o = { dir: d.clone(), radius: 0.62, bas: 0, haut: 0.9, caisse: true };
    P.solides.push(o);
    caisses.push({ d, pos: d.clone().multiplyScalar(sol + 0.45).add(P.center), o, casse: false, flamme: r() < 0.2, q: new THREE.Quaternion().setFromUnitVectors(Y, d).multiply(new THREE.Quaternion().setFromAxisAngle(Y, r() * 6.28)) });
  }

  // rendu : un seul objet pour toutes les pièces (et de la place pour celles qui sortent des caisses), un pour les caisses
  const maxPieces = items.length + nbCaisses * 8 + 60;
  const mesh = new THREE.InstancedMesh(pieceGeo, pieceMat, maxPieces); mesh.frustumCulled = false; mesh.count = 0;
  const caisseMat = allumable(new THREE.MeshLambertMaterial({ map: caisseTex, color: 0xffffff }), P.U);
  const mc = new THREE.InstancedMesh(caisseGeo, caisseMat, Math.max(1, caisses.length)); mc.frustumCulled = false;
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Qs = new THREE.Quaternion(), S1 = new THREE.Vector3(1, 1, 1), S0 = new THREE.Vector3(0, 0, 0);
  caisses.forEach((c, i) => mc.setMatrixAt(i, M.compose(c.pos, c.q, S1)));
  mc.instanceMatrix.needsUpdate = true;
  P.group.add(mesh, mc);

  const up = new THREE.Vector3();
  return {
    items, caisses, total: nbFixes,
    // renvoie le nombre de pièces ramassées pendant cette image
    update(dt, clock, poitrine) {
      let pris = 0;
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it.pris) { mesh.setMatrixAt(i, M.compose(it.pos, Q, S0)); continue; }
        up.copy(it.pos).sub(P.center).normalize();
        if (it.vol) {                                               // pièce qui jaillit d'une caisse
          it.vol.t += dt; it.vol.v.addScaledVector(up, -22 * dt); it.pos.addScaledVector(it.vol.v, dt);
          const sol = P.surface(up) + 0.6, dist = it.pos.distanceTo(P.center);
          if (dist < sol && (!P.terre || P.terre(up))) { it.pos.copy(up).multiplyScalar(sol).add(P.center); it.vol.v.multiplyScalar(0); }
          if (it.vol.t > 6 || dist < R - 30) { it.pris = true; continue; }
        }
        const dd = it.pos.distanceTo(poitrine);
        if (dd < 2.4 && (!it.vol || it.vol.t > 0.3)) it.pos.lerp(poitrine, Math.min(1, dt * 9));   // aimant
        if (dd < 1.05 && (!it.vol || it.vol.t > 0.3)) { it.pris = true; pris++; continue; }
        Q.setFromUnitVectors(Y, up).multiply(Qs.setFromAxisAngle(Y, clock * 3.2 + it.ph));
        mesh.setMatrixAt(i, M.compose(it.pos, Q, S1));
      }
      mesh.count = items.length; mesh.instanceMatrix.needsUpdate = true;
      return pris;
    },
    // casse les caisses à portée ; renvoie celles qui viennent de casser
    casser(centre, rayon) {
      const out = [];
      caisses.forEach((c, i) => {
        if (c.casse || c.pos.distanceTo(centre) > rayon + 0.5) return;
        c.casse = true; c.o.haut = -100; c.o.bas = -100;            // plus de collision
        mc.setMatrixAt(i, M.compose(c.pos, c.q, S0)); mc.instanceMatrix.needsUpdate = true;
        this.jaillir(c.pos.clone().addScaledVector(c.d, 0.3), 5 + Math.floor(Math.random() * 4));
        out.push(c);
      });
      return out;
    },
    // des pièces jaillissent (caisse cassée, ennemi vaincu)
    jaillir(pos, n) {
      const d = pos.clone().sub(P.center).normalize();
      for (let k = 0; k < n && items.length < maxPieces; k++) {
        const v = new THREE.Vector3().randomDirection(); v.addScaledVector(d, -v.dot(d)).normalize().multiplyScalar(2 + Math.random() * 2.5).addScaledVector(d, 7 + Math.random() * 3);
        items.push({ pos: pos.clone(), pris: false, vol: { v, t: 0 }, ph: Math.random() * 6 });
      }
    },
    caisseSous(o) { return caisses.find(c => c.o === o && !c.casse); },
  };
}
