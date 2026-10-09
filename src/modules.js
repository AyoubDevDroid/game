// Les niveaux-parcours sont assemblés à partir de MODULES : de petits morceaux de parcours réglés à la main
// (voir docs/GAMEPLAN.md). Un module = une ou plusieurs îles, le trou qui les précède et ce qu'on y trouve.
//
// île : { rad (rayon), dh (montée par rapport à l'île d'avant), lat (décalage sur le côté),
//         trou: 'court' | 'plateforme' | 'ressorts' (comment on y arrive), gap (largeur du trou),
//         contenu: { ennemis, cristal: 'centre' | 'piliers', habitants, caisses, relais, coffre } }
// secret : une île cachée sur le côté de l'île courante, qu'on atteint par un courant d'air
import { rng } from './univers.js';

export const MODULES = {
  accueil: () => [{ rad: 14, dh: 0, contenu: { caisses: 1 } }],
  sauts: (r, dur) => [0, 1, 2].map(k => ({ rad: 5.5 + r() * 1.5, dh: 0.4 + r() * 0.5, lat: (r() - 0.5) * 6, trou: 'court', gap: (dur ? 4.5 : 3) + r() * 1.5,
    contenu: k === 2 ? { cristal: 'centre', caisses: 1 } : { pieces: true } })),
  plateforme: r => [{ rad: 9 + r() * 2, dh: (r() - 0.5) * 1.5, trou: 'plateforme', gap: 10 + r() * 2.5, contenu: { caisses: 2, habitants: 1, cristal: 'centre' } }],
  ressorts: r => [{ rad: 8 + r() * 2, dh: 2.2 + r(), trou: 'ressorts', gap: 9 + r() * 2, contenu: { cristal: 'centre', habitants: 1 } }],
  arene: (r, dur) => [{ rad: 11.5 + r() * 2, dh: (r() - 0.5), trou: 'court', gap: 3.5 + r() * 1.5, contenu: { ennemis: dur ? 4 : 2 + Math.floor(r() * 2), caisses: 2, cristal: 'centre', habitants: 1 } }],
  piliers: r => [{ rad: 10 + r() * 2, dh: 0.5, trou: 'court', gap: 3.5 + r(), contenu: { cristal: 'piliers', caisses: 1, habitants: 1 } }],
  relais: r => [{ rad: 9 + r() * 2, dh: (r() - 0.5), trou: 'court', gap: 3.5 + r() * 1.5, contenu: { relais: true, caisses: 1, habitants: 1 } }],
  secret: () => [{ secret: true }],
  phare: () => [{ rad: 13, dh: 0.5, trou: 'court', gap: 4, contenu: {} }],
};

// la galaxie 1 est réglée à la main ; les autres piochent des modules (toujours les mêmes pour un niveau donné)
const NIVEAUX = {
  '0-0': ['accueil', 'sauts', 'relais', 'plateforme', 'arene', 'secret', 'sauts', 'ressorts', 'relais', 'piliers', 'phare'],
  '0-1': ['accueil', 'sauts', 'arene', 'secret', 'relais', 'ressorts', 'piliers', 'plateforme', 'relais', 'sauts', 'arene', 'phare'],
  '0-2': ['accueil', 'plateforme', 'sauts', 'relais', 'arene', 'secret', 'piliers', 'ressorts', 'relais', 'plateforme', 'sauts', 'arene', 'phare'],
  '0-4': ['accueil', 'sauts!', 'plateforme', 'ressorts', 'relais', 'sauts!', 'arene!', 'plateforme', 'phare'],
};
const POOL = ['sauts', 'plateforme', 'ressorts', 'arene', 'piliers'];

export function listeModules(g, i, defi) {
  if (NIVEAUX[`${g}-${i}`]) return NIVEAUX[`${g}-${i}`];
  const r = rng(5000 + g * 71 + i * 13), liste = ['accueil'];
  const nb = defi ? 6 : 9;
  for (let k = 0; k < nb; k++) {
    let m = POOL[Math.floor(r() * POOL.length)];
    if (m === liste[liste.length - 1]) m = POOL[(POOL.indexOf(m) + 1) % POOL.length];   // jamais deux fois le même d'affilée
    liste.push(defi && (m === 'sauts' || m === 'arene') ? m + '!' : m);
    if (!defi && k % 3 === 2) liste.push('relais');
    if (!defi && k === 3) liste.push('secret');
  }
  liste.push('phare');
  return liste;
}

// le plan géométrique du niveau : les îles le long du parcours (u = distance depuis la Luciole), et la longueur totale
export function planNiveau(g, i, defi) {
  const r = rng(9000 + g * 53 + i * 17), iles = [], secrets = [];
  let u = 0, h = 1, lat = 0, sens = 1;
  for (const nomBrut of listeModules(g, i, defi)) {
    const dur = nomBrut.endsWith('!'), nom = nomBrut.replace('!', '');
    for (const ile of MODULES[nom](r, dur || defi)) {
      if (ile.secret) { if (iles.length) secrets.push({ base: iles.length - 1, cote: (r() < 0.5 ? -1 : 1) }); continue; }
      const prec = iles[iles.length - 1];
      const gap = prec ? ile.gap : 0;
      u += prec ? prec.rad + gap + ile.rad : 0;
      h = Math.max(0.5, Math.min(7, h + (ile.dh || 0)));
      if (prec && r() < 0.35) sens = -sens;                               // le parcours zigzague
      lat = Math.max(-26, Math.min(26, lat + sens * (3 + r() * 5) + (ile.lat || 0)));
      iles.push({ u, lat: prec ? lat : 0, rad: ile.rad, h, trou: prec ? ile.trou : null, gap, role: nom, contenu: ile.contenu || {} });
    }
  }
  return { iles, secrets, longueur: u };
}
