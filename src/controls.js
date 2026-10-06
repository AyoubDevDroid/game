// Commandes : clavier (ordinateur) + joystick et boutons tactiles (téléphone).
// Lecture : controls.move = {x, y} entre -1 et 1 (y = avancer) ; controls.consume('saut' | 'coup' | 'tir' | 'eclair')
// = true une fois par appui ; controls.tenu('saut') = le bouton est maintenu (pour planer).
//   Clavier : flèches / ZQSD / WASD, Espace = saut, F = coup de flamme, G = tir de braise, H = décharge électrique

const TOUCHES = {
  Space: 'saut', KeyF: 'coup', KeyX: 'coup', KeyJ: 'coup', KeyG: 'tir', KeyC: 'tir', KeyK: 'tir', KeyH: 'eclair', KeyV: 'eclair', KeyL: 'eclair',
};
const BOUTONS = { saut: 'saut', coup: 'coup', tir: 'tir', eclair: 'eclair' };

export function createControls() {
  const move = { x: 0, y: 0 };
  const keys = new Set();
  const file = new Set(), tenus = new Set();
  let stickId = null, origin = null, actif = true;
  let touchMove = { x: 0, y: 0 };
  const stick = document.getElementById('stick');
  const knob = stick.querySelector('i');
  const R = 50; // rayon utile du joystick en pixels

  const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  if (isTouch) {
    document.body.classList.add('tactile');
    document.getElementById('aide').textContent = '';
  }

  // Clavier (AZERTY et QWERTY)
  const map = {
    ArrowUp: 'f', KeyW: 'f', KeyZ: 'f',
    ArrowDown: 'b', KeyS: 'b',
    ArrowLeft: 'l', KeyA: 'l', KeyQ: 'l',
    ArrowRight: 'r', KeyD: 'r',
  };
  addEventListener('keydown', e => {
    const action = TOUCHES[e.code];
    if (action) { if (!e.repeat) file.add(action); tenus.add(action); e.preventDefault(); return; }
    if (map[e.code]) { keys.add(map[e.code]); e.preventDefault(); }
  });
  addEventListener('keyup', e => { const action = TOUCHES[e.code]; if (action) tenus.delete(action); if (map[e.code]) keys.delete(map[e.code]); });
  addEventListener('blur', () => { keys.clear(); tenus.clear(); });

  // Joystick : apparaît là où le pouce touche, sur la moitié gauche de l'écran
  addEventListener('pointerdown', e => {
    if (!actif || e.pointerType === 'mouse' || stickId !== null || e.clientX > innerWidth * 0.55) return;
    if (e.target.closest('button, .pill#son, .ecran, #dialogue')) return;
    stickId = e.pointerId; origin = { x: e.clientX, y: e.clientY };
    stick.style.display = 'block';
    stick.style.left = (origin.x - 60) + 'px'; stick.style.top = (origin.y - 60) + 'px';
    knob.style.transform = '';
  });
  addEventListener('pointermove', e => {
    if (e.pointerId !== stickId) return;
    let dx = e.clientX - origin.x, dy = e.clientY - origin.y;
    const d = Math.hypot(dx, dy);
    if (d > R) { dx *= R / d; dy *= R / d; }
    knob.style.transform = `translate(${dx}px,${dy}px)`;
    touchMove = { x: dx / R, y: -dy / R };
  });
  const end = e => {
    if (e.pointerId !== stickId) return;
    stickId = null; touchMove = { x: 0, y: 0 }; stick.style.display = 'none';
  };
  addEventListener('pointerup', end);
  addEventListener('pointercancel', end);

  // boutons tactiles : saut (maintenu = planer), coup, tir, éclair
  for (const [action, id] of Object.entries(BOUTONS)) {
    const b = document.getElementById(id); if (!b) continue;
    b.addEventListener('pointerdown', e => { e.preventDefault(); file.add(action); tenus.add(action); b.classList.add('on'); });
    const lacher = () => { tenus.delete(action); b.classList.remove('on'); };
    b.addEventListener('pointerup', lacher); b.addEventListener('pointerleave', lacher); b.addEventListener('pointercancel', lacher);
  }

  return {
    move,
    update() {
      let x = (keys.has('r') ? 1 : 0) - (keys.has('l') ? 1 : 0) + touchMove.x;
      let y = (keys.has('f') ? 1 : 0) - (keys.has('b') ? 1 : 0) + touchMove.y;
      const l = Math.hypot(x, y);
      if (l > 1) { x /= l; y /= l; }
      move.x = x; move.y = y;
    },
    consume(action) { const a = file.has(action); file.delete(action); return a; },
    tenu(action) { return tenus.has(action); },
    consumeJump() { return this.consume('saut'); },
    consumeAttaque() { return this.consume('coup'); },
    reset() { keys.clear(); file.clear(); tenus.clear(); },
    // hors des planètes (univers, cinématiques, dialogues) : pas de joystick
    setActif(v) { actif = v; if (!v) { stickId = null; touchMove = { x: 0, y: 0 }; stick.style.display = 'none'; keys.clear(); file.clear(); tenus.clear(); } },
  };
}
