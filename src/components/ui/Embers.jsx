import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export const Embers = ({ team = 'kallans', count = 20 }) => {
  const isKallan = team === 'kallans';
  const reduceMotion = useReducedMotion();

  const particles = useMemo(() => {
    const unit = isKallan ? 'px' : 'vw';
    return [...Array(count)].map((_, i) => {
      const xStart = Math.random() * 100 - (isKallan ? 50 : 0);
      const xEnd = Math.random() * 100 - (isKallan ? 50 : 0);
      return {
        id: i,
        duration: (isKallan ? 1.5 : 4) + Math.random() * (isKallan ? 1 : 2),
        delay: Math.random() * (isKallan ? 0.5 : 2),
        startTransform: `translate(${xStart}${unit}, ${isKallan ? '50px' : '-20px'})`,
        endTransform: `translate(${xEnd}${unit}, ${isKallan ? '-200px' : '100vh'})`,
      };
    });
  }, [count, isKallan]);

  // Purely decorative, ambient movement — skip it entirely for reduced motion.
  if (reduceMotion) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, transform: p.startTransform }}
          animate={{ opacity: [0, isKallan ? 0.8 : 0.6, 0], transform: p.endTransform }}
          transition={{ duration: p.duration, ease: isKallan ? "easeOut" : "linear", delay: p.delay, repeat: isKallan ? 0 : Infinity }}
          className={`absolute ${isKallan ? 'bottom-0 left-1/2 w-2 h-2 bg-theyyam-red rounded-full shadow-[0_0_10px_rgba(230,57,70,1)]' : 'top-0 w-1 h-1 bg-mural-gold/50 rounded-full'}`}
        />
      ))}
    </div>
  );
};

export default Embers;
