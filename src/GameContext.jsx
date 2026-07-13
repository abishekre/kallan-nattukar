import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { generateGameRoles, calculateScores } from './utils/gameLogic';
import { useLocalStorage } from './utils/useLocalStorage';
import {
  makePlayerStats, computeRoundXp, getRankForXp, detectNewAchievements
} from './utils/progression';
import {
  buildChronicleEntry, addChronicleEntry, updateDailyStreak
} from './utils/chronicle';

const GameContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  // Group Profiles
  const [profiles, setProfiles] = useLocalStorage('kn_profiles', [{ id: 'default', name: 'Default Village' }]);
  const [activeProfileId, setActiveProfileId] = useLocalStorage('kn_activeProfile', 'default');

  // Profile-specific state
  const [players, setPlayers] = useLocalStorage(`kn_players_${activeProfileId}`, [
    { id: '11111111-1111-1111-1111-111111111111', name: 'Dasan' },
    { id: '22222222-2222-2222-2222-222222222222', name: 'Vijayan' },
    { id: '33333333-3333-3333-3333-333333333333', name: 'Ramanan' }
  ]);
  const [scores, setScores] = useLocalStorage(`kn_scores_${activeProfileId}`, {});

  // Global Settings
  const [imposterCount, setImposterCount] = useLocalStorage('kn_imposterCount', 1);
  const [enablePottan, setEnablePottan] = useLocalStorage('kn_enablePottan', false);
  const [pottanHint, setPottanHint] = useLocalStorage('kn_pottanHint', 'blind'); // 'none', 'blind', 'category'
  const [selectedCategories, setSelectedCategories] = useLocalStorage('kn_categories', ['Sadhya & Thattukada']);
  const [customCategoriesData, setCustomCategoriesData] = useLocalStorage('kn_customCategoriesData', {});
  const [timerDuration, setTimerDuration] = useLocalStorage('kn_timerDuration', 180); // 0 means disabled
  const [multiRoundVoting, setMultiRoundVoting] = useLocalStorage('kn_multiRoundVoting', false);
  const [enableScoreboard, setEnableScoreboard] = useLocalStorage('kn_enableScoreboard', true);
  const [enableCaughtBy, setEnableCaughtBy] = useLocalStorage('kn_enableCaughtBy', false);
  const [enableAudio, setEnableAudio] = useLocalStorage('kn_enableAudio', true);
  const [wordDifficulty, setWordDifficulty] = useLocalStorage('kn_wordDifficulty', 'all');

  // Profile-specific progress + progression
  const [roundCount, setRoundCount] = useLocalStorage(`kn_roundCount_${activeProfileId}`, 0);
  const [villageXp, setVillageXp] = useLocalStorage(`kn_villageXp_${activeProfileId}`, 0);
  const [villageAchievements, setVillageAchievements] = useLocalStorage(`kn_achievements_${activeProfileId}`, {});
  const [chronicle, setChronicle] = useLocalStorage(`kn_chronicle_${activeProfileId}`, []);

  // Global habit streak (spans all villages)
  const [dailyStreak, setDailyStreak] = useLocalStorage('kn_dailyStreak', { current: 0, best: 0, lastDay: null });

  // Current round data
  const [gameState, setGameState] = useState('setup');
  const [assignedRoles, setAssignedRoles] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [activeDifficulty, setActiveDifficulty] = useState(1);
  const [pottanStoleWin, setPottanStoleWin] = useState(false);
  const [gossipText, setGossipText] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Transient celebration events (surfaced by a global overlay in App)
  const [levelUpEvent, setLevelUpEvent] = useState(null);
  const [achievementToasts, setAchievementToasts] = useState([]);

  // History API Back Button Intercept.
  // We keep a single "trap" entry in the history stack whenever the game is in
  // any phase other than setup. Pressing Back consumes the trap and returns the
  // player to setup instead of leaving the app. The trap is re-armed each time
  // we leave setup again.
  useEffect(() => {
    // Any Back press while in-game consumes the trap entry and returns to setup
    // rather than leaving the app.
    const handlePopState = () => setGameState('setup');
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (gameState !== 'setup') {
      const hasTrap = window.history.state && window.history.state.knTrap;
      if (!hasTrap) {
        window.history.pushState({ knTrap: true }, '');
      }
    }
  }, [gameState]);

  // Legacy score migration — upgrade old number/partial stats to the full shape.
  const migratedProfiles = useRef(new Set());
  useEffect(() => {
    if (migratedProfiles.current.has(activeProfileId)) return;
    migratedProfiles.current.add(activeProfileId);

    setScores(prevScores => {
      let migrated = false;
      const newScores = { ...prevScores };
      Object.keys(newScores).forEach(key => {
        const val = newScores[key];
        if (typeof val === 'number') {
          newScores[key] = makePlayerStats({ points: val });
          migrated = true;
        } else if (val && (val.roundsPlayed === undefined || val.kallanWins === undefined || val.caughtKallans === undefined || val.bestStreak === undefined)) {
          newScores[key] = makePlayerStats(val);
          migrated = true;
        }
      });
      return migrated ? newScores : prevScores;
    });
  }, [activeProfileId, setScores]);

  const startGame = () => {
    const maxImposters = enablePottan ? Math.max(1, players.length - 2) : Math.max(1, players.length - 1);
    const safeImposterCount = Math.min(imposterCount, maxImposters);
    if (imposterCount > safeImposterCount) {
      setImposterCount(safeImposterCount);
    }

    const gameRolesResult = generateGameRoles(players, safeImposterCount, enablePottan, selectedCategories, customCategoriesData, wordDifficulty);
    if (!gameRolesResult) return;

    setRoundCount(prev => prev + 1);
    setPottanStoleWin(false);
    setGossipText('');

    const { roles, category, difficulty } = gameRolesResult;
    setAssignedRoles(roles);
    setActiveCategory(category);
    setActiveDifficulty(difficulty);

    // Ensure every player has a stats object and log role assignment counts.
    setScores(prevScores => {
      const newScores = { ...prevScores };
      players.forEach(p => {
        const existing = newScores[p.id];
        newScores[p.id] = typeof existing === 'number'
          ? makePlayerStats({ points: existing })
          : makePlayerStats(existing || {});
      });
      roles.forEach(p => {
        newScores[p.id] = { ...newScores[p.id] };
        if (p.role === 'Kallan') newScores[p.id].timesKallan += 1;
        if (p.role === 'Pottan') newScores[p.id].timesPottan += 1;
      });
      return newScores;
    });

    setGameState('pass');
  };

  const markPlayerRevealed = (playerId) => {
    setAssignedRoles(prev => prev.map(p =>
      p.id === playerId ? { ...p, revealed: true } : p
    ));
  };

  const eliminatePlayer = (playerId, caughtBy = null) => {
    setAssignedRoles(prev => prev.map(p =>
      p.id === playerId ? { ...p, eliminated: true, caughtBy } : p
    ));
  };

  // Kept for backward compatibility; new flow uses finalizeRound.
  const updateScores = (pointAssignments) => {
    if (!enableScoreboard) return;
    setScores(prev => {
      const newScores = { ...prev };
      pointAssignments.forEach(pa => {
        const playerStats = newScores[pa.id] ? { ...newScores[pa.id] } : makePlayerStats();
        if (pa.points) playerStats.points += pa.points;
        if (pa.wrongfulDeath) playerStats.wrongfulDeaths += 1;
        if (pa.caughtKallans) playerStats.caughtKallans += pa.caughtKallans;
        if (pa.result === 'win') {
          playerStats.winStreak = (playerStats.winStreak || 0) + 1;
        } else if (pa.result === 'loss') {
          playerStats.winStreak = 0;
        }
        newScores[pa.id] = playerStats;
      });
      return newScores;
    });
  };

  // Single end-of-round bookkeeping entry point. Must be called exactly once per
  // round (ResultsPhase guards this with a ref). Returns celebration data.
  const finalizeRound = ({ winningTeam, winner }) => {
    const now = Date.now();
    if (!winningTeam) {
      return { levelUp: null, newAchievements: [], prevXp: villageXp, roundXp: 0, newXp: villageXp, mvpName: null };
    }

    const pointAssignments = enableScoreboard
      ? calculateScores({ assignedRoles, winningTeam, enableScoreboard })
      : [];
    const paById = Object.fromEntries(pointAssignments.map(pa => [pa.id, pa]));

    // Build the next scores snapshot from the current one. The ref guard in the
    // caller guarantees this runs a single time, so reading `scores` directly
    // (rather than a functional updater) is safe and lets us derive XP,
    // achievements and MVP from the same computed result.
    const newScores = { ...scores };
    let roundXpTotal = 0;

    assignedRoles.forEach(p => {
      const existing = newScores[p.id];
      const base = typeof existing === 'number'
        ? makePlayerStats({ points: existing })
        : makePlayerStats(existing || {});
      const s = { ...base };
      const preStreak = base.winStreak || 0;

      const won =
        (winningTeam === 'nattukar' && p.role === 'Nattukaran') ||
        (winningTeam === 'kallans' && p.role === 'Kallan') ||
        (winningTeam === 'pottan' && p.role === 'Pottan');

      roundXpTotal += computeRoundXp({ role: p.role, eliminated: p.eliminated, winningTeam, winStreak: preStreak });

      s.roundsPlayed = (s.roundsPlayed || 0) + 1;

      if (enableScoreboard) {
        const pa = paById[p.id];
        if (pa) {
          if (pa.points) s.points += pa.points;
          if (pa.wrongfulDeath) s.wrongfulDeaths += 1;
          if (pa.caughtKallans) s.caughtKallans += pa.caughtKallans;
          if (pa.result === 'win') s.winStreak = preStreak + 1;
          else if (pa.result === 'loss') s.winStreak = 0;
        }
      } else {
        s.winStreak = won ? preStreak + 1 : 0;
      }

      if (won && p.role === 'Kallan') s.kallanWins = (s.kallanWins || 0) + 1;
      if (won && p.role === 'Pottan') s.pottanWins = (s.pottanWins || 0) + 1;
      s.bestStreak = Math.max(s.bestStreak || 0, s.winStreak);

      newScores[p.id] = s;
    });

    setScores(newScores);

    // Village XP + rank level-up detection.
    const prevRank = getRankForXp(villageXp);
    const newXp = villageXp + roundXpTotal;
    const nextRank = getRankForXp(newXp);
    setVillageXp(newXp);
    const levelUp = nextRank.index > prevRank.index ? { from: prevRank.rank, to: nextRank.rank } : null;

    // Achievement detection across all players in the round.
    const alreadyIds = Object.keys(villageAchievements || {});
    const newlyUnlocked = [];
    assignedRoles.forEach(p => {
      const seen = [...alreadyIds, ...newlyUnlocked.map(a => a.id)];
      const found = detectNewAchievements(newScores[p.id], seen);
      found.forEach(a => newlyUnlocked.push({ ...a, by: p.name }));
    });
    if (newlyUnlocked.length) {
      setVillageAchievements(prev => {
        const copy = { ...(prev || {}) };
        newlyUnlocked.forEach(a => { if (!copy[a.id]) copy[a.id] = { by: a.by, at: now }; });
        return copy;
      });
    }

    // Round MVP: winning-side player who gained the most points this round.
    let mvpName = null;
    if (enableScoreboard && pointAssignments.length) {
      const top = [...pointAssignments]
        .filter(pa => pa.result === 'win' && pa.points > 0)
        .sort((a, b) => b.points - a.points)[0];
      if (top) mvpName = assignedRoles.find(p => p.id === top.id)?.name || null;
    }

    // Chronicle entry.
    const kallansArr = assignedRoles.filter(p => p.role === 'Kallan');
    const pottanP = assignedRoles.find(p => p.role === 'Pottan');
    const nattukaranWord = assignedRoles.find(p => p.role === 'Nattukaran')?.word || kallansArr[0]?.word || '—';
    const entry = buildChronicleEntry({
      id: `${activeProfileId}-${roundCount}-${now}`,
      timestamp: now,
      round: roundCount,
      winner,
      winningTeam,
      category: activeCategory,
      difficulty: activeDifficulty,
      nattukaranWord,
      kallanWord: kallansArr[0]?.word || '—',
      kallans: kallansArr.map(k => k.name),
      pottan: pottanP?.name || null,
      mvpName,
    });
    setChronicle(prev => addChronicleEntry(prev, entry));

    // Daily habit streak.
    setDailyStreak(prev => updateDailyStreak(prev, now));

    // Surface celebrations to the global overlay.
    if (levelUp) setLevelUpEvent(levelUp);
    if (newlyUnlocked.length) setAchievementToasts(q => [...q, ...newlyUnlocked]);

    return { levelUp, newAchievements: newlyUnlocked, prevXp: villageXp, roundXp: roundXpTotal, newXp, mvpName };
  };

  const resetGame = () => {
    setAssignedRoles([]);
    setActiveCategory('');
    setActiveDifficulty(1);
    setPottanStoleWin(false);
    setGossipText('');
    setGameState('setup');
  };

  const playAgainSamePlayers = () => {
    startGame();
  };

  const clearCurrentScores = () => {
    setScores({});
    setVillageXp(0);
    setVillageAchievements({});
    setChronicle([]);
  };

  const dismissLevelUp = () => setLevelUpEvent(null);
  const shiftAchievementToast = () => setAchievementToasts(q => q.slice(1));

  const hardResetApp = () => {
    Object.keys(window.localStorage).forEach(key => {
      if (key.startsWith('kn_')) {
        window.localStorage.removeItem(key);
      }
    });
    window.location.reload();
  };

  const value = {
    gameState, setGameState,
    profiles, setProfiles,
    activeProfileId, setActiveProfileId,
    players, setPlayers,
    imposterCount, setImposterCount,
    enablePottan, setEnablePottan,
    selectedCategories, setSelectedCategories,
    customCategoriesData, setCustomCategoriesData,
    timerDuration, setTimerDuration,
    multiRoundVoting, setMultiRoundVoting,
    pottanHint, setPottanHint,
    enableScoreboard, setEnableScoreboard,
    enableCaughtBy, setEnableCaughtBy,
    enableAudio, setEnableAudio,
    wordDifficulty, setWordDifficulty,
    scores, setScores, updateScores,
    roundCount, setRoundCount,
    assignedRoles, setAssignedRoles,
    activeCategory, activeDifficulty,
    pottanStoleWin, setPottanStoleWin,
    gossipText, setGossipText,
    deferredPrompt, setDeferredPrompt,
    // Progression
    villageXp, villageAchievements, chronicle, dailyStreak,
    levelUpEvent, dismissLevelUp,
    achievementToasts, shiftAchievementToast,
    finalizeRound,
    startGame,
    markPlayerRevealed,
    eliminatePlayer,
    resetGame,
    playAgainSamePlayers,
    clearCurrentScores,
    hardResetApp
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};
