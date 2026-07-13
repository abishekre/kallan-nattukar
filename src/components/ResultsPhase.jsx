import { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Home, RotateCcw, Skull, Target, PartyPopper, Medal, AlertCircle, ShieldAlert, ChevronDown, ChevronUp, Flame, Crown, Sparkles } from 'lucide-react';
import { useGame } from '../GameContext';
import { PUNISHMENTS, calculateWinCondition } from '../utils/gameLogic';
import { SFX, Haptics } from '../utils/engine';

import { Embers } from './ui/Embers';
import { Confetti } from './ui/Confetti';

const ResultsPhase = () => {
  const {
    assignedRoles, resetGame, playAgainSamePlayers,
    enablePottan, multiRoundVoting, enableScoreboard,
    scores, pottanStoleWin,
    gossipText, setGossipText, activeDifficulty,
    finalizeRound,
  } = useGame();

  const [randomPunishment] = useState(() => PUNISHMENTS[Math.floor(Math.random() * PUNISHMENTS.length)]);
  const [showPunishment, setShowPunishment] = useState(false);

  // 0: Suspense curtain, 1: Reveal Truth
  const [revealStep, setRevealStep] = useState(0);
  const [activeTab, setActiveTab] = useState('current');
  const [showConfetti, setShowConfetti] = useState(false);
  const [roundXpGained, setRoundXpGained] = useState(0);
  const [mvpName, setMvpName] = useState(null);

  // Auto-rematch momentum: a short countdown the player can trigger to keep the
  // "one more round" loop friction-free.
  const [autoCountdown, setAutoCountdown] = useState(null);
  const autoTimerRef = useRef(null);

  const kallans = useMemo(() => assignedRoles.filter(p => p.role === 'Kallan'), [assignedRoles]);
  const pottan = useMemo(() => assignedRoles.find(p => p.role === 'Pottan'), [assignedRoles]);
  const nattukar = useMemo(() => assignedRoles.filter(p => p.role === 'Nattukaran'), [assignedRoles]);

  const { winner, winReason, winningTeam, wrongfulKills } = useMemo(() =>
    calculateWinCondition({ assignedRoles, pottanStoleWin, multiRoundVoting }),
  [assignedRoles, pottanStoleWin, multiRoundVoting]);

  // Idempotency guard: end-of-round bookkeeping must happen exactly once, even
  // under React StrictMode double-invocation or re-renders. A ref is the only
  // reliable latch here (state updates are async and can slip through).
  const finalizedRef = useRef(false);

  // Suspense curtain -> reveal.
  useEffect(() => {
    if (revealStep === 0) {
      Haptics.heartbeat();
      const timer = setTimeout(() => {
        setRevealStep(1);
        const villageWon = winner.includes('NATTUKAR') || winner.includes('POTTAN');
        if (villageWon) {
          SFX.win();
          Haptics.heavy();
          setShowConfetti(true);
        } else {
          SFX.lose();
          Haptics.heavy();
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [revealStep, winner]);

  // Run bookkeeping once, right as the truth is revealed.
  useEffect(() => {
    if (revealStep !== 1 || finalizedRef.current || !winningTeam) return;
    finalizedRef.current = true;

    const result = finalizeRound({ winningTeam, winner, wrongfulKills });
    setRoundXpGained(result.roundXp || 0);
    setMvpName(result.mvpName || null);

    setGossipText(buildGossip({ winningTeam, wrongfulKills, kallans, pottan }));
  }, [revealStep, winningTeam, winner, wrongfulKills, kallans, pottan, finalizeRound, setGossipText]);

  // Cleanup auto-rematch timer.
  useEffect(() => () => { if (autoTimerRef.current) clearInterval(autoTimerRef.current); }, []);

  const startAutoRematch = () => {
    if (autoCountdown !== null) {
      // Cancel
      clearInterval(autoTimerRef.current);
      setAutoCountdown(null);
      return;
    }
    Haptics.light();
    setAutoCountdown(3);
    autoTimerRef.current = setInterval(() => {
      setAutoCountdown(prev => {
        if (prev <= 1) {
          clearInterval(autoTimerRef.current);
          SFX.swoosh();
          playAgainSamePlayers();
          return null;
        }
        SFX.tick();
        return prev - 1;
      });
    }, 1000);
  };

  const getAwards = () => {
    if (!enableScoreboard) return [];
    // Awards span the whole village (all players with stats), not just this
    // round's line-up — matches the "cumulative for this village" intent.
    const playerStats = Object.entries(scores).map(([id, stats]) => ({
      id,
      name: assignedRoles.find(p => p.id === id)?.name || villageNameFallback(id),
      stats: stats || {},
    }));

    let awards = [];
    const topPoints = [...playerStats].sort((a, b) => (b.stats.points || 0) - (a.stats.points || 0))[0];
    if (topPoints && (topPoints.stats.points || 0) > 0) awards.push({ title: "The MVP", player: topPoints.name, icon: Trophy, color: 'text-mural-gold', desc: "Highest overall score" });

    const topKallan = [...playerStats].sort((a, b) => (b.stats.timesKallan || 0) - (a.stats.timesKallan || 0))[0];
    if (topKallan && (topKallan.stats.timesKallan || 0) > 0) awards.push({ title: "Master of Deception", player: topKallan.name, icon: Skull, color: 'text-theyyam-red', desc: "Most times played as Kallan" });

    const topPottan = [...playerStats].sort((a, b) => (b.stats.timesPottan || 0) - (a.stats.timesPottan || 0))[0];
    if (topPottan && (topPottan.stats.timesPottan || 0) > 0) awards.push({ title: "The Ultimate Pottan", player: topPottan.name, icon: AlertCircle, color: 'text-green-400', desc: "Most times played as Pottan" });

    const topScapegoat = [...playerStats].sort((a, b) => (b.stats.wrongfulDeaths || 0) - (a.stats.wrongfulDeaths || 0))[0];
    if (topScapegoat && (topScapegoat.stats.wrongfulDeaths || 0) > 0) awards.push({ title: "The Scapegoat", player: topScapegoat.name, icon: Medal, color: 'text-coconut/50', desc: "Wrongfully eliminated the most" });

    return awards;
  };

  // Full-village leaderboard (everyone who has ever played this village),
  // ranked by cumulative points. Falls back to round line-up names.
  const leaderboard = useMemo(() => {
    const rows = Object.entries(scores).map(([id, stats]) => ({
      id,
      name: assignedRoles.find(p => p.id === id)?.name || villageNameFallback(id),
      inRound: assignedRoles.some(p => p.id === id),
      stats: stats || {},
    }));
    return rows.sort((a, b) => (b.stats.points || 0) - (a.stats.points || 0));
  }, [scores, assignedRoles]);

  const getWinnerColor = () => {
    if (winner.includes('NATTUKAR')) return 'text-mural-gold drop-shadow-[0_0_15px_rgba(244,162,97,0.5)]';
    if (winner.includes('POTTAN')) return 'text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]';
    return 'text-theyyam-red drop-shadow-[0_0_15px_rgba(230,57,70,0.5)]';
  };

  const getWinnerIcon = () => {
    if (winner.includes('NATTUKAR')) return <PartyPopper size={48} className="text-mural-gold mx-auto mb-2 animate-bounce" />;
    if (winner.includes('POTTAN')) return <ShieldAlert size={48} className="text-green-400 mx-auto mb-2 animate-bounce" />;
    return <Skull size={48} className="text-theyyam-red mx-auto mb-2 animate-bounce" />;
  };

  return (
    <>
      <AnimatePresence>{showConfetti && <Confetti count={100} />}</AnimatePresence>

      <AnimatePresence>
        {revealStep === 0 && (
          <>
            <motion.div
              key="curtain-top"
              exit={{ y: '-100%' }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="fixed top-0 left-0 right-0 h-1/2 bg-kerala-green border-b border-mural-gold/50 z-50 flex items-end justify-center pb-4 shadow-2xl"
            >
              <h2 className="text-4xl font-display font-bold text-white tracking-widest uppercase">The Truth</h2>
            </motion.div>
            <motion.div
              key="curtain-bottom"
              exit={{ y: '100%' }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="fixed bottom-0 left-0 right-0 h-1/2 bg-kerala-green border-t border-mural-gold/50 z-50 flex items-start justify-center pt-4 shadow-2xl"
            >
              <div className="w-16 h-1 bg-white/20 mx-auto overflow-hidden rounded-full">
                <motion.div initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-full h-full bg-mural-gold" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full w-full py-8 gap-4 overflow-hidden relative">
        <Embers team={winningTeam} count={30} />

        {enableScoreboard && (
          <div className="flex bg-black/30 rounded-xl p-1 shrink-0 border border-white/5 mx-4 shadow-inner relative z-10">
            <button onClick={() => setActiveTab('current')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'current' ? 'bg-white/10 text-white shadow-sm' : 'text-coconut/50'}`}>Current Incident</button>
            <button onClick={() => setActiveTab('awards')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'awards' ? 'bg-white/10 text-mural-gold shadow-sm' : 'text-coconut/50'}`}>Panchayat Honors</button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-6 relative z-10">
          <AnimatePresence mode="wait">
            {activeTab === 'current' ? (
              <motion.div key="current" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6">

                <div className="text-center shrink-0 mt-2 relative">
                  {getWinnerIcon()}
                  <h2 className={`text-4xl font-display font-black tracking-tight mb-2 ${getWinnerColor()}`}>{winner}</h2>
                  <p className="text-coconut/80 font-bold px-4 text-sm">{winReason}</p>
                  {gossipText && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                      className="mt-4 bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-3 inline-block"
                    >
                      <p className="text-sm italic text-mural-gold font-medium">"{gossipText}"</p>
                    </motion.div>
                  )}

                  {/* XP + MVP earn strip */}
                  <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                    {roundXpGained > 0 && (
                      <motion.span
                        initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.8, type: 'spring' }}
                        className="inline-flex items-center gap-1 bg-mural-gold/15 border border-mural-gold/40 text-mural-gold text-xs font-bold px-3 py-1.5 rounded-full"
                      >
                        <Sparkles size={13} /> +{roundXpGained} Village XP
                      </motion.span>
                    )}
                    {mvpName && (
                      <motion.span
                        initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.0, type: 'spring' }}
                        className="inline-flex items-center gap-1 bg-white/10 border border-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full"
                      >
                        <Crown size={13} className="text-mural-gold" /> MVP: {mvpName}
                      </motion.span>
                    )}
                  </div>

                  <div className="mt-6 flex flex-col items-center justify-center gap-2 text-sm font-mono bg-black/30 border border-white/10 rounded-lg py-3 px-4 w-full max-w-sm mx-auto shadow-inner">
                    <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-4 text-center break-words w-full">
                      <span className="text-mural-gold">Nattukar: <span className="font-bold">{nattukar[0]?.word}</span></span>
                      <span className="opacity-30 hidden sm:inline">|</span>
                      <span className="text-theyyam-red">Kallan: <span className="font-bold">{kallans[0]?.word}</span></span>
                    </div>
                    <div className="text-xs text-coconut/50 flex items-center gap-1 mt-1 border-t border-white/10 pt-2 w-full justify-center">
                      Difficulty: {Array.from({ length: activeDifficulty }).map((_, i) => <span key={i}>🌶️</span>)}
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-6 flex flex-col gap-6">
                  <div>
                    <h4 className="text-xs uppercase tracking-widest text-theyyam-red font-bold mb-3 border-b border-white/10 pb-1">The Kallan(s)</h4>
                    <div className="flex flex-col gap-2">
                      {kallans.map(k => {
                        const pStreak = scores[k.id]?.winStreak || 0;
                        return (
                          <div key={k.id} className="flex justify-between items-center">
                            <span className={`font-bold flex items-center gap-2 ${k.eliminated ? 'opacity-50 line-through' : ''}`}>
                              <div className="w-6 h-6 rounded-full bg-theyyam-red/20 border border-theyyam-red flex items-center justify-center text-[10px] text-theyyam-red">K</div>
                              {k.name}
                              {pStreak >= 3 && <Flame size={14} className="text-theyyam-red animate-pulse" />}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {enablePottan && pottan && (
                    <div>
                      <h4 className="text-xs uppercase tracking-widest text-green-400 font-bold mb-3 border-b border-white/10 pb-1">The Pottan</h4>
                      <div className="flex justify-between items-center">
                        <span className={`font-bold flex items-center gap-2 ${pottan.eliminated ? 'opacity-50 line-through' : ''}`}>
                          <div className="w-6 h-6 rounded-full bg-green-400/20 border border-green-400 flex items-center justify-center text-[10px] text-green-400">P</div>
                          {pottan.name}
                          {(scores[pottan.id]?.winStreak || 0) >= 3 && <Flame size={14} className="text-theyyam-red animate-pulse" />}
                        </span>
                        <span className="text-xs opacity-50 italic text-coconut/50">No word</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-xs uppercase tracking-widest text-mural-gold font-bold mb-3 border-b border-white/10 pb-1">The Nattukar</h4>
                    <div className="flex flex-wrap gap-2">
                      {nattukar.map(n => {
                        const pStreak = scores[n.id]?.winStreak || 0;
                        return (
                          <span key={n.id} className={`bg-black/30 border border-white/5 px-2 py-1 rounded text-sm flex items-center gap-1 ${n.eliminated ? 'opacity-50 line-through text-theyyam-red border-theyyam-red/30' : ''}`}>
                            {n.name}
                            {pStreak >= 3 && <Flame size={12} className="text-theyyam-red animate-pulse" />}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {winningTeam && (
                  <div className="bg-mural-gold/10 border border-mural-gold/30 rounded-xl overflow-hidden transition-all shadow-sm">
                    <button
                      onClick={() => setShowPunishment(!showPunishment)}
                      className="w-full p-4 flex justify-between items-center font-bold text-mural-gold text-sm uppercase active:bg-white/5"
                    >
                      View {winningTeam === 'pottan' ? "Village & Kallans'" : (winningTeam === 'kallans' ? "Village's" : "Kallan's")} Punishment
                      {showPunishment ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <AnimatePresence>
                      {showPunishment && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                          <div className="p-4 pt-0 text-sm italic text-coconut/80 text-center border-t border-mural-gold/10">
                            "{randomPunishment}"
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="awards" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col gap-4">
                <div className="text-center mt-2 mb-4">
                  <Trophy size={40} className="text-mural-gold mx-auto mb-2" />
                  <h2 className="text-2xl font-display font-bold">Panchayat Honors</h2>
                  <p className="text-xs text-coconut/50">Cumulative stats for this village</p>
                </div>

                <div className="flex flex-col gap-3">
                  {getAwards().map((award, i) => {
                    const Icon = award.icon;
                    return (
                      <div key={i} className="glass-panel p-4 flex items-center gap-4">
                        <div className={`p-3 bg-black/20 rounded-full ${award.color}`}><Icon size={24} /></div>
                        <div>
                          <h4 className="font-bold text-sm">{award.title}</h4>
                          <p className={`font-display font-black text-xl ${award.color}`}>{award.player}</p>
                          <p className="text-xs text-coconut/50">{award.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-black/20 rounded-xl p-4 border border-white/10 mt-4 shadow-inner">
                  <h3 className="text-mural-gold font-bold text-sm uppercase tracking-widest mb-3">Leaderboard</h3>
                  <div className="flex flex-col gap-2">
                    {leaderboard.map((p, idx) => {
                      const pStreak = p.stats.winStreak || 0;
                      return (
                        <div key={p.id} className={`flex justify-between items-center text-sm ${p.inRound ? '' : 'opacity-60'}`}>
                          <span className="flex items-center gap-2 font-medium">
                            <span className="text-white/30 w-4">{idx + 1}.</span>
                            {p.name}
                            {pStreak >= 3 && <span className="flex items-center text-xs text-theyyam-red ml-1"><Flame size={12} /> {pStreak}</span>}
                            {(p.stats.caughtKallans || 0) > 0 && (
                              <span className="flex items-center text-xs text-green-500 ml-2" title="Kallans Caught"><Target size={12} /> {p.stats.caughtKallans}</span>
                            )}
                          </span>
                          <span className="font-bold text-mural-gold bg-mural-gold/10 px-2 py-0.5 rounded shadow-sm">{p.stats.points || 0} pts</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-3 px-4 shrink-0 mt-auto border-t border-white/5 pt-4 relative z-10">
          <button onClick={() => { SFX.swoosh(); Haptics.light(); resetGame(); }} className="bg-white/10 p-4 rounded-xl flex items-center justify-center active:scale-95 transition-all text-coconut/80 hover:text-white shadow-sm" aria-label="Back to setup">
            <Home size={24} />
          </button>
          <button onClick={() => {
            SFX.swoosh(); Haptics.light();
            if (autoTimerRef.current) clearInterval(autoTimerRef.current);
            playAgainSamePlayers();
          }} className="btn-primary flex-1 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(244,162,97,0.2)]">
            <RotateCcw size={20} /> PLAY AGAIN
          </button>
          <button
            onClick={startAutoRematch}
            className={`px-4 rounded-xl flex items-center justify-center gap-1 font-bold text-sm active:scale-95 transition-all shadow-sm ${autoCountdown !== null ? 'bg-theyyam-red text-white' : 'bg-white/10 text-mural-gold hover:bg-white/20'}`}
            aria-label="Auto rematch"
          >
            {autoCountdown !== null ? autoCountdown : <Flame size={20} />}
          </button>
        </div>
      </motion.div>
    </>
  );
};

// Small fallback so leaderboard rows for players not in the current round still
// render a name if one isn't resolvable (defensive; normally unused).
const villageNameFallback = () => 'Nattukaran';

// Gossip line generator (kept as a pure helper so the effect stays lean).
function buildGossip({ winningTeam, wrongfulKills, kallans, pottan }) {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  if (winningTeam === 'pottan') {
    return pick([
      `${pottan?.name} completely fooled the village! Award for Best Actor goes right here.`,
      `Everyone played right into ${pottan?.name}'s hands. Fahadh Faasil is shivering.`,
      `${pottan?.name} masterfully acted their way to victory! Pure Udayippu.`,
      `The village was played like a fiddle by ${pottan?.name}. "Eda mone!"`,
      `An absolute masterclass in deception by ${pottan?.name}. Mohanlal level acting!`,
      `${pottan?.name} be like: "I am the real Killadi!"`,
      `${pottan?.name} pulled the ultimate Ramanan on you all.`,
      `"Savari Giri Giri..." ${pottan?.name} just scammed the entire village!`,
      `A massive build-up by the village, but ${pottan?.name} gets the last laugh.`,
    ]);
  }

  if (winningTeam === 'nattukar') {
    if (wrongfulKills.length === 0) {
      return pick([
        'A flawless witch-hunt! Perfect execution by the Nattukar.',
        'The Nattukar were united and ruthless. Kattapparai Shubham!',
        'No innocent blood was shed today. CID Dasan and Vijayan would be proud.',
        'The village struck with terrifying precision. Pwoli sanam!',
        'Justice was swift and accurate. The Kallans didn\'t stand a chance.',
        'Clean sweep! The Kallans were smoked out like kothuku thiri.',
        'Zero casualties. The village was acting like prime Georgekutty today.',
        'Mass entry by the Nattukar! The Kallans got completely theppu-ed.',
      ]);
    }
    return pick([
      `${wrongfulKills[0].name} was wrongfully sacrificed for this victory. Oru abadham pattiyea...`,
      `The village won, but at the cost of ${wrongfulKills[0].name}'s life. Pure Daridryam.`,
      `${wrongfulKills[0].name} was collateral damage. A massive pani for them.`,
      `Justice was served, but ${wrongfulKills[0].name} paid the ultimate price.`,
      `Victory is sweet, but ${wrongfulKills[0].name} won't be around to enjoy it. RIP chunk.`,
      `The Nattukar survived, but they did ${wrongfulKills[0].name} dirty.`,
      `Sorry ${wrongfulKills[0].name}, you were the 'Kozhi' that got sacrificed for this Biriyani.`,
      `Task failed successfully. We won, but ${wrongfulKills[0].name} got the ultimate theppu.`,
    ]);
  }

  if (winningTeam === 'kallans') {
    if (kallans.every(k => !k.eliminated)) {
      return pick([
        'The Kallans manipulated everyone perfectly. Kola Mass!',
        'An absolute massacre by the Kallans. The village got wiped out.',
        'The village never suspected a thing. Pure Kallatharam.',
        'The Kallans danced around the Nattukar effortlessly.',
        'A flawless victory for the shadows. Mangalassery Neelakandan vibes.',
        'The Kallans were moving like Minnal Murali. Nattukar didn\'t see it coming.',
        'Absolute scene! The Kallans served the Nattukar an absolute Sadhya of deception.',
        '"Rameshan, njan innale paranju..." The Kallans played the Nattukar beautifully.',
      ]);
    }
    return pick([
      'The Kallans barely escaped with their lives! Shokam scene.',
      'A messy, chaotic victory for the Kallans. But a win is a win!',
      'The Kallans won, but it cost them dearly. Adipoli survival though.',
      'They survived by the skin of their teeth. Sweating like they just ran for a KSRTC bus.',
      'A bloodbath that the Kallans barely survived. Pure luck, Aliyans.',
      'The Kallans pulled through, but it was an absolute comedy of errors.',
      'Half the squad is gone, but the Kallans still delivered the final blow.',
      'A messy win for the Kallans. Someone cue the tragic BGM.',
    ]);
  }

  return '';
}

export default ResultsPhase;
