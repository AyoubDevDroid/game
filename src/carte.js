// La carte de la galaxie : les 15 planètes en spirale, on choisit sa destination.
// Les planètes s'ouvrent au fur et à mesure des phares rallumés ; le Grand Phare (boss) en dernier.
import { GALAXIES, NB_PLANETES, BOSS_REQUIS, planete, phareAllume, planeteOuverte, allumesDans } from './univers.js';

const hex = n => '#' + n.toString(16).padStart(6, '0');

export function createCarte({ onAller }) {
  const $ = id => document.getElementById(id);
  const zone = $('carteZone'), fiche = $('carteFiche');
  let save = null, g = 0, choisie = -1, ici = -1, iciG = -1;

  function afficher(s, galaxie, position = -1) {
    save = s; g = galaxie; ici = position; iciG = galaxie; choisie = -1;
    $('carte').hidden = false;
    dessiner();
  }
  function cacher() { $('carte').hidden = true; }

  function dessiner() {
    const G = GALAXIES[g];
    $('carte').style.background = `radial-gradient(ellipse at 50% 40%, ${hex(G.ciel[1])}cc, ${hex(G.ciel[2])} 75%)`;
    $('carteNom').textContent = G.nom;
    $('carteNum').textContent = `Galaxie ${g + 1} / ${GALAXIES.length}`;
    const n = allumesDans(save, g);
    $('carteStats').innerHTML = `🏮 ${n} / ${NB_PLANETES - 1} phares · 🧡 ${save.gardiens} gardiens · ✨ ${save.eclats}`;
    $('cartePrec').disabled = g === 0;
    $('carteSuiv').disabled = g >= save.debloquee;

    const pts = [];
    zone.innerHTML = '';
    for (let i = 0; i < NB_PLANETES; i++) {
      const P = planete(g, i), boss = P.boss;
      const x = 50 + Math.cos(P.carte.a) * P.carte.d * 44, y = 50 + Math.sin(P.carte.a) * P.carte.d * 44;
      pts.push(`${x},${y}`);
      const b = document.createElement('button');
      const allume = phareAllume(save, g, i), ouverte = planeteOuverte(save, g, i);
      b.className = 'astre' + (boss ? ' boss' : '') + (allume ? ' allume' : '') + (ouverte ? '' : ' ferme') + (i === choisie ? ' choisi' : '');
      b.style.left = x + '%'; b.style.top = y + '%';
      b.style.setProperty('--c1', hex(P.sol.haut)); b.style.setProperty('--c2', hex(P.sol.bas));
      b.innerHTML = (ouverte ? (allume ? '✓' : boss ? '👑' : '') : '🔒') + (i === ici && g === iciG ? '<i>🚀</i>' : '');
      b.onclick = () => { choisie = i; dessiner(); };
      zone.appendChild(b);
    }
    const svg = `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="${pts.join(' ')}" /></svg>`;
    zone.insertAdjacentHTML('afterbegin', svg);

    if (choisie < 0) { fiche.innerHTML = '<span class="mut">Touche une planète pour choisir ta destination</span>'; return; }
    const P = planete(g, choisie), allume = phareAllume(save, g, choisie), ouverte = planeteOuverte(save, g, choisie);
    let etat;
    if (!ouverte) etat = P.boss ? `Rallume ${BOSS_REQUIS} phares de la galaxie pour l'atteindre (${n} / ${BOSS_REQUIS})` : 'Rallume d\'autres phares pour l\'ouvrir';
    else if (allume) etat = P.boss ? 'Grand Phare rallumé ✓' : 'Phare rallumé ✓ · gardien libéré';
    else etat = P.boss ? 'Gardée par la Grande Ombrelle 👑' : `${P.embers} braises · un gardien prisonnier · ${P.ombrelles} Ombrelles`;
    fiche.innerHTML = `<b>${P.nom}</b><span>${etat}</span>`;
    if (ouverte) {
      const go = document.createElement('button');
      go.className = 'btn petit'; go.textContent = choisie === ici && g === iciG ? 'Redescendre' : 'Y aller 🚀';
      go.onclick = () => onAller(g, choisie);
      fiche.appendChild(go);
    }
  }

  $('cartePrec').onclick = () => { if (g > 0) { g--; choisie = -1; dessiner(); } };
  $('carteSuiv').onclick = () => { if (g < save.debloquee) { g++; choisie = -1; dessiner(); } };
  return { afficher, cacher, get galaxie() { return g; } };
}
