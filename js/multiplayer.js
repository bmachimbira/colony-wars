// ─── P2P Multiplayer (PeerJS + WebRTC) ───────────────────────
// 4-character room codes. PeerJS handles signaling,
// actual game data flows peer-to-peer via WebRTC DataChannel.

let peer = null;
let peerConns = []; // host keeps array of connections
let peerConn = null; // guest keeps single connection to host
let isHost = false;
let isOnline = false;
let remoteKeysBySlot = {}; // { 1: {keys}, 2: {keys}, 3: {keys} }
let remoteKeys = {};
let multiplayerUI = null;
let connectionState = 'disconnected';
let roomCode = '';
let myPlayerSlot = 0; // 0=host(P1), 1=first guest(P2), etc.
let onlinePlayerCount = 1;

const PEER_PREFIX = 'colonyclash-';

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ─── UI ──────────────────────────────────────────────────────
function showMultiplayerMenu() {
  if (multiplayerUI) return;

  multiplayerUI = document.createElement('div');
  multiplayerUI.id = 'mp-overlay';
  Object.assign(multiplayerUI.style, {
    position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
    background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center',
    alignItems: 'center', zIndex: '1000', fontFamily: 'monospace', color: '#ccc',
  });

  const panel = document.createElement('div');
  Object.assign(panel.style, {
    background: '#1A1208', border: '2px solid #5C4023', borderRadius: '8px',
    padding: '30px', maxWidth: '420px', width: '90%', textAlign: 'center',
  });

  function makeBtn(text, color, onClick) {
    const btn = document.createElement('button');
    btn.textContent = text;
    Object.assign(btn.style, {
      background: color, color: '#fff', border: 'none', padding: '12px 24px',
      fontFamily: 'monospace', fontSize: '14px', cursor: 'pointer', margin: '8px',
      borderRadius: '4px',
    });
    btn.addEventListener('click', onClick);
    btn.addEventListener('mouseenter', () => { btn.style.filter = 'brightness(1.2)'; });
    btn.addEventListener('mouseleave', () => { btn.style.filter = ''; });
    return btn;
  }

  function makeText(text, color, size) {
    const p = document.createElement('p');
    p.textContent = text;
    Object.assign(p.style, { margin: '10px 0', fontSize: size || '13px', color: color || '#999' });
    return p;
  }

  function makeHeading(text) {
    const h = document.createElement('h2');
    h.textContent = text;
    Object.assign(h.style, { color: '#E8C840', marginBottom: '15px' });
    return h;
  }

  function makeCodeDisplay(id) {
    const d = document.createElement('div');
    d.id = id;
    Object.assign(d.style, {
      fontSize: '48px', fontFamily: 'monospace', fontWeight: 'bold', color: '#88FF44',
      letterSpacing: '12px', margin: '20px 0', textShadow: '0 0 20px rgba(136,255,68,0.5)',
    });
    return d;
  }

  function makeCodeInput(id, placeholder) {
    const input = document.createElement('input');
    input.id = id;
    input.placeholder = placeholder || 'XXXX';
    input.maxLength = 4;
    input.autocomplete = 'off';
    Object.assign(input.style, {
      width: '200px', textAlign: 'center', fontSize: '36px', fontFamily: 'monospace',
      fontWeight: 'bold', letterSpacing: '10px', background: '#0E0A05', color: '#E8C840',
      border: '2px solid #5C4023', padding: '10px', borderRadius: '6px', margin: '15px auto',
      display: 'block', textTransform: 'uppercase',
    });
    input.addEventListener('input', () => { input.value = input.value.toUpperCase(); });
    input.addEventListener('keydown', (e) => {
      e.stopPropagation(); // prevent game from stealing keys
      if (e.key === 'Enter') {
        const joinBtn = input.parentElement.querySelector('button');
        if (joinBtn) joinBtn.click();
      }
    });
    return input;
  }

  function makeStatus(id) {
    const s = document.createElement('div');
    s.id = id;
    Object.assign(s.style, { color: '#E8C840', fontSize: '12px', marginTop: '10px' });
    return s;
  }

  // Steps
  const steps = {};

  // ── Menu ──
  steps.menu = document.createElement('div');
  steps.menu.appendChild(makeHeading('ONLINE MULTIPLAYER'));
  steps.menu.appendChild(makeText('Play with a friend \u2014 no server needed'));
  steps.menu.appendChild(makeBtn('HOST GAME', '#3066C8', () => mpHost(steps)));
  steps.menu.appendChild(makeBtn('JOIN GAME', '#3066C8', () => {
    mpShowStep(steps, 'join');
    setTimeout(() => { const inp = document.getElementById('mp-join-input'); if (inp) inp.focus(); }, 100);
  }));
  steps.menu.appendChild(document.createElement('br'));
  steps.menu.appendChild(makeBtn('BACK', '#C83030', closeMultiplayerMenu));

  // ── Host ──
  steps.host = document.createElement('div');
  steps.host.style.display = 'none';
  steps.host.appendChild(makeHeading('YOUR ROOM CODE'));
  steps.host.appendChild(makeText('Share this code with your friend:'));
  steps.host.appendChild(makeCodeDisplay('mp-room-code'));
  steps.host.appendChild(makeText('Waiting for player to join...', '#E8C840'));
  steps.host.appendChild(makeBtn('CANCEL', '#C83030', () => mpDisconnect(steps)));
  steps.host.appendChild(makeStatus('mp-host-status'));

  // ── Join ──
  steps.join = document.createElement('div');
  steps.join.style.display = 'none';
  steps.join.appendChild(makeHeading('ENTER ROOM CODE'));
  steps.join.appendChild(makeText('Type the 4-letter code from the host:'));
  steps.join.appendChild(makeCodeInput('mp-join-input'));
  steps.join.appendChild(makeBtn('JOIN', '#30A830', () => mpJoin(steps)));
  steps.join.appendChild(document.createElement('br'));
  steps.join.appendChild(makeBtn('BACK', '#C83030', () => mpShowStep(steps, 'menu')));
  steps.join.appendChild(makeStatus('mp-join-status'));

  // ── Connected ──
  steps.connected = document.createElement('div');
  steps.connected.style.display = 'none';
  steps.connected.appendChild(makeHeading('CONNECTED!'));
  steps.connected.appendChild(makeText('Peer-to-peer link established.', '#88FF44'));
  steps.connected.appendChild(makeText('Starting game...'));

  for (const step of Object.values(steps)) panel.appendChild(step);
  multiplayerUI.appendChild(panel);
  document.body.appendChild(multiplayerUI);
  multiplayerUI._steps = steps;
}

function closeMultiplayerMenu() {
  if (multiplayerUI) { multiplayerUI.remove(); multiplayerUI = null; }
}

function mpShowStep(steps, name) {
  for (const [key, el] of Object.entries(steps)) {
    el.style.display = key === name ? 'block' : 'none';
  }
}

function mpSetStatus(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// ─── Host ────────────────────────────────────────────────────
function mpHost(steps) {
  roomCode = generateRoomCode();
  isHost = true;
  connectionState = 'waiting';
  mpShowStep(steps, 'host');

  const codeEl = document.getElementById('mp-room-code');
  if (codeEl) codeEl.textContent = roomCode;
  mpSetStatus('mp-host-status', 'Connecting to signaling...');

  peer = new Peer(PEER_PREFIX + roomCode, { debug: 0 });

  peer.on('open', () => {
    mpSetStatus('mp-host-status', 'Room open. Waiting for players... (1/4)');
  });

  peer.on('connection', (conn) => {
    const slot = peerConns.length + 1; // slots 1, 2, 3
    if (slot > 3) { conn.close(); return; } // max 4 players
    peerConns.push({ conn, slot });
    onlinePlayerCount = peerConns.length + 1;
    playerCount = onlinePlayerCount;
    setupHostConnection(conn, slot, steps);
  });

  peer.on('error', (err) => {
    if (err.type === 'unavailable-id') {
      // Code collision — try another
      peer.destroy();
      roomCode = generateRoomCode();
      if (codeEl) codeEl.textContent = roomCode;
      mpSetStatus('mp-host-status', 'Code taken, trying ' + roomCode + '...');
      peer = new Peer(PEER_PREFIX + roomCode, { debug: 0 });
      peer.on('open', () => mpSetStatus('mp-host-status', 'Room open. Waiting for players... (1/4)'));
      peer.on('connection', (conn) => {
        const slot = peerConns.length + 1;
        if (slot > 3) { conn.close(); return; }
        peerConns.push({ conn, slot });
        onlinePlayerCount = peerConns.length + 1;
        playerCount = onlinePlayerCount;
        setupHostConnection(conn, slot, steps);
      });
    } else {
      mpSetStatus('mp-host-status', 'Error: ' + err.type);
    }
  });
}

// ─── Join ────────────────────────────────────────────────────
function mpJoin(steps) {
  const input = document.getElementById('mp-join-input');
  const code = (input ? input.value : '').toUpperCase().trim();
  if (code.length !== 4) {
    mpSetStatus('mp-join-status', 'Enter a 4-character code');
    return;
  }

  isHost = false;
  roomCode = code;
  connectionState = 'connecting';
  mpSetStatus('mp-join-status', 'Connecting...');

  peer = new Peer(undefined, { debug: 0 });

  peer.on('open', () => {
    const conn = peer.connect(PEER_PREFIX + code, { reliable: true });
    setupGuestConnection(conn, steps);
  });

  peer.on('error', (err) => {
    if (err.type === 'peer-unavailable') {
      mpSetStatus('mp-join-status', 'Room not found. Check the code.');
    } else {
      mpSetStatus('mp-join-status', 'Error: ' + err.type);
    }
  });
}

// ─── Host Connection (accepts multiple guests) ──────────────
function setupHostConnection(conn, slot, steps) {
  conn.on('open', () => {
    console.log('Player', slot + 1, 'connected! Room:', roomCode);
    connectionState = 'connected';
    isOnline = true;
    // Tell the guest their slot
    conn.send({ type: 'slot', slot });
    mpSetStatus('mp-host-status', 'Players: ' + onlinePlayerCount + '/4. Press START GAME when ready.');

    // Show start button after first player joins
    let startBtn = document.getElementById('mp-start-btn');
    if (!startBtn) {
      startBtn = document.createElement('button');
      startBtn.id = 'mp-start-btn';
      startBtn.textContent = 'START GAME (' + onlinePlayerCount + ' players)';
      Object.assign(startBtn.style, {
        background: '#30A830', color: '#fff', border: 'none', padding: '12px 24px',
        fontFamily: 'monospace', fontSize: '16px', cursor: 'pointer', margin: '12px',
        borderRadius: '4px', fontWeight: 'bold',
      });
      startBtn.addEventListener('click', () => {
        // Broadcast game start to all guests
        for (const pc of peerConns) {
          try { pc.conn.send({ type: 'start', playerCount: onlinePlayerCount }); } catch (e) {}
        }
        closeMultiplayerMenu();
        playerCount = onlinePlayerCount;
        gameState = STATE.GENERATING;
      });
      // Insert before cancel button
      const hostStep = steps.host;
      hostStep.appendChild(startBtn);
    } else {
      startBtn.textContent = 'START GAME (' + onlinePlayerCount + ' players)';
    }
  });

  conn.on('data', (data) => {
    if (data && data.type === 'input') {
      remoteKeysBySlot[slot] = data.keys;
      // Relay to other guests
      for (const pc of peerConns) {
        if (pc.slot !== slot) {
          try { pc.conn.send({ type: 'relay', slot, keys: data.keys }); } catch (e) {}
        }
      }
    }
  });

  conn.on('close', () => {
    console.log('Player', slot + 1, 'disconnected');
    peerConns = peerConns.filter(pc => pc.slot !== slot);
    onlinePlayerCount = peerConns.length + 1;
  });
}

// ─── Guest Connection ────────────────────────────────────────
function setupGuestConnection(conn, steps) {
  conn.on('open', () => {
    console.log('Connected to host! Room:', roomCode);
    peerConn = conn;
    connectionState = 'connected';
    isOnline = true;
    mpShowStep(steps, 'connected');
  });

  conn.on('data', (data) => {
    if (data && data.type === 'slot') {
      myPlayerSlot = data.slot;
      console.log('Assigned player slot:', myPlayerSlot + 1);
    } else if (data && data.type === 'input') {
      // Host's input
      remoteKeysBySlot[0] = data.keys;
    } else if (data && data.type === 'relay') {
      // Another guest's input relayed through host
      remoteKeysBySlot[data.slot] = data.keys;
    } else if (data && data.type === 'start') {
      playerCount = data.playerCount;
      closeMultiplayerMenu();
      gameState = STATE.GENERATING;
    }
  });

  conn.on('close', () => {
    console.log('Disconnected from host');
    isOnline = false;
    connectionState = 'disconnected';
  });
}

function mpDisconnect(steps) {
  for (const pc of peerConns) { try { pc.conn.close(); } catch (e) {} }
  peerConns = [];
  if (peerConn) { peerConn.close(); peerConn = null; }
  if (peer) { peer.destroy(); peer = null; }
  isOnline = false;
  connectionState = 'disconnected';
  onlinePlayerCount = 1;
  remoteKeysBySlot = {};
  mpShowStep(steps, 'menu');
}

// ─── Input sync ──────────────────────────────────────────────
let mpSendTimer = 0;

function mpSendInput(dt) {
  if (!isOnline) return;

  mpSendTimer += dt;
  if (mpSendTimer < 0.016) return;
  mpSendTimer = 0;

  // Send our local player's controls
  const mySlot = isHost ? 0 : myPlayerSlot;
  const myControls = PLAYER_CONTROLS[mySlot];
  if (!myControls) return;

  const inputState = {};
  for (const [action, code] of Object.entries(myControls)) {
    inputState[code] = !!keys[code];
  }

  if (isHost) {
    // Host: broadcast to all guests
    for (const pc of peerConns) {
      try { pc.conn.send({ type: 'input', keys: inputState }); } catch (e) {}
    }
  } else {
    // Guest: send to host
    if (peerConn && peerConn.open) {
      try { peerConn.send({ type: 'input', keys: inputState }); } catch (e) {}
    }
  }
}

function mpApplyRemoteInput() {
  if (!isOnline) return;
  // Apply each remote player's keys
  for (const [slot, slotKeys] of Object.entries(remoteKeysBySlot)) {
    for (const [code, pressed] of Object.entries(slotKeys)) {
      keys[code] = pressed;
    }
  }
}

// ─── Title screen indicator ──────────────────────────────────
function drawOnlineButton() {
  if (isOnline) {
    ctx.fillStyle = '#30A830';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ONLINE: CONNECTED  [' + roomCode + ']', W / 2, H / 2 + 160);
  }
}
