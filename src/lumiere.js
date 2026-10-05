// L'effet signature du jeu : une planète éteinte est grise et fade ; quand son phare se rallume,
// la couleur part du phare et recouvre la planète comme une vague.
// On modifie les matériaux Three.js (onBeforeCompile) : tout objet d'une planète partage les mêmes réglages.
import * as THREE from 'three';

const GLSL = /* glsl */`
varying vec3 vWP;
uniform vec3 uCenter, uBeacon, uMotifCol;
uniform float uWave, uScale;
float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vn(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z);
}
vec3 h33(vec3 p){ p = vec3(dot(p, vec3(127.1,311.7,74.7)), dot(p, vec3(269.5,183.3,246.1)), dot(p, vec3(113.5,271.9,124.6))); return fract(sin(p) * 43758.5453); }
float fissure(vec3 x){              // distance entre les deux cellules les plus proches → lignes de fissures
  vec3 i = floor(x), f = fract(x); float d1 = 8.0, d2 = 8.0;
  for (int a = -1; a <= 1; a++) for (int b = -1; b <= 1; b++) for (int c = -1; c <= 1; c++) {
    vec3 g = vec3(float(a), float(b), float(c)); vec3 r = g + h33(i + g) - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
  }
  return sqrt(d2) - sqrt(d1);
}`;

const FRAG = /* glsl */`
#include <emissivemap_fragment>
{
  vec3 dir = normalize(vWP - uCenter);
  float ang = acos(clamp(dot(dir, uBeacon), -1.0, 1.0));
  float lit = 1.0 - smoothstep(uWave - 0.35, uWave, ang);
#if MOTIF == 2                                         // lave : fissures lumineuses
  float k = 1.0 - smoothstep(0.012, 0.045, fissure(dir * uScale));
  diffuseColor.rgb *= 0.9 + 0.2 * vn(dir * uScale * 4.0);
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.5, k);
  totalEmissiveRadiance += uMotifCol * k * 2.4;
#elif MOTIF == 3                                       // poussière d'étoiles
  diffuseColor.rgb *= 0.9 + 0.2 * vn(dir * uScale * 3.0);
  totalEmissiveRadiance += uMotifCol * smoothstep(0.9, 0.99, vn(dir * uScale * 14.0)) * 1.6;
#endif
  float g = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
  vec3 eteint = vec3(g) * vec3(0.62, 0.68, 0.84) * 0.62;     // gris-bleu fade
  diffuseColor.rgb = mix(eteint, diffuseColor.rgb, lit);
  totalEmissiveRadiance *= lit;
}`;

// Réglages partagés par tous les objets d'une planète
export function uniformsPlanete(center, beaconDir) {
  return { uCenter: { value: center.clone() }, uBeacon: { value: beaconDir.clone() }, uWave: { value: -0.5 } };
}
// t de 0 (éteinte) à 1 (entièrement rallumée)
export function regleVague(U, t) { U.uWave.value = -0.5 + t * (Math.PI + 1.0); }

// motif : 0 aucun, 2 lave, 3 étoiles (l'herbe est peinte dans les couleurs du sol)
export function allumable(mat, U, { motif = 0, motifCol = 0xffffff, scale = 6 } = {}) {
  mat.defines = { ...(mat.defines || {}), MOTIF: motif };   // un programme par motif : on ne calcule que le nécessaire
  const extra = { uMotifCol: { value: new THREE.Color(motifCol) }, uScale: { value: scale } };
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U, extra);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
      // objets dupliqués (InstancedMesh) : leur position dans le monde passe aussi par instanceMatrix
      .replace('#include <project_vertex>', '#include <project_vertex>\n#ifdef USE_INSTANCING\nvWP = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;\n#else\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;\n#endif');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + GLSL)
      .replace('#include <emissivemap_fragment>', FRAG);
  };
  return mat;
}
