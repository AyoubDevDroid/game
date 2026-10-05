// Fonctions propres au téléphone : vibrations, plein écran, écran toujours allumé.
// Dans l'appli Android (Capacitor) on utilise les modules natifs ; dans un navigateur, les équivalents web s'il y en a.
import { Capacitor, SystemBars } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { KeepAwake } from '@capacitor-community/keep-awake';

export const natif = Capacitor.isNativePlatform();
const tactile = matchMedia('(pointer: coarse)').matches;

// force : 'leger' | 'moyen' | 'fort'
export function vibre(force = 'leger') {
  if (natif) {
    const style = { leger: ImpactStyle.Light, moyen: ImpactStyle.Medium, fort: ImpactStyle.Heavy }[force];
    Haptics.impact({ style }).catch(() => {});
  } else if (tactile && navigator.vibrate) {
    navigator.vibrate({ leger: 10, moyen: 25, fort: 50 }[force]);
  }
}

export function pleinEcran() {
  if (natif) SystemBars.hide().catch(() => {});
  else if (tactile && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
}

let wakeLock = null;
export async function ecranAllume(on) {
  try {
    if (natif) await (on ? KeepAwake.keepAwake() : KeepAwake.allowSleep());
    else if (on && navigator.wakeLock) wakeLock = await navigator.wakeLock.request('screen');
    else if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch { /* pas disponible : sans gravité */ }
}
