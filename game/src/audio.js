// The Velvet Vault — every sound is a tiny WebAudio blip generated in code.
// No audio files, no network: oscillators and a noise buffer only.
let ctx = null;
let muted = false;

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function audioCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq, dur, type, vol, when = 0, slideTo = null) {
  if (muted) return;
  const ac = audioCtx();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise(dur, vol, lowpass = 1200) {
  if (muted) return;
  const ac = audioCtx();
  if (!ac) return;
  const len = Math.floor(ac.sampleRate * dur);
  const buffer = ac.createBuffer(1, len, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowpass;
  const gain = ac.createGain();
  gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start();
}

export const sfx = {
  coin() {
    tone(1568, 0.09, 'sine', 0.16);
    tone(2093, 0.14, 'sine', 0.14, 0.07);
  },
  pickup() {
    tone(880, 0.1, 'triangle', 0.18);
    tone(1318, 0.16, 'triangle', 0.16, 0.08);
  },
  crack() {
    tone(520, 0.08, 'square', 0.08);
    tone(660, 0.08, 'square', 0.08, 0.09);
    tone(880, 0.2, 'square', 0.1, 0.18);
  },
  vaultOpen() {
    tone(392, 0.18, 'triangle', 0.2);
    tone(523, 0.18, 'triangle', 0.2, 0.12);
    tone(659, 0.3, 'triangle', 0.2, 0.24);
  },
  alarm() {
    tone(740, 0.22, 'sawtooth', 0.1);
    tone(560, 0.22, 'sawtooth', 0.1, 0.24);
  },
  spotted() {
    tone(220, 0.4, 'sawtooth', 0.16, 0, 110);
    noise(0.35, 0.12, 900);
  },
  smoke() {
    noise(0.5, 0.18, 700);
  },
  dash() {
    noise(0.16, 0.1, 2400);
  },
  win() {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.28, 'triangle', 0.18, i * 0.13));
  },
  lose() {
    [392, 330, 262, 196].forEach((f, i) => tone(f, 0.3, 'triangle', 0.14, i * 0.15));
  },
  click() {
    tone(660, 0.05, 'sine', 0.1);
  },
};
