import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { generateGameRoles } from './utils/gameLogic';
import { useLocalStorage } from './utils/useLocalStorage';

const GameContext = createContext();

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

  // Profile-specific progress
  const [roundCount, setRoundCount] = useLocalStorage(`kn_roundCount_${activeProfileId}`, 0);

  // Current round data
  const [gameState, setGameState] = useState('setup'); 
  const [assignedRoles, setAssignedRoles] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [activeDifficulty, setActiveDifficulty] = useState(1);
  const [pottanStoleWin, setPottanStoleWin] = useState(false);
  const [gossipText, setGossipText] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // History API Back Button Intercept
  useEffect(() => {
    const handlePopState = (e) => {
      e.preventDefault();
      if (gameState !== 'setup') {
        setGameState('setup');
      }
    };
    // If we transition FROM setup TO playing, add a history entry so Back works
    if (gameState === 'pass') {
      window.history.pushState({ page: 'playing' }, null, window.location.href);
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [gameState, setGameState]);

  // Legacy score migration
  const migratedProfiles = useRef(new Set());
  useEffect(() => {
    if (migratedProfiles.current.has(activeProfileId)) return;
    migratedProfiles.current.add(activeProfileId);
    
    setScores(prevScores => {
      let migrated = false;
      const newScores = { ...prevScores };
      Object.keys(newScores).forEach(key => {
        if (typeof newScores[key] === 'number') {
          newScores[key] = { points: newScores[key], timesKallan: 0, timesPottan: 0, wrongfulDeaths: 0, winStreak: 0, caughtKallans: 0 };
          migrated = true;
        } else if (newScores[key] && newScores[key].caughtKallans === undefined) {
          newScores[key].caughtKallans = 0;
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
    
    if (enableScoreboard) {
      setScores(prevScores => {
        const newScores = { ...prevScores };
        players.forEach(p => {
          if (typeof newScores[p.id] === 'number') {
            newScores[p.id] = { points: newScores[p.id], timesKallan: 0, timesPottan: 0, wrongfulDeaths: 0, winStreak: 0, caughtKallans: 0 };
          } else if (!newScores[p.id]) {
            newScores[p.id] = { points: 0, timesKallan: 0, timesPottan: 0, wrongfulDeaths: 0, winStreak: 0, caughtKallans: 0 };
          } else if (newScores[p.id].caughtKallans === undefined) {
            newScores[p.id].caughtKallans = 0;
          }
        });
        
        roles.forEach(p => {
          newScores[p.id] = { ...newScores[p.id] };
          if (p.role === 'Kallan') newScores[p.id].timesKallan += 1;
          if (p.role === 'Pottan') newScores[p.id].timesPottan += 1;
        });
        
        return newScores;
      });
    }
    
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
  
  const updateScores = (pointAssignments) => {
    if (!enableScoreboard) return;
    setScores(prev => {
      const newScores = { ...prev };
      pointAssignments.forEach(pa => {
        const playerStats = newScores[pa.id] ? { ...newScores[pa.id] } : { points: 0, timesKallan: 0, timesPottan: 0, wrongfulDeaths: 0, winStreak: 0, caughtKallans: 0 };
        
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
  };

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
