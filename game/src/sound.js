// Tiny WebAudio effects, synthesized in code — no sound files,
// no network. Created lazily on the first user gesture.
let ctx = null;
let muted = false;

export function setMuted(value) {
  muted = value;
}

export function isMuted() {
  return muted;
}

function audio() {
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tone(freq, dur, type, gain, when = 0) {
  if (muted) return;
  const ac = audio();
  if (!ac) return;
  try {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, ac.currentTime + when);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + when + dur);
    osc.connect(g).connect(ac.destination);
    osc.start(ac.currentTime + when);
    osc.stop(ac.currentTime + when + dur);
  } catch {
    // Sound is garnish; a failure never breaks the game.
  }
}

// Warm the AudioContext up on the first pointer gesture, so the
// first real sound never waits on the browser's autoplay policy.
export function primeAudio() {
  audio();
}

export function playSound(name) {
  if (name === 'select') tone(660, 0.07, 'sine', 0.08);
  else if (name === 'play') { tone(392, 0.09, 'triangle', 0.12); tone(523, 0.12, 'triangle', 0.1, 0.07); }
  else if (name === 'bolt') { tone(880, 0.1, 'sawtooth', 0.08); tone(220, 0.18, 'sawtooth', 0.1, 0.05); }
  else if (name === 'hit') tone(180, 0.1, 'square', 0.08);
  else if (name === 'draw') tone(520, 0.06, 'sine', 0.06);
  else if (name === 'win') { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.12, i * 0.12)); }
  else if (name === 'lose') { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.25, 'triangle', 0.1, i * 0.14)); }
  else if (name === 'turn') tone(440, 0.08, 'sine', 0.07);
}
