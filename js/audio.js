// ─── Audio (Web Audio API — procedural sounds) ──────────────
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Resume audio context on first user interaction (browser autoplay policy)
function resumeAudio() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
}
window.addEventListener('keydown', resumeAudio, { once: true });
window.addEventListener('click', resumeAudio, { once: true });

// Master volume
const masterGain = audioCtx.createGain();
masterGain.gain.value = 0.3;
masterGain.connect(audioCtx.destination);

// ─── Sound Effects ───────────────────────────────────────────

function playShoot() {
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(800, t);
  osc.frequency.exponentialRampToValueAtTime(200, t + 0.08);
  gain.gain.setValueAtTime(0.15, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(t);
  osc.stop(t + 0.08);
}

function playDirtBreak() {
  const t = audioCtx.currentTime;
  // Noise burst for crumbling dirt
  const bufferSize = audioCtx.sampleRate * 0.06;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.2, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1200;
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  noise.start(t);
}

function playHit() {
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(300, t);
  osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);
  gain.gain.setValueAtTime(0.2, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(t);
  osc.stop(t + 0.15);
}

function playDeath() {
  const t = audioCtx.currentTime;
  // Low rumble + descending tone
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(400, t);
  osc1.frequency.exponentialRampToValueAtTime(40, t + 0.6);
  osc2.type = 'square';
  osc2.frequency.setValueAtTime(200, t);
  osc2.frequency.exponentialRampToValueAtTime(20, t + 0.6);
  gain.gain.setValueAtTime(0.3, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(masterGain);
  osc1.start(t);
  osc2.start(t);
  osc1.stop(t + 0.6);
  osc2.stop(t + 0.6);

  // Noise burst
  const bufferSize = audioCtx.sampleRate * 0.4;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  const nGain = audioCtx.createGain();
  nGain.gain.setValueAtTime(0.15, t);
  nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  noise.connect(nGain);
  nGain.connect(masterGain);
  noise.start(t);
}

function playMoundClaim() {
  const t = audioCtx.currentTime;
  // Rising chime
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, t);
  osc.frequency.setValueAtTime(660, t + 0.1);
  osc.frequency.setValueAtTime(880, t + 0.2);
  gain.gain.setValueAtTime(0.15, t);
  gain.gain.setValueAtTime(0.15, t + 0.25);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(t);
  osc.stop(t + 0.35);
}

function playPowerUp() {
  const t = audioCtx.currentTime;
  // Sparkle sweep
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, t);
  osc.frequency.exponentialRampToValueAtTime(1200, t + 0.15);
  osc.frequency.exponentialRampToValueAtTime(800, t + 0.25);
  gain.gain.setValueAtTime(0.12, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(t);
  osc.stop(t + 0.25);
}

function playCountdownTick() {
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.15, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(t);
  osc.stop(t + 0.1);
}

function playRoundStart() {
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 1200;
  gain.gain.setValueAtTime(0.2, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(t);
  osc.stop(t + 0.2);
}

function playSoldierSpawn() {
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(300, t);
  osc.frequency.exponentialRampToValueAtTime(500, t + 0.1);
  gain.gain.setValueAtTime(0.1, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(t);
  osc.stop(t + 0.1);
}

function playMoundAppear() {
  const t = audioCtx.currentTime;
  // Mystical rising bubble — two detuned sines
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc1.type = 'sine';
  osc2.type = 'sine';
  osc1.frequency.setValueAtTime(350, t);
  osc1.frequency.exponentialRampToValueAtTime(700, t + 0.25);
  osc2.frequency.setValueAtTime(355, t);
  osc2.frequency.exponentialRampToValueAtTime(710, t + 0.25);
  gain.gain.setValueAtTime(0.1, t);
  gain.gain.setValueAtTime(0.1, t + 0.15);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(masterGain);
  osc1.start(t);
  osc2.start(t);
  osc1.stop(t + 0.3);
  osc2.stop(t + 0.3);
}

function playPowerUpAppear() {
  const t = audioCtx.currentTime;
  // Quick sparkle pop — short high note + tiny noise
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1400, t);
  osc.frequency.exponentialRampToValueAtTime(900, t + 0.12);
  gain.gain.setValueAtTime(0.1, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(t);
  osc.stop(t + 0.12);
  // Tiny pop noise
  const bufferSize = Math.floor(audioCtx.sampleRate * 0.015);
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  const nGain = audioCtx.createGain();
  nGain.gain.setValueAtTime(0.08, t);
  nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
  noise.connect(nGain);
  nGain.connect(masterGain);
  noise.start(t);
}

function playWalk() {
  const t = audioCtx.currentTime;
  // Tiny click — ant footsteps on dirt
  const bufferSize = Math.floor(audioCtx.sampleRate * 0.02);
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 2000;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.06, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  noise.start(t);
}

function playMatchWin() {
  const t = audioCtx.currentTime;
  // Victory fanfare — ascending notes
  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const start = t + i * 0.15;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.15, start + 0.05);
    gain.gain.setValueAtTime(0.15, start + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(start);
    osc.stop(start + 0.3);
  });
}

// ─── Background Music (procedural, looping) ──────────────────
const musicGain = audioCtx.createGain();
musicGain.gain.value = 0;
musicGain.connect(audioCtx.destination);

let musicPlaying = false;
let musicNodes = [];

function startMusic() {
  if (musicPlaying) return;
  musicPlaying = true;
  musicGain.gain.setValueAtTime(0, audioCtx.currentTime);
  musicGain.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 2);

  // ── Bass drone: two detuned saws through a lowpass ──
  const bass1 = audioCtx.createOscillator();
  const bass2 = audioCtx.createOscillator();
  const bassGain = audioCtx.createGain();
  const bassFilter = audioCtx.createBiquadFilter();
  bass1.type = 'sawtooth';
  bass2.type = 'sawtooth';
  bass1.frequency.value = 55; // A1
  bass2.frequency.value = 55.3; // slightly detuned
  bassGain.gain.value = 0.35;
  bassFilter.type = 'lowpass';
  bassFilter.frequency.value = 200;
  bassFilter.Q.value = 2;
  bass1.connect(bassFilter);
  bass2.connect(bassFilter);
  bassFilter.connect(bassGain);
  bassGain.connect(musicGain);
  bass1.start();
  bass2.start();
  musicNodes.push(bass1, bass2);

  // ── Rhythmic pulse: filtered square wave with LFO on gain ──
  const pulse = audioCtx.createOscillator();
  const pulseGain = audioCtx.createGain();
  const pulseLFO = audioCtx.createOscillator();
  const pulseLFOGain = audioCtx.createGain();
  const pulseFilter = audioCtx.createBiquadFilter();
  pulse.type = 'square';
  pulse.frequency.value = 110; // A2
  pulseFilter.type = 'bandpass';
  pulseFilter.frequency.value = 300;
  pulseFilter.Q.value = 3;
  pulseLFO.type = 'sine';
  pulseLFO.frequency.value = 2; // 2 Hz throb
  pulseLFOGain.gain.value = 0.12;
  pulseGain.gain.value = 0.08;
  pulseLFO.connect(pulseLFOGain);
  pulseLFOGain.connect(pulseGain.gain);
  pulse.connect(pulseFilter);
  pulseFilter.connect(pulseGain);
  pulseGain.connect(musicGain);
  pulse.start();
  pulseLFO.start();
  musicNodes.push(pulse, pulseLFO);

  // ── Ambient pad: soft chord with slow filter sweep ──
  const padNotes = [82.4, 110, 164.8]; // E2, A2, E3 (open fifth)
  const padGain = audioCtx.createGain();
  const padFilter = audioCtx.createBiquadFilter();
  padGain.gain.value = 0.06;
  padFilter.type = 'lowpass';
  padFilter.frequency.value = 400;
  padFilter.Q.value = 1;
  // Slow sweep on filter
  const padLFO = audioCtx.createOscillator();
  const padLFOGain = audioCtx.createGain();
  padLFO.type = 'sine';
  padLFO.frequency.value = 0.08; // very slow
  padLFOGain.gain.value = 300;
  padLFO.connect(padLFOGain);
  padLFOGain.connect(padFilter.frequency);
  padLFO.start();
  musicNodes.push(padLFO);

  for (const freq of padNotes) {
    const osc = audioCtx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    osc.connect(padFilter);
    osc.start();
    musicNodes.push(osc);
  }
  padFilter.connect(padGain);
  padGain.connect(musicGain);

  // ── Melody: sequenced notes on a timer ──
  scheduleMelody();
}

// Pentatonic minor scale notes for an eerie underground feel
const melodyNotes = [165, 196, 220, 262, 294, 330, 392, 440];
let melodyInterval = null;

function scheduleMelody() {
  let stepIndex = 0;
  melodyInterval = setInterval(() => {
    if (!musicPlaying) { clearInterval(melodyInterval); return; }
    const t = audioCtx.currentTime;

    // Play a note every ~0.8s, sometimes skip for rhythm
    if (Math.random() < 0.3) return;

    const note = melodyNotes[stepIndex % melodyNotes.length];
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    osc.type = Math.random() < 0.5 ? 'triangle' : 'sine';
    osc.frequency.value = note;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.6);
    gain.gain.setValueAtTime(0.07, t);
    gain.gain.setValueAtTime(0.07, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(musicGain);
    osc.start(t);
    osc.stop(t + 0.6);

    stepIndex++;
  }, 800);
}

function stopMusic() {
  if (!musicPlaying) return;
  musicPlaying = false;
  musicGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1);

  // Stop all persistent nodes after fade
  setTimeout(() => {
    for (const node of musicNodes) {
      try { node.stop(); } catch (e) {}
    }
    musicNodes = [];
  }, 1200);

  if (melodyInterval) {
    clearInterval(melodyInterval);
    melodyInterval = null;
  }
}
