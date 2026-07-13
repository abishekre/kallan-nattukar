import { useMemo } from 'react';
import { motion } from 'framer-motion';

// Lightweight, dependency-free confetti burst. Purely decorative and
// pointer-events-none so it never blocks the UI. Colours pull from the app
// palette. `fire` toggles the burst so it can be re-triggered by key remount.
const COLORS = ['#F4A261', '#E63946', '#F8F9FA', '#2A9D8F', '#E9C46A'];

export const Confetti = ({ count = 80 }) => {
  const pieces = useMemo(() =>
    [...Array(count)].map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: COLORS[i % COLORS.length],
      size: 6 + Math.random() * 8,
      delay: Math.random() * 0.4,
      duration: 1.8 + Math.random() * 1.6,
      rotate: Math.random() * 720 - 360,
      drift: Math.random() * 30 - 15,
      round: Math.random() > 0.5,
    })), [count]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[80]">
      {pieces.map(p => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, top: '-10%', left: `${p.x}%`, rotate: 0 }}
          animate={{ opacity: [1, 1, 0], top: '110%', left: `${p.x + p.drift}%`, rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          style={{ position: 'absolute', width: p.size, height: p.round ? p.size : p.size * 0.4, backgroundColor: p.color, borderRadius: p.round ? '9999px' : '2px' }}
        />
      ))}
    </div>
  );
};

export default Confetti;
