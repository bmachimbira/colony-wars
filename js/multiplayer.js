// ─── P2P Multiplayer (PeerJS + WebRTC) ───────────────────────
// 4-character room codes. PeerJS handles signaling,
// actual game data flows peer-to-peer via WebRTC DataChannel.

let peer = null;
let peerConn = null;
let isHost = false;
let isOnline = false;
let remoteKeys = {};
let multiplayerUI = null;
let connectionState = 'disconnected';
let roomCode = '';

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
  steps.menu.appendChild(makeBtn('JOIN GAME', '#3066C8', () => mpShowStep(steps, 'join')));
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
    mpSetStatus('mp-host-status', 'Room open. Waiting for opponent...');
  });

  peer.on('connection', (conn) => {
    peerConn = conn;
    setupPeerConnection(conn, steps);
  });

  peer.on('error', (err) => {
    if (err.type === 'unavailable-id') {
      // Code collision — try another
      peer.destroy();
      roomCode = generateRoomCode();
      if (codeEl) codeEl.textContent = roomCode;
      mpSetStatus('mp-host-status', 'Code taken, trying ' + roomCode + '...');
      peer = new Peer(PEER_PREFIX + roomCode, { debug: 0 });
      peer.on('open', () => mpSetStatus('mp-host-status', 'Room open. Waiting for opponent...'));
      peer.on('connection', (conn) => { peerConn = conn; setupPeerConnection(conn, steps); });
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
    peerConn = conn;
    setupPeerConnection(conn, steps);
  });

  peer.on('error', (err) => {
    if (err.type === 'peer-unavailable') {
      mpSetStatus('mp-join-status', 'Room not found. Check the code.');
    } else {
      mpSetStatus('mp-join-status', 'Error: ' + err.type);
    }
  });
}

// ─── Connection ──────────────────────────────────────────────
function setupPeerConnection(conn, steps) {
  conn.on('open', () => {
    console.log('P2P connected! Room:', roomCode);
    connectionState = 'connected';
    isOnline = true;
    mpShowStep(steps, 'connected');
    setTimeout(() => {
      closeMultiplayerMenu();
      if (gameState === STATE.TITLE || gameState === STATE.NARRATIVE) {
        gameState = STATE.GENERATING;
      }
    }, 1500);
  });

  conn.on('data', (data) => {
    if (data && data.type === 'input') {
      remoteKeys = data.keys;
    }
  });

  conn.on('close', () => {
    console.log('P2P disconnected');
    isOnline = false;
    connectionState = 'disconnected';
  });

  conn.on('error', (err) => {
    console.error('P2P error:', err);
  });
}

function mpDisconnect(steps) {
  if (peerConn) { peerConn.close(); peerConn = null; }
  if (peer) { peer.destroy(); peer = null; }
  isOnline = false;
  connectionState = 'disconnected';
  mpShowStep(steps, 'menu');
}

// ─── Input sync ──────────────────────────────────────────────
let mpSendTimer = 0;

function mpSendInput(dt) {
  if (!isOnline || !peerConn || !peerConn.open) return;

  mpSendTimer += dt;
  if (mpSendTimer < 0.016) return;
  mpSendTimer = 0;

  const localControls = isHost
    ? { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', shoot: 'Space' }
    : { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', shoot: 'Enter' };

  const inputState = {};
  for (const [action, code] of Object.entries(localControls)) {
    inputState[code] = !!keys[code];
  }

  try { peerConn.send({ type: 'input', keys: inputState }); } catch (e) {}
}

function mpApplyRemoteInput() {
  if (!isOnline) return;
  for (const [code, pressed] of Object.entries(remoteKeys)) {
    keys[code] = pressed;
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
