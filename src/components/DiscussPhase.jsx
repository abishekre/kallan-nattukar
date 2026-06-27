import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, AlertTriangle, Clock } from 'lucide-react';
import { useGame } from '../GameContext';

const DiscussPhase = () => {
  const { setGameState, enablePottan, enableTimer } = useGame();
  
  // Timer Logic: 3 minutes (180 seconds)
  const [timeLeft, setTimeLeft] = useState(180);

  useEffect(() => {
    if (!enableTimer) return;
    
    if (timeLeft <= 0) return;

    const timerId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [enableTimer, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercentage = (timeLeft / 180) * 100;
  const isDanger = timeLeft < 30;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center h-full w-full gap-6 py-8"
    >
      <div className="text-center w-full">
        <MessageCircle size={48} className="text-mural-gold mx-auto mb-2" />
        <h2 className="text-4xl font-display font-bold text-mural-gold mb-1">Discussion</h2>
        <p className="text-coconut/80 mb-4">Time to find the Kallan!</p>

        {enableTimer && (
          <div className="bg-black/30 rounded-2xl p-4 w-full mb-4 border border-white/5">
            <div className="flex justify-between items-center mb-2">
              <span className="flex items-center gap-2 text-sm text-coconut/70">
                <Clock size={16} /> Time Remaining
              </span>
              <span className={`font-mono text-xl font-bold ${isDanger ? 'text-theyyam-red animate-pulse' : 'text-mural-gold'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full ${isDanger ? 'bg-theyyam-red' : 'bg-mural-gold'}`}
                initial={{ width: '100%' }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, ease: 'linear' }}
              />
            </div>
            {timeLeft === 0 && (
              <p className="text-theyyam-red font-bold text-sm mt-2 animate-bounce">TIME IS UP! VOTE NOW!</p>
            )}
          </div>
        )}
      </div>

      <div className="glass-panel p-6 w-full flex flex-col gap-6 overflow-y-auto pr-2 flex-1">
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
          <div className="bg-theyyam-red/20 border border-theyyam-red/50 rounded-xl p-4 mt-2 shrink-0">
            <h3 className="font-bold text-theyyam-red mb-1 flex items-center gap-2">
              <AlertTriangle size={18} /> Watch out for Pottan!
            </h3>
            <p className="text-xs text-coconut/80">The Pottan is in play! They have no word and are completely guessing.</p>
          </div>
        )}
      </div>

      <button 
        onClick={() => setGameState('voting')}
        className="btn-danger w-full mt-2 text-lg shadow-[0_0_30px_rgba(230,57,70,0.3)] shrink-0"
      >
        WE ARE READY TO VOTE
      </button>
    </motion.div>
  );
};

export default DiscussPhase;
