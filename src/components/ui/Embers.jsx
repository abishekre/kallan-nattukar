import { useMemo } from 'react';
import { motion } from 'framer-motion';

export const Embers = ({ team = 'kallans', count = 20 }) => {
  const isKallan = team === 'kallans';
  
  const particles = useMemo(() => {
    return [...Array(count)].map((_, i) => ({
      id: i,
      xStart: Math.random() * 100 - (isKallan ? 50 : 0),
      xEnd: Math.random() * 100 - (isKallan ? 50 : 0),
      duration: (isKallan ? 1.5 : 4) + Math.random() * (isKallan ? 1 : 2),
      delay: Math.random() * (isKallan ? 0.5 : 2)
    }));
  }, [count, isKallan]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: isKallan ? 50 : '-20px', x: isKallan ? p.xStart : `${p.xStart}vw` }}
          animate={{ opacity: [0, isKallan ? 0.8 : 0.6, 0], y: isKallan ? -200 : '100vh', x: isKallan ? p.xEnd : `${p.xEnd}vw` }}
          transition={{ duration: p.duration, ease: isKallan ? "easeOut" : "linear", delay: p.delay, repeat: isKallan ? 0 : Infinity }}
          className={`absolute ${isKallan ? 'bottom-0 left-1/2 w-2 h-2 bg-theyyam-red rounded-full shadow-[0_0_10px_rgba(230,57,70,1)]' : 'top-0 w-1 h-1 bg-mural-gold/50 rounded-full'}`}
        />
      ))}
    </div>
  );
};

export default Embers;
