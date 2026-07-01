import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit2, Trash2 } from 'lucide-react';
import { useGame } from '../../GameContext';
import { WORD_BANK } from '../../utils/gameLogic';
import { SFX, Haptics } from '../../utils/engine';

export const CategoryManager = () => {
  const {
    selectedCategories, setSelectedCategories,
    customCategoriesData, setCustomCategoriesData
  } = useGame();

  const [showCustomCategories, setShowCustomCategories] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [customWord1, setCustomWord1] = useState('');
  const [customWord2, setCustomWord2] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  const toggleCategory = (cat) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const createCustomCategory = () => {
    if (newCategoryName.trim() && !customCategoriesData[newCategoryName.trim()]) {
      const name = newCategoryName.trim();
      setCustomCategoriesData({ ...customCategoriesData, [name]: [] });
      setEditingCategory(name);
      setNewCategoryName('');
      Haptics.light();
    }
  };

  const deleteCustomCategory = (name) => {
    setConfirmAction({
      title: "Delete Category?",
      message: `Are you sure you want to delete "${name}"?`,
      action: () => {
        const newData = { ...customCategoriesData };
        delete newData[name];
        setCustomCategoriesData(newData);
        setSelectedCategories(prev => prev.filter(c => c !== name));
        if (editingCategory === name) setEditingCategory(null);
        setConfirmAction(null);
        Haptics.heavy();
      }
    });
  };

  const addWordPair = () => {
    if (customWord1.trim() && customWord2.trim() && editingCategory) {
      const newData = { ...customCategoriesData };
      newData[editingCategory] = [...newData[editingCategory], { nattukaran: customWord1.trim(), kallan: customWord2.trim() }];
      setCustomCategoriesData(newData);
      setCustomWord1('');
      setCustomWord2('');
      Haptics.light();
    }
  };

  const removeWordPair = (catName, idx) => {
    const newData = { ...customCategoriesData };
    newData[catName] = newData[catName].filter((_, i) => i !== idx);
    setCustomCategoriesData(newData);
  };

  const allCategories = useMemo(() => [...Object.keys(WORD_BANK), ...Object.keys(customCategoriesData)], [customCategoriesData]);

  return (
    <>
      <div className="border-t border-white/5 pt-4">
        <div className="flex justify-between items-center mb-3">
          <span className="block text-sm font-bold">Word Categories</span>
          <button onClick={() => { Haptics.light(); setShowCustomCategories(true); }} className="text-xs bg-white/10 px-2 py-1 rounded text-mural-gold font-bold active:scale-95">
            Manage Custom
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {allCategories.map(cat => {
            const count = customCategoriesData[cat] ? customCategoriesData[cat].length : (WORD_BANK[cat]?.length || 0);
            return (
              <button
                key={cat}
                onClick={() => { Haptics.light(); toggleCategory(cat); }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border active:scale-95 ${
                  selectedCategories.includes(cat) 
                    ? 'bg-mural-gold text-kerala-green border-mural-gold' 
                    : 'bg-black/30 border-white/10 text-coconut/70'
                }`}
              >
                {cat} <span className="opacity-60 font-normal">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirm Modal (Local) */}
      <AnimatePresence>
        {confirmAction && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-kerala-green/95 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-black/50 border border-theyyam-red/30 rounded-2xl p-6 w-full max-w-sm text-center">
              <h3 className="text-xl font-bold text-theyyam-red mb-2">{confirmAction.title}</h3>
              <p className="text-sm text-coconut/80 mb-6">{confirmAction.message}</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmAction(null)} className="flex-1 p-3 rounded-xl bg-white/10 text-white font-bold active:scale-95">Cancel</button>
                <button onClick={confirmAction.action} className="flex-1 p-3 rounded-xl bg-theyyam-red text-white font-bold active:scale-95 shadow-[0_0_15px_rgba(230,57,70,0.4)]">Confirm</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCustomCategories && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-kerala-green/90 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-kerala-green-light border border-mural-gold/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="text-xl font-bold text-mural-gold">Custom Categories</h3>
                <button onClick={() => setShowCustomCategories(false)} className="text-coconut/50 hover:text-white"><X size={24} /></button>
              </div>
              
              {!editingCategory ? (
                <>
                  <p className="text-sm text-coconut/80 mb-4 shrink-0">Create your own categories and word pairs. They will be saved to your device.</p>
                  
                  <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1">
                    {Object.keys(customCategoriesData).length === 0 ? (
                      <p className="text-center text-coconut/50 text-sm py-4 italic">No custom categories yet.</p>
                    ) : (
                      Object.keys(customCategoriesData).map(catName => (
                        <div key={catName} className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-white/5">
                          <div>
                            <p className="font-bold">{catName}</p>
                            <p className="text-xs text-coconut/50">{customCategoriesData[catName].length} word pairs</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setEditingCategory(catName)} className="text-mural-gold bg-mural-gold/10 p-2 rounded"><Edit2 size={16} /></button>
                            <button onClick={() => deleteCustomCategory(catName)} className="text-theyyam-red bg-theyyam-red/10 p-2 rounded"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="bg-white/5 p-3 rounded-xl border border-white/10 shrink-0">
                    <p className="text-xs text-coconut/50 mb-2 font-bold uppercase">New Category</p>
                    <div className="flex gap-2">
                      <input 
                        type="text" placeholder="e.g. Inside Jokes" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)}
                        className="flex-1 bg-black/20 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-mural-gold text-white"
                      />
                      <button onClick={createCustomCategory} disabled={!newCategoryName.trim()} className="bg-mural-gold text-kerala-green font-bold px-3 py-2 rounded flex justify-center items-center gap-1 disabled:opacity-30">
                        Add
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-4 shrink-0">
                    <button onClick={() => setEditingCategory(null)} className="text-coconut/50 hover:text-white">Back</button>
                    <h3 className="font-bold text-white flex-1 text-center truncate px-2">{editingCategory}</h3>
                    <div className="w-8"></div>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1">
                    {!customCategoriesData[editingCategory] || customCategoriesData[editingCategory].length === 0 ? (
                      <p className="text-center text-coconut/50 text-sm py-4 italic">No words added yet.</p>
                    ) : (
                      customCategoriesData[editingCategory].map((cw, i) => (
                        <div key={`${cw.nattukaran}-${cw.kallan}-${i}`} className="flex justify-between items-center bg-black/20 p-2 rounded-lg text-sm border border-white/5">
                          <span className="truncate flex-1">{cw.nattukaran} <span className="text-white/30 mx-1">|</span> {cw.kallan}</span>
                          <button aria-label="Remove word pair" onClick={() => removeWordPair(editingCategory, i)} className="text-theyyam-red/70 hover:text-theyyam-red p-1 shrink-0 ml-2">
                            <X size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex flex-col gap-2 bg-white/5 p-3 rounded-xl border border-white/10 shrink-0">
                    <input 
                      type="text" placeholder="Nattukar Word..." value={customWord1} onChange={e => setCustomWord1(e.target.value)}
                      className="bg-black/20 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-mural-gold text-white"
                    />
                    <input 
                      type="text" placeholder="Kallan Word..." value={customWord2} onChange={e => setCustomWord2(e.target.value)}
                      className="bg-black/20 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-mural-gold text-white"
                    />
                    <button onClick={addWordPair} disabled={!customWord1.trim() || !customWord2.trim()} className="w-full bg-mural-gold text-kerala-green font-bold p-2 rounded mt-1 disabled:opacity-30">
                      Add Pair
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
