import React, { createContext, useContext } from 'react';
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

  // Scoreboard Object: { playerId: score }
  const [scores, setScores] = useLocalStorage('kn_scores', {});

  // Current round data
  const [assignedRoles, setAssignedRoles] = useLocalStorage('kn_assignedRoles', []); 
  const [activeCategory, setActiveCategory] = useLocalStorage('kn_activeCategory', null);

  const startGame = () => {
    const { roles, category } = generateGameRoles(players, imposterCount, enablePottan, selectedCategories);
    setAssignedRoles(roles);
    setActiveCategory(category);
    
    // Initialize scores for new players
    if (enableScoreboard) {
      const newScores = { ...scores };
      players.forEach(p => {
        if (newScores[p.id] === undefined) newScores[p.id] = 0;
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
        newScores[pa.id] = (newScores[pa.id] || 0) + pa.points;
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
