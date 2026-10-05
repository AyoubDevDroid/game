// Décors des planètes, dessinés par le code dans le style « pâte à modeler » des concepts.
// Chaque décor est une liste de morceaux [géométrie, matière] posés sur le sol (y = 0, haut = +Y).
// Le monde regroupe ensuite tous les morceaux d'une même matière en un seul objet (rapide sur téléphone).
import * as THREE from 'three';

// Matières utilisées par les décors : [couleur, couleur lumineuse, intensité, facettes]
export const MATIERES = {
  creme: [0xfff1df], blanc: [0xffffff], murs: [0xf3e2c9], toit: [0xa8775a], porte: [0x7a4a35],
  fenetre: [0xffe08a, 0xffc04d, 1.3],
  champiRose: [0xff5fae, 0xff3d9a, 0.55], champiJaune: [0xffd36b, 0xffb84d, 0.6],
  rocher: [0x8d7f8f], rocherSombre: [0x5e4a52],
  cristalRose: [0xff4f9a, 0xff2d7a, 0.55, true], cristalJaune: [0xffe066, 0xffc83d, 0.65, true], cristalBleu: [0x8feaff, 0x4fd8ff, 0.6, true],
};

const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), S = new THREE.Vector3();
function piece(geo, cle, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  M.compose(V.set(x, y, z), Q.setFromEuler(E.set(rx, ry, rz)), S.set(sx, sy, sz));
  return [geo.clone().applyMatrix4(M), cle];
}

const G = {
  pied: new THREE.CylinderGeometry(0.1, 0.14, 0.45, 10),
  chapeau: new THREE.SphereGeometry(0.36, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
  point: new THREE.SphereGeometry(0.05, 6, 5),
  murs: new THREE.CylinderGeometry(0.55, 0.62, 0.85, 16),
  toit: new THREE.ConeGeometry(0.85, 0.8, 16),
  porte: new THREE.CapsuleGeometry(0.13, 0.18, 4, 8),
  fenetre: new THREE.SphereGeometry(0.1, 8, 6),
  cheminee: new THREE.CylinderGeometry(0.08, 0.09, 0.4, 8),
  brin: new THREE.ConeGeometry(0.05, 0.32, 5),
  rocher: new THREE.IcosahedronGeometry(0.35, 1),
  cristal: new THREE.OctahedronGeometry(0.17, 0),
};

// r() : générateur aléatoire du niveau (pour que la planète soit identique à chaque partie)
export const DECORS = {
  champiRose: r => champignons(r, 'champiRose'),
  champiJaune: r => champignons(r, 'champiJaune'),
  maison: r => {
    const out = [
      piece(G.murs, 'murs', 0, 0.42),
      piece(G.toit, 'toit', 0, 1.22, 0, 0, r() * 6, 0, 1, 1 + r() * 0.2, 1),
      piece(G.porte, 'porte', 0, 0.28, 0.56, 0, 0, 0, 1, 1, 0.5),
      piece(G.fenetre, 'fenetre', 0.42, 0.55, 0.36, 0, 0, 0, 1, 1, 0.6),
      piece(G.cheminee, 'porte', 0.3, 1.45, -0.1),
    ];
    return out;
  },
  touffe: (r, cle = 'herbe') => [0, 1, 2].map(i => piece(G.brin, cle, (r() - 0.5) * 0.18, 0.14, (r() - 0.5) * 0.18, (r() - 0.5) * 0.6, 0, (r() - 0.5) * 0.6)),
  rocher: r => [piece(G.rocher, r() < 0.5 ? 'rocher' : 'rocherSombre', 0, 0.08, 0, r(), r(), r(), 1, 0.65 + r() * 0.2, 0.9)],
  cristalRose: r => cristaux(r, 'cristalRose'),
  cristalJaune: r => cristaux(r, 'cristalJaune'),
  cristalBleu: r => cristaux(r, 'cristalBleu'),
};

function champignons(r, cle) {
  const out = [], n = 1 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const s = i === 0 ? 1 + r() * 0.5 : 0.5 + r() * 0.4, a = r() * 6, d = i === 0 ? 0 : 0.35 + r() * 0.15;
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    out.push(piece(G.pied, 'creme', x, 0.22 * s, z, 0, 0, 0, s, s, s));
    out.push(piece(G.chapeau, cle, x, 0.42 * s, z, 0, 0, 0, s, 0.75 * s, s));
    for (let k = 0; k < 3; k++) {
      const b = r() * 6;
      out.push(piece(G.point, 'blanc', x + Math.cos(b) * 0.2 * s, 0.6 * s, z + Math.sin(b) * 0.2 * s, 0, 0, 0, s, 0.6 * s, s));
    }
  }
  return out;
}
function cristaux(r, cle) {
  const out = [], n = 3 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r(), t = i === 0 ? 0 : 0.35 + r() * 0.25, s = i === 0 ? 1.3 : 0.6 + r() * 0.5;
    out.push(piece(G.cristal, cle, Math.cos(a) * 0.12 * (i ? 1 : 0), 0.32 * s, Math.sin(a) * 0.12 * (i ? 1 : 0),
      Math.sin(a) * t, 0, -Math.cos(a) * t, s, 2.6 * s, s));
  }
  return out;
}
