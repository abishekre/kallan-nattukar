// Haptics & Audio Synthesizer Engine

const playTone = (freq, type, duration, vol = 0.1) => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(freq * 0.5, audioCtx.currentTime + duration);

    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // Ignore audio context errors (e.g. if blocked by browser policy before user interaction)
  }
};

export const SFX = {
  swoosh: () => playTone(150, 'sine', 0.2, 0.2), // Light transition sound
  tick: () => playTone(800, 'square', 0.05, 0.05), // Timer tick
  boom: () => playTone(50, 'sawtooth', 0.5, 0.4), // Heavy elimination drum
  win: () => {
    playTone(300, 'sine', 0.2, 0.2);
    setTimeout(() => playTone(400, 'sine', 0.4, 0.2), 200);
  },
  lose: () => playTone(100, 'sawtooth', 0.8, 0.3)
};

export const Haptics = {
  light: () => { if (navigator.vibrate) navigator.vibrate(10); },
  heavy: () => { if (navigator.vibrate) navigator.vibrate(200); },
  heartbeat: () => { if (navigator.vibrate) navigator.vibrate([50, 100, 50]); }
};
