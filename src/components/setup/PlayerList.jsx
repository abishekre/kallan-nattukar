import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, X } from 'lucide-react';
import { useGame } from '../../GameContext';
import { SFX, Haptics } from '../../utils/engine';

export const PlayerList = () => {
  const { players, setPlayers } = useGame();
  
  const [newPlayerName, setNewPlayerName] = useState('');
  const [duplicateError, setDuplicateError] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const handleEditComplete = (player) => {
    const newName = editName.trim();
    if (!newName) {
      setEditingId(null);
      return;
    }
    
    if (players.some(p => p.id !== player.id && p.name.toLowerCase() === newName.toLowerCase())) {
      setDuplicateError(true);
      Haptics.heavy();
      setTimeout(() => setDuplicateError(false), 500);
      // Revert name if duplicate
      setEditName(player.name);
      return;
    }

    setPlayers(players.map(p => p.id === player.id ? { ...p, name: newName } : p));
    setEditingId(null);
  };

  const addPlayer = (e) => {
    e.preventDefault();
    if (newPlayerName.trim()) {
      const name = newPlayerName.trim();
      if (players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        setDuplicateError(true);
        Haptics.heavy();
        setTimeout(() => setDuplicateError(false), 500);
        return;
      }
      if (players.length >= 20) {
        setDuplicateError(true); // Reusing this for the shake animation
        Haptics.heavy();
        setTimeout(() => setDuplicateError(false), 500);
        return;
      }
      setPlayers([...players, { id: crypto.randomUUID(), name }]);
      setNewPlayerName('');
      setDuplicateError(false);
      Haptics.light();
    }
  };

  const removePlayer = (id) => {
    setPlayers(players.filter(p => p.id !== id));
    if (editingId === id) setEditingId(null);
    Haptics.light();
  };

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Users className="text-mural-gold" size={20} />
        <h2 className="text-xl font-display font-bold text-white">The Village</h2>
        <span className="ml-auto text-sm bg-mural-gold/20 text-mural-gold px-2 py-0.5 rounded-full font-bold">
          {players.length}
        </span>
      </div>

      <form onSubmit={addPlayer} className="flex flex-col gap-1 mb-3">
        <div className="flex gap-2">
          <motion.input 
            animate={duplicateError ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
            type="text" value={newPlayerName} onChange={(e) => { setNewPlayerName(e.target.value); setDuplicateError(false); }}
            placeholder="Add Nattukaran name..."
            className={`flex-1 bg-black/30 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-mural-gold text-white shadow-inner ${duplicateError ? 'border-theyyam-red text-theyyam-red' : 'border-white/10'}`}
          />
          <button type="submit" aria-label="Add player" disabled={!newPlayerName.trim() || players.length >= 20} className="bg-mural-gold text-kerala-green p-3 rounded-xl disabled:opacity-50 font-bold active:scale-95 transition-transform shadow-[0_0_15px_rgba(244,162,97,0.3)]">
            <UserPlus size={20} />
          </button>
        </div>
        <AnimatePresence>
          {duplicateError && <motion.span key="dup-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-theyyam-red ml-2">{players.length >= 20 ? 'Maximum 20 players allowed!' : 'Name already exists!'}</motion.span>}
        </AnimatePresence>
      </form>

      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {players.map((player, idx) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, x: -20 }} 
                animate={{ opacity: 1, scale: 1, x: 0 }} 
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: "spring", damping: 15, delay: idx * 0.05 }}
                key={player.id} 
                className="bg-white/10 pl-3 pr-1 py-1 rounded-full flex items-center gap-2 text-sm border border-white/5 backdrop-blur-sm"
              >
                {editingId === player.id ? (
                  <input 
                    type="text" autoFocus value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => handleEditComplete(player)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.target.blur(); // Blurring triggers onBlur which calls handleEditComplete
                      } else if (e.key === 'Escape') {
                        setEditingId(null);
                      }
                    }}
                    className={`bg-kerala-green border rounded px-2 py-0.5 w-24 outline-none font-bold text-sm ${duplicateError && editingId === player.id ? 'border-theyyam-red text-theyyam-red' : 'border-mural-gold/50 text-mural-gold'}`}
                  />
                ) : (
                  <span className="font-medium flex items-center gap-1 cursor-pointer hover:text-mural-gold transition-colors" onClick={() => { setEditingId(player.id); setEditName(player.name); }}>
                    {player.name}
                  </span>
                )}
                <button aria-label="Remove player" onClick={() => removePlayer(player.id)} className="p-1.5 text-coconut/50 hover:text-theyyam-red hover:bg-theyyam-red/10 rounded-full transition-colors">
                  <X size={14} />
                </button>
              </motion.div>
            ))}
        </AnimatePresence>
      </div>
    </section>
  );
};
