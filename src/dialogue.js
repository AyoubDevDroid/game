// Les dialogues : une bulle en bas de l'écran (portrait, nom, texte qui s'écrit lettre par lettre).
// Toucher l'écran (ou Espace / Entrée) fait avancer ; le jeu est en pause pendant qu'on parle.
// Les portraits sont provisoires (emoji) : ils seront remplacés par les vrais dessins des personnages.

export const PERSONNAGES = {
  mamie: { nom: 'Mamie Mèche', portrait: '🏮', couleur: '#ffb347' },
  fanal: { nom: 'Fanal', portrait: '🔥', couleur: '#ff3d81' },
  gardien: { nom: 'Petit gardien', portrait: '🕯️', couleur: '#7cf0ff' },
  nocturna: { nom: 'Nocturna', portrait: '🌙', couleur: '#b48cff' },
};

export function createDialogue({ quandOuvert, quandFerme, son }) {
  const $ = id => document.getElementById(id);
  const boite = $('dialogue'), portrait = $('dlgPortrait'), nom = $('dlgNom'), texte = $('dlgTexte');
  const file = [];
  let ouvert = false, ligne = '', affiche = 0, t = 0;

  // qui : clé de PERSONNAGES ou { nom, portrait, couleur } ; lignes : texte ou liste de textes
  function dire(qui, lignes) {
    const p = typeof qui === 'string' ? PERSONNAGES[qui] : qui;
    for (const l of [].concat(lignes)) file.push({ p, l });
    if (!ouvert) suivante();
  }
  function suivante() {
    const s = file.shift();
    if (!s) { fermer(); return; }
    if (!ouvert) { ouvert = true; boite.hidden = false; quandOuvert && quandOuvert(); }
    portrait.textContent = s.p.portrait; portrait.style.background = s.p.couleur;
    nom.textContent = s.p.nom; nom.style.color = s.p.couleur;
    ligne = s.l; affiche = 0; t = 0; texte.textContent = '';
  }
  function fermer() { ouvert = false; boite.hidden = true; quandFerme && quandFerme(); }
  function avancer() {
    if (!ouvert) return;
    if (affiche < ligne.length) { affiche = ligne.length; texte.textContent = ligne; return; }   // tout afficher d'un coup
    suivante();
  }
  boite.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); avancer(); });
  addEventListener('keydown', e => { if (ouvert && (e.code === 'Space' || e.code === 'Enter')) { e.preventDefault(); e.stopImmediatePropagation(); avancer(); } }, true);

  function update(dt) {
    if (!ouvert || affiche >= ligne.length) return;
    t += dt * 45;                                           // 45 lettres par seconde
    const n = Math.min(ligne.length, Math.floor(t));
    if (n > affiche) { if (son && n % 3 === 0 && ligne[n - 1] !== ' ') son(); affiche = n; texte.textContent = ligne.slice(0, n); }
  }
  return { dire, update, get ouvert() { return ouvert; } };
}
