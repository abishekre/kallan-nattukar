import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, ShieldQuestion, CheckCircle2, Lock } from 'lucide-react';
import { useGame } from '../GameContext';
import { SFX, Haptics } from '../utils/engine';

const PassPhase = () => {
  const { assignedRoles, markPlayerRevealed, setGameState, pottanHint, activeCategory } = useGame();
  
  const [activePlayer, setActivePlayer] = useState(null); 
  const [isUnlocked, setIsUnlocked] = useState(false);
  
  const [isHolding, setIsHolding] = useState(false);
  const [showWord, setShowWord] = useState(false);
  const [hasRevealedOnce, setHasRevealedOnce] = useState(false);

  useEffect(() => {
    let timer;
    if (isHolding) {
      Haptics.light();
      timer = setTimeout(() => {
        setShowWord(true);
        setHasRevealedOnce(true);
        Haptics.success();
        // Removed SFX.boom() to prevent auditory tells.
      }, 500);
    } else {
      setShowWord(false);
    }
    return () => clearTimeout(timer);
  }, [isHolding]);

  const handleReveal = (player) => {
    Haptics.light();
    setActivePlayer(player);
    setIsUnlocked(false);
    setShowWord(false);
    setIsHolding(false);
    setHasRevealedOnce(false);
  };

  const handleHoldStart = (e) => {
    e.preventDefault();
    setIsHolding(true);
  };

  const handleHoldEnd = (e) => {
    e.preventDefault();
    setIsHolding(false);
  };

  const handleDone = () => {
    Haptics.light();
    SFX.swoosh();
    markPlayerRevealed(activePlayer.id);
    setActivePlayer(null);
  };

  const allRevealed = assignedRoles.every(p => p.revealed);

  if (activePlayer) {
    if (!isUnlocked) {
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center h-full w-full gap-8 absolute inset-0 bg-kerala-green z-20 p-8"
        >
          <Lock size={64} className="text-mural-gold mb-4" />
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">Are you really</h2>
            <h1 className="text-5xl font-display font-black text-white">{activePlayer.name}?</h1>
            <p className="text-sm font-bold text-mural-gold mt-2">Sathyam para!</p>
          </div>
          <p className="text-coconut/50 text-center text-sm px-4">
            If you are not {activePlayer.name}, hand the phone over. Kallatharam padilla!
          </p>
          <button 
            onClick={() => { Haptics.light(); setIsUnlocked(true); }}
            className="btn-primary w-full mt-8 py-4 shadow-[0_0_30px_rgba(244,162,97,0.3)]"
          >
            YES, I AM {activePlayer.name.toUpperCase()}
          </button>
          <button 
            onClick={() => { Haptics.light(); setActivePlayer(null); }}
            className="text-coconut/50 font-bold mt-4 p-2 active:scale-95 transition-transform"
          >
            Cancel
          </button>
        </motion.div>
      );
    }

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center h-full w-full absolute inset-0 bg-kerala-green z-20 p-8"
      >
        <div className="text-center mt-12 shrink-0">
          <h2 className="text-4xl font-display font-bold">{activePlayer.name}</h2>
          <p className="text-coconut/50 mt-1 text-sm">Make sure no one else is looking. <br/> <span className="italic">Nokanda unni, ithu njan alla!</span></p>
        </div>

        <div 
          className="glass-panel w-full flex-1 my-8 flex flex-col items-center relative overflow-hidden select-none touch-none cursor-pointer"
          onPointerDown={handleHoldStart}
          onPointerUp={handleHoldEnd}
          onPointerLeave={handleHoldEnd}
          onPointerCancel={handleHoldEnd}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Top/Center: Word Reveal Area */}
          <div className="flex-1 w-full flex items-center justify-center p-4 relative z-10 pt-12">
            <AnimatePresence>
              {showWord ? (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.85, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                  transition={{ type: 'spring', damping: 14, stiffness: 220 }}
                  className="flex flex-col items-center gap-4 w-full"
                >
                  {activePlayer.role === 'Pottan' ? (
                    <>
                      <ShieldQuestion size={48} className="text-theyyam-red z-10" />
                      <div className="text-center z-10">
                        <h3 className="text-3xl font-display font-bold text-theyyam-red mb-2 drop-shadow-[0_0_10px_rgba(230,57,70,0.5)]">POTTAN</h3>
                        {pottanHint === 'category' ? (
                          <div className="bg-white/10 p-3 rounded-lg border border-theyyam-red/30 backdrop-blur-md">
                            <p className="text-xs text-coconut/50 uppercase tracking-widest mb-1">Category Hint</p>
                            <p className="text-mural-gold font-bold">{activeCategory}</p>
                          </div>
                        ) : (
                          <p className="text-sm opacity-80 px-2 text-theyyam-red font-bold">You are completely blind.</p>
                        )}
                        <p className="text-xs opacity-50 px-2 mt-2">Fake it till you make it!</p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center w-full z-10">
                      <p className="text-coconut/50 text-xs uppercase tracking-wider mb-2">Category: <span className="text-mural-gold font-bold">{activeCategory}</span></p>
                      <h3 className={`text-4xl md:text-5xl font-display font-black leading-tight px-2 break-words max-w-full ${activePlayer.role === 'Kallan' ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'text-white'}`}>
                        {activePlayer.word}
                      </h3>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center opacity-30 pointer-events-none"
                >
                  <Lock size={32} className="mx-auto mb-2 text-coconut" />
                  <p className="text-xs uppercase tracking-widest font-bold">Hidden</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom: Fingerprint Scanner */}
          <div className="shrink-0 mb-12 relative flex flex-col items-center z-10">
            <div className="relative">
              <svg className="absolute inset-0 w-24 h-24 -m-4 -rotate-90 pointer-events-none">
                <circle cx="48" cy="48" r="44" stroke="rgba(255,255,255,0.1)" strokeWidth="4" fill="none" />
                <motion.circle 
                  cx="48" cy="48" r="44" stroke="#F4A261" strokeWidth="4" fill="none" 
                  strokeDasharray="276"
                  animate={{ strokeDashoffset: isHolding ? 0 : 276 }}
                  transition={{ duration: isHolding ? 0.5 : 0.2, ease: "linear" }}
                />
              </svg>
              <Fingerprint size={64} className={`transition-[color,transform] duration-300 ${isHolding ? 'text-mural-gold scale-110 drop-shadow-[0_0_10px_rgba(244,162,97,0.5)]' : 'text-coconut/50'}`} />
            </div>
            <motion.p 
              animate={{ opacity: isHolding ? 0 : 1 }} 
              className="text-center font-bold text-mural-gold mt-6 uppercase tracking-widest text-sm"
            >
              Hold to reveal <br/><span className="text-[10px] opacity-70 normal-case">(Pathukke...)</span>
            </motion.p>
          </div>
        </div>

        <button 
          onClick={handleDone}
          disabled={!hasRevealedOnce}
          className="btn-primary w-full shrink-0 mb-8 shadow-[0_0_20px_rgba(244,162,97,0.2)] disabled:opacity-50"
        >
          Done
        </button>

      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6 w-full h-full py-8 relative"
    >
      <div className="text-center mb-4 shrink-0">
        <h2 className="text-3xl font-display font-bold text-mural-gold">Pass & Reveal</h2>
        <p className="text-coconut/70 text-sm mt-2">Pass the phone around. Aarkum kodukkathe irikkalle!</p>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto flex-1 pb-24 pr-2">
        {assignedRoles.map((player, idx) => (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            key={player.id}
            onClick={() => handleReveal(player)}
            disabled={player.revealed}
            className={`glass-panel p-4 flex items-center justify-between transition-all ${
              player.revealed ? 'opacity-50 grayscale' : 'active:scale-95'
            }`}
          >
            <span className="text-xl font-bold">{player.name}</span>
            {player.revealed ? (
              <CheckCircle2 className="text-green-400" />
            ) : (
              <span className="text-mural-gold text-sm uppercase tracking-wider font-bold">Tap to view</span>
            )}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {allRevealed && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-8 left-0 right-0 px-8 w-full mx-auto"
          >
            <button 
              onClick={() => { Haptics.light(); SFX.swoosh(); setGameState('discuss'); }}
              className="btn-primary w-full flex items-center justify-center gap-2 text-xl py-5 shadow-[0_0_30px_rgba(244,162,97,0.3)]"
            >
              BEGIN DISCUSSION
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PassPhase;
