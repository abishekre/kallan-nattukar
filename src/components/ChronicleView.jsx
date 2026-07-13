import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ScrollText, Trophy, Flame, Skull, Award, Lock } from 'lucide-react';
import { useGame } from '../GameContext';
import { RankBadge } from './ui/RankBadge';
import { ACHIEVEMENTS } from '../utils/progression';
import { relativeTime } from '../utils/chronicle';

// The "Panchayat Chronicle" — a retention hub combining village rank, the daily
// habit streak, unlockable achievements, and a scrollable feed of past rounds.
// Rendered as a modal so it's reachable from Setup without leaving the flow.
const teamMeta = {
  nattukar: { label: 'Nattukar', color: 'text-mural-gold', icon: Trophy },
  kallans: { label: 'Kallans', color: 'text-theyyam-red', icon: Skull },
  pottan: { label: 'Pottan', color: 'text-green-400', icon: Award },
};

const ChronicleView = ({ show, onClose }) => {
  const { chronicle, villageXp, villageAchievements, dailyStreak } = useGame();
  const now = Date.now();

  const unlockedCount = Object.keys(villageAchievements || {}).length;
  const sortedAchievements = useMemo(() => {
    const unlocked = (a) => (villageAchievements && villageAchievements[a.id] ? 1 : 0);
    return [...ACHIEVEMENTS].sort((a, b) => unlocked(b) - unlocked(a));
  }, [villageAchievements]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-kerala-green/95 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
            className="bg-kerala-green-light border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl flex flex-col max-h-[88vh]"
          >
            <div className="flex justify-between items-center p-5 pb-3 shrink-0 border-b border-white/5">
              <h3 className="text-xl font-display font-bold text-mural-gold flex items-center gap-2">
                <ScrollText size={22} /> Panchayat Chronicle
              </h3>
              <button aria-label="Close chronicle" onClick={onClose} className="text-coconut/50 hover:text-white p-1 bg-white/5 rounded-full"><X size={20} /></button>
            </div>

            <div className="overflow-y-auto p-5 pt-4 flex flex-col gap-5">
              {/* Rank + streak */}
              <div className="flex flex-col gap-3">
                <RankBadge xp={villageXp} />
                <div className="flex gap-3">
                  <div className="flex-1 bg-black/30 border border-theyyam-red/20 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-theyyam-red">
                      <Flame size={18} className={dailyStreak?.current > 0 ? 'animate-pulse' : 'opacity-40'} />
                      <span className="text-2xl font-black">{dailyStreak?.current || 0}</span>
                    </div>
                    <p className="text-[10px] text-coconut/50 uppercase tracking-widest mt-1">Day Streak</p>
                  </div>
                  <div className="flex-1 bg-black/30 border border-mural-gold/20 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-mural-gold">
                      <Award size={18} />
                      <span className="text-2xl font-black">{unlockedCount}<span className="text-sm text-coconut/40">/{ACHIEVEMENTS.length}</span></span>
                    </div>
                    <p className="text-[10px] text-coconut/50 uppercase tracking-widest mt-1">Badges</p>
                  </div>
                </div>
              </div>

              {/* Achievements grid */}
              <div>
                <h4 className="text-xs uppercase tracking-widest text-coconut/50 font-bold mb-2">Achievements</h4>
                <div className="grid grid-cols-3 gap-2">
                  {sortedAchievements.map(a => {
                    const unlocked = villageAchievements && villageAchievements[a.id];
                    return (
                      <div
                        key={a.id}
                        title={`${a.title} — ${a.desc}`}
                        className={`rounded-xl p-2 flex flex-col items-center text-center gap-1 border aspect-square justify-center transition-all ${unlocked ? 'bg-mural-gold/10 border-mural-gold/40' : 'bg-black/20 border-white/5'}`}
                      >
                        <span className={`text-2xl ${unlocked ? '' : 'grayscale opacity-30'}`}>{unlocked ? a.icon : <Lock size={20} className="text-coconut/30" />}</span>
                        <span className={`text-[9px] leading-tight font-bold ${unlocked ? 'text-mural-gold' : 'text-coconut/30'}`}>{a.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Round history feed */}
              <div>
                <h4 className="text-xs uppercase tracking-widest text-coconut/50 font-bold mb-2">Recent Rounds</h4>
                {(!chronicle || chronicle.length === 0) ? (
                  <p className="text-center text-coconut/40 text-sm py-6 italic">No rounds played yet. Start a pooram!</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {chronicle.map(entry => {
                      const meta = teamMeta[entry.winningTeam] || teamMeta.nattukar;
                      const Icon = meta.icon;
                      return (
                        <div key={entry.id} className="bg-black/20 border border-white/5 rounded-xl p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`flex items-center gap-1.5 font-bold text-sm ${meta.color}`}>
                              <Icon size={15} /> {meta.label} won
                            </span>
                            <span className="text-[10px] text-coconut/40 shrink-0">{relativeTime(entry.timestamp, now)}</span>
                          </div>
                          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1.5 text-xs text-coconut/60">
                            <span className="bg-white/5 px-1.5 py-0.5 rounded">{entry.category}</span>
                            <span className="text-mural-gold/80">{entry.nattukaranWord}</span>
                            <span className="opacity-30">vs</span>
                            <span className="text-theyyam-red/80">{entry.kallanWord}</span>
                          </div>
                          {entry.mvpName && (
                            <p className="text-[10px] text-coconut/50 mt-1.5 flex items-center gap-1">
                              <Trophy size={11} className="text-mural-gold" /> MVP: <span className="text-white font-medium">{entry.mvpName}</span>
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChronicleView;
