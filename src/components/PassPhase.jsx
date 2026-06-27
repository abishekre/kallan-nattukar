import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, ShieldQuestion, CheckCircle2, Lock, List } from 'lucide-react';
import { useGame } from '../GameContext';
import { WORD_BANK } from '../utils/gameLogic';

const PassPhase = () => {
  const { assignedRoles, markPlayerRevealed, setGameState, pottanCheatSheet, activeCategory } = useGame();
  const [activePlayer, setActivePlayer] = useState(null); 
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showWord, setShowWord] = useState(false);
  const [showCheatSheet, setShowCheatSheet] = useState(false);

  const handleReveal = (player) => {
    setActivePlayer(player);
    setIsUnlocked(false);
    setShowWord(false);
    setShowCheatSheet(false);
  };

  const handleHoldStart = () => {
    setShowWord(true);
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const handleHoldEnd = () => {
    setShowWord(false);
  };

  const handleDone = () => {
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
          </div>
          <p className="text-coconut/50 text-center text-sm px-4">
            If you are not {activePlayer.name}, hand the phone to them immediately.
          </p>
          <button 
            onClick={() => setIsUnlocked(true)}
            className="btn-primary w-full mt-8 py-4 shadow-[0_0_30px_rgba(244,162,97,0.3)]"
          >
            YES, I AM {activePlayer.name.toUpperCase()}
          </button>
          <button 
            onClick={() => setActivePlayer(null)}
            className="text-coconut/50 font-bold mt-4 p-2 active:scale-95"
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
        className="flex flex-col items-center justify-center h-full w-full gap-8 absolute inset-0 bg-kerala-green z-20 p-8"
      >
        <div className="text-center mt-12">
          <h2 className="text-4xl font-display font-bold">{activePlayer.name}</h2>
          <p className="text-mural-gold mt-1 text-sm tracking-widest">{activeCategory} Category</p>
        </div>

        <div 
          className="glass-panel w-full aspect-square flex flex-col items-center justify-center p-8 relative overflow-hidden select-none touch-none"
          onPointerDown={handleHoldStart}
          onPointerUp={handleHoldEnd}
          onPointerLeave={handleHoldEnd}
          onContextMenu={(e) => e.preventDefault()}
        >
          <AnimatePresence mode="wait">
            {!showWord ? (
              <motion.div 
                key="hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4"
              >
                <Eye size={48} className="text-mural-gold animate-pulse" />
                <p className="text-center font-medium">Tap and hold<br/>to reveal your word</p>
              </motion.div>
            ) : (
              <motion.div 
                key="revealed"
                initial={{ opacity: 0, scale: 0.5, rotateY: -90 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.5, rotateY: 90 }}
                transition={{ type: "spring", damping: 15 }}
                className="flex flex-col items-center gap-6"
              >
                {activePlayer.role === 'Pottan' ? (
                  <>
                    <ShieldQuestion size={64} className="text-theyyam-red" />
                    <div className="text-center">
                      <h3 className="text-3xl font-display font-bold text-theyyam-red mb-2">POTTAN</h3>
                      <p className="text-sm opacity-80 px-2">You have no word. Fake it!</p>
                    </div>
                  </>
                ) : (
                  <div className="text-center w-full">
                    <p className="text-mural-gold text-sm uppercase tracking-wider mb-2">Your Word</p>
                    <h3 className="text-4xl md:text-5xl font-display font-black text-white leading-tight px-2 break-words max-w-full">
                      {activePlayer.word}
                    </h3>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {activePlayer.role === 'Pottan' && pottanCheatSheet && (
          <button 
            onClick={() => setShowCheatSheet(true)}
            className="flex items-center gap-2 text-mural-gold bg-mural-gold/10 px-4 py-2 rounded-full font-bold active:scale-95 transition-all"
          >
            <List size={18} /> View Word List
          </button>
        )}

        <button 
          onClick={handleDone}
          className="btn-primary w-full mt-auto mb-8"
        >
          Done
        </button>

        {/* Pottan Cheat Sheet Modal */}
        <AnimatePresence>
          {showCheatSheet && (
            <motion.div 
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              className="absolute inset-0 bg-kerala-green z-50 flex flex-col p-6"
            >
              <div className="flex justify-between items-center mb-6 mt-4">
                <h3 className="text-2xl font-bold text-mural-gold">Category Words</h3>
                <button onClick={() => setShowCheatSheet(false)} className="bg-white/10 p-2 rounded-full">
                  <X size={24} />
                </button>
              </div>
              <p className="text-sm text-coconut/70 mb-4">The secret word is ONE of these pairs. Good luck guessing.</p>
              
              <div className="flex-1 overflow-y-auto flex flex-col gap-2 pb-8">
                {WORD_BANK[activeCategory].map((pair, idx) => (
                  <div key={idx} className="bg-white/5 p-3 rounded-lg flex justify-between">
                    <span>{pair.nattukaran}</span>
                    <span className="text-white/30">|</span>
                    <span>{pair.kallan}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6 w-full h-full py-8"
    >
      <div className="text-center mb-4">
        <h2 className="text-3xl font-display font-bold text-mural-gold">Pass & Reveal</h2>
        <p className="text-coconut/70 text-sm mt-2">Pass the phone to each player</p>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto flex-1 pb-24 pr-2">
        {assignedRoles.map(player => (
          <button
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
              <span className="text-mural-gold text-sm uppercase tracking-wider">Tap to view</span>
            )}
          </button>
        ))}
      </div>

      {allRevealed && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-0 right-0 px-4 w-full max-w-md mx-auto"
        >
          <button 
            onClick={() => setGameState('discuss')}
            className="btn-primary w-full flex items-center justify-center gap-2 text-lg shadow-[0_0_30px_rgba(244,162,97,0.3)]"
          >
            BEGIN DISCUSSION
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PassPhase;
