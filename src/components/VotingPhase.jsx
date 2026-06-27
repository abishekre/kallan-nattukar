import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Vote, Skull, X, Check, ArrowRight } from 'lucide-react';
import { useGame } from '../GameContext';

const VotingPhase = () => {
  const { assignedRoles, eliminatePlayer, setGameState, multiRoundVoting } = useGame();
  
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [eliminationResult, setEliminationResult] = useState(null); // { player, role, remainingKallans }

  const activePlayers = assignedRoles.filter(p => !p.eliminated);
  const activeKallans = activePlayers.filter(p => p.role === 'Kallan');
  const activeNattukar = activePlayers.filter(p => p.role === 'Nattukaran');

  const confirmElimination = () => {
    if (!selectedPlayer) return;
    
    eliminatePlayer(selectedPlayer.id);

    if (multiRoundVoting) {
      // Logic for multi-round
      const wasKallan = selectedPlayer.role === 'Kallan';
      const newActiveKallans = wasKallan ? activeKallans.length - 1 : activeKallans.length;
      const newActiveNattukar = selectedPlayer.role === 'Nattukaran' ? activeNattukar.length - 1 : activeNattukar.length;
      
      // Check win conditions
      if (newActiveKallans === 0 || newActiveKallans >= newActiveNattukar) {
        setGameState('results');
      } else {
        // Game continues
        setEliminationResult({
          player: selectedPlayer,
          role: selectedPlayer.role,
          remainingKallans: newActiveKallans
        });
      }
    } else {
      // Single elimination mode
      setGameState('results');
    }
    
    setSelectedPlayer(null);
  };

  const nextRound = () => {
    setEliminationResult(null);
    setGameState('discuss'); // Go back to discussion
  };

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
            They were {isKallan ? <span className="text-mural-gold font-bold">a KALLAN!</span> : <span className="text-theyyam-red font-bold">NOT a Kallan.</span>}
          </p>
        </div>
        
        <div className="bg-white/10 p-4 rounded-xl border border-white/20">
          <p className="font-bold text-lg mb-1">The game continues.</p>
          <p className="text-coconut/80">There {eliminationResult.remainingKallans === 1 ? 'is' : 'are'} still <span className="text-mural-gold font-bold">{eliminationResult.remainingKallans} Kallan(s)</span> hiding among you.</p>
        </div>

        <button 
          onClick={nextRound}
          className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
        >
          NEXT ROUND <ArrowRight size={20} />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col h-full w-full gap-6 py-8 relative"
    >
      <div className="text-center mb-2">
        <Vote size={40} className="text-theyyam-red mx-auto mb-2" />
        <h2 className="text-3xl font-display font-bold text-theyyam-red">Cast Your Votes</h2>
        <p className="text-coconut/70 text-sm mt-2">1. Count to 3.<br/>2. Everyone points at a suspect.<br/>3. Host taps the chosen player.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1 overflow-y-auto pb-4 content-start pr-1">
        {activePlayers.map(player => (
          <motion.button
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            key={player.id}
            onClick={() => setSelectedPlayer(player)}
            className="glass-panel p-4 flex flex-col items-center justify-center gap-2 aspect-square active:scale-95 transition-all border-theyyam-red/30 hover:bg-theyyam-red/10"
          >
            <span className="text-xl font-bold text-center line-clamp-2">{player.name}</span>
            <span className="text-xs text-theyyam-red uppercase font-bold tracking-widest mt-2 flex items-center gap-1">
              <Skull size={12} /> Eliminate
            </span>
          </motion.button>
        ))}
      </div>
      
      <button 
        onClick={() => setGameState('results')}
        className="bg-white/10 text-white font-bold py-4 rounded-xl active:scale-95 transition-all mt-auto shrink-0"
      >
        SKIP TO RESULTS
      </button>

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {selectedPlayer && (
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
              <Skull size={48} className="text-theyyam-red mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Eliminate {selectedPlayer.name}?</h3>
              <p className="text-coconut/70 text-sm mb-8">They will be permanently removed from the village.</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setSelectedPlayer(null)}
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
