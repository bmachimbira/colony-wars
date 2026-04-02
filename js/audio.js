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

// ─── Voice Announcements (Web Speech API) ────────────────────
const VOICE_ENABLED = 'speechSynthesis' in window;
let voiceQueue = [];
let voiceSpeaking = false;

function announce(text) {
  if (!VOICE_ENABLED) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1.3;
  utter.pitch = 0.8;
  utter.volume = 0.7;
  // Try to use a deep/dramatic voice
  const voices = speechSynthesis.getVoices();
  const preferred = voices.find(v => v.name.includes('Daniel') || v.name.includes('Alex') || v.name.includes('Google UK English Male'));
  if (preferred) utter.voice = preferred;
  utter.onend = () => { voiceSpeaking = false; processVoiceQueue(); };
  voiceQueue.push(utter);
  processVoiceQueue();
}

function processVoiceQueue() {
  if (voiceSpeaking || voiceQueue.length === 0) return;
  // Only keep the latest announcement to avoid queue buildup
  const utter = voiceQueue.pop();
  voiceQueue = [];
  voiceSpeaking = true;
  speechSynthesis.speak(utter);
}

const POWER_UP_NAMES = {
  SUGAR: 'Sugar Rush!',
  RAPID: 'Rapid Fire!',
  SHIELD: 'Shield Up!',
  MEGA: 'Mega Acid!',
};

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

  // Massive impact slam
  const bufferSize = Math.floor(audioCtx.sampleRate * 0.4);
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.2);
  }
  const slam = audioCtx.createBufferSource();
  slam.buffer = buffer;
  const slamGain = audioCtx.createGain();
  slamGain.gain.setValueAtTime(0.6, t);
  slamGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  const slamFilter = audioCtx.createBiquadFilter();
  slamFilter.type = 'lowpass';
  slamFilter.frequency.value = 400;
  slam.connect(slamFilter);
  slamFilter.connect(slamGain);
  slamGain.connect(masterGain);
  slam.start(t);

  // Deep sub bass boom
  const sub = audioCtx.createOscillator();
  const subGain = audioCtx.createGain();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(50, t);
  sub.frequency.exponentialRampToValueAtTime(25, t + 0.8);
  subGain.gain.setValueAtTime(0.5, t);
  subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
  sub.connect(subGain);
  subGain.connect(masterGain);
  sub.start(t);
  sub.stop(t + 0.8);

  // Slow rising power chord — heavy and sustained
  const fightNotes = [110, 165, 220, 330];
  fightNotes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = i < 2 ? 'sawtooth' : 'square';
    osc.frequency.setValueAtTime(freq * 0.6, t);
    osc.frequency.exponentialRampToValueAtTime(freq, t + 0.3);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.setValueAtTime(0.2, t + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1500, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 1.2);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    osc.start(t);
    osc.stop(t + 1.2);
  });

  // Voice announcement: "FIGHT!" — slow, deep, dramatic
  if (VOICE_ENABLED) {
    const utter = new SpeechSynthesisUtterance('FIGHT!');
    utter.rate = 0.4;
    utter.pitch = 0.3;
    utter.volume = 1.0;
    const voices = speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.includes('Daniel') || v.name.includes('Alex') || v.name.includes('Google UK English Male'));
    if (preferred) utter.voice = preferred;
    speechSynthesis.speak(utter);
  }
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
  // Silent — mounds appear too frequently for a sound
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

function playAnteaterRoar() {
  const t = audioCtx.currentTime;
  // Deep growl — low sawtooth with noise
  const osc = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  osc.type = 'sawtooth';
  osc2.type = 'sawtooth';
  osc.frequency.setValueAtTime(60, t);
  osc.frequency.exponentialRampToValueAtTime(35, t + 0.8);
  osc2.frequency.setValueAtTime(63, t);
  osc2.frequency.exponentialRampToValueAtTime(37, t + 0.8);
  filter.type = 'lowpass';
  filter.frequency.value = 300;
  filter.Q.value = 3;
  gain.gain.setValueAtTime(0.3, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
  osc.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  osc.start(t);
  osc2.start(t);
  osc.stop(t + 0.8);
  osc2.stop(t + 0.8);
  // Noise layer
  const bufSize = Math.floor(audioCtx.sampleRate * 0.5);
  const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
  const noise = audioCtx.createBufferSource();
  noise.buffer = buf;
  const nGain = audioCtx.createGain();
  const nFilter = audioCtx.createBiquadFilter();
  nFilter.type = 'lowpass';
  nFilter.frequency.value = 200;
  nGain.gain.setValueAtTime(0.15, t);
  nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
  noise.connect(nFilter);
  nFilter.connect(nGain);
  nGain.connect(masterGain);
  noise.start(t);
}

function playAnteaterTongue() {
  const t = audioCtx.currentTime;
  // Quick whip sound
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, t);
  osc.frequency.exponentialRampToValueAtTime(1200, t + 0.08);
  osc.frequency.exponentialRampToValueAtTime(400, t + 0.15);
  gain.gain.setValueAtTime(0.15, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(t);
  osc.stop(t + 0.15);
}

function playAnteaterDeath() {
  const t = audioCtx.currentTime;
  // Descending wail + explosion
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(300, t);
  osc.frequency.exponentialRampToValueAtTime(30, t + 1);
  gain.gain.setValueAtTime(0.25, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 1);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(t);
  osc.stop(t + 1);
  // Big noise burst
  const bufSize = Math.floor(audioCtx.sampleRate * 0.6);
  const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 2);
  const noise = audioCtx.createBufferSource();
  noise.buffer = buf;
  const nGain = audioCtx.createGain();
  nGain.gain.setValueAtTime(0.2, t);
  nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
  noise.connect(nGain);
  nGain.connect(masterGain);
  noise.start(t);
}

// ─── Character Select Music (Mortal Kombat style) ────────────
let csMusic = false;
let csNodes = [];
let csIntervals = [];

function startCharSelectMusic() {
  if (csMusic) return;
  csMusic = true;
  const t = audioCtx.currentTime;

  const csGain = audioCtx.createGain();
  csGain.gain.setValueAtTime(0, t);
  csGain.gain.linearRampToValueAtTime(0.25, t + 1);
  csGain.connect(audioCtx.destination);

  // Dark pad — minor chord (Am: A2, C3, E3) with detuned square waves
  const padNotes = [110, 130.8, 164.8];
  const padGain = audioCtx.createGain();
  const padFilter = audioCtx.createBiquadFilter();
  padGain.gain.value = 0.12;
  padFilter.type = 'lowpass';
  padFilter.frequency.value = 500;
  padFilter.Q.value = 2;
  for (const freq of padNotes) {
    const osc = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    osc.type = 'square';
    osc2.type = 'square';
    osc.frequency.value = freq;
    osc2.frequency.value = freq * 1.005;
    osc.connect(padFilter);
    osc2.connect(padFilter);
    osc.start();
    osc2.start();
    csNodes.push(osc, osc2);
  }
  padFilter.connect(padGain);
  padGain.connect(csGain);

  // Heavy kick drum + hi-hat loop at ~140 BPM
  const bpm = 140;
  const beatMs = (60 / bpm) * 1000;
  let beatCount = 0;

  const drumLoop = setInterval(() => {
    if (!csMusic) return;
    const now = audioCtx.currentTime;

    // Kick on every beat
    const kick = audioCtx.createOscillator();
    const kickGain = audioCtx.createGain();
    kick.type = 'sine';
    kick.frequency.setValueAtTime(120, now);
    kick.frequency.exponentialRampToValueAtTime(30, now + 0.15);
    kickGain.gain.setValueAtTime(0.5, now);
    kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    kick.connect(kickGain);
    kickGain.connect(csGain);
    kick.start(now);
    kick.stop(now + 0.15);

    // Kick noise layer
    const kBuf = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * 0.05), audioCtx.sampleRate);
    const kData = kBuf.getChannelData(0);
    for (let i = 0; i < kData.length; i++) kData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / kData.length, 3);
    const kNoise = audioCtx.createBufferSource();
    kNoise.buffer = kBuf;
    const kNGain = audioCtx.createGain();
    const kFilter = audioCtx.createBiquadFilter();
    kFilter.type = 'lowpass'; kFilter.frequency.value = 200;
    kNGain.gain.setValueAtTime(0.3, now);
    kNGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    kNoise.connect(kFilter);
    kFilter.connect(kNGain);
    kNGain.connect(csGain);
    kNoise.start(now);

    // Hi-hat on offbeats
    if (beatCount % 2 === 1) {
      const hBuf = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * 0.03), audioCtx.sampleRate);
      const hData = hBuf.getChannelData(0);
      for (let i = 0; i < hData.length; i++) hData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / hData.length, 4);
      const hat = audioCtx.createBufferSource();
      hat.buffer = hBuf;
      const hatGain = audioCtx.createGain();
      const hatFilter = audioCtx.createBiquadFilter();
      hatFilter.type = 'highpass'; hatFilter.frequency.value = 6000;
      hatGain.gain.setValueAtTime(0.2, now);
      hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      hat.connect(hatFilter);
      hatFilter.connect(hatGain);
      hatGain.connect(csGain);
      hat.start(now);
    }

    // Bass synth riff — every 4 beats play a note
    if (beatCount % 4 === 0) {
      const bassNotes = [55, 55, 65.4, 55]; // A1, A1, C2, A1
      const bNote = bassNotes[Math.floor(beatCount / 4) % bassNotes.length];
      const bass = audioCtx.createOscillator();
      const bassGain = audioCtx.createGain();
      const bassFilter = audioCtx.createBiquadFilter();
      bass.type = 'sawtooth';
      bass.frequency.value = bNote;
      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(800, now);
      bassFilter.frequency.exponentialRampToValueAtTime(150, now + 0.3);
      bassGain.gain.setValueAtTime(0.2, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      bass.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(csGain);
      bass.start(now);
      bass.stop(now + 0.35);
    }

    beatCount++;
  }, beatMs / 2); // 8th notes

  csIntervals.push(drumLoop);
  csNodes.push({ stop: () => { csGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5); } });
}

function stopCharSelectMusic() {
  if (!csMusic) return;
  csMusic = false;
  for (const id of csIntervals) clearInterval(id);
  csIntervals = [];
  for (const node of csNodes) {
    try { node.stop(); } catch (e) {}
  }
  csNodes = [];
}

// ─── Background Music (MP3-based, looping) ──────────────────
const bgMusic = new Audio('assets/music.mp3');
bgMusic.loop = true;
bgMusic.volume = 0;
let musicPlaying = false;

function startMusic() {
  if (musicPlaying) return;
  musicPlaying = true;
  bgMusic.currentTime = 0;
  bgMusic.volume = 0;
  bgMusic.play().catch(() => {});
  // Fade in
  let vol = 0;
  const fadeIn = setInterval(() => {
    vol += 0.01;
    if (vol >= 0.35) { vol = 0.35; clearInterval(fadeIn); }
    bgMusic.volume = vol;
  }, 50);
}

function stopMusic() {
  if (!musicPlaying) return;
  musicPlaying = false;
  // Fade out
  const fadeOut = setInterval(() => {
    bgMusic.volume = Math.max(0, bgMusic.volume - 0.02);
    if (bgMusic.volume <= 0) {
      clearInterval(fadeOut);
      bgMusic.pause();
    }
  }, 50);
}
