import { motion } from 'framer-motion';
import { getRankForXp } from '../../utils/progression';

// Compact village-rank chip with an XP progress bar toward the next rank.
// Used on the Setup header to make progression always visible (a persistent
// "you're this close to the next rank" nudge).
export const RankBadge = ({ xp = 0, compact = false }) => {
  const { rank, next, progress, xpForNext } = getRankForXp(xp);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 bg-black/30 border border-mural-gold/30 rounded-full pl-1.5 pr-2.5 py-1">
        <span className="text-base leading-none">{rank.icon}</span>
        <span className="text-[11px] font-bold text-mural-gold leading-none">{rank.name}</span>
      </div>
    );
  }

  return (
    <div className="bg-black/30 border border-mural-gold/20 rounded-xl p-3 w-full">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl leading-none">{rank.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="font-display font-bold text-mural-gold leading-tight truncate">{rank.name}</p>
          <p className="text-[10px] text-coconut/50 uppercase tracking-widest leading-tight">{rank.tag}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-white leading-none">{xp}</p>
          <p className="text-[9px] text-coconut/40 uppercase tracking-widest">XP</p>
        </div>
      </div>
      <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-mural-gold to-mural-gold-dark rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <p className="text-[10px] text-coconut/50 mt-1.5 text-right">
        {next ? `${xpForNext} XP to ${next.name}` : 'Max rank reached — Ithihasam!'}
      </p>
    </div>
  );
};

export default RankBadge;
