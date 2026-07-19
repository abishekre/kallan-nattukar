import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, ChevronDown, ChevronUp, Volume2, VolumeX } from 'lucide-react';
import { useGame } from '../../GameContext';

export const GameSettings = ({ onClearScores }) => {
  const {
    players,
    imposterCount, setImposterCount,
    enablePottan, setEnablePottan,
    pottanHint, setPottanHint,
    selectedCategories,
    timerDuration, setTimerDuration,
    multiRoundVoting, setMultiRoundVoting,
    enableCaughtBy, setEnableCaughtBy,
    enableScoreboard, setEnableScoreboard,
    enableAudio, setEnableAudio,
    wordDifficulty, setWordDifficulty
  } = useGame();

  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);

  // Calculate maximum allowed Kallans (must be strictly less than Nattukar)
  // Total = K + N + P => N = Total - K - P
  // K < N => K < Total - K - P => 2K < Total - P => K <= floor((Total - P - 1)/2)
  const maxKallans = Math.max(1, Math.floor((players.length - (enablePottan ? 1 : 0) - 1) / 2));

  useEffect(() => {
    if (players.length < 3 && enablePottan) {
      setEnablePottan(false);
    }
    if (imposterCount > maxKallans) {
      setImposterCount(maxKallans);
    }
  }, [players.length, enablePottan, maxKallans, imposterCount, setImposterCount, setEnablePottan]);

  const getPottanSummary = () => {
    if (!enablePottan) return 'No Pottan';
    return pottanHint === 'category' ? 'Pottan (Hint)' : 'Pottan (Blind)';
  };

  return (
    <section className="mt-2">
      <button 
        onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
        className={`w-full glass-panel p-4 flex flex-col gap-2 transition-all ${isSettingsExpanded ? 'rounded-b-none border-b-0 bg-black/20' : 'active:scale-[0.98]'}`}
      >
        <div className="flex justify-between items-center w-full">
          <span className="font-bold flex items-center gap-2 text-mural-gold"><Settings2 size={18}/> Village Rules</span>
          {isSettingsExpanded ? <ChevronUp size={20} className="text-coconut/50" /> : <ChevronDown size={20} className="text-coconut/50" />}
        </div>
        {!isSettingsExpanded && (
          <p className="text-sm text-left text-coconut/80 font-medium leading-relaxed">
            {imposterCount} Kallan <span className="opacity-30">•</span> {getPottanSummary()} <span className="opacity-30">•</span> {selectedCategories.length} Categories
          </p>
        )}
      </button>

      <AnimatePresence>
        {isSettingsExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }} 
            className="overflow-hidden glass-panel border-t-0 rounded-t-none bg-black/20"
          >
            <div className="p-4 pt-0 flex flex-col gap-6">
              
              {/* Roles */}
              <div className="pt-2">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <span className="block text-sm font-bold">Number of Kallans</span>
                    <span className="text-xs text-coconut/50">Max {maxKallans}</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 rounded-lg p-1">
                    <button onClick={() => setImposterCount(Math.max(1, imposterCount - 1))} disabled={imposterCount <= 1} className="w-8 h-8 flex items-center justify-center bg-black/30 rounded-md text-mural-gold font-bold active:scale-95 transition-transform disabled:opacity-30">-</button>
                    <span className="font-bold w-4 text-center">{imposterCount}</span>
                    <button onClick={() => setImposterCount(Math.min(maxKallans, imposterCount + 1))} disabled={imposterCount >= maxKallans} className="w-8 h-8 flex items-center justify-center bg-black/30 rounded-md text-mural-gold font-bold active:scale-95 transition-transform disabled:opacity-30">+</button>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-3">
                  <span className="block text-sm font-bold mb-2">Include Pottan (The Fool)</span>
                  <div className="flex gap-2 bg-black/30 p-1 rounded-lg">
                    <button 
                      onClick={() => { setPottanHint('none'); setEnablePottan(false); }} 
                      className={`flex-1 py-2 text-xs font-bold rounded transition-all ${!enablePottan ? 'bg-theyyam-red text-white shadow-sm' : 'text-coconut/50 hover:text-white'}`}
                    >Off</button>
                    <button 
                      onClick={() => { setPottanHint('blind'); setEnablePottan(true); }} 
                      className={`flex-1 py-2 text-xs font-bold rounded transition-all ${enablePottan && pottanHint === 'blind' ? 'bg-mural-gold/20 text-mural-gold border border-mural-gold/30' : 'text-coconut/50 hover:text-white'}`}
                    >Blind</button>
                    <button 
                      onClick={() => { setPottanHint('category'); setEnablePottan(true); }} 
                      className={`flex-1 py-2 text-xs font-bold rounded transition-all ${enablePottan && pottanHint === 'category' ? 'bg-mural-gold/20 text-mural-gold border border-mural-gold/30' : 'text-coconut/50 hover:text-white'}`}
                    >Category Hint</button>
                  </div>
                </div>
              </div>

              {/* Advanced Rules */}
              <div className="border-t border-white/5 pt-4 flex flex-col gap-4">
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-sm font-bold">Discussion Timer</span>
                    <span className="text-xs text-coconut/50">Adds suspense & music</span>
                  </div>
                  <div className="flex gap-2 bg-black/30 p-1 rounded-lg">
                    {[0, 60, 180, 300].map(val => (
                      <button 
                        key={val}
                        onClick={() => setTimerDuration(val)}
                        className={`px-3 py-1 text-xs font-bold rounded transition-all ${timerDuration === val ? 'bg-mural-gold/20 text-mural-gold border border-mural-gold/30' : 'text-coconut/50 hover:text-white'}`}
                      >
                        {val === 0 ? 'Off' : `${val/60}m`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-sm font-bold">Multi-Round Voting</span>
                    <span className="text-xs text-coconut/50">Vote until Kallans are caught</span>
                  </div>
                  <button onClick={() => setMultiRoundVoting(!multiRoundVoting)} className={`w-12 h-6 rounded-full transition-colors relative ${multiRoundVoting ? 'bg-mural-gold' : 'bg-white/10'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${multiRoundVoting ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-sm font-bold">Log Who Caught Them</span>
                    <span className="text-xs text-coconut/50">Track which Nattukaran caught each Kallan</span>
                  </div>
                  <button onClick={() => setEnableCaughtBy(!enableCaughtBy)} className={`w-12 h-6 rounded-full transition-colors relative ${enableCaughtBy ? 'bg-mural-gold' : 'bg-white/10'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${enableCaughtBy ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-sm font-bold">Global Audio</span>
                    <span className="text-xs text-coconut/50">Music, SFX, and Haptics</span>
                  </div>
                  <button onClick={() => setEnableAudio(!enableAudio)} className={`p-2 rounded-lg transition-colors ${enableAudio ? 'bg-mural-gold/20 text-mural-gold' : 'bg-white/5 text-coconut/50'}`}>
                    {enableAudio ? <Volume2 size={18} /> : <VolumeX size={18} />}
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-sm font-bold">Word Difficulty</span>
                    <span className="text-xs text-coconut/50">Filter word pairs</span>
                  </div>
                  <div className="flex gap-1 bg-black/30 p-1 rounded-lg">
                    {['all', 'easy', 'medium', 'hard'].map(level => (
                      <button 
                        key={level}
                        onClick={() => setWordDifficulty(level)}
                        className={`px-2 py-1 text-[10px] font-bold uppercase rounded transition-all ${wordDifficulty === level ? 'bg-mural-gold/20 text-mural-gold border border-mural-gold/30' : 'text-coconut/50 hover:text-white'}`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>


                <div className="border-t border-white/5 pt-4 flex items-center justify-between">
                  <div>
                    <span className="block text-sm font-bold">Scoreboard</span>
                    <span className="text-xs text-coconut/50">Track points across rounds</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={onClearScores} className="text-xs text-theyyam-red font-bold p-1 active:opacity-50">
                      Reset Points
                    </button>
                    <button onClick={() => setEnableScoreboard(!enableScoreboard)} className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${enableScoreboard ? 'bg-mural-gold' : 'bg-white/10'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${enableScoreboard ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
