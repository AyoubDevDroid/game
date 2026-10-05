import fs from 'node:fs';

// Modèles .glb présents dans public/modeles : le jeu les utilise à la place des formes dessinées par le code
const dossier = 'public/modeles';
const modeles = fs.existsSync(dossier) ? fs.readdirSync(dossier).filter(f => f.endsWith('.glb')).map(f => f.slice(0, -4)) : [];

// base relative : le build s'ouvre aussi depuis un fichier local ou dans Capacitor
export default {
  base: './',
  define: { __MODELES__: JSON.stringify(modeles) },
};
