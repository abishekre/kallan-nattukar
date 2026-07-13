import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Vote, Skull, X, Check, ArrowRight, ShieldAlert, Target } from 'lucide-react';
import { useGame } from '../GameContext';
import { SFX, Haptics } from '../utils/engine';

import { Embers } from './ui/Embers';

const VotingPhase = () => {
  const { assignedRoles, eliminatePlayer, setGameState, multiRoundVoting, setPottanStoleWin, enableCaughtBy } = useGame();
  
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [eliminationResult, setEliminationResult] = useState(null);
  const [pottanGuessing, setPottanGuessing] = useState(false);
  const [dyingPlayerId, setDyingPlayerId] = useState(null);
  const [dyingRotation, setDyingRotation] = useState(0);

  const [heroPrompt, setHeroPrompt] = useState(false);
  const [eliminatedKallan, setEliminatedKallan] = useState(null);

  const activePlayers = assignedRoles.filter(p => !p.eliminated);
  const activeNattukar = activePlayers.filter(p => p.role === 'Nattukaran');

  const confirmElimination = () => {
    if (!selectedPlayer) return;
    
    Haptics.heavy();
    SFX.boom();
    
    const targetId = selectedPlayer.id;
    const targetPlayer = selectedPlayer;
    setSelectedPlayer(null);
    setDyingPlayerId(targetId);
    setDyingRotation(Math.random() * 40 - 20);

    setTimeout(() => {
      const wasPottan = targetPlayer.role === 'Pottan';
      const wasKallan = targetPlayer.role === 'Kallan';
      
      if (wasKallan && enableCaughtBy && activeNattukar.length > 0) {
        setDyingPlayerId(null);
        setEliminatedKallan(targetPlayer);
        setHeroPrompt(true);
        return;
      }

      eliminatePlayer(targetId);

      if (wasPottan) {
        setDyingPlayerId(null);
        setPottanGuessing(true);
        return;
      }

      proceedAfterElimination(targetPlayer);
    }, 1000);
  };

  const proceedAfterElimination = (eliminatedPlayer) => {
    setDyingPlayerId(null);
    const newActivePlayers = activePlayers.filter(p => p.id !== eliminatedPlayer.id);
    const newActiveKallans = newActivePlayers.filter(p => p.role === 'Kallan').length;
    const newActiveNattukar = newActivePlayers.filter(p => p.role === 'Nattukaran').length;
    const pottanAlive = newActivePlayers.some(p => p.role === 'Pottan') ? 1 : 0;

    if (multiRoundVoting) {
      if (newActiveKallans === 0 || newActiveKallans >= (newActiveNattukar + pottanAlive)) {
        setGameState('results');
      } else {
        setEliminationResult({
          player: eliminatedPlayer,
          role: eliminatedPlayer.role,
          remainingKallans: newActiveKallans
        });
      }
    } else {
      setGameState('results');
    }
  };

  const handlePottanGuess = (isCorrect) => {
    Haptics.heavy();
    if (isCorrect) {
      SFX.win();
      setPottanStoleWin(true);
      setGameState('results');
    } else {
      SFX.boom();
      proceedAfterElimination(assignedRoles.find(p => p.role === 'Pottan'));
    }
  };

  const nextRound = () => {
    setEliminationResult(null);
    setGameState('discuss'); 
  };

  const handleHeroSelection = (heroId) => {
    Haptics.light();
    eliminatePlayer(eliminatedKallan.id, heroId);
    setHeroPrompt(false);
    proceedAfterElimination(eliminatedKallan);
  };

  if (pottanGuessing) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-full w-full gap-8 absolute inset-0 bg-kerala-green z-40 p-8 text-center"
      >
        <ShieldAlert size={64} className="text-theyyam-red animate-pulse" />
        <div>
          <h2 className="text-3xl font-display font-bold mb-2 text-theyyam-red uppercase">Pottan's Last Stand!</h2>
          <p className="text-xl">You voted out <span className="font-bold">{assignedRoles.find(p => p.role==='Pottan')?.name}</span>, and they were the <span className="text-mural-gold font-bold">POTTAN!</span></p>
        </div>
        
        <div className="bg-white/10 p-6 rounded-xl border border-theyyam-red/50 shadow-[0_0_30px_rgba(230,57,70,0.2)]">
          <p className="text-sm text-coconut/80 mb-4">{assignedRoles.find(p => p.role==='Pottan')?.name}, say your guess for the secret word out loud. Did they guess it correctly?</p>
          <div className="flex gap-3">
            <button onClick={() => handlePottanGuess(false)} className="flex-1 bg-white/10 p-4 rounded-xl font-bold transition-all active:scale-95 text-coconut">
              <X size={24} className="mx-auto mb-1 text-coconut/50" /> Wrong
            </button>
            <button onClick={() => handlePottanGuess(true)} className="flex-1 bg-theyyam-red text-white p-4 rounded-xl font-bold transition-all active:scale-95 shadow-[0_0_20px_rgba(230,57,70,0.4)]">
              <Check size={24} className="mx-auto mb-1" /> Correct
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (heroPrompt) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-full w-full gap-4 absolute inset-0 bg-kerala-green z-40 p-8 text-center"
      >
        <Target size={64} className="text-green-500 mx-auto" />
        <div>
          <h2 className="text-2xl font-display font-bold mb-2 uppercase text-green-500 tracking-widest">Who Caught Them?</h2>
          <p className="text-sm text-coconut/80">Select the Nattukaran who successfully accused <span className="font-bold text-theyyam-red">{eliminatedKallan.name}</span>.</p>
        </div>
        
        <div className="w-full flex flex-col gap-2 mt-4 max-h-[50vh] overflow-y-auto">
          {activePlayers.filter(p => p.role === 'Nattukaran' || p.role === 'Pottan').map(n => (
            <button 
              key={n.id}
              onClick={() => handleHeroSelection(n.id)}
              className="w-full bg-white/10 p-4 rounded-xl font-bold transition-all active:scale-95 text-white border border-white/10 hover:bg-white/20 flex items-center justify-between"
            >
              {n.name} {n.role === 'Pottan' && <span className="text-xs text-mural-gold">(Pottan)</span>}
              <ArrowRight size={18} className="opacity-50" />
            </button>
          ))}
        </div>
        
        <button 
          onClick={() => handleHeroSelection(null)}
          className="text-coconut/50 text-sm mt-4 p-3 font-medium active:scale-95 bg-black/20 rounded-xl w-full"
        >
          Skip (Village Effort)
        </button>
      </motion.div>
    );
  }

  if (eliminationResult) {
    const isKallan = eliminationResult.role === 'Kallan';
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-full w-full gap-8 absolute inset-0 bg-kerala-green z-30 p-8 text-center"
      >
        <Skull size={64} className={isKallan ? 'text-mural-gold' : 'text-theyyam-red'} />
        <div>
          <h2 className="text-3xl font-display font-bold mb-2">{eliminationResult.player.name} was eliminated!</h2>
          <p className="text-xl">
            They were {isKallan ? <span className="text-mural-gold font-bold">a KALLAN!</span> : <span className="text-theyyam-red font-bold">innocent! Oru abadham patti...</span>}
          </p>
        </div>
        
        <div className="bg-white/10 p-4 rounded-xl border border-white/20">
          <p className="font-bold text-lg mb-1">The game continues. Kali theernilla!</p>
          <p className="text-coconut/80">There {eliminationResult.remainingKallans === 1 ? 'is' : 'are'} still <span className="text-mural-gold font-bold">{eliminationResult.remainingKallans} Kallan(s)</span> hiding among you.</p>
        </div>

        <button 
          onClick={nextRound}
          className="btn-primary w-full mt-4 flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(244,162,97,0.3)]"
        >
          NEXT ROUND <ArrowRight size={20} />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={dyingPlayerId
        ? { opacity: 1, scale: 1, x: [0, -8, 8, -6, 6, -3, 0] }
        : { opacity: 1, scale: 1, x: 0 }}
      transition={dyingPlayerId ? { duration: 0.5 } : { duration: 0.3 }}
      className="flex flex-col h-full w-full gap-6 py-8 relative"
    >
      <div className="text-center mb-2">
        <Vote size={40} className="text-theyyam-red mx-auto mb-2" />
        <h2 className="text-3xl font-display font-bold text-theyyam-red">Nattukootam</h2>
        <p className="text-coconut/50 text-sm mt-2 font-medium">On 3, point at your suspect!</p>
        <div className="bg-mural-gold/10 border border-mural-gold/30 text-mural-gold text-xs p-2 rounded-lg mt-4 font-bold max-w-xs mx-auto">
          Mooppan (Game Owner), hold the device to log the group's vote.
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1 overflow-y-auto pb-4 content-start pr-1 relative z-10">
        {activePlayers.map(player => {
          const isDying = dyingPlayerId === player.id;
          const isSelected = selectedPlayer?.id === player.id;
          
          return (
            <motion.button
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={
                isDying 
                  ? { y: 150, opacity: 0, scale: 0.5, rotateZ: dyingRotation, filter: 'blur(10px)' } 
                  : { opacity: 1, scale: 1, y: 0, rotateZ: 0, filter: 'blur(0px)' }
              }
              transition={{ duration: isDying ? 0.8 : 0.2, ease: isDying ? "easeIn" : "easeOut" }}
              key={player.id}
              onClick={() => { Haptics.light(); setSelectedPlayer(player); }}
              className={`glass-panel p-4 flex flex-col items-center justify-center gap-2 aspect-square transition-colors relative overflow-hidden ${isSelected ? 'border-theyyam-red bg-theyyam-red/20' : 'border-theyyam-red/30 hover:bg-theyyam-red/10'}`}
            >
              {isDying && <Embers />}
              
              {/* Target Lock Corners */}
              <AnimatePresence>
                {isSelected && !isDying && (
                  <>
                    <motion.div initial={{ top: -10, left: -10 }} animate={{ top: 0, left: 0 }} className="absolute w-4 h-4 border-t-2 border-l-2 border-theyyam-red" />
                    <motion.div initial={{ top: -10, right: -10 }} animate={{ top: 0, right: 0 }} className="absolute w-4 h-4 border-t-2 border-r-2 border-theyyam-red" />
                    <motion.div initial={{ bottom: -10, left: -10 }} animate={{ bottom: 0, left: 0 }} className="absolute w-4 h-4 border-b-2 border-l-2 border-theyyam-red" />
                    <motion.div initial={{ bottom: -10, right: -10 }} animate={{ bottom: 0, right: 0 }} className="absolute w-4 h-4 border-b-2 border-r-2 border-theyyam-red" />
                    <motion.div 
                      initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 0.2 }} exit={{ scale: 0, opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center text-theyyam-red"
                    >
                      <Target size={64} />
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              <span className="text-xl font-bold text-center line-clamp-2 relative z-10">{player.name}</span>
              <span className="text-xs text-theyyam-red uppercase font-bold tracking-widest mt-2 flex items-center gap-1 relative z-10">
                <Skull size={12} /> Eliminate
              </span>
            </motion.button>
          )
        })}
      </div>
      

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {selectedPlayer && !dyingPlayerId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-kerala-green/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-kerala-green-light border border-theyyam-red/50 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center"
            >
              <Target size={48} className="text-theyyam-red mx-auto mb-4 animate-pulse" />
              <h3 className="text-2xl font-bold mb-2">Eliminate {selectedPlayer.name}?</h3>
              <p className="text-coconut/80 text-sm mb-8">They will be permanently removed from the village.</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => { Haptics.light(); setSelectedPlayer(null); }}
                  className="flex-1 bg-white/10 p-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all active:scale-95"
                >
                  <X size={18} /> Cancel
                </button>
                <button 
                  onClick={confirmElimination}
                  className="flex-1 bg-theyyam-red text-white p-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all active:scale-95 shadow-[0_0_20px_rgba(230,57,70,0.4)]"
                >
                  <Check size={18} /> Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default VotingPhase;
