// crypto.randomUUID() is only exposed in secure contexts (HTTPS or localhost),
// so it's undefined when the dev server is opened over a LAN IP (e.g. for
// testing on a phone). Fall back to getRandomValues (works in any context),
// then to Math.random as a last resort.
export const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
    return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const isAudioEnabled = () => {
  const val = window.localStorage.getItem('kn_enableAudio');
  if (val === null) return true;
  try {
    return JSON.parse(val) === true;
  } catch {
    return val !== 'false';
  }
};

export const Haptics = {
  light: () => {
    if (!isAudioEnabled()) return;
    if (navigator.vibrate) navigator.vibrate(10);
  },
  heavy: () => {
    if (!isAudioEnabled()) return;
    if (navigator.vibrate) navigator.vibrate(40);
  },
  heartbeat: () => {
    if (!isAudioEnabled()) return;
    if (navigator.vibrate) navigator.vibrate([20, 100, 40]);
  },
  success: () => {
    if (!isAudioEnabled()) return;
    if (navigator.vibrate) navigator.vibrate([15, 100, 30]);
  }
};

let audioCtx = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

let droneOsc = null;
let droneGain = null;
let droneInterval = null;

export const SFX = {
  swoosh: () => {
    if (!isAudioEnabled()) return;
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  },
  
  boom: () => {
    if (!isAudioEnabled()) return;
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  },

  win: () => {
    if (!isAudioEnabled()) return;
    initAudio();
    
    // Simple arpeggio
    const freqs = [440, 554.37, 659.25, 880];
    freqs.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0, audioCtx.currentTime + (i * 0.1));
      gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + (i * 0.1) + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + (i * 0.1) + 0.3);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start(audioCtx.currentTime + (i * 0.1));
      osc.stop(audioCtx.currentTime + (i * 0.1) + 0.3);
    });
  },

  lose: () => {
    if (!isAudioEnabled()) return;
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(50, audioCtx.currentTime + 0.8);

    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.8);
  },

  // Rising 5-note fanfare for ranking up.
  levelup: () => {
    if (!isAudioEnabled()) return;
    initAudio();
    const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    freqs.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const t = audioCtx.currentTime + i * 0.09;
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.35);
    });
  },

  // Short bright two-note chime for unlocking a badge.
  unlock: () => {
    if (!isAudioEnabled()) return;
    initAudio();
    [880, 1174.66].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const t = audioCtx.currentTime + i * 0.08;
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  },

  // Soft tick for countdown / XP counting.
  tick: () => {
    if (!isAudioEnabled()) return;
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.06);
  },

  drone: {
    // Single shared beat closure — reused by start() and setSpeed() so the
    // envelope stays consistent and there's only one place to maintain it.
    _beat: () => {
      if (!droneGain || !audioCtx) return;
      droneGain.gain.setValueAtTime(0, audioCtx.currentTime);
      droneGain.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 0.1);
      droneGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    },
    start: (fast = false) => {
      if (!isAudioEnabled()) return;
      if (droneOsc) return;
      initAudio();

      droneOsc = audioCtx.createOscillator();
      droneGain = audioCtx.createGain();

      droneOsc.type = 'sine';
      droneOsc.frequency.setValueAtTime(45, audioCtx.currentTime);

      droneGain.gain.setValueAtTime(0, audioCtx.currentTime);

      droneOsc.connect(droneGain);
      droneGain.connect(audioCtx.destination);

      droneOsc.start();

      SFX.drone._beat();
      droneInterval = setInterval(SFX.drone._beat, fast ? 500 : 1000);
    },
    setSpeed: (fast) => {
      if (!droneInterval) return;
      clearInterval(droneInterval);
      droneInterval = setInterval(SFX.drone._beat, fast ? 500 : 1000);
    },
    stop: () => {
      if (droneInterval) clearInterval(droneInterval);
      if (droneGain && audioCtx) {
        try {
          droneGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
        } catch {
          droneGain.gain.value = 0;
        }
      }
      if (droneOsc && audioCtx) {
        try {
          droneOsc.stop(audioCtx.currentTime + 0.5);
        } catch { /* already stopped */ }
      }
      droneOsc = null;
      droneGain = null;
      droneInterval = null;
    }
  }
};
