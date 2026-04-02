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
  { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', shoot: 'Space' },
  // Player 2
  { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', shoot: 'Enter' },
];

const STICK_DEADZONE = 0.3;

// Track previous button states to detect fresh presses
const prevButtons = [{}, {}];

function pollGamepads() {
  const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];

  for (let gi = 0; gi < 2; gi++) {
    const gp = gamepads[gi];
    if (!gp) continue;

    const map = GAMEPAD_MAPS[gi];

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
    keys[map.up] = dpadUp || stickUp || (keys[map.up] && !isGamepadKey(map.up));
    keys[map.down] = dpadDown || stickDown || (keys[map.down] && !isGamepadKey(map.down));
    keys[map.left] = dpadLeft || stickLeft || (keys[map.left] && !isGamepadKey(map.left));
    keys[map.right] = dpadRight || stickRight || (keys[map.right] && !isGamepadKey(map.right));

    // ── Shoot: A (0), B (1), X (2), Y (3), RB (5), RT (7) ──
    const shootPressed = (gp.buttons[0] && gp.buttons[0].pressed) ||
                         (gp.buttons[5] && gp.buttons[5].pressed) ||
                         (gp.buttons[7] && gp.buttons[7].pressed);
    keys[map.shoot] = shootPressed || (keys[map.shoot] && !isGamepadKey(map.shoot));

    // ── Start button (9) for menu navigation ──
    if (gp.buttons[9] && gp.buttons[9].pressed && !prevButtons[gi].start) {
      // Simulate a keypress for title/match-end screens
      keys['_gamepadStart'] = true;
      setTimeout(() => { keys['_gamepadStart'] = false; }, 100);
    }
    prevButtons[gi].start = gp.buttons[9] && gp.buttons[9].pressed;
  }
}

// Track which keys are currently being driven by gamepad
// so keyboard presses don't get overwritten
const gamepadDrivenKeys = new Set();

function isGamepadKey(code) {
  // Check if this key code belongs to a gamepad mapping
  return GAMEPAD_MAPS.some(m => Object.values(m).includes(code));
}

// ── Connection events ──
window.addEventListener('gamepadconnected', (e) => {
  console.log(`Gamepad ${e.gamepad.index} connected: ${e.gamepad.id}`);
});

window.addEventListener('gamepaddisconnected', (e) => {
  console.log(`Gamepad ${e.gamepad.index} disconnected`);
  // Clear keys for this gamepad
  if (e.gamepad.index < 2) {
    const map = GAMEPAD_MAPS[e.gamepad.index];
    for (const key of Object.values(map)) {
      keys[key] = false;
    }
  }
});
