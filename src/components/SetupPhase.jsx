import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Settings, Play, X, Info, Edit2, Sliders, Trash2, BookOpen, PlusCircle } from 'lucide-react';
import { useGame } from '../GameContext';
import { WORD_BANK } from '../utils/gameLogic';
import { SFX, Haptics } from '../utils/engine';

const SetupPhase = () => {
  const { 
    players, setPlayers, 
    imposterCount, setImposterCount,
    enablePottan, setEnablePottan,
    selectedCategories, setSelectedCategories,
    customWords, setCustomWords,
    enableTimer, setEnableTimer,
    multiRoundVoting, setMultiRoundVoting,
    pottanCheatSheet, setPottanCheatSheet,
    enableScoreboard, setEnableScoreboard,
    startGame, hardResetApp, setGameState
  } = useGame();

  const [newPlayerName, setNewPlayerName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showCustomWords, setShowCustomWords] = useState(false);

  const [customWord1, setCustomWord1] = useState('');
  const [customWord2, setCustomWord2] = useState('');

  const maxKallans = Math.max(1, Math.ceil((players.length - (enablePottan ? 1 : 0)) / 2) - 1);

  useEffect(() => {
    if (imposterCount > maxKallans) {
      setImposterCount(maxKallans);
    }
  }, [players.length, enablePottan, maxKallans, imposterCount, setImposterCount]);

  const addPlayer = () => {
    if (newPlayerName.trim() && players.length < 20) {
      setPlayers([...players, { id: Date.now(), name: newPlayerName.trim() }]);
      setNewPlayerName('');
    }
  };

  const removePlayer = (id) => {
    if (players.length > 3) {
      setPlayers(players.filter(p => p.id !== id));
    }
  };

  const startEdit = (player) => {
    setEditingId(player.id);
    setEditName(player.name);
  };

  const saveEdit = (id) => {
    if (editName.trim()) {
      setPlayers(players.map(p => p.id === id ? { ...p, name: editName.trim() } : p));
    }
    setEditingId(null);
  };

  const toggleCategory = (category) => {
    if (selectedCategories.includes(category)) {
      if (selectedCategories.length > 1) {
        setSelectedCategories(selectedCategories.filter(c => c !== category));
      }
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const ToggleSwitch = ({ label, desc, checked, onChange }) => (
    <div className="flex justify-between items-center border-t border-white/5 pt-4 mt-4">
      <div className="pr-4">
        <span className="block font-medium">{label}</span>
        {desc && <span className="text-xs text-coconut/50 leading-tight block mt-1">{desc}</span>}
      </div>
      <label className="relative inline-flex items-center cursor-pointer shrink-0">
        <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
        <div className="w-11 h-6 bg-kerala-green-light rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-mural-gold after:border-mural-gold after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theyyam-red"></div>
      </label>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col gap-6 w-full pb-8"
    >
      <div className="text-center mt-8 relative">
        <button onClick={hardResetApp} className="absolute right-0 top-0 text-coconut/30 hover:text-theyyam-red transition-colors p-2">
          <Trash2 size={20} />
        </button>
        <h1 className="text-5xl font-black text-mural-gold mb-2 tracking-tighter">KALLAN <br/><span className="text-theyyam-red">&</span> NATTUKAR</h1>
        <p className="text-coconut/70 text-sm font-medium">The Kerala Pop Culture Imposter Game</p>
      </div>

      <div className="glass-panel p-5 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <Users className="text-mural-gold" size={20} />
          <h2 className="text-xl font-bold">Players ({players.length})</h2>
        </div>
        
        <div className="flex flex-col gap-2 mb-4 max-h-48 overflow-y-auto pr-2">
          <AnimatePresence>
            {players.map((player, idx) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, height: 0 }}
                key={player.id} 
                className="bg-kerala-green-light/80 border border-mural-gold/20 px-3 py-2 rounded-xl flex items-center justify-between"
              >
                {editingId === player.id ? (
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => saveEdit(player.id)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit(player.id)}
                    className="bg-kerala-green border border-mural-gold rounded px-2 py-1 w-full mr-2 text-white outline-none"
                    maxLength={15}
                  />
                ) : (
                  <span className="font-bold flex items-center gap-2" onDoubleClick={() => startEdit(player)}>
                    <span className="text-mural-gold/50 text-xs w-4">{idx + 1}.</span> 
                    {player.name}
                  </span>
                )}

                <div className="flex gap-2 text-coconut/50">
                  {editingId !== player.id && (
                    <button onClick={() => startEdit(player)} className="hover:text-mural-gold transition-colors p-1">
                      <Edit2 size={16} />
                    </button>
                  )}
                  {players.length > 3 && (
                    <button onClick={() => removePlayer(player.id)} className="hover:text-theyyam-red transition-colors p-1">
                      <X size={18} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="flex gap-2">
          <input 
            type="text" 
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
            placeholder="Add player name..."
            className="flex-1 bg-kerala-green/50 border border-mural-gold/20 rounded-xl px-4 py-2 focus:outline-none focus:border-mural-gold text-white"
            maxLength={15}
          />
          <button 
            onClick={addPlayer}
            disabled={!newPlayerName.trim() || players.length >= 20}
            className="bg-mural-gold text-kerala-green p-2 rounded-xl disabled:opacity-50 transition-transform active:scale-95 flex items-center justify-center w-12"
          >
            <UserPlus size={24} />
          </button>
        </div>
      </div>

      <div className="glass-panel p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings className="text-mural-gold" size={20} />
            <h2 className="text-xl font-bold">Game Settings</h2>
          </div>
          <button onClick={() => setShowAdvanced(!showAdvanced)} className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded transition-colors ${showAdvanced ? 'bg-mural-gold text-kerala-green' : 'bg-white/10 text-white/50'}`}>
            <Sliders size={12} /> {showAdvanced ? 'BASIC' : 'ADVANCED'}
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center mb-2">
            <div>
              <span className="block font-medium">Number of Kallans</span>
              <span className="text-xs text-coconut/50">Max {maxKallans} {players.length < 5 && '(Add players to increase)'}</span>
            </div>
            <div className="flex items-center gap-3 bg-kerala-green/50 rounded-lg p-1">
              <button 
                onClick={() => setImposterCount(Math.max(1, imposterCount - 1))}
                disabled={imposterCount <= 1}
                className="w-8 h-8 flex items-center justify-center bg-kerala-green-light rounded-md text-mural-gold font-bold active:scale-95 transition-transform disabled:opacity-30"
              >-</button>
              <span className="font-bold w-4 text-center">{imposterCount}</span>
              <button 
                onClick={() => setImposterCount(Math.min(maxKallans, imposterCount + 1))}
                disabled={imposterCount >= maxKallans}
                className="w-8 h-8 flex items-center justify-center bg-kerala-green-light rounded-md text-mural-gold font-bold active:scale-95 transition-transform disabled:opacity-30"
              >+</button>
            </div>
          </div>

          <ToggleSwitch 
            label="Include Pottan" 
            desc="1 player gets NO word. Pure chaos."
            checked={enablePottan} 
            onChange={() => setEnablePottan(!enablePottan)} 
          />

          <div className="border-t border-white/5 pt-4 mt-4">
            <span className="block font-medium mb-3 flex items-center gap-2">Word Categories <span className="text-xs font-normal text-coconut/50">(Select at least 1)</span></span>
            <div className="flex flex-wrap gap-2">
              {[...Object.keys(WORD_BANK), 'Custom'].map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    Haptics.light();
                    if (cat === 'Custom' && !selectedCategories.includes('Custom')) {
                      setShowCustomWords(true);
                    }
                    toggleCategory(cat);
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border active:scale-95 ${
                    selectedCategories.includes(cat) 
                      ? 'bg-mural-gold/20 border-mural-gold text-mural-gold' 
                      : 'bg-kerala-green/50 border-white/10 text-coconut/50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-2"
              >
                <div className="bg-black/20 rounded-xl p-4 mt-4 border border-white/5 space-y-1">
                  <h3 className="font-bold text-mural-gold text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Sliders size={14} /> Advanced Rules
                  </h3>
                  
                  <ToggleSwitch 
                    label="Multi-Round Voting" 
                    desc="Game continues until ALL Kallans are caught."
                    checked={multiRoundVoting} 
                    onChange={() => setMultiRoundVoting(!multiRoundVoting)} 
                  />
                  
                  <ToggleSwitch 
                    label="Enable Scoreboard" 
                    desc="Track points persistently across multiple rounds."
                    checked={enableScoreboard} 
                    onChange={() => setEnableScoreboard(!enableScoreboard)} 
                  />
                  
                  <ToggleSwitch 
                    label="Discussion Timer" 
                    desc="Adds a 3-minute visual countdown timer."
                    checked={enableTimer} 
                    onChange={() => setEnableTimer(!enableTimer)} 
                  />
                  
                  {enablePottan && (
                    <ToggleSwitch 
                      label="Pottan's Cheat Sheet" 
                      desc="Allows Pottan to peek at category words."
                      checked={pottanCheatSheet} 
                      onChange={() => setPottanCheatSheet(!pottanCheatSheet)} 
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <button 
        onClick={() => {
          Haptics.light();
          SFX.swoosh();
          startGame();
        }}
        className="btn-primary mt-2 flex items-center justify-center gap-2 text-lg w-full py-4 shadow-[0_0_30px_rgba(244,162,97,0.3)]"
      >
        <Play size={24} fill="currentColor" />
        START GAME
      </button>

      <div className="flex justify-between items-center mt-2 px-2">
        <button 
          onClick={() => { Haptics.light(); setShowRules(true); }}
          className="text-xs text-coconut/50 hover:text-mural-gold transition-colors font-medium flex items-center gap-1"
        >
          <BookOpen size={14} /> How to Play
        </button>
        <button 
          onClick={() => { Haptics.light(); setGameState('about'); }} 
          className="text-xs text-coconut/50 hover:text-mural-gold transition-colors font-medium"
        >
          Developed by Abishek
        </button>
      </div>

      {/* Rules Modal */}
      <AnimatePresence>
        {showRules && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-kerala-green/90 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-kerala-green-light border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative max-h-[80vh] overflow-y-auto"
            >
              <button onClick={() => setShowRules(false)} className="absolute top-4 right-4 text-coconut/50 hover:text-white">
                <X size={24} />
              </button>
              <h3 className="text-2xl font-display font-bold text-mural-gold mb-4">How to Play</h3>
              <div className="space-y-4 text-sm text-coconut/80 leading-relaxed">
                <p><strong>Nattukar:</strong> You will all receive the SAME secret word. Your goal is to figure out who the Kallan is.</p>
                <p><strong>Kallan:</strong> You will receive a SIMILAR, but different word. You must blend in and pretend you have the Nattukar's word.</p>
                <p><strong>Pottan (Optional):</strong> You have NO word. You are completely blind and must lie your way to survival.</p>
                <div className="bg-white/5 p-3 rounded-lg border border-white/10 mt-4">
                  <p className="font-bold text-theyyam-red mb-1">Sudden Death Mode</p>
                  <p className="text-xs">If "Multi-Round Voting" is OFF, catching ONE Kallan wins the game for Nattukar. But voting out ONE Nattukaran instantly loses the game!</p>
                </div>
                <p className="text-xs opacity-50 text-center mt-6">All settings and scores are securely saved locally on your device (localStorage).</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Words Modal */}
      <AnimatePresence>
        {showCustomWords && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-kerala-green/90 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-kerala-green-light border border-mural-gold/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-mural-gold">Custom Words</h3>
                <button onClick={() => setShowCustomWords(false)} className="text-coconut/50 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              <p className="text-sm text-coconut/80 mb-4">Add your own inside jokes! They will be saved to your device.</p>
              
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-2">
                {customWords.map((cw, i) => (
                  <div key={i} className="flex justify-between items-center bg-black/20 p-2 rounded-lg text-sm">
                    <span className="truncate">{cw.nattukaran} <span className="text-white/30">|</span> {cw.kallan}</span>
                    <button onClick={() => setCustomWords(customWords.filter((_, idx) => idx !== i))} className="text-theyyam-red/70 hover:text-theyyam-red p-1">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2 bg-white/5 p-3 rounded-xl border border-white/10">
                <input 
                  type="text" placeholder="Nattukar Word..." value={customWord1} onChange={e => setCustomWord1(e.target.value)}
                  className="bg-black/20 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-mural-gold text-white"
                />
                <input 
                  type="text" placeholder="Kallan Word..." value={customWord2} onChange={e => setCustomWord2(e.target.value)}
                  className="bg-black/20 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-mural-gold text-white"
                />
                <button 
                  onClick={() => {
                    if (customWord1.trim() && customWord2.trim()) {
                      setCustomWords([...customWords, { nattukaran: customWord1.trim(), kallan: customWord2.trim() }]);
                      setCustomWord1(''); setCustomWord2('');
                      Haptics.light();
                    }
                  }}
                  disabled={!customWord1.trim() || !customWord2.trim()}
                  className="w-full mt-2 bg-mural-gold/20 text-mural-gold font-bold p-2 rounded flex justify-center items-center gap-1 disabled:opacity-30"
                >
                  <PlusCircle size={16} /> ADD PAIR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default SetupPhase;
