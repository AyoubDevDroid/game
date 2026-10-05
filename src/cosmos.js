// L'univers en 3D : la galaxie (noyau lumineux, bras de poussière d'étoiles, orbites) et ses 15 planètes.
// On fait tourner la vue au doigt, on touche une planète, « Y aller » : la Luciole y vole toute seule (cinématique).
// Vers une autre galaxie : saut hyperespace. Tout est construit loin au-dessus de la planète jouée (BASE).
import * as THREE from 'three';
import { GALAXIES, NB_PLANETES, BOSS_REQUIS, planete, phareAllume, planeteOuverte, allumesDans, rng } from './univers.js';

const BASE = new THREE.Vector3(0, 4000, 0);
const DIST_LOIN = 120, DIST_PRES = 26;
const hex = n => '#' + n.toString(16).padStart(6, '0');
const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

// position d'une planète dans sa galaxie (coordonnées locales)
function placement(g, i) {
  const a = i * 0.82 + g * 0.5, r = 16 + i * 4.6;
  return new THREE.Vector3(Math.cos(a) * r, Math.sin(i * 1.7 + g) * 7, Math.sin(a) * r);
}

const boule = new THREE.IcosahedronGeometry(1, 4);

export function createCosmos({ scene, glow, camera, canvas, sky, vaisseau, onArrivee, onFermer }) {
  const $ = id => document.getElementById(id);
  const monde = new THREE.Group(); monde.position.copy(BASE); monde.visible = false; scene.add(monde);
  let galaxie = null, G = -1, save = null, ici = 0, iciG = 0, choisie = -1, astres = [];
  const cam = { yaw: 0.9, pitch: 0.5, dist: DIST_LOIN, distVoulue: DIST_LOIN, cible: new THREE.Vector3(), cibleVoulue: new THREE.Vector3() };
  const vol = { actif: false, t: 0, duree: 4, courbe: null, dest: null, hyper: 0, fin: false };
  let t = 0;

  // ---------- construction d'une galaxie ----------
  function construire(g) {
    if (galaxie) {
      monde.remove(galaxie);
      galaxie.traverse(o => { if (o.geometry && o.geometry !== boule) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    }
    $('cosmosEtiquettes').innerHTML = '';
    G = g; galaxie = new THREE.Group(); monde.add(galaxie);
    const C = GALAXIES[g].ciel, r = rng(500 + g);
    sky.couleurs(C, g * 0.7);

    // noyau lumineux
    for (const [couleur, taille, op] of [[C[0], 34, 0.95], [C[1], 90, 0.55], [0xffffff, 14, 0.9]]) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: couleur, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
      s.scale.setScalar(taille); galaxie.add(s);
    }
    // bras de poussière d'étoiles
    const N = 3500, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
    const c0 = new THREE.Color(C[0]), c1 = new THREE.Color(C[1]), blanc = new THREE.Color(0xffffff), c = new THREE.Color();
    for (let k = 0; k < N; k++) {
      const u = Math.pow(r(), 0.7), bras = k % 3, a = u * 6 + bras * (Math.PI * 2 / 3) + (r() - 0.5) * 0.6, d = 6 + u * 95;
      pos.set([Math.cos(a) * d, (r() - 0.5) * 6 * (1.2 - u), Math.sin(a) * d], k * 3);
      c.copy(c0).lerp(c1, u).lerp(blanc, r() * 0.4);
      col.set([c.r, c.g, c.b], k * 3);
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('color', new THREE.BufferAttribute(col, 3));
    galaxie.add(new THREE.Points(pg, new THREE.PointsMaterial({ size: 1.1, map: glow, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending })));

    // planètes, orbites et étiquettes
    astres = [];
    for (let i = 0; i < NB_PLANETES; i++) {
      const L = planete(g, i), p = placement(g, i);
      const allume = phareAllume(save, g, i), ouverte = planeteOuverte(save, g, i);
      // orbite
      const rp = Math.hypot(p.x, p.z), pts = [];
      for (let k = 0; k <= 96; k++) { const a = (k / 96) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * rp, p.y, Math.sin(a) * rp)); }
      galaxie.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x7fb4ff, transparent: true, opacity: allume ? 0.35 : 0.14 })));
      // la planète : couleurs du biome, grises tant que le phare est éteint
      const taille = L.boss ? 4.2 : 1.6 + (L.radius - 15) * 0.12;
      const geo = boule.clone(), P = geo.attributes.position, cols = new Float32Array(P.count * 3), v = new THREE.Vector3();
      const bas = new THREE.Color(L.sol.bas), base = new THREE.Color(L.sol.base), haut = new THREE.Color(L.sol.haut);
      for (let k = 0; k < P.count; k++) {
        v.fromBufferAttribute(P, k);
        const n = 0.5 + 0.5 * Math.sin(v.x * 3.1 + L.seed) * Math.sin(v.y * 4.3 + L.seed * 0.3) * Math.sin(v.z * 3.7);
        c.copy(bas).lerp(base, Math.min(1, n * 2)).lerp(haut, Math.max(0, n * 2 - 1));
        if (!allume) { const l = c.r * 0.3 + c.g * 0.59 + c.b * 0.11; c.lerp(new THREE.Color(l * 0.62, l * 0.68, l * 0.84), 0.75); }
        if (!ouverte) c.multiplyScalar(0.55);
        cols.set([c.r, c.g, c.b], k * 3);
      }
      geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
      const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, emissive: allume ? L.sol.base : 0x000000, emissiveIntensity: 0.12 }));
      mesh.scale.setScalar(taille); mesh.position.copy(p); galaxie.add(mesh);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: allume ? L.sol.haut : 0x9aa6d8, transparent: true, opacity: allume ? 0.55 : 0.18, depthWrite: false, blending: THREE.AdditiveBlending }));
      halo.scale.setScalar(taille * 4.2); halo.position.copy(p); galaxie.add(halo);
      if (L.boss) {
        const anneau = new THREE.Mesh(new THREE.TorusGeometry(taille * 1.5, 0.18, 8, 48), new THREE.MeshStandardMaterial({ color: 0xffc23d, emissive: 0x7a4a00, metalness: 0.6, roughness: 0.3 }));
        anneau.position.copy(p); anneau.rotation.x = Math.PI / 2.4; galaxie.add(anneau);
      }
      const choix = new THREE.Mesh(new THREE.TorusGeometry(taille * 1.35, 0.08, 6, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }));
      choix.position.copy(p); choix.visible = false; galaxie.add(choix);
      const e = document.createElement('div');
      e.className = 'etiquette' + (ouverte ? '' : ' ferme') + (allume ? ' allume' : '');
      e.innerHTML = (ouverte ? (allume ? '✓ ' : L.boss ? '👑 ' : '') : '🔒 ') + L.nom;
      $('cosmosEtiquettes').appendChild(e);
      astres.push({ i, L, p, taille, mesh, halo, choix, e, ouverte, allume });
    }
  }

  // ---------- ouverture / fermeture ----------
  function ouvrir(s, g, i) {
    save = s; ici = i; iciG = g; choisie = -1;
    monde.visible = true; $('carte').hidden = false; $('cosmosEtiquettes').hidden = false;
    construire(g);
    monde.add(vaisseau.object); vaisseau.object.scale.setScalar(0.55); vaisseau.object.visible = true;
    // la vue part tout près de la planète où l'on est, puis recule pour montrer la galaxie
    const p = astres[i].p;
    cam.cible.copy(p); cam.dist = 10; cam.yaw = Math.atan2(p.x, p.z); cam.pitch = 0.35;
    cam.cibleVoulue.set(0, 0, 0); cam.distVoulue = DIST_LOIN;
    vol.actif = false;
    entete(); fiche();
  }
  function fermer() {
    monde.visible = false; $('carte').hidden = true; $('cosmosEtiquettes').hidden = true;
    vaisseau.object.scale.setScalar(1);
    camera.fov = 60; camera.updateProjectionMatrix();
  }

  function entete() {
    $('carteNom').textContent = GALAXIES[G].nom;
    $('carteNum').textContent = `Galaxie ${G + 1} / ${GALAXIES.length}`;
    $('carteStats').textContent = `🏮 ${allumesDans(save, G)} / ${NB_PLANETES - 1} phares · 🧡 ${save.gardiens} gardiens libérés`;
    $('cartePrec').disabled = G === 0;
    $('carteSuiv').disabled = G >= save.debloquee;
  }
  function fiche() {
    const f = $('carteFiche');
    astres.forEach(a => (a.choix.visible = a.i === choisie));
    if (choisie < 0) { f.innerHTML = '<span>Touche une planète · fais glisser pour tourner la galaxie</span>'; return; }
    const a = astres[choisie], L = a.L, n = allumesDans(save, G);
    let etat;
    if (!a.ouverte) etat = L.boss ? `Rallume ${BOSS_REQUIS} phares de la galaxie pour l'atteindre (${n} / ${BOSS_REQUIS})` : 'Rallume d\'autres phares pour l\'ouvrir';
    else if (a.allume) etat = L.boss ? 'Grand Phare rallumé ✓' : 'Phare rallumé ✓ · gardien libéré';
    else etat = L.boss ? 'Gardée par la Grande Ombrelle 👑' : `${L.embers} braises · un gardien prisonnier · ${L.ombrelles} Ombrelles`;
    f.innerHTML = `<b>${L.nom}</b><span>${etat}</span>`;
    if (a.ouverte) {
      const go = document.createElement('button');
      const icite = choisie === ici && G === iciG;
      go.className = 'btn petit'; go.textContent = icite ? 'Redescendre' : 'Y aller 🚀';
      go.onclick = () => (icite ? onFermer() : partir(G, choisie));
      f.appendChild(go);
    }
  }
  function choisir(i) {
    choisie = i;
    if (i >= 0) { cam.cibleVoulue.copy(astres[i].p); cam.distVoulue = DIST_PRES + astres[i].taille * 3; }
    else { cam.cibleVoulue.set(0, 0, 0); cam.distVoulue = DIST_LOIN; }
    fiche();
  }
  $('cartePrec').onclick = () => { if (G > 0 && !vol.actif) { construire(G - 1); choisir(-1); entete(); } };
  $('carteSuiv').onclick = () => { if (G < save.debloquee && !vol.actif) { construire(G + 1); choisir(-1); entete(); } };
  $('carteFermer').onclick = () => { if (!vol.actif) onFermer(); };

  // ---------- doigts et souris ----------
  const doigts = new Map(); let bouge = 0, pince = 0;
  canvas.addEventListener('pointerdown', e => {
    if (!monde.visible || vol.actif) return;
    doigts.set(e.pointerId, { x: e.clientX, y: e.clientY }); bouge = 0;
    if (doigts.size === 2) { const [a, b] = [...doigts.values()]; pince = Math.hypot(a.x - b.x, a.y - b.y); }
  });
  addEventListener('pointermove', e => {
    const d = doigts.get(e.pointerId); if (!d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y; d.x = e.clientX; d.y = e.clientY;
    bouge += Math.abs(dx) + Math.abs(dy);
    if (doigts.size === 1) {
      cam.yaw -= dx * 0.006; cam.pitch = THREE.MathUtils.clamp(cam.pitch + dy * 0.004, 0.08, 1.35);
    } else if (doigts.size === 2) {
      const [a, b] = [...doigts.values()], p = Math.hypot(a.x - b.x, a.y - b.y);
      if (pince > 0) cam.distVoulue = THREE.MathUtils.clamp(cam.distVoulue * pince / p, 12, 200);
      pince = p;
    }
  });
  const leve = e => {
    if (!doigts.has(e.pointerId)) return;
    const seul = doigts.size === 1; doigts.delete(e.pointerId);
    if (seul && bouge < 10) toucher(e.clientX, e.clientY);
  };
  addEventListener('pointerup', leve); addEventListener('pointercancel', e => doigts.delete(e.pointerId));
  canvas.addEventListener('wheel', e => { if (monde.visible) cam.distVoulue = THREE.MathUtils.clamp(cam.distVoulue * (1 + e.deltaY * 0.001), 12, 200); }, { passive: true });

  // on choisit la planète la plus proche du doigt à l'écran (plus facile que viser une petite boule)
  const ecran = (p, out) => { out.copy(p).add(BASE).project(camera); return out.z < 1 ? { x: (out.x + 1) / 2 * innerWidth, y: (1 - out.y) / 2 * innerHeight } : null; };
  const tmpV = new THREE.Vector3();
  function toucher(x, y) {
    let meilleur = -1, dmin = Infinity;
    for (const a of astres) {
      const s = ecran(a.p, tmpV); if (!s) continue;
      const d = Math.hypot(s.x - x, s.y - y);
      if (d < 46 && d < dmin) { dmin = d; meilleur = a.i; }
    }
    choisir(meilleur);
  }

  // ---------- le vol de la Luciole (automatique) ----------
  function partir(g, i) {
    vol.actif = true; vol.t = 0; vol.dest = { g, i }; vol.fin = false;
    vol.hyper = g !== iciG ? 1 : 0;
    $('carteFiche').innerHTML = `<b>${planete(g, i).nom}</b><span>${vol.hyper ? 'Saut hyperespace… 🚀' : 'En route… 🚀'}</span>`;
    $('carte').classList.add('envol');
    if (vol.hyper) {
      if (G !== iciG) construire(iciG);
      vol.tHyper = 0;
    } else preparerCourbe();
  }
  function preparerCourbe() {
    const { i } = vol.dest, a = astres[i];
    const depart = vaisseau.object.position.clone();
    const versDepart = depart.clone().sub(a.p).normalize();
    const arrivee = a.p.clone().addScaledVector(versDepart, a.taille + 0.8);
    const milieu = depart.clone().lerp(arrivee, 0.5).add(new THREE.Vector3(0, 12 + depart.distanceTo(arrivee) * 0.15, 0));
    vol.courbe = new THREE.QuadraticBezierCurve3(depart, milieu, arrivee);
    vol.duree = 3.2 + depart.distanceTo(arrivee) * 0.018; vol.t = 0;
    astres.forEach(x => (x.choix.visible = x.i === i));
  }

  const camPos = new THREE.Vector3(), regard = new THREE.Vector3();
  function update(dt) {
    if (!monde.visible) return;
    t += dt;
    for (const a of astres) a.mesh.rotation.y += dt * 0.25;
    if (galaxie) galaxie.rotation.y = 0;

    if (vol.actif && vol.hyper === 1) {
      // saut hyperespace : la Luciole fonce, l'image s'étire, puis on change de galaxie
      vol.tHyper += dt;
      const avant = new THREE.Vector3(0, 0.3, 1).applyQuaternion(vaisseau.object.quaternion);
      vaisseau.object.position.addScaledVector(avant, dt * (20 + vol.tHyper * 160));
      vaisseau.animate(dt, 1, 0);
      camera.fov = 60 + Math.min(1, vol.tHyper / 1.2) * 50; camera.updateProjectionMatrix();
      camPos.copy(vaisseau.object.position).addScaledVector(avant, -9).add(new THREE.Vector3(0, 3, 0));
      camera.position.copy(camPos).add(BASE); camera.lookAt(regard.copy(vaisseau.object.position).add(BASE));
      document.body.classList.toggle('hyperespace', vol.tHyper > 0.5);
      if (vol.tHyper > 1.4) {
        construire(vol.dest.g); entete();
        vaisseau.object.position.set(0, 40, 170);
        vol.hyper = 2; camera.fov = 60; camera.updateProjectionMatrix();
        document.body.classList.remove('hyperespace');
        preparerCourbe(); vol.recale = true;
      }
    } else if (vol.actif) {
      vol.t = Math.min(1, vol.t + dt / vol.duree);
      const k = ease(vol.t), p = vol.courbe.getPoint(k), tan = vol.courbe.getTangent(k);
      vaisseau.object.position.copy(p);
      vaisseau.object.lookAt(regard.copy(p).add(tan).add(BASE));     // lookAt attend une position absolue
      vaisseau.animate(dt, 1, 0);
      // caméra de poursuite qui se rapproche à l'arrivée
      camPos.copy(p).addScaledVector(tan, -10 + k * 4).add(new THREE.Vector3(0, 4 - k * 2, 0));
      camera.position.lerp(tmpV.copy(camPos).add(BASE), vol.recale ? 1 : 1 - Math.exp(-5 * dt)); vol.recale = false;
      camera.lookAt(regard.copy(p).addScaledVector(tan, 6).add(BASE));
      if (vol.t > 0.82 && !vol.fin) { vol.fin = true; document.body.classList.add('fondu'); }
      if (vol.t >= 1) {
        vol.actif = false; $('carte').classList.remove('envol');
        onArrivee(vol.dest.g, vol.dest.i);
      }
    } else {
      // vue libre : la caméra tourne autour de la cible
      cam.cible.lerp(cam.cibleVoulue, 1 - Math.exp(-3 * dt));
      cam.dist += (cam.distVoulue - cam.dist) * (1 - Math.exp(-2.5 * dt));
      const cp = Math.cos(cam.pitch);
      camPos.set(Math.sin(cam.yaw) * cp, Math.sin(cam.pitch), Math.cos(cam.yaw) * cp).multiplyScalar(cam.dist).add(cam.cible);
      camera.position.copy(camPos).add(BASE); camera.up.set(0, 1, 0);
      camera.lookAt(regard.copy(cam.cible).add(BASE));
      // la Luciole flotte au-dessus de la planète où l'on est (seulement dans sa galaxie)
      vaisseau.object.visible = G === iciG;
      if (G === iciG) {
        const a = astres[ici], ang = t * 0.6;
        vaisseau.object.position.copy(a.p).add(new THREE.Vector3(Math.cos(ang) * (a.taille + 2.2), a.taille * 0.6 + 1, Math.sin(ang) * (a.taille + 2.2)));
        vaisseau.object.lookAt(a.p.clone().add(new THREE.Vector3(Math.cos(ang + 0.6) * (a.taille + 2.2), a.taille * 0.6 + 1, Math.sin(ang + 0.6) * (a.taille + 2.2))).add(BASE));
        vaisseau.animate(dt, 0.6, 0);
      }
    }
    // étiquettes sous les planètes
    for (const a of astres) {
      const s = ecran(tmpV.copy(a.p).add(new THREE.Vector3(0, -a.taille - 0.6, 0)), tmpV);
      a.e.style.display = s && !vol.actif && (a.ouverte || a.L.boss || a.i === choisie || cam.dist < 70) ? '' : 'none';
      if (s) { a.e.style.left = s.x + 'px'; a.e.style.top = s.y + 'px'; }
      a.halo.material.opacity = (a.allume ? 0.5 : 0.16) + (a.i === choisie ? Math.sin(t * 5) * 0.15 + 0.15 : 0);
      a.choix.rotation.x = Math.PI / 2; a.choix.rotation.z = t;
    }
  }

  return { ouvrir, fermer, update, get actif() { return monde.visible; }, get enVol() { return vol.actif; } };
}
