import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, AlertTriangle, Clock, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useGame } from '../GameContext';
import { SFX, Haptics } from '../utils/engine';

const chalis = [
  "Who is sweating like they just ran for a KSRTC bus?",
  "Ellam mayajalam... (It's all an illusion...)",
  "Remember, even Ramanan was betrayed.",
  "Kallan kapali! Who is acting suspiciously quiet?",
  "Oru minit, oru minit... let's think about this logically.",
  "Is someone playing a double game like CID Moosa?"
];

const DiscussPhase = () => {
  const { setGameState, enablePottan, timerDuration } = useGame();
  
  const [timeLeft, setTimeLeft] = useState(timerDuration);
  const [showHelp, setShowHelp] = useState(false);
  const [canVote, setCanVote] = useState(false);
  const endTimeRef = useRef(null);

  const [chaliIndex, setChaliIndex] = useState(0);

  useEffect(() => {
    const chaliTimer = setInterval(() => {
      setChaliIndex(prev => (prev + 1) % chalis.length);
    }, 6000);
    return () => clearInterval(chaliTimer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCanVote(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Only start drone if we have a timer, otherwise just ambient
    if (timerDuration > 0) {
      SFX.drone.start(false);
    }
    
    return () => {
      SFX.drone.stop();
    };
  }, [timerDuration]);

  useEffect(() => {
    if (timerDuration === 0) return;
    
    if (!endTimeRef.current) {
      endTimeRef.current = Date.now() + timerDuration * 1000;
    }

    const timerId = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
      setTimeLeft(remaining);
      
      if (remaining <= 0) clearInterval(timerId);
    }, 1000);

    return () => clearInterval(timerId);
  }, [timerDuration]);

  const isDanger = timeLeft > 0 && timeLeft <= 30;

  useEffect(() => {
    if (timerDuration > 0) {
      if (timeLeft === 30) {
        Haptics.heavy();
        SFX.drone.setSpeed(true);
      }
      if (timeLeft === 0) {
        SFX.drone.stop();
        Haptics.heartbeat();
      }
    }
  }, [timeLeft, timerDuration]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercentage = timerDuration > 0 ? (timeLeft / timerDuration) * 100 : 100;

  const [holdProgress, setHoldProgress] = useState(0);
  const holdIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (holdProgress >= 100) {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
      SFX.drone.stop();
      setGameState('voting');
    }
  }, [holdProgress, setGameState]);

  const startHold = () => {
    if (!canVote) return;
    Haptics.light();
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    holdIntervalRef.current = setInterval(() => {
      setHoldProgress(prev => {
        if (prev >= 100) return 100;
        return prev + 5; // 20 frames * 50ms = 1 second hold
      });
    }, 50);
  };

  const endHold = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
    }
    if (holdProgress < 100) {
      setHoldProgress(0);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center h-full w-full gap-6 py-8 relative"
    >
      <AnimatePresence>
        {isDanger && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.2, 0.6, 0.2] }}
            exit={{ opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="absolute inset-0 pointer-events-none z-0"
            style={{ boxShadow: 'inset 0 0 150px rgba(230,57,70, 0.8)' }}
          />
        )}
      </AnimatePresence>

      <div className="text-center w-full relative z-10">
        <motion.div 
          animate={timerDuration === 0 ? { 
            boxShadow: ['0 0 0px rgba(244,162,97,0)', '0 0 40px rgba(244,162,97,0.3)', '0 0 0px rgba(244,162,97,0)'],
            scale: [1, 1.05, 1]
          } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="inline-block rounded-full p-2"
        >
          <MessageCircle size={48} className="text-mural-gold mx-auto mb-2" />
        </motion.div>
        <h2 className="text-4xl font-display font-bold text-mural-gold mb-1">Discussion</h2>
        <p className="text-coconut/80 mb-4">Time to find the Kallan!</p>

        {timerDuration > 0 && (
          <div className="bg-black/40 rounded-2xl p-6 w-full mb-4 border border-white/5 shadow-inner relative overflow-hidden backdrop-blur-md">
            <div className="flex justify-between items-center mb-4 relative z-10">
              <span className="flex items-center gap-2 text-sm text-coconut/70">
                <Clock size={16} /> Time Remaining
              </span>
              <span className={`font-mono text-2xl font-bold ${isDanger ? 'text-theyyam-red animate-pulse drop-shadow-[0_0_10px_rgba(230,57,70,0.8)]' : 'text-mural-gold'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            
            <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden relative z-10">
              <motion.div 
                className={`h-full ${isDanger ? 'bg-theyyam-red' : 'bg-mural-gold'}`}
                initial={{ width: '100%' }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, ease: 'linear' }}
              />
            </div>
            
            
            {timeLeft === 0 ? (
              <p className="text-theyyam-red font-bold text-sm mt-4 animate-bounce relative z-10">TIME IS UP! VOTE NOW!</p>
            ) : (
              <div className="mt-4 min-h-[40px] flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.p 
                    key={chaliIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                    className="text-coconut/60 text-xs italic font-medium relative z-10 text-center"
                  >
                    "{chalis[chaliIndex]}"
                  </motion.p>
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="w-full flex-1 flex flex-col overflow-y-auto">
        <button 
          onClick={() => { Haptics.light(); setShowHelp(!showHelp); }}
          className="bg-black/30 border border-white/10 rounded-xl p-4 flex justify-between items-center w-full transition-all active:scale-95 shadow-sm"
        >
          <span className="font-bold text-mural-gold flex items-center gap-2 text-sm uppercase tracking-widest"><HelpCircle size={18} /> How to Discuss</span>
          {showHelp ? <ChevronUp size={20} className="text-coconut/50" /> : <ChevronDown size={20} className="text-coconut/50" />}
        </button>

        <AnimatePresence>
          {showHelp && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }} 
              className="overflow-hidden"
            >
              <div className="glass-panel p-6 mt-4 flex flex-col gap-6">
                <div>
                  <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <span className="bg-mural-gold text-kerala-green w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                    Say your word
                  </h3>
                  <p className="text-sm text-coconut/70">Go around the circle. Everyone says ONE word related to their secret word. (Don't say the exact word!)</p>
                </div>
                
                <div>
                  <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <span className="bg-mural-gold text-kerala-green w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                    Discuss & Argue
                  </h3>
                  <p className="text-sm text-coconut/70">Who sounded suspicious? Who gave a generic word? The Kallan is trying to blend in!</p>
                </div>

                {enablePottan && (
                  <div className="bg-theyyam-red/20 border border-theyyam-red/50 rounded-xl p-4 mt-2 shadow-[0_0_15px_rgba(230,57,70,0.1)]">
                    <h3 className="font-bold text-theyyam-red mb-1 flex items-center gap-2">
                      <AlertTriangle size={18} /> Watch out for Pottan!
                    </h3>
                    <p className="text-xs text-coconut/80">The Pottan is in play! They have no word and are completely guessing.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div 
        className="w-full mt-2 relative select-none"
        onPointerDown={startHold}
        onPointerUp={endHold}
        onPointerLeave={endHold}
        onContextMenu={(e) => e.preventDefault()}
      >
        <button 
          disabled={!canVote}
          className="btn-danger w-full text-lg shadow-[0_0_30px_rgba(230,57,70,0.3)] shrink-0 disabled:opacity-50 relative overflow-hidden"
        >
          <span className="relative z-10 mix-blend-difference">{canVote ? (holdProgress > 0 ? "HOLDING..." : "HOLD TO VOTE") : "DISCUSS..."}</span>
          <motion.div 
            className="absolute top-0 left-0 bottom-0 bg-white"
            style={{ width: `${holdProgress}%` }}
          />
        </button>
      </div>
      <p className="text-center text-xs text-coconut/50 mt-2 font-medium">Pass the phone to the Mooppan to vote</p>
    </motion.div>
  );
};

export default DiscussPhase;
