// Commandes : clavier (ordinateur) + joystick et bouton tactiles (téléphone).
// Lecture : controls.move = {x, y} entre -1 et 1 (y = avancer), controls.consumeJump() = true une fois par appui.

export function createControls() {
  const move = { x: 0, y: 0 };
  const keys = new Set();
  let jumpQueued = false;
  let stickId = null, origin = null;
  let touchMove = { x: 0, y: 0 };
  const stick = document.getElementById('stick');
  const knob = stick.querySelector('i');
  const jumpBtn = document.getElementById('saut');
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
    if (e.code === 'Space') { if (!e.repeat) jumpQueued = true; e.preventDefault(); return; }
    if (map[e.code]) { keys.add(map[e.code]); e.preventDefault(); }
  });
  addEventListener('keyup', e => { if (map[e.code]) keys.delete(map[e.code]); });
  addEventListener('blur', () => keys.clear());

  // Joystick : apparaît là où le pouce touche, sur la moitié gauche de l'écran
  addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' || stickId !== null || e.clientX > innerWidth * 0.55) return;
    if (e.target.closest('button, .pill#son, .ecran')) return;
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

  jumpBtn.addEventListener('pointerdown', e => { e.preventDefault(); jumpQueued = true; jumpBtn.classList.add('on'); });
  jumpBtn.addEventListener('pointerup', () => jumpBtn.classList.remove('on'));
  jumpBtn.addEventListener('pointerleave', () => jumpBtn.classList.remove('on'));

  return {
    move,
    update() {
      let x = (keys.has('r') ? 1 : 0) - (keys.has('l') ? 1 : 0) + touchMove.x;
      let y = (keys.has('f') ? 1 : 0) - (keys.has('b') ? 1 : 0) + touchMove.y;
      const l = Math.hypot(x, y);
      if (l > 1) { x /= l; y /= l; }
      move.x = x; move.y = y;
    },
    consumeJump() { const j = jumpQueued; jumpQueued = false; return j; },
    reset() { keys.clear(); jumpQueued = false; },
  };
}
