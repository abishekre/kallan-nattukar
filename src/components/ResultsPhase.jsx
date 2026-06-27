import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PartyPopper, Skull, RotateCcw, Home, Trophy, Medal, AlertCircle } from 'lucide-react';
import { useGame } from '../GameContext';
import { PUNISHMENTS } from '../utils/gameLogic';
import { SFX, Haptics } from '../utils/engine';

const ResultsPhase = () => {
  const { 
    assignedRoles, resetGame, playAgainSamePlayers, 
    enablePottan, multiRoundVoting, enableScoreboard,
    scores, updateScores
  } = useGame();
  
  const [scoresUpdated, setScoresUpdated] = useState(false);
  const [randomPunishment] = useState(() => PUNISHMENTS[Math.floor(Math.random() * PUNISHMENTS.length)]);
  
  // 0: Suspense, 1: Reveal Truth
  const [revealStep, setRevealStep] = useState(0);
  const [activeTab, setActiveTab] = useState('current'); // 'current' or 'awards'

  const kallans = assignedRoles.filter(p => p.role === 'Kallan');
  const pottan = assignedRoles.find(p => p.role === 'Pottan');
  const nattukar = assignedRoles.filter(p => p.role === 'Nattukaran');
  
  const activeKallans = kallans.filter(p => !p.eliminated);
  const activeNattukar = nattukar.filter(p => !p.eliminated);
  const pottanEliminated = pottan && pottan.eliminated;
  
  // Win Logic
  let winner = '';
  let winReason = '';
  let winningTeam = ''; 

  if (multiRoundVoting) {
    if (pottanEliminated) {
      winner = 'KALLANS WON!';
      winReason = 'The village voted out the Pottan! Chaos reigns, the Kallans escaped!';
      winningTeam = 'kallans';
    } else if (activeKallans.length === 0) {
      winner = 'NATTUKAR WON!';
      winReason = 'All Kallans were caught!';
      winningTeam = 'nattukar';
    } else if (activeKallans.length >= activeNattukar.length) {
      winner = 'KALLANS WON!';
      winReason = 'Kallans overpowered the village!';
      winningTeam = 'kallans';
    } else {
      winner = 'GAME OVER';
      winReason = 'The game ended abruptly.';
    }
  } else {
    // Single Elimination Logic (Sudden Death)
    const eliminatedPlayer = assignedRoles.find(p => p.eliminated);
    if (eliminatedPlayer) {
      if (eliminatedPlayer.role === 'Kallan') {
        winner = 'NATTUKAR WON!';
        winReason = `You successfully caught a Kallan! (${eliminatedPlayer.name})`;
        winningTeam = 'nattukar';
      } else if (eliminatedPlayer.role === 'Pottan') {
        winner = 'KALLANS WON!';
        winReason = `You voted out the Pottan (${eliminatedPlayer.name})! The Kallans escaped safely.`;
        winningTeam = 'kallans';
      } else {
        winner = 'KALLANS WON!';
        winReason = `You killed an innocent Nattukaran (${eliminatedPlayer.name})! The Kallans escaped!`;
        winningTeam = 'kallans';
      }
    } else {
      winner = 'GAME OVER';
      winReason = 'No one was eliminated.';
    }
  }

  // Suspense Timer
  useEffect(() => {
    if (revealStep === 0) {
      Haptics.heartbeat();
      const timer = setTimeout(() => {
        setRevealStep(1);
        if (winner.includes('NATTUKAR')) {
          SFX.win();
          Haptics.heavy();
        } else {
          SFX.lose();
          Haptics.heavy();
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [revealStep, winner]);

  // Update Scores once
  useEffect(() => {
    if (revealStep === 1 && enableScoreboard && !scoresUpdated && winningTeam) {
      const pointAssignments = [];
      
      if (winningTeam === 'nattukar') {
        nattukar.forEach(n => pointAssignments.push({ id: n.id, points: 1 })); 
      } else if (winningTeam === 'kallans') {
        kallans.forEach(k => pointAssignments.push({ id: k.id, points: 3 }));
      }
      
      // Pottan gets points if they survived the whole game (and game wasn't cut short)
      if (pottan && !pottanEliminated && winningTeam !== '') {
        pointAssignments.push({ id: pottan.id, points: 5 });
      }

      // Track wrongful deaths
      const wrongfullyKilledNattukar = nattukar.find(n => n.eliminated);
      if (wrongfullyKilledNattukar) {
        pointAssignments.push({ id: wrongfullyKilledNattukar.id, wrongfulDeath: true });
      }

      updateScores(pointAssignments);
      setScoresUpdated(true);
    }
  }, [revealStep, enableScoreboard, scoresUpdated, winningTeam, nattukar, kallans, pottan, pottanEliminated, updateScores]);

  // Compute Awards
  const getAwards = () => {
    if (!enableScoreboard) return [];
    const playerStats = assignedRoles.map(p => ({ ...p, stats: scores[p.id] || { points: 0, timesKallan: 0, timesPottan: 0, wrongfulDeaths: 0 } }));
    
    let awards = [];
    const topPoints = [...playerStats].sort((a,b) => b.stats.points - a.stats.points)[0];
    if (topPoints && topPoints.stats.points > 0) awards.push({ title: "The MVP", player: topPoints.name, icon: Trophy, color: 'text-mural-gold', desc: "Highest overall score" });

    const topKallan = [...playerStats].sort((a,b) => b.stats.timesKallan - a.stats.timesKallan)[0];
    if (topKallan && topKallan.stats.timesKallan > 0) awards.push({ title: "Master of Deception", player: topKallan.name, icon: Skull, color: 'text-theyyam-red', desc: "Most times played as Kallan" });

    const topPottan = [...playerStats].sort((a,b) => b.stats.timesPottan - a.stats.timesPottan)[0];
    if (topPottan && topPottan.stats.timesPottan > 0) awards.push({ title: "The Ultimate Pottan", player: topPottan.name, icon: AlertCircle, color: 'text-green-400', desc: "Most times played as Pottan" });

    const topScapegoat = [...playerStats].sort((a,b) => b.stats.wrongfulDeaths - a.stats.wrongfulDeaths)[0];
    if (topScapegoat && topScapegoat.stats.wrongfulDeaths > 0) awards.push({ title: "The Scapegoat", player: topScapegoat.name, icon: Medal, color: 'text-coconut/50', desc: "Wrongfully eliminated the most" });

    return awards;
  };

  if (revealStep === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-kerala-green absolute inset-0 z-50">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }} 
          transition={{ repeat: Infinity, duration: 1 }}
          className="text-center"
        >
          <h2 className="text-4xl font-display font-bold text-white tracking-widest uppercase mb-4">The Truth Is...</h2>
          <div className="w-16 h-1 bg-white/20 mx-auto overflow-hidden rounded-full">
            <motion.div 
              initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ repeat: Infinity, duration: 0.5 }}
              className="w-full h-full bg-mural-gold"
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col h-full w-full py-8 gap-4 overflow-hidden"
    >
      {enableScoreboard && (
        <div className="flex bg-black/30 rounded-xl p-1 shrink-0 border border-white/5 mx-4">
          <button 
            onClick={() => setActiveTab('current')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'current' ? 'bg-white/10 text-white' : 'text-coconut/50'}`}
          >
            Current Game
          </button>
          <button 
            onClick={() => setActiveTab('awards')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'awards' ? 'bg-white/10 text-mural-gold' : 'text-coconut/50'}`}
          >
            Nightly Awards
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-6">
        <AnimatePresence mode="wait">
          {activeTab === 'current' ? (
            <motion.div key="current" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6">
              
              <div className="text-center shrink-0 mt-2">
                {winner.includes('NATTUKAR') ? (
                  <PartyPopper size={48} className="text-mural-gold mx-auto mb-2 animate-bounce" />
                ) : (
                  <Skull size={48} className="text-theyyam-red mx-auto mb-2 animate-bounce" />
                )}
                <h2 className={`text-4xl font-display font-black tracking-tight mb-2 ${winner.includes('NATTUKAR') ? 'text-mural-gold drop-shadow-[0_0_15px_rgba(244,162,97,0.5)]' : 'text-theyyam-red drop-shadow-[0_0_15px_rgba(230,57,70,0.5)]'}`}>
                  {winner}
                </h2>
                <p className="text-coconut/80 font-medium px-4 text-sm">{winReason}</p>
              </div>

              <div className="glass-panel p-6 flex flex-col gap-4">
                <h3 className="text-xl font-bold border-b border-white/10 pb-2">The Truth</h3>
                
                <div>
                  <h4 className="text-sm uppercase tracking-widest text-theyyam-red font-bold mb-2">Kallan(s)</h4>
                  {kallans.map(k => (
                    <div key={k.id} className={`flex justify-between items-center bg-kerala-green/50 p-2 rounded-lg mb-1 ${k.eliminated ? 'opacity-50 line-through' : ''}`}>
                      <span className="font-bold">{k.name}</span>
                      <span className="text-sm opacity-70 text-coconut/80">Word: {k.word}</span>
                    </div>
                  ))}
                </div>

                {enablePottan && pottan && (
                  <div>
                    <h4 className="text-sm uppercase tracking-widest text-mural-gold font-bold mb-2 mt-2">The Pottan</h4>
                    <div className={`flex justify-between items-center bg-kerala-green/50 p-2 rounded-lg ${pottan.eliminated ? 'opacity-50 line-through' : ''}`}>
                      <span className="font-bold">{pottan.name}</span>
                      <span className="text-sm opacity-70 italic text-coconut/80">No word</span>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm uppercase tracking-widest text-coconut/50 font-bold mb-2 mt-2">Nattukar</h4>
                  <div className="flex flex-wrap gap-2">
                    {nattukar.map(n => (
                      <span key={n.id} className={`bg-white/5 px-2 py-1 rounded text-sm ${n.eliminated ? 'opacity-50 line-through text-theyyam-red' : ''}`}>
                        {n.name}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-coconut/50 mt-2">Their word was: {nattukar[0]?.word}</p>
                </div>
              </div>

              {winningTeam !== 'nattukar' && (
                <div className="bg-mural-gold/10 border border-mural-gold/30 p-4 rounded-xl">
                  <h4 className="text-mural-gold font-bold text-sm uppercase mb-1">Loser's Punishment</h4>
                  <p className="text-sm italic text-coconut/80">"{randomPunishment}"</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="awards" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col gap-4">
              <div className="text-center mt-2 mb-4">
                <Trophy size={40} className="text-mural-gold mx-auto mb-2" />
                <h2 className="text-2xl font-display font-bold">Nightly Awards</h2>
                <p className="text-xs text-coconut/50">Cumulative stats for this session</p>
              </div>

              <div className="flex flex-col gap-3">
                {getAwards().map((award, i) => {
                  const Icon = award.icon;
                  return (
                    <div key={i} className="glass-panel p-4 flex items-center gap-4">
                      <div className={`p-3 bg-black/20 rounded-full ${award.color}`}>
                        <Icon size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{award.title}</h4>
                        <p className={`font-display font-black text-xl ${award.color}`}>{award.player}</p>
                        <p className="text-xs text-coconut/50">{award.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-black/20 rounded-xl p-4 border border-white/10 mt-4">
                <h3 className="text-mural-gold font-bold text-sm uppercase tracking-widest mb-3">Leaderboard</h3>
                <div className="flex flex-col gap-2">
                  {assignedRoles
                    .slice()
                    .sort((a, b) => (scores[b.id]?.points || 0) - (scores[a.id]?.points || 0))
                    .map((p, idx) => (
                      <div key={p.id} className="flex justify-between items-center text-sm">
                        <span className="flex items-center gap-2 font-medium">
                          <span className="text-white/30 w-4">{idx + 1}.</span> {p.name}
                        </span>
                        <span className="font-bold text-mural-gold bg-mural-gold/10 px-2 py-0.5 rounded">
                          {scores[p.id]?.points || 0} pts
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-3 px-4 shrink-0 mt-auto">
        <button 
          onClick={() => { SFX.swoosh(); Haptics.light(); resetGame(); }}
          className="bg-white/10 p-4 rounded-xl flex items-center justify-center active:scale-95 transition-all"
        >
          <Home size={24} />
        </button>
        <button 
          onClick={() => { SFX.swoosh(); Haptics.light(); playAgainSamePlayers(); }}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          <RotateCcw size={20} />
          PLAY AGAIN
        </button>
      </div>
    </motion.div>
  );
};

export default ResultsPhase;
