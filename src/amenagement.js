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
  // cimetière (g_ : planète hantée)
  'g_pine-crooked': [2.4, 'tronc'], 'g_pine-fall-crooked': [2.4, 'tronc'], g_pine: [2.4, 'tronc'], 'g_gravestone-cross': [2.4, 'plein'],
  'g_gravestone-round': [2.4, 'plein'], 'g_gravestone-decorative': [2.4, 'plein'], 'g_gravestone-broken': [2.4, null], 'g_crypt-small': [2.4, 'plein'],
  g_crypt: [2.4, 'plein'], 'g_iron-fence': [2.4, null], 'g_iron-fence-damaged': [2.4, null], 'g_pumpkin-carved': [3.5, 'plein'],
  'g_pumpkin-tall-carved': [3.5, 'plein'], 'g_lantern-candle': [2.4, null], 'g_lightpost-single': [2.4, 'tronc'], 'g_candle-multiple': [2.4, null],
  'g_coffin-old': [2.4, 'plein'], 'g_altar-stone': [2.4, 'plein'], 'g_rocks-tall': [2.4, 'plein'], g_rocks: [2.4, 'plein'], 'g_trunk-long': [2.4, 'plein'],
  'g_pillar-obelisk': [2.4, 'tronc'], 'g_fire-basket': [2.4, null], 'g_hay-bale': [2.4, 'plein'], 'g_urn-round': [2.4, null],
  // pirates (r_ : île au trésor)
  'r_palm-bend': [1.4, 'tronc'], 'r_palm-detailed-straight': [1.4, 'tronc'], 'r_palm-straight': [1.4, 'tronc'], 'r_ship-wreck': [0.7, 'plein'],
  r_chest: [1.4, 'plein'], r_crate: [1.4, 'plein'], 'r_crate-bottles': [1.4, 'plein'], r_barrel: [1.4, 'plein'], 'r_bottle-large': [1.4, null],
  r_cannon: [1.4, 'plein'], 'r_flag-pirate-high': [1.4, null], 'r_tower-watch': [1.4, 'plein'], 'r_rocks-sand-a': [0.7, 'plein'],
  'r_rocks-sand-b': [0.7, 'plein'], 'r_rocks-a': [0.7, 'plein'], 'r_boat-row-small': [1.4, null], 'r_structure-platform-dock-small': [1.4, 'plein'],
  'r_platform-planks': [1.4, 'plein'], 'r_patch-grass-foliage': [1, null], 'r_grass-plant': [1.4, null],
  // château (c_ : royaume)
  'c_tower-square': [3, 'plein'], 'c_tower-hexagon-base': [3, 'plein'], 'c_tower-hexagon-top': [3, null], 'c_tower-square-top-roof': [3, null],
  'c_tree-large': [2.7, 'tronc'], 'c_tree-small': [2.7, 'tronc'], 'c_flag-banner-long': [2, null], 'c_flag-pennant': [2.5, null],
  'c_siege-catapult': [2, 'plein'], 'c_siege-ballista': [2, 'plein'], 'c_rocks-large': [3, 'plein'], 'c_rocks-small': [2, null],
  'c_wall-pillar': [1.8, 'plein'], 'c_stairs-stone': [3, null], c_gate: [3, null], 'c_bridge-straight-pillar': [2.4, 'plein'],
  // gourmandises géantes (f_ : planète gourmande)
  'f_donut-sprinkles': [10, 'plein'], 'f_donut-chocolate': [10, 'plein'], f_cupcake: [7, 'plein'], 'f_cake-birthday': [6, 'plein'],
  f_lollypop: [10, 'tronc'], 'f_ice-cream': [7, 'tronc'], 'f_ice-cream-cne': [9, 'tronc'], 'f_candy-bar': [10, 'plein'],
  'f_cookie-chocolate': [9, null], f_cherries: [8, null], f_apple: [6, 'plein'], f_pear: [6, 'plein'], f_pineapple: [8, 'tronc'],
  f_watermelon: [4, 'plein'], f_strawberry: [7, null], f_cheese: [4, 'plein'], f_mushroom: [8, null], f_croissant: [5, 'plein'],
  f_muffin: [6, 'plein'], f_pie: [4, 'plein'], f_banana: [5, null], f_grapes: [6, 'tronc'],
  // fêtes de l'hiver (h_)
  'h_snowman-hat': [2.4, 'plein'], h_snowman: [2.4, 'plein'], 'h_tree-decorated-snow': [2.4, 'tronc'], 'h_present-a-cube': [2.4, 'plein'],
  'h_present-b-round': [2.4, 'plein'], 'h_present-a-round': [2.4, 'plein'], 'h_candy-cane-red': [6, null], 'h_candy-cane-green': [6, null],
  'h_gingerbread-man': [4, null], h_reindeer: [2.4, 'plein'], h_sled: [2.4, null], h_lantern: [2.4, 'tronc'], 'h_rocks-large': [1, 'plein'],
  'h_snow-pile': [2.4, null], 'h_lights-colored': [2.4, null], h_nutcracker: [2.4, 'tronc'],
  // bourg fantastique (v_)
  v_tree: [2.3, 'tronc'], 'v_tree-crooked': [2.3, 'tronc'], 'v_tree-high-round': [2.3, 'tronc'], 'v_tree-high': [2.3, 'tronc'],
  v_hedge: [2.3, null], 'v_hedge-large': [2.3, 'plein'], 'v_fountain-round': [2.3, null], 'v_stall-red': [2.3, 'plein'], 'v_stall-green': [2.3, 'plein'],
  v_cart: [2.3, 'plein'], v_lantern: [2.3, 'tronc'], 'v_banner-red': [2.3, null], 'v_rock-large': [2.3, 'plein'], 'v_rock-wide': [2.3, 'plein'],
  'v_pillar-stone': [2.3, 'tronc'], v_fence: [2.3, null],
};
// les packs rangés dans leur propre dossier (chacun a sa texture colormap.png) : g_pine → decors/g/pine.glb
const fichier = id => (/^[a-z]_/.test(id) && !/^[nps]_/.test(id) ? `./decors/${id[0]}/${id.slice(2)}.glb` : `./decors/${id}.glb`);
const PACKS_COLORES = /^[grcfhva]_/;                       // packs déjà très colorés : on garde leurs couleurs

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
  // nouveaux mondes (packs Kenney Graveyard, Pirate, Castle, Food, Holiday, Fantasy Town)
  hantee: { arbres: ['g_pine-crooked', 'g_pine-fall-crooked', 'g_pine'], champis: ['g_pumpkin-carved', 'g_pumpkin-tall-carved', 'g_lightpost-single', 'n_mushroom_tanTall'],
    petits: ['g_candle-multiple', 'g_gravestone-broken', 'g_urn-round', 'n_grass', 'g_lantern-candle'], rochers: ['g_gravestone-cross', 'g_gravestone-round', 'g_gravestone-decorative', 'g_rocks-tall'],
    escalier: ['g_rocks', 'g_crypt', 'g_crypt-small'], ilot: 'n_platform_stone', cachette: ['g_crypt-small'],
    deco: ['g_iron-fence', 'g_iron-fence-damaged', 'g_coffin-old', 'g_altar-stone', 'g_fire-basket', 'g_hay-bale', 'g_pillar-obelisk'], feuillage: null },
  pirate: { arbres: ['r_palm-bend', 'r_palm-straight', 'r_palm-detailed-straight'], champis: ['r_barrel', 'r_crate', 'r_crate-bottles', 'r_bottle-large'],
    petits: ['r_grass-plant', 'n_grass', 's_rocks_smallA', 'n_flower_yellowB'], rochers: ['r_rocks-sand-a', 'r_rocks-sand-b', 'r_rocks-a'],
    escalier: ['r_crate', 'r_chest', 'r_tower-watch'], ilot: 'r_platform-planks', cachette: ['r_boat-row-small'],
    deco: ['r_cannon', 'r_flag-pirate-high', 'r_chest', 'r_ship-wreck', 'r_structure-platform-dock-small'], feuillage: null },
  royaume: { arbres: ['c_tree-large', 'c_tree-small', 'n_tree_cone'], champis: ['c_flag-banner-long', 'c_flag-pennant', 'n_mushroom_redGroup'],
    petits: ['n_flower_redA', 'n_flower_yellowB', 'n_grass', 'c_rocks-small'], rochers: ['c_rocks-large', 'c_wall-pillar', 'c_bridge-straight-pillar'],
    escalier: ['c_rocks-large', 'c_wall-pillar', 'c_tower-square'], ilot: 'n_platform_stone', cachette: ['c_gate'],
    deco: ['c_siege-catapult', 'c_siege-ballista', 'c_flag-banner-long', 'c_stairs-stone', 'c_tower-hexagon-base'], feuillage: null },
  gourmande: { arbres: ['f_lollypop', 'f_ice-cream', 'f_ice-cream-cne', 'f_pineapple'], champis: ['f_cupcake', 'f_muffin', 'f_watermelon', 'f_grapes'],
    petits: ['f_cherries', 'f_strawberry', 'f_apple', 'f_pear', 'f_cookie-chocolate', 'f_mushroom'], rochers: ['f_donut-sprinkles', 'f_donut-chocolate', 'f_cheese', 'f_croissant'],
    escalier: ['f_donut-sprinkles', 'f_cake-birthday', 'f_cupcake'], ilot: 'f_pie', cachette: ['f_cake-birthday'],
    deco: ['f_candy-bar', 'f_banana', 'f_croissant', 'f_cheese'], feuillage: null },
  fetes: { arbres: ['h_tree-decorated-snow', 'p_tree-snow', 'p_tree-pine-snow'], champis: ['h_present-a-cube', 'h_present-a-round', 'h_present-b-round', 'h_candy-cane-red', 'h_candy-cane-green'],
    petits: ['h_snow-pile', 'n_stone_smallC', 'h_gingerbread-man'], rochers: ['h_snowman', 'h_snowman-hat', 'p_block-snow'],
    escalier: ['p_block-snow-low-large', 'p_block-snow', 'p_block-snow-large-tall'], ilot: 'n_platform_stone', cachette: ['h_sled'],
    deco: ['h_reindeer', 'h_lantern', 'h_nutcracker', 'h_lights-colored', 'h_rocks-large'], feuillage: 0x8fdcff },
  bourg: { arbres: ['v_tree', 'v_tree-high-round', 'v_tree-crooked', 'v_tree-high'], champis: ['v_stall-red', 'v_stall-green', 'v_cart', 'v_lantern'],
    petits: ['n_flower_redA', 'n_flower_yellowB', 'n_flower_purpleC', 'n_grass_large', 'p_flowers-tall'], rochers: ['v_rock-large', 'v_rock-wide', 'v_hedge-large'],
    escalier: ['p_block-grass-low-large', 'v_rock-wide', 'p_block-grass-large-tall'], ilot: 'n_platform_grass', cachette: ['v_stall-red'],
    deco: ['v_fountain-round', 'v_banner-red', 'v_fence', 'v_pillar-stone', 'v_lantern'], feuillage: null },
};

// ---------- chargement des modèles (une fois, au démarrage) ----------
const MODELES = {};
export const decorsPrets = () => Object.keys(MODELES).length > 0;
export async function chargerDecors() {
  const loader = new GLTFLoader();
  await Promise.all(Object.entries(CATALOGUE).map(([id, [echelle]]) =>
    loader.loadAsync(fichier(id)).then(g => { MODELES[id] = preparer(g.scene, echelle); }).catch(e => console.warn('Décor illisible :', id, e))));
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
// ---------- vos décors à vous : public/modeles/decor-<monde>-<rôle>[-n].glb remplacent les objets Kenney ----------
// rôle : arbre, champi, petit, rocher, escalier-bas, escalier-moyen, escalier-haut, ilot, cachette, deco
// monde : menthe, lave, etoilee, givre, verdoyance, dunes, corail, marais, lagon, volcan, hantee, pirate,
//         royaume, gourmande, fetes, bourg — ou « tous » pour tous les mondes
// Les modèles sont mis à la hauteur du rôle (en unités du jeu ; Fanal mesure 1,75).
const ROLES = {
  arbre: ['arbres', 5, 'tronc'], champi: ['champis', 2.2, 'tronc'], petit: ['petits', 0.6, null], rocher: ['rochers', 1.5, 'plein'],
  'escalier-bas': ['escalier', 1, 'plein', 0], 'escalier-moyen': ['escalier', 1.9, 'plein', 1], 'escalier-haut': ['escalier', 3.2, 'plein', 2],
  ilot: ['ilot', 0.8, 'plein'], cachette: ['cachette', 2.2, null], deco: ['deco', 1.3, 'plein'],
};
const PERSO = {};                                          // monde → rôle du thème → [ids]
export function enregistrerDecors(modeles) {
  for (const [nom, scene] of Object.entries(modeles)) {
    const m = /^decor-([a-z]+)-([a-z]+(?:-[a-z]+)?)(?:-\d+)?$/.exec(nom.normalize('NFD').replace(/[̀-ͯ]/g, ''));
    if (!m || !ROLES[m[2]]) continue;
    const [cleTheme, hauteur, collision, rang] = ROLES[m[2]], id = 'perso:' + nom;
    scene.updateMatrixWorld(true);
    const t = new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3());
    MODELES[id] = preparer(scene, hauteur / Math.max(t.y, 1e-6));
    CATALOGUE[id] = [1, collision];
    const monde = (PERSO[m[1]] ||= {});
    if (rang !== undefined) { (monde.escalier ||= []); monde.escalier[rang] = id; }
    else (monde[cleTheme] ||= []).push(id);
  }
}
const sansAccent = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

export function amenager(ctx) {
  const { L, r, k, group, surfacePoint, freeDir, marquer, allumable, U, solides } = ctx;
  // le thème du monde, où vos décors remplacent ceux de Kenney rôle par rôle
  const T = { ...(THEMES[L.biome] || THEMES.menthe) };
  for (const source of [PERSO.tous, PERSO[sansAccent(L.biome)]]) if (source) for (const [role, ids] of Object.entries(source)) {
    if (role === 'escalier') T.escalier = T.escalier.map((id, i) => ids[i] || id);
    else if (role === 'ilot') T.ilot = ids[0];
    else T[role] = ids;
  }
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
      if (!PACKS_COLORES.test(id)) recolorer(m, L, T);
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
