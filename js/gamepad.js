// ─── Gamepad Support (Web Gamepad API) ───────────────────────
// Maps gamepad inputs into the existing `keys` object so
// controllers work seamlessly with the keyboard input system.
//
// Gamepad 0 → Player 1 (maps to WASD + Space)
// Gamepad 1 → Player 2 (maps to Arrows + Enter)
//
// Standard mapping:
//   Left stick / D-pad → movement
//   A button (0) or Right trigger (7) → shoot
//   Start (9) → any key (for menus)

const GAMEPAD_MAPS = [
  // Player 1
  { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', shoot: 'Space', special: 'KeyQ' },
  // Player 2
  { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', shoot: 'Enter', special: 'ShiftRight' },
];

const STICK_DEADZONE = 0.3;

// Track previous button states to detect fresh presses
const prevButtons = [{}, {}];
// Track previous direction states for edge detection in menus
const prevDirs = [{ up: false, down: false, left: false, right: false }, { up: false, down: false, left: false, right: false }];

function syncPadKey(code, pressed) {
  if (!code) return;
  keys[code] = !!pressed || !!keyboardKeys[code];
}

function resetPadState(gi, map) {
  syncPadKey(map.up, false);
  syncPadKey(map.down, false);
  syncPadKey(map.left, false);
  syncPadKey(map.right, false);
  syncPadKey(map.shoot, false);
  syncPadKey(map.special, false);
  prevButtons[gi] = {};
  prevDirs[gi] = { up: false, down: false, left: false, right: false };
}

function pollGamepads() {
  const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];

  for (let gi = 0; gi < 2; gi++) {
    const map = GAMEPAD_MAPS[gi];
    const gp = gamepads[gi];
    if (!gp) {
      resetPadState(gi, map);
      continue;
    }

    // ── D-pad (buttons 12-15) ──
    const dpadUp = gp.buttons[12] && gp.buttons[12].pressed;
    const dpadDown = gp.buttons[13] && gp.buttons[13].pressed;
    const dpadLeft = gp.buttons[14] && gp.buttons[14].pressed;
    const dpadRight = gp.buttons[15] && gp.buttons[15].pressed;

    // ── Left stick (axes 0, 1) ──
    const lx = gp.axes[0] || 0;
    const ly = gp.axes[1] || 0;
    const stickUp = ly < -STICK_DEADZONE;
    const stickDown = ly > STICK_DEADZONE;
    const stickLeft = lx < -STICK_DEADZONE;
    const stickRight = lx > STICK_DEADZONE;

    // ── Combine d-pad + stick ──
    const dirUp = dpadUp || stickUp;
    const dirDown = dpadDown || stickDown;
    const dirLeft = dpadLeft || stickLeft;
    const dirRight = dpadRight || stickRight;

    // In char select, only use edge-detected keys — skip raw continuous updates
    const inMenu = (typeof gameState !== 'undefined' && typeof STATE !== 'undefined' && gameState === STATE.CHAR_SELECT);
    if (!inMenu) {
      syncPadKey(map.up, dirUp);
      syncPadKey(map.down, dirDown);
      syncPadKey(map.left, dirLeft);
      syncPadKey(map.right, dirRight);
    }

    // ── Edge-detected menu keys (only fire on fresh press, for char select) ──
    if (dirUp && !prevDirs[gi].up) keys['_gp' + gi + 'Up'] = true;
    if (dirDown && !prevDirs[gi].down) keys['_gp' + gi + 'Down'] = true;
    if (dirLeft && !prevDirs[gi].left) keys['_gp' + gi + 'Left'] = true;
    if (dirRight && !prevDirs[gi].right) keys['_gp' + gi + 'Right'] = true;
    prevDirs[gi].up = dirUp;
    prevDirs[gi].down = dirDown;
    prevDirs[gi].left = dirLeft;
    prevDirs[gi].right = dirRight;

    // ── Shoot: A (0), RB (5), RT (7) ──
    const shootPressed = (gp.buttons[0] && gp.buttons[0].pressed) ||
                         (gp.buttons[5] && gp.buttons[5].pressed) ||
                         (gp.buttons[7] && gp.buttons[7].pressed);
    syncPadKey(map.shoot, shootPressed);

    // ── Special: X (2), LB (4) ──
    const specialPressed = (gp.buttons[2] && gp.buttons[2].pressed) ||
                           (gp.buttons[4] && gp.buttons[4].pressed);
    syncPadKey(map.special, specialPressed);

    // ── Start button (9) for menu navigation ──
    if (gp.buttons[9] && gp.buttons[9].pressed && !prevButtons[gi].start) {
      // Simulate a keypress for title/match-end screens
      keys['_gamepadStart'] = true;
      setTimeout(() => { keys['_gamepadStart'] = false; }, 100);
    }
    prevButtons[gi].start = gp.buttons[9] && gp.buttons[9].pressed;
  }
}

// ── Connection events ──
window.addEventListener('gamepadconnected', (e) => {
  console.log(`Gamepad ${e.gamepad.index} connected: ${e.gamepad.id}`);
});

window.addEventListener('gamepaddisconnected', (e) => {
  console.log(`Gamepad ${e.gamepad.index} disconnected`);
  // Clear keys for this gamepad
  if (e.gamepad.index < 2) {
    resetPadState(e.gamepad.index, GAMEPAD_MAPS[e.gamepad.index]);
  }
});
