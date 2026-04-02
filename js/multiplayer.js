// ─── P2P Multiplayer (WebRTC DataChannel) ────────────────────
// True peer-to-peer: no server required. Players exchange
// connection codes via copy-paste to establish a direct link.
//
// Architecture: lockstep input sync
//   - Each frame, local player sends their input state
//   - Remote input is applied to the other queen
//   - Both machines run the same simulation

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

let peerConnection = null;
let dataChannel = null;
let isHost = false;
let isOnline = false;
let remoteKeys = {};
let multiplayerUI = null;
let connectionState = 'disconnected'; // disconnected, waiting, connecting, connected

// ─── UI Overlay (safe DOM construction) ──────────────────────
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
    padding: '30px', maxWidth: '500px', width: '90%', textAlign: 'center',
  });

  // Helper functions
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

  function makeTextarea(id, placeholder, readOnly) {
    const ta = document.createElement('textarea');
    ta.id = id;
    if (placeholder) ta.placeholder = placeholder;
    if (readOnly) ta.readOnly = true;
    Object.assign(ta.style, {
      width: '100%', height: '80px', background: '#0E0A05', color: '#88FF44',
      border: '1px solid #5C4023', fontFamily: 'monospace', fontSize: '11px',
      padding: '8px', resize: 'none', borderRadius: '4px', margin: '8px 0',
      display: 'block', boxSizing: 'border-box',
    });
    return ta;
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

  function makeStatus(id) {
    const s = document.createElement('div');
    s.id = id;
    Object.assign(s.style, { color: '#E8C840', fontSize: '12px', marginTop: '10px' });
    return s;
  }

  // Build steps as separate divs
  const steps = {};

  // ── Step: Menu ──
  steps.menu = document.createElement('div');
  steps.menu.appendChild(makeHeading('ONLINE MULTIPLAYER'));
  steps.menu.appendChild(makeText('Play with a friend on another machine.\nNo server needed \u2014 direct peer-to-peer connection.'));
  steps.menu.appendChild(makeBtn('HOST GAME', '#3066C8', () => mpStartHost(steps)));
  steps.menu.appendChild(makeBtn('JOIN GAME', '#3066C8', () => mpStartJoin(steps)));
  steps.menu.appendChild(document.createElement('br'));
  steps.menu.appendChild(makeBtn('BACK', '#C83030', closeMultiplayerMenu));

  // ── Step: Host Offer ──
  steps.hostOffer = document.createElement('div');
  steps.hostOffer.style.display = 'none';
  steps.hostOffer.appendChild(makeHeading('HOST \u2014 STEP 1 OF 2'));
  steps.hostOffer.appendChild(makeText('Send this code to your friend:'));
  steps.hostOffer.appendChild(makeTextarea('mp-offer-text', null, true));
  steps.hostOffer.appendChild(makeBtn('COPY CODE', '#3066C8', mpCopyOffer));
  steps.hostOffer.appendChild(makeText('Then paste their response code below:'));
  steps.hostOffer.appendChild(makeTextarea('mp-answer-input', 'Paste your friend\'s response code here...'));
  steps.hostOffer.appendChild(makeBtn('CONNECT', '#30A830', () => mpHostAcceptAnswer(steps)));
  steps.hostOffer.appendChild(document.createElement('br'));
  steps.hostOffer.appendChild(makeBtn('CANCEL', '#C83030', () => mpCancel(steps)));
  steps.hostOffer.appendChild(makeStatus('mp-status'));

  // ── Step: Join ──
  steps.join = document.createElement('div');
  steps.join.style.display = 'none';
  steps.join.appendChild(makeHeading('JOIN \u2014 STEP 1 OF 2'));
  steps.join.appendChild(makeText('Paste the host\'s code below:'));
  steps.join.appendChild(makeTextarea('mp-join-offer-input', 'Paste the host\'s code here...'));
  steps.join.appendChild(makeBtn('GENERATE RESPONSE', '#30A830', () => mpJoinCreateAnswer(steps)));
  steps.join.appendChild(document.createElement('br'));
  steps.join.appendChild(makeBtn('CANCEL', '#C83030', () => mpCancel(steps)));
  steps.join.appendChild(makeStatus('mp-status-join'));

  // ── Step: Join Answer ──
  steps.joinAnswer = document.createElement('div');
  steps.joinAnswer.style.display = 'none';
  steps.joinAnswer.appendChild(makeHeading('JOIN \u2014 STEP 2 OF 2'));
  steps.joinAnswer.appendChild(makeText('Send this response code back to the host:'));
  steps.joinAnswer.appendChild(makeTextarea('mp-answer-text', null, true));
  steps.joinAnswer.appendChild(makeBtn('COPY RESPONSE', '#3066C8', mpCopyAnswer));
  steps.joinAnswer.appendChild(makeText('Waiting for connection...'));
  steps.joinAnswer.appendChild(makeBtn('CANCEL', '#C83030', () => mpCancel(steps)));
  steps.joinAnswer.appendChild(makeStatus('mp-status-join2'));

  // ── Step: Connected ──
  steps.connected = document.createElement('div');
  steps.connected.style.display = 'none';
  steps.connected.appendChild(makeHeading('CONNECTED!'));
  steps.connected.appendChild(makeText('Peer-to-peer link established.\nStarting game...', '#88FF44'));

  // Add all steps to panel
  for (const step of Object.values(steps)) panel.appendChild(step);
  multiplayerUI.appendChild(panel);
  document.body.appendChild(multiplayerUI);

  // Store steps ref for switching
  multiplayerUI._steps = steps;
}

function closeMultiplayerMenu() {
  if (multiplayerUI) {
    multiplayerUI.remove();
    multiplayerUI = null;
  }
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

// ─── Compress/decompress SDP for shorter codes ──────────────
function compressSDP(sdp) {
  return btoa(JSON.stringify(sdp));
}

function decompressSDP(compressed) {
  return JSON.parse(atob(compressed));
}

// ─── Host Flow ───────────────────────────────────────────────
async function mpStartHost(steps) {
  isHost = true;
  connectionState = 'waiting';
  mpShowStep(steps, 'hostOffer');
  mpSetStatus('mp-status', 'Creating offer...');

  peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });

  dataChannel = peerConnection.createDataChannel('game', {
    ordered: true, maxRetransmits: 0,
  });
  setupDataChannel(dataChannel, steps);

  const candidates = [];
  peerConnection.onicecandidate = (e) => {
    if (e.candidate) candidates.push(e.candidate);
  };

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  // Wait for ICE gathering
  await new Promise(resolve => {
    if (peerConnection.iceGatheringState === 'complete') resolve();
    else peerConnection.onicegatheringstatechange = () => {
      if (peerConnection.iceGatheringState === 'complete') resolve();
    };
    setTimeout(resolve, 5000);
  });

  const offerData = { sdp: peerConnection.localDescription, candidates };
  document.getElementById('mp-offer-text').value = compressSDP(offerData);
  mpSetStatus('mp-status', 'Code ready. Send it to your friend!');
}

function mpCopyOffer() {
  const ta = document.getElementById('mp-offer-text');
  ta.select();
  navigator.clipboard.writeText(ta.value);
  mpSetStatus('mp-status', 'Copied to clipboard!');
}

async function mpHostAcceptAnswer(steps) {
  const answerText = document.getElementById('mp-answer-input').value.trim();
  if (!answerText) { mpSetStatus('mp-status', 'Paste the response code first!'); return; }

  try {
    mpSetStatus('mp-status', 'Connecting...');
    const answerData = decompressSDP(answerText);
    await peerConnection.setRemoteDescription(answerData.sdp);
    for (const c of answerData.candidates) {
      await peerConnection.addIceCandidate(c);
    }
  } catch (e) {
    mpSetStatus('mp-status', 'Invalid code. Try again.');
  }
}

// ─── Join Flow ───────────────────────────────────────────────
function mpStartJoin(steps) {
  isHost = false;
  connectionState = 'connecting';
  mpShowStep(steps, 'join');
}

async function mpJoinCreateAnswer(steps) {
  const offerText = document.getElementById('mp-join-offer-input').value.trim();
  if (!offerText) { mpSetStatus('mp-status-join', 'Paste the host code first!'); return; }

  try {
    mpSetStatus('mp-status-join', 'Processing...');
    const offerData = decompressSDP(offerText);

    peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peerConnection.ondatachannel = (e) => {
      dataChannel = e.channel;
      setupDataChannel(dataChannel, steps);
    };

    const candidates = [];
    peerConnection.onicecandidate = (e) => {
      if (e.candidate) candidates.push(e.candidate);
    };

    await peerConnection.setRemoteDescription(offerData.sdp);
    for (const c of offerData.candidates) {
      await peerConnection.addIceCandidate(c);
    }

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    await new Promise(resolve => {
      if (peerConnection.iceGatheringState === 'complete') resolve();
      else peerConnection.onicegatheringstatechange = () => {
        if (peerConnection.iceGatheringState === 'complete') resolve();
      };
      setTimeout(resolve, 5000);
    });

    const answerData = { sdp: peerConnection.localDescription, candidates };
    mpShowStep(steps, 'joinAnswer');
    document.getElementById('mp-answer-text').value = compressSDP(answerData);
    mpSetStatus('mp-status-join2', 'Send this code back to the host!');
  } catch (e) {
    mpSetStatus('mp-status-join', 'Invalid host code. Try again.');
  }
}

function mpCopyAnswer() {
  const ta = document.getElementById('mp-answer-text');
  ta.select();
  navigator.clipboard.writeText(ta.value);
  mpSetStatus('mp-status-join2', 'Copied to clipboard!');
}

function mpCancel(steps) {
  if (peerConnection) { peerConnection.close(); peerConnection = null; }
  dataChannel = null;
  isOnline = false;
  connectionState = 'disconnected';
  mpShowStep(steps, 'menu');
}

// ─── Data Channel ────────────────────────────────────────────
function setupDataChannel(channel, steps) {
  channel.onopen = () => {
    console.log('P2P DataChannel open!');
    connectionState = 'connected';
    isOnline = true;
    if (steps) mpShowStep(steps, 'connected');
    setTimeout(() => {
      closeMultiplayerMenu();
      if (gameState === STATE.TITLE || gameState === STATE.NARRATIVE) {
        gameState = STATE.GENERATING;
      }
    }, 1500);
  };

  channel.onclose = () => {
    console.log('P2P DataChannel closed');
    isOnline = false;
    connectionState = 'disconnected';
  };

  channel.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.type === 'input') {
        remoteKeys = msg.keys;
      }
    } catch (err) {}
  };
}

// ─── Send local input state ──────────────────────────────────
let mpSendTimer = 0;

function mpSendInput(dt) {
  if (!isOnline || !dataChannel || dataChannel.readyState !== 'open') return;

  mpSendTimer += dt;
  if (mpSendTimer < 0.016) return; // ~60fps
  mpSendTimer = 0;

  const localControls = isHost
    ? { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', shoot: 'Space' }
    : { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', shoot: 'Enter' };

  const inputState = {};
  for (const [action, code] of Object.entries(localControls)) {
    inputState[code] = !!keys[code];
  }

  try {
    dataChannel.send(JSON.stringify({ type: 'input', keys: inputState }));
  } catch (e) {}
}

function mpApplyRemoteInput() {
  if (!isOnline) return;
  for (const [code, pressed] of Object.entries(remoteKeys)) {
    keys[code] = pressed;
  }
}

// ─── Draw online status on title screen ──────────────────────
function drawOnlineButton() {
  if (isOnline) {
    ctx.fillStyle = '#30A830';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ONLINE: CONNECTED', W / 2, H / 2 + 160);
  }
}
