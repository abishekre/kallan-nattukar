import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users as UsersIcon, X, Check, PlusCircle, Trash2, Edit2 } from 'lucide-react';
import { useGame } from '../../GameContext';
import { Haptics, generateId } from '../../utils/engine';

export const GroupProfilesManager = ({ showProfiles, setShowProfiles }) => {
  const { profiles, setProfiles, activeProfileId, setActiveProfileId } = useGame();
  const [newProfileName, setNewProfileName] = useState('');
  const [editingProfileId, setEditingProfileId] = useState(null);
  const [editProfileName, setEditProfileName] = useState('');

  const createProfile = () => {
    if (newProfileName.trim()) {
      const newId = generateId();
      setProfiles([...profiles, { id: newId, name: newProfileName.trim() }]);
      setActiveProfileId(newId);
      setNewProfileName('');
      setShowProfiles(false);
      Haptics.heavy();
    }
  };

  const handleDeleteProfile = (id, e) => {
    e.stopPropagation();
    if (profiles.length <= 1) return; // Prevent deleting the last profile
    
    // Cleanup storage first (players, scores, progress + progression keys)
    try {
      localStorage.removeItem(`kn_players_${id}`);
      localStorage.removeItem(`kn_scores_${id}`);
      localStorage.removeItem(`kn_roundCount_${id}`);
      localStorage.removeItem(`kn_villageXp_${id}`);
      localStorage.removeItem(`kn_achievements_${id}`);
      localStorage.removeItem(`kn_chronicle_${id}`);
    } catch {
      /* storage unavailable — non-critical */
    }

    const remaining = profiles.filter(p => p.id !== id);
    setProfiles(remaining);
    
    if (activeProfileId === id) {
      setActiveProfileId(remaining[0].id);
    }
    
    Haptics.light();
  };

  const handleRenameSubmit = (id) => {
    if (editProfileName.trim()) {
      setProfiles(profiles.map(p => p.id === id ? { ...p, name: editProfileName.trim() } : p));
    }
    setEditingProfileId(null);
  };

  return (
    <AnimatePresence>
      {showProfiles && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[50] flex items-center justify-center p-4 bg-kerala-green/90 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-kerala-green-light border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><UsersIcon className="text-mural-gold"/> Villages</h3>
              <button aria-label="Close villages" onClick={() => setShowProfiles(false)} className="text-coconut/50 hover:text-white"><X size={24} /></button>
            </div>
            <p className="text-sm text-coconut/80 mb-4">Switch villages to keep Nattukar names and scores separate.</p>
            
            <div className="space-y-2 mb-4 max-h-[40vh] overflow-y-auto pr-1">
              {profiles.map(p => (
                <div 
                  key={p.id}
                  className={`w-full p-2 pl-3 rounded-xl text-left border transition-all flex justify-between items-center ${activeProfileId === p.id ? 'bg-mural-gold/20 border-mural-gold text-mural-gold' : 'bg-black/20 border-white/10 text-white hover:bg-white/5'}`}
                >
                  {editingProfileId === p.id ? (
                    <input
                      type="text"
                      autoFocus
                      value={editProfileName}
                      onChange={(e) => setEditProfileName(e.target.value)}
                      onBlur={() => handleRenameSubmit(p.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.target.blur();
                        if (e.key === 'Escape') setEditingProfileId(null);
                      }}
                      className="bg-black/40 border border-mural-gold/50 rounded px-2 py-1 flex-1 outline-none font-bold text-sm text-white"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <button 
                      type="button" 
                      onClick={() => { setActiveProfileId(p.id); setShowProfiles(false); }}
                      className="font-bold flex-1 truncate text-left outline-none focus-visible:text-mural-gold hover:text-mural-gold transition-colors"
                    >
                      {p.name}
                    </button>
                  )}

                  {editingProfileId !== p.id && (
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingProfileId(p.id); setEditProfileName(p.name); }}
                        className="p-1.5 text-coconut/50 hover:text-mural-gold rounded-full"
                        aria-label="Rename village"
                      >
                        <Edit2 size={16} />
                      </button>
                      
                      <button 
                        onClick={(e) => handleDeleteProfile(p.id, e)}
                        disabled={profiles.length <= 1}
                        className="p-1.5 text-coconut/50 hover:text-theyyam-red disabled:opacity-30 rounded-full"
                        aria-label="Delete village"
                      >
                        <Trash2 size={16} />
                      </button>

                      {activeProfileId === p.id && (
                        <span className="text-xs bg-mural-gold text-kerala-green px-1.5 py-1.5 rounded-full ml-1"><Check size={14} strokeWidth={3}/></span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-black/20 p-3 rounded-xl border border-white/5">
              <p className="text-xs text-coconut/50 mb-2 uppercase tracking-widest font-bold">Found a New Village</p>
              <div className="flex gap-2">
                <input 
                  type="text" placeholder="e.g. Office Desham" value={newProfileName} onChange={e => setNewProfileName(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-mural-gold text-white"
                />
                <button aria-label="Create village" onClick={createProfile} disabled={!newProfileName.trim()} className="bg-mural-gold text-kerala-green p-2 rounded-lg disabled:opacity-50">
                  <PlusCircle size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
