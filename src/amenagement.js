// Aménagement des planètes avec des objets 3D (packs Kenney, licence CC0 : voir CREDITS.md).
// Chaque biome a son ambiance : forêts, champignons, ruines, cristaux, sapins enneigés…
// et des coins à explorer : escaliers à escalader, îlots flottants (double saut), enclos-cachettes.
// Les objets « solides » ont une forme de collision simple (cylindre) : on monte dessus, ils bloquent.
// Rendu : un InstancedMesh par morceau de modèle et par planète (rapide sur téléphone).
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// id → [échelle, collision] ; collision : 'plein' (on monte dessus), 'tronc' (bloque, fin), null (on traverse)
// Échelle commune par pack (Fanal mesure 1,75) : nature ×3,6, plateforme ×1,6, espace ×3 ; quelques exceptions voulues
// (champignons et cristaux géants, arbres enneigés plus grands).
const N = 3.6, P = 1.6, E = 3;
const CATALOGUE = {
  // nature (n_)
  n_tree_oak: [N, 'tronc'], n_tree_default: [N, 'tronc'], n_tree_fat: [N, 'tronc'], n_tree_detailed: [N, 'tronc'], n_tree_tall: [N, 'tronc'],
  n_tree_cone: [N, 'tronc'], n_tree_blocks: [N, 'tronc'], n_tree_pineRoundC: [N, 'tronc'], n_tree_pineTallA: [N, 'tronc'], n_tree_palmTall: [N, 'tronc'],
  n_tree_palmBend: [N, 'tronc'], n_tree_palmDetailedShort: [N, 'tronc'], n_tree_oak_dark: [N, 'tronc'], n_tree_default_dark: [N, 'tronc'],
  n_tree_fat_fall: [N, 'tronc'], n_tree_simple_fall: [N, 'tronc'], n_tree_plateau: [N, 'tronc'],
  n_mushroom_redGroup: [5, null], n_mushroom_redTall: [10, 'tronc'], n_mushroom_tanGroup: [5, null], n_mushroom_tanTall: [10, 'tronc'],
  n_flower_redA: [3.5, null], n_flower_yellowB: [3.5, null], n_flower_purpleC: [3.5, null], n_grass: [3, null], n_grass_large: [3, null],
  n_grass_leafsLarge: [3, null], n_plant_bushLarge: [N, null], n_plant_bushDetailed: [N, null], n_plant_flatTall: [N, null],
  n_rock_largeA: [N, 'plein'], n_rock_largeC: [N, 'plein'], n_rock_largeE: [N, 'plein'], n_rock_tallB: [N, 'plein'], n_rock_tallE: [N, 'plein'],
  n_rock_tallG: [N, 'plein'], n_rock_smallTopA: [N, null], n_stone_largeB: [N, 'plein'], n_stone_largeD: [N, 'plein'], n_stone_tallC: [N, 'plein'],
  n_stone_tallF: [N, 'plein'], n_stone_smallC: [N, null], n_log_large: [N, 'plein'], n_log_stackLarge: [N, 'plein'], n_stump_roundDetailed: [N, 'plein'],
  n_stump_squareDetailedWide: [N, 'plein'], n_stump_oldTall: [N, 'plein'], n_fence_simple: [N, null], n_fence_planks: [N, null],
  n_tent_detailedOpen: [N, null], n_campfire_stones: [N, null], n_campfire_logs: [N, null], n_cactus_tall: [N, 'tronc'], n_cactus_short: [N, 'tronc'],
  n_pot_large: [N, 'plein'], n_statue_obelisk: [N, 'tronc'], n_statue_column: [N, 'plein'], n_statue_columnDamaged: [N, 'plein'], n_statue_head: [2.5, 'plein'],
  n_statue_ring: [N, null], n_platform_grass: [N, 'plein'], n_platform_stone: [N, 'plein'], n_platform_beach: [N, 'plein'], n_lily_large: [N, null],
  n_canoe: [N, null], n_crop_pumpkin: [N, 'plein'], n_crop_melon: [N, null], n_crops_cornStageD: [2.4, null], n_sign: [N, null],
  // plateforme (p_)
  'p_block-grass': [P, 'plein'], 'p_block-grass-low-large': [P, 'plein'], 'p_block-grass-large-tall': [P, 'plein'], 'p_block-grass-large': [P, 'plein'],
  'p_block-grass-hexagon': [P, 'plein'], 'p_block-snow': [P, 'plein'], 'p_block-snow-low-large': [P, 'plein'], 'p_block-snow-large-tall': [P, 'plein'],
  'p_block-snow-large': [P, 'plein'], p_crate: [1.8, 'plein'], 'p_crate-strong': [1.8, 'plein'], p_barrel: [1.8, 'plein'], p_hedge: [2, 'plein'],
  'p_tree-snow': [2.2, 'tronc'], 'p_tree-pine-snow': [2.2, 'tronc'], 'p_flowers-tall': [P, null], p_mushrooms: [2.5, null], p_chest: [2, 'plein'],
  p_flag: [2.6, null], p_platform: [P, 'plein'],
  // espace (s_)
  s_rock_crystalsLargeA: [4.5, 'plein'], s_rock_crystalsLargeB: [4.5, 'plein'], s_rock_crystals: [3.5, null], s_meteor_detailed: [E, 'plein'],
  s_meteor_half: [E, 'plein'], s_crater: [3.5, null], s_craterLarge: [3.5, null], s_rock_largeA: [E, 'plein'], s_rock_largeB: [E, 'plein'],
  s_rocks_smallA: [E, null], s_bones: [2.5, null],
};

// ambiances : arbres, petits (fleurs, herbes), rochers, escalier [bas, moyen, haut], îlot flottant, cachette, déco
// feuillage : teinte des feuilles des arbres (null = couleurs d'origine)
const THEMES = {
  menthe: { arbres: ['n_tree_oak', 'n_tree_default', 'n_tree_fat', 'n_tree_detailed'], champis: ['n_mushroom_redGroup', 'n_mushroom_redTall', 'n_mushroom_tanTall'],
    petits: ['n_flower_redA', 'n_flower_yellowB', 'n_flower_purpleC', 'n_grass_large', 'n_grass', 'n_plant_bushDetailed'], rochers: ['n_rock_largeA', 'n_rock_largeC', 'n_stump_roundDetailed'],
    escalier: ['p_block-grass-low-large', 'p_block-grass', 'p_block-grass-large-tall'], ilot: 'n_platform_grass', cachette: ['n_tent_detailedOpen'],
    deco: ['n_log_stackLarge', 'n_campfire_logs', 'n_fence_simple', 'n_sign', 'p_crate'], feuillage: null },
  lave: { arbres: ['n_rock_tallB', 'n_rock_tallE', 'n_rock_tallG'], champis: ['s_rock_crystalsLargeA', 's_rock_crystalsLargeB', 's_rock_crystals'],
    petits: ['s_rocks_smallA', 's_crater', 'n_rock_smallTopA', 's_rock_crystals'], rochers: ['s_meteor_detailed', 's_rock_largeA', 'n_rock_largeC'],
    escalier: ['s_meteor_half', 's_meteor_detailed', 'n_rock_tallB'], ilot: 'n_platform_stone', cachette: ['n_campfire_stones'],
    deco: ['s_bones', 'n_campfire_stones', 's_craterLarge'], feuillage: null },
  'étoilée': { arbres: ['n_tree_pineRoundC', 'n_tree_cone', 'n_statue_obelisk'], champis: ['s_rock_crystalsLargeA', 'n_mushroom_tanTall'],
    petits: ['n_flower_purpleC', 'n_grass', 's_rock_crystals', 'n_stone_smallC'], rochers: ['n_stone_largeB', 'n_stone_largeD', 'n_statue_head'],
    escalier: ['n_stone_largeD', 'n_statue_columnDamaged', 'n_statue_column'], ilot: 'n_platform_stone', cachette: ['n_statue_ring'],
    deco: ['n_statue_columnDamaged', 'n_statue_obelisk', 'n_statue_head'], feuillage: 0xb48cff },
  givre: { arbres: ['p_tree-snow', 'p_tree-pine-snow', 'n_tree_pineTallA'], champis: ['s_rock_crystalsLargeB', 's_rock_crystals'],
    petits: ['n_stone_smallC', 's_rock_crystals', 'n_grass'], rochers: ['n_stone_largeB', 'n_stone_largeD', 'p_block-snow'],
    escalier: ['p_block-snow-low-large', 'p_block-snow', 'p_block-snow-large-tall'], ilot: 'n_platform_stone', cachette: ['n_tent_detailedOpen'],
    deco: ['p_crate-strong', 'n_log_large', 'p_flag'], feuillage: 0x8fdcff },
  verdoyance: { arbres: ['n_tree_blocks', 'n_tree_plateau', 'n_tree_default', 'n_tree_detailed'], champis: ['n_crops_cornStageD', 'n_crop_pumpkin', 'n_crop_melon'],
    petits: ['n_flower_yellowB', 'n_flower_redA', 'n_grass_leafsLarge', 'p_flowers-tall', 'n_plant_flatTall'], rochers: ['p_hedge', 'n_stump_squareDetailedWide', 'p_barrel'],
    escalier: ['p_block-grass-low-large', 'p_block-grass-hexagon', 'p_block-grass-large-tall'], ilot: 'n_platform_grass', cachette: ['n_tent_detailedOpen'],
    deco: ['n_fence_planks', 'p_crate', 'p_barrel', 'n_sign'], feuillage: 0x8fe63a },
  dunes: { arbres: ['n_tree_palmTall', 'n_tree_palmBend', 'n_cactus_tall'], champis: ['n_cactus_short', 'n_pot_large'],
    petits: ['n_rock_smallTopA', 'n_grass', 's_rocks_smallA'], rochers: ['n_rock_largeE', 'n_statue_head', 'n_pot_large'],
    escalier: ['n_rock_largeA', 'n_statue_columnDamaged', 'n_rock_tallB'], ilot: 'n_platform_beach', cachette: ['n_statue_ring'],
    deco: ['n_statue_obelisk', 'n_campfire_stones', 's_bones'], feuillage: null },
  corail: { arbres: ['n_tree_fat_fall', 'n_tree_simple_fall', 'n_mushroom_redTall'], champis: ['n_mushroom_redGroup', 'n_mushroom_redTall', 'p_mushrooms'],
    petits: ['n_flower_redA', 'n_flower_purpleC', 'p_flowers-tall', 'n_grass_large'], rochers: ['n_rock_largeC', 'p_hedge', 'n_stump_roundDetailed'],
    escalier: ['n_stump_roundDetailed', 'n_stump_oldTall', 'p_block-grass-large-tall'], ilot: 'n_platform_grass', cachette: ['n_tent_detailedOpen'],
    deco: ['n_log_stackLarge', 'n_fence_simple', 'p_chest'], feuillage: 0xff6f9e },
  marais: { arbres: ['n_tree_oak_dark', 'n_tree_default_dark', 'n_mushroom_tanTall'], champis: ['n_mushroom_tanGroup', 'n_mushroom_tanTall', 's_rock_crystals'],
    petits: ['n_lily_large', 'n_grass_large', 'n_plant_flatTall', 'n_grass'], rochers: ['n_stump_oldTall', 'n_log_large', 'n_stone_largeD'],
    escalier: ['n_log_large', 'n_stump_oldTall', 'n_stone_tallC'], ilot: 'n_platform_stone', cachette: ['n_statue_ring'],
    deco: ['n_log_stackLarge', 'n_canoe', 'n_campfire_logs'], feuillage: 0x6a4fc9 },
  lagon: { arbres: ['n_tree_palmTall', 'n_tree_palmBend', 'n_tree_palmDetailedShort'], champis: ['n_plant_bushLarge', 'n_mushroom_redGroup'],
    petits: ['n_lily_large', 'n_flower_yellowB', 'n_grass_leafsLarge', 'n_grass'], rochers: ['n_rock_largeA', 'n_rock_largeE', 'p_barrel'],
    escalier: ['n_rock_largeC', 'n_rock_tallE', 'n_rock_tallB'], ilot: 'n_platform_beach', cachette: ['n_tent_detailedOpen'],
    deco: ['n_canoe', 'p_chest', 'p_crate', 'n_campfire_logs'], feuillage: 0x2fd3c4 },
  volcan: { arbres: ['n_rock_tallG', 'n_stone_tallC', 'n_rock_tallB'], champis: ['s_rock_crystalsLargeA', 's_meteor_detailed'],
    petits: ['s_crater', 's_rocks_smallA', 'n_rock_smallTopA'], rochers: ['s_meteor_detailed', 's_rock_largeB', 'n_stone_largeB'],
    escalier: ['s_meteor_half', 's_rock_largeA', 'n_stone_tallF'], ilot: 'n_platform_stone', cachette: ['n_campfire_stones'],
    deco: ['s_bones', 's_craterLarge', 'n_campfire_stones'], feuillage: null },
};

// ---------- chargement des modèles (une fois, au démarrage) ----------
const MODELES = {};
export const decorsPrets = () => Object.keys(MODELES).length > 0;
export async function chargerDecors() {
  const loader = new GLTFLoader();
  await Promise.all(Object.entries(CATALOGUE).map(([id, [echelle]]) =>
    loader.loadAsync(`./decors/${id}.glb`).then(g => { MODELES[id] = preparer(g.scene, echelle); }).catch(e => console.warn('Décor illisible :', id, e))));
  return Object.keys(MODELES).length > 0;
}
// agrandit le modèle (même échelle pour tout un pack : les proportions restent justes), centré, posé en y = 0
function preparer(scene, s) {
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(scene), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  const hauteur = size.y * s;
  const norm = new THREE.Matrix4().makeScale(s, s, s).multiply(new THREE.Matrix4().makeTranslation(-c.x, -box.min.y, -c.z));
  const morceaux = [];
  scene.traverse(o => {
    if (!o.isMesh) return;
    const geo = o.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(norm, o.matrixWorld));
    morceaux.push({ geo, mat: Array.isArray(o.material) ? o.material[0] : o.material });
  });
  return { morceaux, l: size.x * s, p: size.z * s, h: hauteur };
}

// ---------- couleurs : chaque matière des modèles prend une teinte de la palette de la planète ----------
// (noms des matières Kenney : leafsGreen, woodBark, stone, rock, crystal, colorRed…)
function recolorer(m, L, T) {
  const p = L.palette;
  if (!p) { if (T.feuillage && /^leafs/.test(m.name || '')) m.color = new THREE.Color(T.feuillage); return; }
  const n = m.name || '', em = (L.humeur && L.humeur.emissif) || 0.1;
  let c = null, eclat = 0;
  if (/^leafsFall/.test(n)) { c = p.feuillageAutomne; eclat = em; }
  else if (/^leafsDark/.test(n)) { c = p.feuillage2; eclat = em; }
  else if (/^leafs/.test(n) || n === 'grass') { c = p.feuillage; eclat = em; }
  else if (/^wood(Inner|Birch)/.test(n)) c = p.boisClair;
  else if (/^wood/.test(n)) c = p.bois;
  else if (/^(stone|rock)Dark/.test(n)) c = p.pierreSombre;
  else if (/^(stone|rock)/.test(n)) c = p.pierre;
  else if (n === 'dirt') c = p.terre;
  else if (n === 'crystal') { c = p.cristal; eclat = 0.55; }
  else if (n === 'colorRed') { c = p.fleurs[0]; eclat = 0.25; }
  else if (n === 'colorYellow' || n === 'colorTan') { c = p.fleurs[1]; eclat = 0.25; }
  else if (n === 'colorPurple') { c = p.fleurs[2]; eclat = 0.25; }
  else if (n === 'colormap') { m.color = new THREE.Color(0xffffff).lerp(new THREE.Color(p.sol.base), 0.45); return; }   // blocs texturés
  if (c === null) return;
  m.color = new THREE.Color(c);
  if (eclat && m.emissive) { m.emissive = new THREE.Color(c); m.emissiveIntensity = eclat; }
}

// ---------- aménagement d'une planète ----------
// ctx : { L, r, k, center, U, group, surfacePoint, surface, freeDir, marquer, allumable, solides }
// renvoie les « coins » où cacher des braises : [{ dir, h }]
export function amenager(ctx) {
  const { L, r, k, group, surfacePoint, freeDir, marquer, allumable, U, solides } = ctx;
  const T = THEMES[L.biome] || THEMES.menthe;
  const Y = new THREE.Vector3(0, 1, 0);
  const lots = new Map();                                   // id → [Matrix4]
  const coins = [];
  const choix = liste => liste[Math.floor(r() * liste.length)];
  const surface = 1 / (k * k);                              // une planète de rayon 9 vaut 1

  // repère tangent en dir : pour placer les morceaux d'un ensemble les uns par rapport aux autres
  const repere = (dir, ang) => {
    const t1 = new THREE.Vector3(1, 0, 0).addScaledVector(dir, -dir.x); if (t1.lengthSq() < 1e-3) t1.set(0, 0, 1).addScaledVector(dir, -dir.z);
    t1.normalize();
    const t2 = new THREE.Vector3().crossVectors(dir, t1);
    const c = Math.cos(ang), s = Math.sin(ang);
    return [t1.clone().multiplyScalar(c).addScaledVector(t2, s), t2.clone().multiplyScalar(c).addScaledVector(t1, -s)];
  };
  const decale = (dir, [a, b], x, z) => dir.clone().multiplyScalar(L.radius).addScaledVector(a, x).addScaledVector(b, z).normalize();

  // pose un objet ; bas = hauteur au-dessus du sol (îlots flottants) ; renvoie le haut de l'objet
  const Q = new THREE.Quaternion(), Qy = new THREE.Quaternion(), S = new THREE.Vector3(), M = new THREE.Matrix4();
  function poser(id, dir, { bas = 0, tourne = r() * Math.PI * 2, echelle = 0.85 + r() * 0.3 } = {}) {
    const m = MODELES[id]; if (!m) return bas;
    Qy.setFromAxisAngle(Y, tourne); Q.setFromUnitVectors(Y, dir).multiply(Qy);
    const pos = surfacePoint(dir).addScaledVector(dir, bas - 0.06);
    M.compose(pos, Q, S.set(echelle, echelle, echelle));
    if (!lots.has(id)) lots.set(id, []);
    lots.get(id).push(M.clone());
    const col = CATALOGUE[id][1], haut = bas + m.h * echelle;
    if (col === 'plein') solides.push({ dir: dir.clone(), radius: Math.max(m.l, m.p) * 0.42 * echelle, bas, haut });
    if (col === 'tronc') solides.push({ dir: dir.clone(), radius: 0.35 * echelle, bas, haut: bas + 99 });   // on ne grimpe pas aux arbres
    return haut;
  }

  // 1. escaliers à escalader, avec une braise au sommet
  const nbEscaliers = Math.max(2, Math.round(1.2 * surface ** 0.5));
  for (let n = 0; n < nbEscaliers; n++) {
    const dir = freeDir(1.0), rep = repere(dir, r() * 6); marquer(dir, 1.0);
    let haut = 0;
    T.escalier.forEach((id, j) => { haut = poser(id, decale(dir, rep, j * 2.4, 0), { tourne: 0, echelle: 1 }); });
    coins.push({ dir: decale(dir, rep, 2 * 2.4, 0), h: haut + 0.9 });
    // un îlot flottant au-dessus, à atteindre d'un double saut depuis le haut de l'escalier
    if (r() < 0.6) {
      const d2 = decale(dir, rep, 2 * 2.4 + 3.6, 1.5), b = haut + 1.6;
      const top = poser(T.ilot, d2, { bas: b, echelle: 1.3 });
      coins.push({ dir: d2, h: top + 0.9 });
    }
  }

  // 2. îlots flottants seuls, avec un rocher pour prendre son élan
  const nbIlots = Math.max(1, Math.round(0.9 * surface ** 0.5));
  for (let n = 0; n < nbIlots; n++) {
    const dir = freeDir(0.9), rep = repere(dir, r() * 6); marquer(dir, 0.9);
    const marche = poser(choix(T.rochers), decale(dir, rep, -2.6, 0), { echelle: 1.1 });
    const top = poser(T.ilot, dir, { bas: Math.min(3.4, marche + 1.5), echelle: 1.4 });
    coins.push({ dir, h: top + 0.9 });
    poser(choix(T.petits), decale(dir, rep, 0.6, 0.4), { bas: top - 0.05, echelle: 0.9 });
  }

  // 3. enclos-cachettes : un cercle de rochers et d'arbres avec une seule ouverture
  const nbEnclos = Math.max(1, Math.round(surface ** 0.5 * 0.8));
  for (let n = 0; n < nbEnclos; n++) {
    const dir = freeDir(1.0), rep = repere(dir, r() * 6); marquer(dir, 1.0);
    const rayon = 3.2, nb = 9;
    for (let j = 1; j < nb; j++) {                           // j = 0 : l'ouverture
      const a = (j / nb) * Math.PI * 2;
      poser(j % 3 ? choix(T.rochers) : choix(T.arbres), decale(dir, rep, Math.cos(a) * rayon, Math.sin(a) * rayon), { echelle: 1 + r() * 0.3 });
    }
    poser(choix(T.cachette), dir, { echelle: 0.9 });
    coins.push({ dir: decale(dir, rep, 0.9, 0.6), h: 0.9 });
  }

  // 4. bosquets d'arbres et de champignons (on peut s'y cacher des Ombrelles)
  const nbBosquets = Math.round(3 * surface ** 0.6);
  for (let n = 0; n < nbBosquets; n++) {
    const dir = freeDir(0.55), rep = repere(dir, r() * 6); marquer(dir, 0.5);
    const nb = 3 + Math.floor(r() * 4);
    for (let j = 0; j < nb; j++) {
      const a = r() * 6.28, d = 1.2 + r() * 3.2;
      poser(r() < 0.65 ? choix(T.arbres) : choix(T.champis), decale(dir, rep, Math.cos(a) * d, Math.sin(a) * d));
    }
    for (let j = 0; j < 4; j++) { const a = r() * 6.28, d = r() * 4.5; poser(choix(T.petits), decale(dir, rep, Math.cos(a) * d, Math.sin(a) * d)); }
    if (r() < 0.5) coins.push({ dir: decale(dir, rep, 0.5, 0.5), h: 0.9 });
  }

  // 5. petits coins décorés (feu de camp, caisses, barrières…)
  const nbDeco = Math.round(2 * surface ** 0.6);
  for (let n = 0; n < nbDeco; n++) {
    const dir = freeDir(0.45), rep = repere(dir, r() * 6); marquer(dir, 0.4);
    poser(choix(T.deco), dir);
    for (let j = 0; j < 3; j++) { const a = r() * 6.28; poser(choix(r() < 0.5 ? T.deco : T.petits), decale(dir, rep, Math.cos(a) * 1.8, Math.sin(a) * 1.8)); }
  }

  // 6. l'élément signature de la planète : ce qu'on retient d'elle
  const centre = freeDir(1.2), rc = repere(centre, r() * 6); marquer(centre, 1.3);
  const autour = (d, a) => decale(centre, rc, Math.cos(a) * d, Math.sin(a) * d);
  if (L.signature === 'geants') {                           // champignons et arbres géants
    for (let j = 0; j < 8; j++) {
      const a = (j / 8) * Math.PI * 2 + r() * 0.5;
      poser(r() < 0.6 ? choix(['n_mushroom_redTall', 'n_mushroom_tanTall']) : choix(T.arbres), autour(2.6 + r() * 4, a), { echelle: 2 + r() * 0.9 });
    }
    coins.push({ dir: centre, h: 0.9 });
  } else if (L.signature === 'cristaux') {                  // forêt de cristaux lumineux
    for (let j = 0; j < 14; j++) poser(choix(['s_rock_crystalsLargeA', 's_rock_crystalsLargeB', 's_rock_crystals']), autour(1.6 + r() * 5.5, r() * 6.28), { echelle: 1 + r() * 1.3 });
    coins.push({ dir: centre, h: 0.9 });
  } else if (L.signature === 'archipel') {                  // îlots en spirale qui montent vers le ciel
    let bas = 1.4, top = 0, d = centre;
    for (let j = 0; j < 6; j++) {
      d = autour(2.2 + j * 0.5, j * 1.1);
      top = poser(T.ilot, d, { bas, echelle: 1.1, tourne: j * 1.1 });
      bas = top + 1.3;
    }
    coins.push({ dir: d, h: top + 0.9 });
  } else if (L.signature === 'anneau') {                    // cercle de colonnes autour d'un obélisque
    let haut = 0, dCol = centre;
    for (let j = 0; j < 10; j++) {
      const d = autour(5.5, (j / 10) * Math.PI * 2), h = poser(j % 3 ? 'n_statue_column' : 'n_statue_columnDamaged', d, { echelle: 1.1, tourne: 0 });
      if (h > haut) { haut = h; dCol = d; }
    }
    poser('n_statue_obelisk', centre, { echelle: 1.4 });
    coins.push({ dir: dCol, h: haut + 0.9 });
  } else if (L.signature === 'jardin') {                    // champ de fleurs géantes
    for (let j = 0; j < 70; j++) poser(choix(['n_flower_redA', 'n_flower_yellowB', 'n_flower_purpleC', 'p_flowers-tall']), autour(Math.sqrt(r()) * 6.5, r() * 6.28), { echelle: 1.2 + r() * 1.3 });
    coins.push({ dir: centre, h: 0.9 });
  } else {                                                  // canyon : cercle de pitons rocheux, une seule entrée
    for (let j = 1; j < 14; j++) poser(choix(['n_rock_tallB', 'n_rock_tallG', 'n_stone_tallC']), autour(6 + r() * 0.8, (j / 14) * Math.PI * 2), { echelle: 1.4 + r() * 0.6 });
    coins.push({ dir: centre, h: 0.9 });
  }

  // 7. semis : fleurs, herbes, rochers isolés partout
  const nbSemis = Math.round(55 * surface);
  for (let n = 0; n < nbSemis; n++) {
    const dir = freeDir(0.08);
    poser(r() < 0.82 ? choix(T.petits) : choix(T.rochers), dir, { echelle: 0.7 + r() * 0.6 });
  }
  const nbArbres = Math.round(8 * surface);
  for (let n = 0; n < nbArbres; n++) { const dir = freeDir(0.35); marquer(dir, 0.3); poser(choix(T.arbres), dir); }

  // ---------- construction des InstancedMesh, aux couleurs de la planète ----------
  for (const [id, mats] of lots) {
    for (const { geo, mat } of MODELES[id].morceaux) {
      const m = mat.clone();
      recolorer(m, L, T);
      const im = new THREE.InstancedMesh(geo, allumable(m, U), mats.length);
      mats.forEach((x, i) => im.setMatrixAt(i, x));
      im.instanceMatrix.needsUpdate = true;
      im.computeBoundingSphere();
      im.userData.partage = true;                           // géométrie partagée entre les planètes : ne pas la libérer
      group.add(im);
    }
  }
  return coins;
}
