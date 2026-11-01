'use strict';
// Keyboard state. "pressed" holds fresh key presses until a tick uses them, or for BUFFER ticks at most,
// so a press during a hit freeze still counts once play resumes.

const Input = (() => {
  const BUFFER = 15;
  const down = new Set(), pressed = new Map();  // code -> ticks since the press
  addEventListener('keydown', e => {
    if (!down.has(e.code)) pressed.set(e.code, 0);
    down.add(e.code);
    if (e.code.startsWith('Arrow') || e.code === 'Space' || e.code === 'Tab') e.preventDefault();
  });
  addEventListener('keyup', e => down.delete(e.code));
  addEventListener('blur', () => down.clear());

  const MAPS = [
    { left: ['KeyA'], right: ['KeyD'], up: ['KeyW'], down: ['KeyS'], attack: ['KeyF'], special: ['KeyG'] },
    { left: ['ArrowLeft'], right: ['ArrowRight'], up: ['ArrowUp'], down: ['ArrowDown'], attack: ['KeyK', 'Numpad1'], special: ['KeyL', 'Numpad2'] },
  ];

  // Controls for player i: held keys (left, attack...) and fresh presses (leftP, attackP...). Uses up the presses.
  function read(i) {
    const m = MAPS[i], c = {};
    for (const k in m) {
      c[k] = m[k].some(code => down.has(code));
      c[k + 'P'] = m[k].some(code => pressed.has(code));
      m[k].forEach(code => pressed.delete(code));
    }
    return c;
  }

  function endTick() {
    for (const [code, age] of pressed) {
      if (age >= BUFFER) pressed.delete(code);
      else pressed.set(code, age + 1);
    }
  }

  return { read, hit: code => pressed.delete(code), clear: () => pressed.clear(), endTick };
})();

function noControls() {
  return { left: false, right: false, up: false, down: false, attack: false, special: false,
    leftP: false, rightP: false, upP: false, downP: false, attackP: false, specialP: false };
}
