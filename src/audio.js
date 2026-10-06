// Sons et musique 100 % générés par le jeu (synthèse Web Audio) : aucun fichier, aucun droit d'auteur tiers.

let ctx = null, master = null, musicGain = null, musicTimer = null, muted = false;

export function initAudio() {
  if (ctx) return;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0.7; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.18; musicGain.connect(master);
  } catch { ctx = null; }
}

export function toggleMute() {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : 0.7;
  return muted;
}

function tone({ freq = 440, to = null, type = 'sine', dur = 0.2, vol = 0.2, delay = 0, out = master }) {
  if (!ctx || muted) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
}

function noise({ dur = 0.4, vol = 0.15, from = 400, to = 3000 }) {
  if (!ctx || muted) return;
  const t = ctx.currentTime, n = ctx.sampleRate * dur;
  const buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(); src.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.5;
  f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(master); src.start(t);
}

// Gamme pentatonique : toutes les notes sonnent bien ensemble
const PENTA = [0, 2, 4, 7, 9];
const note = (base, step) => base * Math.pow(2, (PENTA[((step % 5) + 5) % 5] + 12 * Math.floor(step / 5)) / 12);

export const sfx = {
  jump: () => tone({ freq: 300, to: 620, type: 'square', dur: 0.16, vol: 0.07 }),
  jump2: () => { tone({ freq: 520, to: 1040, type: 'square', dur: 0.14, vol: 0.06 }); tone({ freq: 1040, to: 1560, type: 'triangle', dur: 0.18, vol: 0.08, delay: 0.05 }); },
  repere: () => tone({ freq: 220, to: 150, type: 'triangle', dur: 0.22, vol: 0.09 }),
  ecrase: () => { tone({ freq: 700, to: 180, type: 'square', dur: 0.12, vol: 0.07 }); noise({ dur: 0.25, vol: 0.08, from: 2500, to: 400 }); },
  touche: () => { tone({ freq: 330, to: 110, type: 'sawtooth', dur: 0.35, vol: 0.08 }); tone({ freq: 260, to: 90, type: 'triangle', dur: 0.4, vol: 0.1, delay: 0.05 }); },
  land: () => tone({ freq: 140, to: 70, type: 'sine', dur: 0.12, vol: 0.18 }),
  piece: n => { tone({ freq: note(784, n % 10), type: 'sine', dur: 0.12, vol: 0.13 }); tone({ freq: note(784, (n % 10) + 4), type: 'triangle', dur: 0.14, vol: 0.07, delay: 0.04 }); },
  tir: () => { tone({ freq: 180, to: 90, type: 'square', dur: 0.2, vol: 0.08 }); noise({ dur: 0.18, vol: 0.06, from: 600, to: 200 }); },
  onde: () => { tone({ freq: 1400, to: 300, type: 'sawtooth', dur: 0.4, vol: 0.05 }); noise({ dur: 0.4, vol: 0.05, from: 4000, to: 9000 }); },
  pique: () => tone({ freq: 900, to: 400, type: 'square', dur: 0.12, vol: 0.07 }),
  coup: () => { noise({ dur: 0.22, vol: 0.12, from: 800, to: 3000 }); tone({ freq: 240, to: 520, type: 'sawtooth', dur: 0.18, vol: 0.06 }); },
  coffre: () => { [0, 2, 4, 7, 9].forEach((s, i) => tone({ freq: note(523, s), type: 'triangle', dur: 0.3, vol: 0.13, delay: i * 0.06 })); noise({ dur: 0.5, vol: 0.05, from: 5000, to: 11000 }); },
  joie: () => { [4, 7, 9, 12].forEach((s, i) => tone({ freq: note(392, s), type: 'sine', dur: 0.28, vol: 0.14, delay: i * 0.08 })); tone({ freq: 880, to: 1320, type: 'triangle', dur: 0.3, vol: 0.06, delay: 0.3 }); },
  cristal: n => {   // carillon cristallin qui monte d'une note à chaque cristal, avec un scintillement
    [0, 2, 4].forEach((s, i) => tone({ freq: note(659, n + s), type: 'triangle', dur: 0.35, vol: 0.14, delay: i * 0.05 }));
    tone({ freq: note(1318, n + 4), type: 'sine', dur: 0.6, vol: 0.08, delay: 0.12 });
    noise({ dur: 0.35, vol: 0.05, from: 6000, to: 12000 });
  },
  ember: n => { tone({ freq: note(523, n), type: 'triangle', dur: 0.25, vol: 0.2 }); tone({ freq: note(523, n + 2), type: 'sine', dur: 0.3, vol: 0.12, delay: 0.06 }); },
  ready: () => [0, 2, 4, 5].forEach((s, i) => tone({ freq: note(392, s), type: 'triangle', dur: 0.35, vol: 0.16, delay: i * 0.09 })),
  beacon: () => { [0, 2, 4, 7].forEach(s => tone({ freq: note(262, s), type: 'sawtooth', dur: 1.6, vol: 0.05 })); [5, 7, 9, 10].forEach((s, i) => tone({ freq: note(262, s), type: 'triangle', dur: 0.6, vol: 0.12, delay: 0.15 + i * 0.12 })); },
  launch: () => { noise({ dur: 1.0, vol: 0.18, from: 300, to: 4000 }); tone({ freq: 200, to: 900, type: 'triangle', dur: 1.0, vol: 0.12 }); },
  respawn: () => tone({ freq: 500, to: 180, type: 'triangle', dur: 0.4, vol: 0.15 }),
  victory: () => [0, 2, 4, 5, 7, 9, 10].forEach((s, i) => tone({ freq: note(392, s), type: 'triangle', dur: 0.5, vol: 0.15, delay: i * 0.12 })),
};

// Musique d'ambiance : arpège lent et doux, généré à l'infini
export function startMusic(mood = 0) {
  if (!ctx) return;
  stopMusic();
  const base = [220, 196, 247][mood % 3];
  const pattern = [0, 2, 4, 2, 5, 4, 2, 1];
  let i = 0;
  const step = () => {
    if (muted) return;
    const s = pattern[i % pattern.length] + (Math.floor(i / 16) % 2 ? 1 : 0);
    tone({ freq: note(base, s), type: 'sine', dur: 0.9, vol: 0.25, out: musicGain });
    if (i % 8 === 0) tone({ freq: note(base / 2, 0), type: 'triangle', dur: 2.6, vol: 0.18, out: musicGain });
    i++;
  };
  step();
  musicTimer = setInterval(step, 420);
}
// Application en arrière-plan : on coupe le son, puis on le reprend
export function pauseAudio() { if (ctx) ctx.suspend().catch(() => {}); }
export function resumeAudio() { if (ctx) ctx.resume().catch(() => {}); }
export function stopMusic() { clearInterval(musicTimer); musicTimer = null; }
