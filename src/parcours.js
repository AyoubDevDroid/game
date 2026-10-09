// Le parcours d'une planète (façon niveau de plateforme) : un chemin du vaisseau au phare,
// des lanternes-relais (points de reprise), des coffres au trésor, des flammèches (vie),
// et les habitants du peuple local, prisonniers de bulles d'ombre, cachés partout : il faut les libérer.
// Tous les personnages sont dessinés par le code, dans le style de Fanal.
import * as THREE from 'three';
import { peindrePaves } from './peinture.js';

const Y = new THREE.Vector3(0, 1, 0);

// ---------- les peuples (un par monde) ----------
export const PEUPLES = {
  menthe: { nom: 'Mousserons', forme: 'champignon', corps: 0xfff1df, deco: 0xff5fae },
  lave: { nom: 'Braisillons', forme: 'flamme', corps: 0xffb36b, deco: 0xff5a1f },
  'étoilée': { nom: 'Astronomes', forme: 'antennes', corps: 0xd9ccff, deco: 0xffe066 },
  givre: { nom: 'Givrins', forme: 'bonnet', corps: 0xe8fbff, deco: 0x3fa0ff },
  verdoyance: { nom: 'Jardiniers', forme: 'pousse', corps: 0xfff2b0, deco: 0x5fd03f },
  dunes: { nom: 'Nomades des sables', forme: 'turban', corps: 0xffd9a8, deco: 0x2fd3c4 },
  corail: { nom: 'Corailleurs', forme: 'coquillage', corps: 0xffd0dc, deco: 0xff6f91 },
  marais: { nom: 'Gens des marais', forme: 'nenuphar', corps: 0xb8f0c0, deco: 0x7f63c9 },
  lagon: { nom: 'Pêcheurs du lagon', forme: 'bandana', corps: 0xfff0d0, deco: 0x00b8d9 },
  volcan: { nom: 'Forgerons', forme: 'flamme', corps: 0xffc28a, deco: 0xd8285f },
  hantee: { nom: 'Veilleurs de nuit', forme: 'capuche', corps: 0xc9b8ff, deco: 0x5c3f99 },
  pirate: { nom: 'Corsaires de lumière', forme: 'bandana', corps: 0xffe0c4, deco: 0xff3d3d },
  royaume: { nom: 'Gens du royaume', forme: 'couronne', corps: 0xfff4e0, deco: 0xffc23d },
  gourmande: { nom: 'Mielins', forme: 'oreilles', corps: 0xffe6f2, deco: 0xff8ad8 },
  fetes: { nom: 'Lutins des neiges', forme: 'pointu', corps: 0xfff0e6, deco: 0xe0283f },
  bourg: { nom: 'Bourgeois du bourg', forme: 'paille', corps: 0xffe8c8, deco: 0xd9a441 },
  ocean: { nom: 'Nageurs des abysses', forme: 'coquillage', corps: 0xd0f4ff, deco: 0x00a3c4 },
  nuages: { nom: 'Gens des nuées', forme: 'antennes', corps: 0xfff4ff, deco: 0xb08cff },
};

// ---------- géométries partagées (jamais libérées) ----------
const partage = g => { g.userData.partage = true; return g; };
const GH = {
  corps: partage(new THREE.SphereGeometry(0.36, 18, 14)), oeil: partage(new THREE.SphereGeometry(0.075, 10, 8)),
  pupille: partage(new THREE.SphereGeometry(0.04, 8, 6)), bras: partage(new THREE.SphereGeometry(0.09, 8, 6)),
  pied: partage(new THREE.SphereGeometry(0.1, 8, 6)), bouche: partage(new THREE.TorusGeometry(0.06, 0.016, 6, 12, Math.PI)),
  bulle: partage(new THREE.SphereGeometry(0.85, 24, 18)), tourbillon: partage(new THREE.TorusGeometry(0.6, 0.03, 6, 40)),
  chapeau: partage(new THREE.SphereGeometry(0.34, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2)), cone: partage(new THREE.ConeGeometry(0.22, 0.5, 12)),
  boule: partage(new THREE.SphereGeometry(0.07, 8, 6)), oreille: partage(new THREE.CapsuleGeometry(0.06, 0.32, 4, 8)),
  tige: partage(new THREE.CylinderGeometry(0.015, 0.015, 0.25, 5)), anneau: partage(new THREE.TorusGeometry(0.3, 0.05, 6, 20)),
  pointe: partage(new THREE.ConeGeometry(0.06, 0.14, 5)), feuille: partage(new THREE.SphereGeometry(0.1, 8, 6)),
};
const MB = { blanc: new THREE.MeshBasicMaterial({ color: 0xffffff }), noir: new THREE.MeshBasicMaterial({ color: 0x2a1640 }) };
for (const m of Object.values(MB)) m.userData.partage = true;

// un habitant (dessiné par le code) ; renvoie { g, corps, bras, bouche, … }
export function habitant(peuple, r) {
  const lam = c => new THREE.MeshLambertMaterial({ color: c });
  const mCorps = lam(peuple.corps), mDeco = lam(peuple.deco);
  const g = new THREE.Group(), corps = new THREE.Group(); g.add(corps);
  const ventre = new THREE.Mesh(GH.corps, mCorps); ventre.position.y = 0.42; ventre.scale.set(1, 1.08, 0.95); corps.add(ventre);
  const pieds = [-0.14, 0.14].map(x => { const p = new THREE.Mesh(GH.pied, mDeco); p.position.set(x, 0.07, 0.06); p.scale.set(1, 0.6, 1.4); g.add(p); return p; });
  const bras = [-1, 1].map(s => { const b = new THREE.Mesh(GH.bras, mCorps); b.position.set(s * 0.36, 0.4, 0.02); corps.add(b); return b; });
  for (const s of [-1, 1]) {
    const o = new THREE.Mesh(GH.oeil, MB.blanc); o.position.set(s * 0.12, 0.5, 0.3); o.scale.set(1, 1.3, 0.6); corps.add(o);
    const p = new THREE.Mesh(GH.pupille, MB.noir); p.position.set(s * 0.12, 0.49, 0.35); corps.add(p);
  }
  const bouche = new THREE.Mesh(GH.bouche, MB.noir); bouche.position.set(0, 0.36, 0.33); corps.add(bouche);
  const joue = new THREE.MeshBasicMaterial({ color: 0xff8fb8, transparent: true, opacity: 0.6 });
  for (const s of [-1, 1]) { const j = new THREE.Mesh(GH.pupille, joue); j.position.set(s * 0.22, 0.4, 0.29); j.scale.set(1.3, 0.8, 0.5); corps.add(j); }
  // ce qui distingue chaque peuple
  const tete = new THREE.Group(); tete.position.y = 0.72; corps.add(tete);
  const add = (geo, mat, x, y, z, rx = 0, rz = 0, s = 1) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, 0, rz); m.scale.setScalar(s); tete.add(m); return m; };
  switch (peuple.forme) {
    case 'champignon': { const c = add(GH.chapeau, mDeco, 0, -0.05, 0); c.scale.set(1.5, 0.9, 1.5); for (let k = 0; k < 4; k++) add(GH.boule, MB.blanc, Math.cos(k * 1.6) * 0.3, 0.12, Math.sin(k * 1.6) * 0.3); break; }
    case 'flamme': for (let k = 0; k < 3; k++) add(GH.cone, mDeco, (k - 1) * 0.12, 0.05 + (k === 1 ? 0.08 : 0), 0, 0, (k - 1) * -0.35, 0.6); break;
    case 'antennes': for (const s of [-1, 1]) { add(GH.tige, mDeco, s * 0.1, 0.08, 0, 0, s * -0.4); add(GH.boule, mDeco, s * 0.16, 0.2, 0); } break;
    case 'bonnet': { const c = add(GH.chapeau, mDeco, 0, -0.08, 0); c.scale.set(1.05, 1.1, 1.05); add(GH.boule, MB.blanc, 0, 0.3, 0, 0, 0, 1.4); break; }
    case 'pousse': add(GH.tige, mDeco, 0, 0.08, 0); add(GH.feuille, mDeco, 0.08, 0.2, 0, 0, -0.8).scale.set(1.4, 0.5, 0.8); add(GH.feuille, mDeco, -0.08, 0.18, 0, 0, 0.8).scale.set(1.4, 0.5, 0.8); break;
    case 'turban': { const t = add(GH.chapeau, mDeco, 0, -0.08, 0); t.scale.set(1.15, 0.8, 1.15); add(GH.anneau, mDeco, 0, -0.08, 0, Math.PI / 2, 0, 1.1); add(GH.boule, lam(0xffd23f), 0, -0.04, 0.33); break; }
    case 'coquillage': { const c = add(GH.chapeau, mDeco, 0, -0.02, 0); c.scale.set(1.1, 0.7, 0.7); c.rotation.x = -0.3; break; }
    case 'nenuphar': { const c = add(GH.chapeau, mDeco, 0, -0.05, 0); c.scale.set(1.6, 0.25, 1.6); add(GH.boule, lam(0xff8ad8), 0, 0.05, 0, 0, 0, 1.6); break; }
    case 'bandana': { const c = add(GH.chapeau, mDeco, 0, -0.1, 0); c.scale.set(1.08, 0.75, 1.08); add(GH.boule, mDeco, 0.05, -0.05, -0.36, 0, 0, 1.3); break; }
    case 'capuche': { const c = add(GH.chapeau, mDeco, 0, -0.2, -0.04); c.scale.set(1.2, 1.4, 1.2); break; }
    case 'couronne': { add(GH.anneau, mDeco, 0, -0.04, 0, Math.PI / 2, 0, 0.75); for (let k = 0; k < 5; k++) add(GH.pointe, mDeco, Math.cos(k * 1.257) * 0.22, 0.06, Math.sin(k * 1.257) * 0.22); break; }
    case 'oreilles': for (const s of [-1, 1]) add(GH.oreille, mDeco, s * 0.14, 0.12, 0, 0, s * -0.25); break;
    case 'pointu': { const c = add(GH.cone, mDeco, 0, 0.12, 0, -0.25, 0, 1.3); c.scale.y = 1.6; add(GH.boule, MB.blanc, 0, 0.5, -0.2, 0, 0, 1.3); break; }
    case 'paille': { const c = add(GH.chapeau, mDeco, 0, -0.04, 0); c.scale.set(1.7, 0.45, 1.7); add(GH.anneau, lam(0xd8285f), 0, -0.03, 0, Math.PI / 2, 0, 0.95); break; }
  }
  return { g, corps, bras, pieds, bouche };
}

// ---------- une lanterne-relais (point de reprise) ----------
function relais(glow) {
  const g = new THREE.Group();
  const bois = new THREE.MeshLambertMaterial({ color: 0x7a4a35 }), metal = new THREE.MeshLambertMaterial({ color: 0x3b1f5c });
  const mat = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 1.8, 8), bois); mat.position.y = 0.9; g.add(mat);
  const socle = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.2, 10), metal); socle.position.y = 0.1; g.add(socle);
  const potence = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.06), bois); potence.position.set(0.25, 1.75, 0); g.add(potence);
  const lampe = new THREE.MeshStandardMaterial({ color: 0x8a8aa0, emissive: 0xffb347, emissiveIntensity: 0, transparent: true, opacity: 0.9 });
  const cage = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.32, 6), lampe); cage.position.set(0.5, 1.5, 0); g.add(cage);
  const toit = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.15, 6), metal); toit.position.set(0.5, 1.72, 0); g.add(toit);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xffb347, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.position.set(0.5, 1.5, 0); halo.scale.setScalar(2.2); g.add(halo);
  return { g, lampe, halo };
}

// ---------- un coffre au trésor ----------
function coffre(glow) {
  const g = new THREE.Group();
  const bois = new THREE.MeshLambertMaterial({ color: 0xa0522d }), or = new THREE.MeshStandardMaterial({ color: 0xffc23d, emissive: 0x7a4a00, metalness: 0.6, roughness: 0.3 });
  const caisse = new THREE.Mesh(new THREE.BoxGeometry(1, 0.55, 0.65), bois); caisse.position.y = 0.28; g.add(caisse);
  const couvercle = new THREE.Group(); couvercle.position.set(0, 0.55, -0.32); g.add(couvercle);
  const dome = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 1, 12, 1, false, 0, Math.PI), bois);
  dome.rotation.z = Math.PI / 2; dome.rotation.y = Math.PI / 2; dome.position.z = 0.32; couvercle.add(dome);
  for (const x of [-0.35, 0, 0.35]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.68), or); b.position.set(x, 0.29, 0); g.add(b); }
  const serrure = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.06), or); serrure.position.set(0, 0.42, 0.34); g.add(serrure);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xffd36b, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.position.y = 0.6; halo.scale.setScalar(2.4); g.add(halo);
  return { g, couvercle, halo };
}

// ---------- construction du parcours ----------
// ctx : { L, r, k, group, surfacePoint, placeOn, marquer, glow, U, allumable, obstacles, solides, depart, arrivee, deja }
export function tracerChemin(ctx) {
  const { L, r, surfacePoint, marquer, group, U, allumable, depart, arrivee, glow, obstacles } = ctx;
  const R = L.radius;
  const axe = new THREE.Vector3().crossVectors(depart, arrivee).normalize();
  const angle = depart.angleTo(arrivee), pas = 0.9 / R, n = Math.max(8, Math.floor(angle / pas));
  const ondulation = 2.5 + r() * 1.5, tours = 2 + Math.floor(r() * 2);
  const points = [];
  if (ctx.etapes) {                                                         // archipel : le chemin passe d'île en île
    for (let e = 0; e < ctx.etapes.length - 1; e++) {
      const a = ctx.etapes[e], b = ctx.etapes[e + 1], m = Math.max(2, Math.ceil(a.angleTo(b) / pas));
      for (let i = 0; i < m; i++) points.push(a.clone().lerp(b, i / m).normalize());
    }
    points.push(ctx.etapes[ctx.etapes.length - 1].clone());
  } else for (let i = 0; i <= n; i++) {
    const t = i / n, d = depart.clone().applyAxisAngle(axe, angle * t);
    const cote = new THREE.Vector3().crossVectors(d, axe).normalize();      // de côté : le chemin serpente
    d.addScaledVector(cote, Math.sin(t * Math.PI * tours) * Math.sin(t * Math.PI) * ondulation / R).normalize();
    points.push(d);
  }
  for (const d of points) marquer(d, 0.2);
  // ruban pavé posé sur le relief : clair au centre, plus foncé sur les bords
  const pos = [], col = [], idx = [];
  const cCentre = new THREE.Color(L.palette ? L.palette.sol.haut : 0xffffff).lerp(new THREE.Color(0xfff4e0), 0.45);
  const cBord = new THREE.Color(L.palette ? L.palette.terre : 0xb08060).lerp(new THREE.Color(0xffffff), 0.15);
  for (let i = 0; i < points.length; i++) {
    const d = points[i], suiv = points[Math.min(i + 1, points.length - 1)], prec = points[Math.max(i - 1, 0)];
    const tan = suiv.clone().sub(prec).normalize(), cote = new THREE.Vector3().crossVectors(d, tan).normalize();
    for (const [o, c] of [[-1.05, cBord], [-0.75, cCentre], [0, cCentre], [0.75, cCentre], [1.05, cBord]]) {
      const dd = d.clone().addScaledVector(cote, o / R).normalize(), p = surfacePoint(dd).addScaledVector(dd, 0.07);
      pos.push(p.x, p.y, p.z); col.push(c.r, c.g, c.b);
    }
    if (i > 0 && (!ctx.terre || (ctx.terre(points[i]) && ctx.terre(points[i - 1])))) for (let j = 0; j < 4; j++) { const a = (i - 1) * 5 + j, b = i * 5 + j; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx); geo.computeVertexNormals();
  group.add(new THREE.Mesh(geo, allumable(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), U, { tex: peindrePaves(L), texScale: 0.42, plein: true })));
  // cailloux de bordure
  const caillou = new THREE.IcosahedronGeometry(0.16, 0), nbC = Math.floor(points.length * 1.2);
  const cailloux = new THREE.InstancedMesh(caillou, allumable(new THREE.MeshLambertMaterial({ color: cBord.clone().multiplyScalar(0.85), flatShading: true }), U), nbC);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3();
  for (let i = 0; i < nbC; i++) {
    const j = Math.floor(r() * (points.length - 1)), d = points[j], tan = points[j + 1].clone().sub(d).normalize();
    const cote = new THREE.Vector3().crossVectors(d, tan).normalize(), dd = d.clone().addScaledVector(cote, (r() < 0.5 ? -1 : 1) * 1.25 / R).normalize();
    const vide = ctx.terre && !ctx.terre(dd);                               // pas de caillou au-dessus du vide
    Q.setFromUnitVectors(Y, dd); const s = vide ? 0 : 0.6 + r() * 0.9;
    cailloux.setMatrixAt(i, M.compose(surfacePoint(dd), Q, S.set(s, s * 0.6, s)));
  }
  group.add(cailloux);
  // trois lanternes-relais le long du chemin
  // lanternes-relais : environ une tous les 25 pas de chemin (points de reprise rapprochés)
  const nbRelais = Math.max(3, Math.min(9, Math.round(points.length * pas * R / 25)));
  const proche = d => { let m = 0, best = 9; points.forEach((p, k) => { const a = p.angleTo(d); if (a < best && k < points.length - 1) { best = a; m = k; } }); return m / (points.length - 1); };
  const lesRelais = (ctx.relaisDirs ? ctx.relaisDirs.map(proche) : Array.from({ length: nbRelais }, (_, k) => 0.12 + 0.8 * (k + 0.5) / nbRelais)).map((t, n2) => {
    let j = Math.floor(t * (points.length - 1));
    if (ctx.terre) for (let e = 0; e < points.length * 2; e++) {           // archipel : la lanterne se pose sur une île, jamais au-dessus du vide
      const jj = j + (e % 2 ? -1 : 1) * Math.ceil(e / 2);
      if (jj < 0 || jj >= points.length - 1 || !ctx.terre(points[jj])) continue;
      const t2 = points[jj + 1].clone().sub(points[jj]).normalize(), c2 = new THREE.Vector3().crossVectors(points[jj], t2).normalize();
      if (ctx.terre(points[jj].clone().addScaledVector(c2, 1.7 / R).normalize())) { j = jj; break; }
    }
    const d = points[j], tan = points[j + 1].clone().sub(d).normalize();
    const cote = new THREE.Vector3().crossVectors(d, tan).normalize(), dd = d.clone().addScaledVector(cote, 1.7 / R).normalize();
    const rl = relais(glow); ctx.placeOn(rl.g, dd); group.add(rl.g);
    obstacles.push({ dir: dd, radius: 0.35, height: 1.9 });
    return { ...rl, dir: dd, reprise: d.clone(), allume: false, n: n2 };
  });
  return { points, relais: lesRelais };
}

// coffres, flammèches et habitants, posés aux endroits donnés : [{ dir, h }]
export function placerTresors(ctx, coinsCoffres, coinsHabitants, coinsFlammeches, deja = { coffres: [], liberes: [] }) {
  const { L, r, group, surfacePoint, glow, solides } = ctx;
  const coffres = coinsCoffres.map((c, n) => {
    const cf = coffre(glow); const ouvert = deja.coffres.includes(n);
    cf.g.position.copy(surfacePoint(c.dir)).addScaledVector(c.dir, Math.max(0, c.h - 0.9));
    cf.g.quaternion.setFromUnitVectors(Y, c.dir).multiply(new THREE.Quaternion().setFromAxisAngle(Y, r() * 6.28));
    group.add(cf.g);
    if (ouvert) { cf.couvercle.rotation.x = -1.9; cf.halo.visible = false; }
    if (c.h <= 0.95) solides.push({ dir: c.dir.clone(), radius: 0.55, bas: 0, haut: 0.9 });
    return { ...cf, dir: c.dir, pos: cf.g.position.clone().addScaledVector(c.dir, 0.5), ouvert, t: ouvert ? 1 : 0, n };
  });
  const flammeches = coinsFlammeches.map(c => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xff5fa2, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    const coeur = new THREE.Mesh(GH.boule, new THREE.MeshBasicMaterial({ color: 0xffd0e6 })); coeur.scale.setScalar(2.2);
    const g = new THREE.Group(); g.add(s, coeur); s.scale.setScalar(1.3);
    g.position.copy(surfacePoint(c.dir)).addScaledVector(c.dir, c.h); group.add(g);
    return { g, dir: c.dir, pos: g.position.clone(), pris: false, ph: r() * 6 };
  });
  const peuple = PEUPLES[L.biome] || PEUPLES.menthe;
  const habitants = coinsHabitants.map((c, n) => {
    const h = habitant(peuple, r), libre = deja.liberes.includes(n);
    const g = new THREE.Group(); g.add(h.g);
    g.position.copy(surfacePoint(c.dir)).addScaledVector(c.dir, Math.max(0, c.h - 0.9));
    g.quaternion.setFromUnitVectors(Y, c.dir).multiply(new THREE.Quaternion().setFromAxisAngle(Y, r() * 6.28));
    const bulleMat = new THREE.MeshStandardMaterial({ color: 0x3b1f5c, emissive: 0x2a0d4a, transparent: true, opacity: 0.55, roughness: 0.1, metalness: 0.4, depthWrite: false });
    const bulle = new THREE.Mesh(GH.bulle, bulleMat); bulle.position.y = 0.55; g.add(bulle);
    const tour = new THREE.Mesh(GH.tourbillon, new THREE.MeshBasicMaterial({ color: 0x9a6fd6, transparent: true, opacity: 0.7 })); tour.position.y = 0.55; g.add(tour);
    const appel = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xb48cff, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }));
    appel.position.y = 1.7; appel.scale.setScalar(1.2); g.add(appel);
    group.add(g);
    if (libre) g.visible = false;
    return { ...h, groupe: g, bulle, tour, appel, dir: c.dir, pos: g.position.clone().addScaledVector(c.dir, 0.55), libre, t: 0, n, ph: r() * 6, parti: libre };
  });
  return { coffres, flammeches, habitants, peuple };
}

// animation de tout ce petit monde
export function animerParcours(P, dt, clock) {
  const pc = P.parcours; if (!pc) return;
  for (const rl of pc.relais) {
    rl.lampe.emissiveIntensity = rl.allume ? 1.8 + Math.sin(clock * 6) * 0.3 : 0;
    rl.halo.material.opacity = rl.allume ? 0.75 : 0;
  }
  for (const c of pc.coffres) {
    if (c.ouvert && c.t < 1) { c.t = Math.min(1, c.t + dt * 2.5); c.couvercle.rotation.x = -1.9 * c.t; }
    if (!c.ouvert) c.halo.material.opacity = 0.4 + Math.sin(clock * 3 + c.n) * 0.2;
    else c.halo.visible = false;
  }
  for (const f of pc.flammeches) {
    if (f.pris) { f.g.visible = false; continue; }
    f.g.position.copy(f.pos).addScaledVector(f.dir, Math.sin(clock * 2.5 + f.ph) * 0.15);
    f.g.children[0].material.opacity = 0.7 + Math.sin(clock * 6 + f.ph) * 0.3;
  }
  for (const h of pc.habitants) {
    if (h.parti) continue;
    if (!h.libre) {
      // prisonnier : il se balance tristement, la bulle tourbillonne
      h.corps.rotation.z = Math.sin(clock * 1.5 + h.ph) * 0.12;
      h.bouche.rotation.z = Math.PI;                                   // bouche à l'envers : triste
      h.tour.rotation.x = clock * 1.3 + h.ph; h.tour.rotation.y = clock * 0.9;
      h.appel.material.opacity = 0.35 + Math.sin(clock * 4 + h.ph) * 0.25;
      h.bras.forEach((b, i) => { b.position.y = 0.38 + Math.sin(clock * 3 + i) * 0.03; });
    } else {
      // libéré : il saute de joie, bras en l'air, puis s'envole vers la Luciole
      h.t += dt;
      h.bouche.rotation.z = 0;
      h.bulle.visible = false; h.tour.visible = false; h.appel.visible = false;
      h.corps.rotation.z = 0;
      h.g.position.y = h.t < 1.8 ? Math.abs(Math.sin(h.t * 7)) * 0.6 : (h.t - 1.8) * (h.t - 1.8) * 9;
      h.bras.forEach((b, i) => { b.position.y = 0.6 + Math.sin(h.t * 14 + i * 3) * 0.08; });
      h.g.rotation.y += dt * (h.t < 1.8 ? 2 : 10);
      if (h.t > 2.6) { h.parti = true; h.groupe.visible = false; }
    }
  }
}
