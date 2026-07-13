import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../GameContext';
import { SFX, Haptics } from '../../utils/engine';
import { Confetti } from './Confetti';

// Global, always-mounted overlay that surfaces the two big dopamine moments:
// a rank level-up (full-screen banner + confetti) and achievement unlocks
// (stacked toasts). Both are driven by transient state in GameContext so any
// phase can trigger them without prop-drilling.

const LevelUpBanner = () => {
  const { levelUpEvent, dismissLevelUp } = useGame();

  useEffect(() => {
    if (levelUpEvent) {
      SFX.levelup();
      Haptics.success();
      const t = setTimeout(dismissLevelUp, 4200);
      return () => clearTimeout(t);
    }
  }, [levelUpEvent, dismissLevelUp]);

  return (
    <AnimatePresence>
      {levelUpEvent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={dismissLevelUp}
          className="fixed inset-0 z-[85] flex items-center justify-center p-6 bg-kerala-green/80 backdrop-blur-sm cursor-pointer"
        >
          <Confetti count={90} />
          <motion.div
            initial={{ scale: 0.6, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 14, stiffness: 200 }}
            className="relative text-center"
          >
            <motion.div
              animate={{ rotate: [0, -8, 8, -4, 0] }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-7xl mb-2 drop-shadow-[0_0_25px_rgba(244,162,97,0.6)]"
            >
              {levelUpEvent.to.icon}
            </motion.div>
            <p className="text-mural-gold/80 uppercase tracking-[0.3em] text-xs font-bold mb-1">Rank Up!</p>
            <h2 className="text-4xl font-display font-black text-white drop-shadow-[0_0_15px_rgba(244,162,97,0.5)]">
              {levelUpEvent.to.name}
            </h2>
            <p className="text-coconut/70 text-sm mt-1 font-medium">{levelUpEvent.to.tag}</p>
            <p className="text-[11px] text-coconut/40 mt-4 uppercase tracking-widest">Tap to continue</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const AchievementToasts = () => {
  const { achievementToasts, shiftAchievementToast } = useGame();
  const current = achievementToasts[0];

  useEffect(() => {
    if (current) {
      SFX.unlock();
      Haptics.light();
      const t = setTimeout(shiftAchievementToast, 3200);
      return () => clearTimeout(t);
    }
  }, [current, shiftAchievementToast]);

  return (
    <div className="fixed top-4 left-0 right-0 z-[86] flex flex-col items-center px-4 pointer-events-none">
      <AnimatePresence>
        {current && (
          <motion.button
            key={current.id}
            type="button"
            onClick={shiftAchievementToast}
            initial={{ opacity: 0, y: -60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.9 }}
            transition={{ type: 'spring', damping: 16 }}
            className="pointer-events-auto bg-kerala-green-light border border-mural-gold/50 rounded-2xl shadow-[0_10px_40px_rgba(244,162,97,0.25)] px-4 py-3 flex items-center gap-3 max-w-sm w-full"
          >
            <div className="text-3xl shrink-0">{current.icon}</div>
            <div className="text-left min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-mural-gold font-bold">Achievement Unlocked</p>
              <p className="font-display font-bold text-white truncate">{current.title}</p>
              <p className="text-xs text-coconut/60 truncate">{current.by ? `${current.by} — ` : ''}{current.desc}</p>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export const CelebrationOverlay = () => (
  <>
    <LevelUpBanner />
    <AchievementToasts />
  </>
);

export default CelebrationOverlay;
