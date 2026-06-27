import React, { createContext, useContext, useEffect } from 'react';
import { generateGameRoles } from './utils/gameLogic';
import { useLocalStorage } from './utils/useLocalStorage';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  const [gameState, setGameState] = useLocalStorage('kn_gameState', 'setup'); 
  const [players, setPlayers] = useLocalStorage('kn_players', [
    { id: 1, name: 'Dasan' }, 
    { id: 2, name: 'Vijayan' }, 
    { id: 3, name: 'Ramanan' }
  ]);
  const [imposterCount, setImposterCount] = useLocalStorage('kn_imposterCount', 1);
  const [enablePottan, setEnablePottan] = useLocalStorage('kn_enablePottan', false);
  const [selectedCategories, setSelectedCategories] = useLocalStorage('kn_selectedCategories', ['Food']);
  
  // Advanced Settings
  const [enableTimer, setEnableTimer] = useLocalStorage('kn_enableTimer', false);
  const [multiRoundVoting, setMultiRoundVoting] = useLocalStorage('kn_multiRoundVoting', false);
  const [pottanCheatSheet, setPottanCheatSheet] = useLocalStorage('kn_pottanCheatSheet', false);
  const [enableScoreboard, setEnableScoreboard] = useLocalStorage('kn_enableScoreboard', true);

  const [customWords, setCustomWords] = useLocalStorage('kn_customWords', []);

  // Scoreboard Object: { playerId: { points: 0, timesKallan: 0, timesPottan: 0, wrongfulDeaths: 0 } }
  const [scores, setScores] = useLocalStorage('kn_scores', {});

  // Current round data
  const [assignedRoles, setAssignedRoles] = useLocalStorage('kn_assignedRoles', []); 
  const [activeCategory, setActiveCategory] = useLocalStorage('kn_activeCategory', null);

  // History API Back Button Intercept
  useEffect(() => {
    const handlePopState = (e) => {
      e.preventDefault();
      if (gameState !== 'setup') {
        setGameState('setup');
      }
    };
    window.history.pushState(null, null, window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [gameState, setGameState]);

  const startGame = () => {
    // Generate roles passing customWords if needed
    const { roles, category } = generateGameRoles(players, imposterCount, enablePottan, selectedCategories, customWords);
    setAssignedRoles(roles);
    setActiveCategory(category);
    
    // Initialize scores & track roles for new round
    if (enableScoreboard) {
      const newScores = { ...scores };
      players.forEach(p => {
        // If it's a legacy number, convert it. If it doesn't exist, create it.
        if (typeof newScores[p.id] === 'number') {
          newScores[p.id] = { points: newScores[p.id], timesKallan: 0, timesPottan: 0, wrongfulDeaths: 0 };
        } else if (!newScores[p.id]) {
          newScores[p.id] = { points: 0, timesKallan: 0, timesPottan: 0, wrongfulDeaths: 0 };
        }
      });
      
      roles.forEach(p => {
        if (p.role === 'Kallan') newScores[p.id].timesKallan += 1;
        if (p.role === 'Pottan') newScores[p.id].timesPottan += 1;
      });
      
      setScores(newScores);
    }
    
    setGameState('pass');
  };

  const markPlayerRevealed = (playerId) => {
    setAssignedRoles(prev => prev.map(p => 
      p.id === playerId ? { ...p, revealed: true } : p
    ));
  };

  const eliminatePlayer = (playerId) => {
    setAssignedRoles(prev => prev.map(p => 
      p.id === playerId ? { ...p, eliminated: true } : p
    ));
  };
  
  const updateScores = (pointAssignments) => {
    if (!enableScoreboard) return;
    setScores(prev => {
      const newScores = { ...prev };
      pointAssignments.forEach(pa => {
        const playerStats = newScores[pa.id] ? { ...newScores[pa.id] } : { points: 0, timesKallan: 0, timesPottan: 0, wrongfulDeaths: 0 };
        if (pa.points) playerStats.points += pa.points;
        if (pa.wrongfulDeath) playerStats.wrongfulDeaths += 1;
        newScores[pa.id] = playerStats;
      });
      return newScores;
    });
  };

  const resetGame = () => {
    setAssignedRoles([]);
    setActiveCategory(null);
    setGameState('setup');
  };

  const playAgainSamePlayers = () => {
    setAssignedRoles([]);
    setActiveCategory(null);
    setGameState('setup');
  };

  const hardResetApp = () => {
    if (window.confirm("Are you sure you want to clear all data and scores?")) {
      window.localStorage.clear();
      window.location.reload();
    }
  };

  const value = {
    gameState, setGameState,
    players, setPlayers,
    imposterCount, setImposterCount,
    enablePottan, setEnablePottan,
    selectedCategories, setSelectedCategories,
    customWords, setCustomWords,
    enableTimer, setEnableTimer,
    multiRoundVoting, setMultiRoundVoting,
    pottanCheatSheet, setPottanCheatSheet,
    enableScoreboard, setEnableScoreboard,
    scores, setScores, updateScores,
    assignedRoles, setAssignedRoles,
    activeCategory,
    startGame,
    markPlayerRevealed,
    eliminatePlayer,
    resetGame,
    playAgainSamePlayers,
    hardResetApp
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};
