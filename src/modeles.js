// Modèles 3D externes (.glb, par exemple générés avec Meshy ou Tripo).
// Dépose un fichier dans public/modeles/ (ex. public/modeles/phare.glb) : au prochain lancement de
// « npm run dev » ou « npm run build », il remplace automatiquement la version dessinée par le code.
//
// Noms reconnus : fanal · phare · champignon · maison · cristal · rocher · touffe
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Liste remplie au démarrage de Vite à partir du dossier public/modeles (voir vite.config.js)
// eslint-disable-next-line no-undef
const DISPONIBLES = typeof __MODELES__ !== 'undefined' ? __MODELES__ : [];

export async function chargerModeles() {
  const loader = new GLTFLoader(), out = {};
  await Promise.all(DISPONIBLES.map(n =>
    loader.loadAsync(`./modeles/${n}.glb`).then(g => { out[n] = g.scene; }).catch(e => console.warn('Modèle illisible :', n, e))));
  return out;
}

// Met un modèle à la bonne taille (hauteur en unités du jeu), pieds en y = 0, centré.
// Renvoie la liste de ses morceaux { geo, mat } prêts à être placés.
export function morceaux(scene, hauteur) {
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(scene);
  const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  const s = hauteur / Math.max(size.y, 1e-6);
  const norm = new THREE.Matrix4().makeScale(s, s, s).multiply(new THREE.Matrix4().makeTranslation(-c.x, -box.min.y, -c.z));
  const out = [];
  scene.traverse(o => {
    if (!o.isMesh) return;
    const geo = o.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(norm, o.matrixWorld));
    out.push({ geo, mat: Array.isArray(o.material) ? o.material[0] : o.material });
  });
  return out;
}
