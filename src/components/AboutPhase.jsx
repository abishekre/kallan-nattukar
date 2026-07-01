import { motion } from 'framer-motion';
import { Heart, Code2, Coffee, ArrowLeft, Camera, Briefcase } from 'lucide-react';
import { useGame } from '../GameContext';

const AboutPhase = () => {
  const { setGameState } = useGame();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col h-full w-full py-8 gap-6"
    >
      <div className="flex items-center justify-between mb-4 mt-8">
        <button 
          aria-label="Go back"
          onClick={() => setGameState('setup')}
          className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors active:scale-95"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-display font-bold text-mural-gold">Developer</h1>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      <div className="glass-panel p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
        {/* Decorative background circle */}
        <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-theyyam-red rounded-full opacity-20 blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-[-50px] left-[-50px] w-32 h-32 bg-mural-gold rounded-full opacity-20 blur-2xl pointer-events-none"></div>

        <div className="bg-gradient-to-br from-mural-gold to-mural-gold-dark p-[2px] rounded-full mb-6 shadow-[0_0_30px_rgba(244,162,97,0.3)] z-10">
          <div className="bg-kerala-green rounded-full p-4">
            <Code2 size={48} className="text-mural-gold" />
          </div>
        </div>

        <h3 className="text-4xl font-display font-black tracking-tight mb-2 z-10">ABISHEK</h3>
        <p className="text-coconut/80 font-medium mb-6 flex items-center gap-2 justify-center z-10">
          Built with <Heart size={16} className="text-theyyam-red animate-pulse fill-theyyam-red" /> & <Coffee size={16} className="text-mural-gold" />
        </p>

        <div className="bg-black/30 border border-white/5 rounded-xl p-4 text-sm text-coconut/70 mb-6 leading-relaxed z-10">
          Kallan & Nattukar is a tribute to Kerala pop culture, designed for friends to argue, laugh, and betray each other in pure Mallu style. 
        </div>

        <div className="flex gap-4 z-10 w-full px-4 mt-2">
          <a href="https://www.instagram.com/abishek_r_edakkalathur/" aria-label="Instagram Profile" target="_blank" rel="noopener noreferrer" className="flex-1 bg-white/5 hover:bg-white/10 transition-colors border border-white/10 p-3 rounded-xl flex justify-center items-center">
            <Camera size={20} className="text-mural-gold" />
          </a>
          <a href="https://github.com/abishekre" aria-label="GitHub Profile" target="_blank" rel="noopener noreferrer" className="flex-1 bg-white/5 hover:bg-white/10 transition-colors border border-white/10 p-3 rounded-xl flex justify-center items-center">
            <Code2 size={20} className="text-mural-gold" />
          </a>
          <a href="https://www.linkedin.com/in/abishek-r-edakkalathur-4822a3217/" aria-label="LinkedIn Profile" target="_blank" rel="noopener noreferrer" className="flex-1 bg-white/5 hover:bg-white/10 transition-colors border border-white/10 p-3 rounded-xl flex justify-center items-center">
            <Briefcase size={20} className="text-mural-gold" />
          </a>
        </div>

      </div>

      <p className="text-center text-xs text-coconut/60 mt-auto pb-4 font-mono font-medium">
        v1.0.0 • Handcrafted in Kerala
      </p>
    </motion.div>
  );
};

export default AboutPhase;
