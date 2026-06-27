import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PartyPopper, Skull, RotateCcw, Home, Trophy } from 'lucide-react';
import { useGame } from '../GameContext';
import { PUNISHMENTS } from '../utils/gameLogic';

const ResultsPhase = () => {
  const { 
    assignedRoles, resetGame, playAgainSamePlayers, 
    enablePottan, multiRoundVoting, enableScoreboard,
    scores, updateScores
  } = useGame();
  
  const [scoresUpdated, setScoresUpdated] = useState(false);
  const [randomPunishment] = useState(() => PUNISHMENTS[Math.floor(Math.random() * PUNISHMENTS.length)]);

  const kallans = assignedRoles.filter(p => p.role === 'Kallan');
  const pottan = assignedRoles.find(p => p.role === 'Pottan');
  const nattukar = assignedRoles.filter(p => p.role === 'Nattukaran');
  
  const activeKallans = kallans.filter(p => !p.eliminated);
  const activeNattukar = nattukar.filter(p => !p.eliminated);
  const pottanEliminated = pottan && pottan.eliminated;
  
  // Win Logic
  let winner = '';
  let winReason = '';
  let winningTeam = ''; // 'nattukar', 'kallans', 'pottan'

  if (multiRoundVoting) {
    if (activeKallans.length === 0) {
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
    // Single Elimination Logic
    const eliminatedPlayer = assignedRoles.find(p => p.eliminated);
    if (eliminatedPlayer) {
      if (eliminatedPlayer.role === 'Kallan') {
        winner = 'NATTUKAR WON!';
        winReason = `They caught a Kallan: ${eliminatedPlayer.name}`;
        winningTeam = 'nattukar';
      } else if (eliminatedPlayer.role === 'Pottan') {
        winner = 'POTTAN WON?!';
        winReason = `Wait, you guys eliminated the Pottan (${eliminatedPlayer.name}). Chaos reigns!`;
        winningTeam = 'pottan';
      } else {
        winner = 'KALLAN WON!';
        winReason = `An innocent Nattukaran (${eliminatedPlayer.name}) was eliminated!`;
        winningTeam = 'kallans';
      }
    } else {
      winner = 'GAME OVER';
      winReason = 'No one was eliminated.';
    }
  }

  // Update Scores once
  useEffect(() => {
    if (enableScoreboard && !scoresUpdated && winningTeam) {
      const pointAssignments = [];
      
      if (winningTeam === 'nattukar') {
        nattukar.forEach(n => pointAssignments.push({ id: n.id, points: 1 })); // Surviving or not, they won
      } else if (winningTeam === 'kallans') {
        kallans.forEach(k => pointAssignments.push({ id: k.id, points: 3 }));
      } else if (winningTeam === 'pottan') {
        if (pottan) pointAssignments.push({ id: pottan.id, points: 5 });
      }

      // Bonus for Pottan surviving a Nattukar win in multi-round
      if (winningTeam === 'nattukar' && pottan && !pottanEliminated) {
        pointAssignments.push({ id: pottan.id, points: 2 });
      }

      updateScores(pointAssignments);
      setScoresUpdated(true);
    }
  }, [enableScoreboard, scoresUpdated, winningTeam, nattukar, kallans, pottan, pottanEliminated, updateScores]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full w-full py-8 gap-6 overflow-hidden"
    >
      <div className="text-center shrink-0">
        {winner.includes('NATTUKAR') ? (
          <PartyPopper size={48} className="text-mural-gold mx-auto mb-2" />
        ) : (
          <Skull size={48} className="text-theyyam-red mx-auto mb-2" />
        )}
        <h2 className={`text-4xl font-display font-black tracking-tight mb-2 ${winner.includes('NATTUKAR') ? 'text-mural-gold' : 'text-theyyam-red'}`}>
          {winner}
        </h2>
        <p className="text-coconut/80 font-medium px-4">{winReason}</p>
      </div>

      <div className="glass-panel p-6 flex-1 overflow-y-auto pr-2 flex flex-col gap-6">
        
        {/* Scoreboard Section */}
        {enableScoreboard && (
          <div className="bg-black/20 rounded-xl p-4 border border-white/10">
            <h3 className="text-mural-gold font-bold text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
              <Trophy size={16} /> Leaderboard
            </h3>
            <div className="flex flex-col gap-2">
              {assignedRoles
                .slice()
                .sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0))
                .map((p, idx) => (
                  <div key={p.id} className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2">
                      <span className="text-white/30 w-4">{idx + 1}.</span> {p.name}
                    </span>
                    <span className="font-bold text-mural-gold bg-mural-gold/10 px-2 rounded">
                      {scores[p.id] || 0} pts
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Roles Reveal */}
        <div>
          <h3 className="text-xl font-bold mb-4 border-b border-white/10 pb-2">The Truth</h3>
          <div className="flex flex-col gap-4">
            <div>
              <h4 className="text-sm uppercase tracking-widest text-theyyam-red font-bold mb-2">Kallan(s)</h4>
              {kallans.map(k => (
                <div key={k.id} className={`flex justify-between items-center bg-kerala-green/50 p-2 rounded-lg mb-1 ${k.eliminated ? 'opacity-50 line-through' : ''}`}>
                  <span className="font-bold">{k.name}</span>
                  <span className="text-sm opacity-70">Word: {k.word}</span>
                </div>
              ))}
            </div>

            {enablePottan && pottan && (
              <div>
                <h4 className="text-sm uppercase tracking-widest text-mural-gold font-bold mb-2 mt-2">The Pottan</h4>
                <div className={`flex justify-between items-center bg-kerala-green/50 p-2 rounded-lg ${pottan.eliminated ? 'opacity-50 line-through' : ''}`}>
                  <span className="font-bold">{pottan.name}</span>
                  <span className="text-sm opacity-70 italic">No word</span>
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm uppercase tracking-widest text-coconut/50 font-bold mb-2 mt-4">Nattukar</h4>
              <div className="flex flex-wrap gap-2">
                {nattukar.map(n => (
                  <span key={n.id} className={`bg-white/5 px-2 py-1 rounded text-sm ${n.eliminated ? 'opacity-50 line-through text-theyyam-red' : ''}`}>
                    {n.name}
                  </span>
                ))}
              </div>
              <p className="text-xs text-coconut/40 mt-2">Their word was: {nattukar[0]?.word}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-mural-gold/10 border border-mural-gold/30 p-4 rounded-xl shrink-0">
        <h4 className="text-mural-gold font-bold text-sm uppercase mb-1">Loser's Punishment</h4>
        <p className="text-sm italic">"{randomPunishment}"</p>
      </div>

      <div className="flex gap-3 mt-auto shrink-0">
        <button 
          onClick={resetGame}
          className="bg-white/10 p-4 rounded-xl flex items-center justify-center active:scale-95 transition-all"
        >
          <Home size={24} />
        </button>
        <button 
          onClick={playAgainSamePlayers}
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
