'use strict';
// Keyboard state. "pressed" holds keys that went down since the last game tick.

const Input = (() => {
  const down = new Set(), pressed = new Set();
  addEventListener('keydown', e => {
    if (!down.has(e.code)) pressed.add(e.code);
    down.add(e.code);
    if (e.code.startsWith('Arrow') || e.code === 'Space' || e.code === 'Tab') e.preventDefault();
  });
  addEventListener('keyup', e => down.delete(e.code));
  addEventListener('blur', () => down.clear());

  const MAPS = [
    { left: ['KeyA'], right: ['KeyD'], up: ['KeyW'], down: ['KeyS'], attack: ['KeyF'], special: ['KeyG'] },
    { left: ['ArrowLeft'], right: ['ArrowRight'], up: ['ArrowUp'], down: ['ArrowDown'], attack: ['KeyK', 'Numpad1'], special: ['KeyL', 'Numpad2'] },
  ];

  // Controls for player i: held keys (left, attack...) and fresh presses (leftP, attackP...).
  function read(i) {
    const m = MAPS[i], c = {};
    for (const k in m) {
      c[k] = m[k].some(code => down.has(code));
      c[k + 'P'] = m[k].some(code => pressed.has(code));
    }
    return c;
  }

  return { read, hit: code => pressed.has(code), endTick: () => pressed.clear() };
})();

function noControls() {
  return { left: false, right: false, up: false, down: false, attack: false, special: false,
    leftP: false, rightP: false, upP: false, downP: false, attackP: false, specialP: false };
}
