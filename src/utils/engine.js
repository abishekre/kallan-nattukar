const isAudioEnabled = () => {
  const val = window.localStorage.getItem('kn_enableAudio');
  if (val === null) return true;
  try {
    return JSON.parse(val) === true;
  } catch (e) {
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

  drone: {
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
      
      const beat = () => {
        if (!droneGain) return;
        droneGain.gain.setValueAtTime(0, audioCtx.currentTime);
        droneGain.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 0.1);
        droneGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      };
      
      beat();
      droneInterval = setInterval(beat, fast ? 500 : 1000);
    },
    setSpeed: (fast) => {
      if (!droneInterval) return;
      clearInterval(droneInterval);
      droneInterval = setInterval(() => {
        if (!droneGain) return;
        droneGain.gain.setValueAtTime(0, audioCtx.currentTime);
        droneGain.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 0.1);
        droneGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      }, fast ? 500 : 1000);
    },
    stop: () => {
      if (droneInterval) clearInterval(droneInterval);
      if (droneGain && audioCtx) {
        try {
          droneGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
        } catch (e) {
          droneGain.gain.value = 0;
        }
      }
      if (droneOsc && audioCtx) {
        try {
          droneOsc.stop(audioCtx.currentTime + 0.5);
        } catch (e) {}
      }
      droneOsc = null;
      droneGain = null;
      droneInterval = null;
    }
  }
};
