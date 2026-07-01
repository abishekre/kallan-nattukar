import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users as UsersIcon, BookOpen, Play, X, Download } from 'lucide-react';
import { useGame } from '../GameContext';
import { SFX, Haptics } from '../utils/engine';

import { PlayerList } from './setup/PlayerList';
import { GameSettings } from './setup/GameSettings';
import { CategoryManager } from './setup/CategoryManager';
import { GroupProfilesManager } from './setup/GroupProfilesManager';

const SetupPhase = () => {
  const { 
    players, selectedCategories, roundCount,
    startGame, setGameState, clearCurrentScores
  } = useGame();
  
  const [showRules, setShowRules] = useState(false);
  const [showProfiles, setShowProfiles] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const { deferredPrompt, setDeferredPrompt } = useGame();
  const [showIOSInstallPrompt, setShowIOSInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect iOS and Standalone mode
    const isIosDevice = 
      /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    const ios = isIosDevice && !window.MSStream;
    setIsIOS(ios);
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone);
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstallPrompt(true);
      return;
    }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const handleClearScores = () => {
    setConfirmAction({
      title: "Reset Points?",
      message: "Are you sure you want to clear scores for this village? Scene aavumo?",
      action: () => { clearCurrentScores(); setConfirmAction(null); Haptics.heavy(); }
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full w-full py-8 max-w-md mx-auto relative z-10">
        
      <div className="flex justify-between items-start mb-6 mt-4 px-4">
        <div className="flex flex-col text-left">
          <h1 className="text-4xl md:text-5xl font-black text-mural-gold mb-1 tracking-tighter leading-none font-display">
            KALLAN <br/><span className="text-theyyam-red">&</span> NATTUKAR
          </h1>
          <p className="text-coconut/70 text-xs md:text-sm font-medium mb-2">The Mallu Imposter Game</p>
          {roundCount > 0 && (
            <div className="bg-mural-gold/20 border border-mural-gold/50 text-mural-gold px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest w-max">
              Round {roundCount}
            </div>
          )}
        </div>
        <div className="flex gap-2 shrink-0 pt-1">
          <button 
            onClick={() => { Haptics.light(); setShowProfiles(true); }}
            className="bg-white/10 p-2 md:p-3 rounded-full hover:bg-white/20 transition-colors active:scale-95 flex items-center justify-center relative"
          >
            <UsersIcon size={20} className="md:w-6 md:h-6" />
          </button>
          <button 
            onClick={() => { Haptics.light(); setShowRules(true); }}
            className="bg-white/10 p-2 md:p-3 rounded-full hover:bg-white/20 transition-colors active:scale-95 hidden md:flex items-center justify-center"
          >
            <BookOpen size={20} className="md:w-6 md:h-6" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-12 flex flex-col gap-6">
        {/* Card 1: Players (Always Visible) */}
        <PlayerList />

        {/* Card 2: Smart Summary / Settings Accordion */}
        <div className="flex flex-col gap-0">
          <GameSettings onClearScores={handleClearScores} />
          <div className="glass-panel p-4 mt-2 bg-black/20">
            <CategoryManager />
          </div>
        </div>

      </div>

      {/* Start Button & Footer */}
      <div className="px-4 shrink-0 mt-auto bg-kerala-green pt-2 pb-4 border-t border-white/5 relative z-10">
        <button 
          onClick={() => { Haptics.light(); SFX.swoosh(); startGame(); }} 
          disabled={players.length < 3 || selectedCategories.length === 0} 
          className="btn-primary flex items-center justify-center gap-2 text-xl w-full py-5 disabled:opacity-50 transition-all shadow-md"
        >
          <Play size={24} fill="currentColor" /> START POORAM
        </button>
        {players.length < 3 && <p className="text-center text-xs text-theyyam-red font-bold mt-2">Need at least {3 - players.length} more Nattukar to start the pooram!</p>}
        {players.length >= 3 && selectedCategories.length === 0 && <p className="text-center text-xs text-theyyam-red font-bold mt-2">Select at least 1 category (Oru visayam vende?)</p>}

        <div className="flex justify-between items-center mt-4 px-2">
          <button onClick={() => { Haptics.light(); setGameState('about'); }} className="text-[10px] text-coconut/50 hover:text-mural-gold transition-colors font-medium">
            Developed by Abishek
          </button>
          <div className="flex gap-4">
            {(deferredPrompt || (isIOS && !isStandalone)) && (
              <button onClick={handleInstallClick} className="text-[10px] text-mural-gold hover:text-white transition-colors font-medium flex items-center gap-1">
                <Download size={12}/> Install App
              </button>
            )}
            <button onClick={() => { Haptics.light(); setShowRules(true); }} className="text-[10px] md:hidden text-coconut/50 hover:text-mural-gold transition-colors font-medium flex items-center gap-1">
              <BookOpen size={12} /> How to Play
            </button>
          </div>
        </div>
      </div>



      {/* Rules Modal */}
      <AnimatePresence>
        {showRules && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-kerala-green/95 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-kerala-green-light border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative max-h-[85vh] overflow-y-auto">
              <button aria-label="Close rules" onClick={() => setShowRules(false)} className="absolute top-4 right-4 text-coconut/50 hover:text-white p-1 bg-white/5 rounded-full"><X size={20} /></button>
              <h3 className="text-2xl font-display font-bold text-mural-gold mb-4">How to Play</h3>
              <div className="space-y-4 text-sm text-coconut/80 leading-relaxed">
                <p><strong>Nattukar:</strong> You will all receive the SAME secret word. Your goal is to figure out who the Kallan is.</p>
                <p><strong>Kallan:</strong> You will receive a SIMILAR, but different word. You must blend in and pretend you have the Nattukar's word.</p>
                <p><strong>Pottan (Optional):</strong> You have NO word. You are completely blind and must lie your way to survival.</p>
                <div className="bg-black/20 p-4 rounded-xl border border-white/5 mt-4">
                  <p className="font-bold text-theyyam-red mb-1">Sudden Death Mode</p>
                  <p className="text-xs">If "Multi-Round Voting" is OFF, catching ONE Kallan wins the game for Nattukar. But voting out ONE Nattukaran instantly loses the game!</p>
                </div>
                <p className="text-[10px] opacity-40 text-center mt-6 uppercase tracking-widest">All settings saved locally</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <GroupProfilesManager showProfiles={showProfiles} setShowProfiles={setShowProfiles} />

      {/* Custom Confirm Modal (Clean aesthetic) */}
      <AnimatePresence>
        {confirmAction && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-kerala-green/95 backdrop-blur-md"
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-kerala-green-light border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <h3 className="text-xl font-bold mb-2 text-white">{confirmAction.title}</h3>
              <p className="text-coconut/80 text-sm mb-6">{confirmAction.message}</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmAction(null)} className="flex-1 bg-white/5 p-3 rounded-xl font-bold text-coconut/80 hover:text-white transition-colors">Cancel</button>
                <button onClick={confirmAction.action} className="flex-1 bg-theyyam-red text-white p-3 rounded-xl font-bold active:scale-95 transition-transform">Confirm</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Install Prompt Modal */}
      <AnimatePresence>
        {showIOSInstallPrompt && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[70] flex items-end justify-center p-4 bg-kerala-green/90 backdrop-blur-sm pb-10"
          >
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="bg-white text-black rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
              <button onClick={() => setShowIOSInstallPrompt(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black p-1"><X size={20} /></button>
              <h3 className="text-xl font-bold mb-2">Install on iOS</h3>
              <p className="text-sm text-gray-600 mb-6">Install this app on your home screen for the best fullscreen experience without Safari's UI.</p>
              
              <div className="flex flex-col gap-4 text-sm font-medium">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-blue-500 font-bold text-xl">1</div>
                  <p>Tap the <strong>Share</strong> button at the bottom of Safari.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-blue-500 font-bold text-xl">2</div>
                  <p>Scroll down and tap <strong>Add to Home Screen</strong> <span className="inline-block p-1 bg-gray-100 rounded ml-1 text-xs">+</span>.</p>
                </div>
              </div>
              <button onClick={() => setShowIOSInstallPrompt(false)} className="w-full bg-black text-white p-3 rounded-xl font-bold mt-6 active:scale-95 transition-transform">Got it</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SetupPhase;
