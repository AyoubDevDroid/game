// La mission de chaque planète (en plus des cristaux et du phare) : sauvetage, braseros ou commande.
// Réussie, elle rapporte une étoile de mission ⭐ (sauvegardée) et un mot de Mamie Mèche.
import * as THREE from 'three';
import { MISSIONS, missionDe } from './histoire.js';
import { habitant, PEUPLES } from './parcours.js';
import { rng } from './univers.js';

const Y = new THREE.Vector3(0, 1, 0);

function brasero(glow) {
  const g = new THREE.Group();
  const pierre = new THREE.MeshLambertMaterial({ color: 0x8a7a9a }), sombre = new THREE.MeshLambertMaterial({ color: 0x4a3a5a });
  const bol = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.32, 0.4, 14), pierre); bol.position.y = 0.95; g.add(bol);
  const pied = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, 0.8, 10), sombre); pied.position.y = 0.4; g.add(pied);
  const braise = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x3a2a30 })); braise.position.y = 1.05; g.add(braise);
  const feu = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xff8a3d, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  feu.position.y = 1.5; feu.scale.set(1.6, 2.2, 1); g.add(feu);
  return { g, braise, feu };
}

// planet : la planète construite ; save : la sauvegarde ; cle : "g-i"
export function installerMission(planet, glow, save, cle) {
  const type = missionDe(planet); if (!type) return null;
  const M = { type, ...MISSIONS[type], faite: !!(save.etoiles && save.etoiles[cle]), progres: '', braseros: [], chrono: 0 };
  const r = rng(planet.seed * 13 + 3);
  if (type === 'braseros') {
    for (let k = 0; k < 4; k++) {
      let d = planet.freeDir(0.7);
      for (let n = 0; n < 30 && d.angleTo(Y) * planet.radius < 11; n++) d = planet.freeDir(0.7);   // loin de l'atterrissage
      const b = brasero(glow);
      planet.placeOn(b.g, d); planet.group.add(b.g);
      planet.obstacles.push({ dir: d, radius: 0.5, height: 1.2 });
      M.braseros.push({ ...b, dir: d, pos: b.g.position.clone().addScaledVector(d, 1.1), allume: M.faite });
    }
  }
  if (type === 'commande') {
    const peuple = PEUPLES[planet.biome] || PEUPLES.menthe;
    const h = habitant(peuple, r), g = new THREE.Group(); g.add(h.g); g.scale.setScalar(1.25);
    const d = new THREE.Vector3(0, Math.cos(9 / planet.radius), Math.sin(9 / planet.radius)).applyAxisAngle(Y, 0.6).normalize();
    planet.placeOn(g, d); planet.group.add(g);
    const bulle = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xffe066, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    bulle.position.y = 1.7; bulle.scale.setScalar(0.9); g.add(bulle);
    M.ancien = { g, h, bulle, dir: d, pos: g.position.clone().addScaledVector(d, 0.6) };
    M.voulu = Math.min(30, Math.max(10, Math.floor(planet.ressources.items.length * 0.45)));
  }
  return M;
}

// renvoie un évènement : { type: 'brasero' | 'chrono_rate' | 'demande' | 'reussie' }
export function updateMission(M, planet, fanalPos, dt, clock) {
  if (!M) return null;
  let evt = null;
  if (M.type === 'sauvetage') {
    const h = planet.parcours.habitants, n = h.filter(x => x.libre).length;
    M.progres = `${n} / ${h.length}`;
    if (!M.faite && h.length && n === h.length) { M.faite = true; evt = { type: 'reussie' }; }
  }
  if (M.type === 'braseros') {
    const n = M.braseros.filter(b => b.allume).length;
    for (const b of M.braseros) {
      b.feu.material.opacity = b.allume ? 0.85 + Math.sin(clock * 9 + b.dir.x * 9) * 0.15 : 0;
      b.braise.material.color.setHex(b.allume ? 0xffb347 : 0x3a2a30);
      if (!M.faite && !b.allume && fanalPos.distanceTo(b.pos) < 1.8) {
        b.allume = true; evt = { type: 'brasero', pos: b.pos.clone() };
        if (n === 0) M.chrono = 30 + Math.round(planet.radius);
      }
    }
    const n2 = M.braseros.filter(b => b.allume).length;
    if (!M.faite && n2 === M.braseros.length) { M.faite = true; M.chrono = 0; evt = { type: 'reussie' }; }
    if (!M.faite && M.chrono > 0) {
      M.chrono -= dt;
      if (M.chrono <= 0) { M.chrono = 0; M.braseros.forEach(b => (b.allume = false)); evt = { type: 'chrono_rate' }; }
    }
    M.progres = M.faite ? '✓' : `${n2} / ${M.braseros.length}` + (M.chrono > 0 ? ` · ${Math.ceil(M.chrono)} s` : '');
  }
  if (M.type === 'commande') {
    const pris = planet.ressources.items.filter(x => x.pris).length;
    M.progres = M.faite ? '✓' : `${Math.min(pris, M.voulu)} / ${M.voulu} ${planet.ressource.icone}`;
    const a = M.ancien;
    a.bulle.material.opacity = M.faite ? 0 : 0.6 + Math.sin(clock * 4) * 0.3;
    a.h.corps.rotation.z = Math.sin(clock * 2) * 0.08;
    const pres = fanalPos.distanceTo(a.pos) < 2.4;
    if (pres && !a.pres && !M.faite) evt = pris >= M.voulu ? (M.faite = true, { type: 'reussie' }) : { type: 'demande', il_manque: M.voulu - pris };
    a.pres = pres;
  }
  if (M.faite) M.progres = '✓';
  return evt;
}
