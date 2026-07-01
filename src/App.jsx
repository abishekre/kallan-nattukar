import { useEffect, useState, Suspense, lazy } from 'react';
import { useGame } from './GameContext';
import { AnimatePresence, motion } from 'framer-motion';
import { Download } from 'lucide-react';

const SetupPhase = lazy(() => import('./components/SetupPhase'));
const PassPhase = lazy(() => import('./components/PassPhase'));
const DiscussPhase = lazy(() => import('./components/DiscussPhase'));
const VotingPhase = lazy(() => import('./components/VotingPhase'));
const ResultsPhase = lazy(() => import('./components/ResultsPhase'));
const AboutPhase = lazy(() => import('./components/AboutPhase'));

function App() {
  const { gameState, setDeferredPrompt } = useGame();
  
  const [showInstallNag, setShowInstallNag] = useState(false);

  useEffect(() => {
    let visits = parseInt(localStorage.getItem('kn_visitCount') || '0', 10);
    
    if (!sessionStorage.getItem('kn_session_active')) {
      visits += 1;
      localStorage.setItem('kn_visitCount', visits.toString());
      sessionStorage.setItem('kn_session_active', 'true');
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (visits >= 3 && localStorage.getItem('kn_installDismissed') !== 'true') {
        setShowInstallNag(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For testing in dev:
    // if (visits >= 3 && localStorage.getItem('kn_installDismissed') !== 'true') {
    //   setShowInstallNag(true);
    // }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    // We can't access deferredPrompt directly here anymore, but SetupPhase will handle the button click.
    // If we need the install logic here for the nag screen:
    alert("Please install from the Setup Phase screen or browser menu.");
    setShowInstallNag(false);
  };

  const handleDismissInstall = () => {
    localStorage.setItem('kn_installDismissed', 'true');
    setShowInstallNag(false);
  };

  const renderPhase = () => {
    switch (gameState) {
      case 'setup':
        return <SetupPhase key="setup" />;
      case 'pass':
        return <PassPhase key="pass" />;
      case 'discuss':
        return <DiscussPhase key="discuss" />;
      case 'voting':
        return <VotingPhase key="voting" />;
      case 'results':
        return <ResultsPhase key="results" />;
      case 'about':
        return <AboutPhase key="about" />;
      default:
        return <SetupPhase key="setup" />;
    }
  };

  return (
    <div className="min-h-screen bg-kerala-green text-coconut p-4 md:p-8 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background decor - simplified for performance and clean aesthetic */}
      <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 20px 20px, #F4A261 2px, transparent 0)', backgroundSize: '40px 40px' }}></div>
      
      <main className="z-10 w-full max-w-md h-full flex flex-col">
        <Suspense fallback={<div className="flex items-center justify-center h-full text-mural-gold/50">Loading...</div>}>
          <AnimatePresence mode="wait">
            {renderPhase()}
          </AnimatePresence>
        </Suspense>
      </main>

      <AnimatePresence>
        {showInstallNag && (
          <motion.div 
            role="alert"
            aria-live="polite"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 left-4 right-4 bg-mural-gold text-kerala-green p-4 rounded-2xl shadow-[0_10px_40px_rgba(244,162,97,0.4)] z-50 flex items-center justify-between gap-4 max-w-md mx-auto"
          >
            <div>
              <h4 className="font-bold text-lg mb-1">Install App</h4>
              <p className="text-sm font-medium opacity-80">Add Kallan & Nattukar to your home screen for the best experience.</p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <button onClick={handleInstallClick} className="bg-kerala-green text-mural-gold px-4 py-2 rounded-xl font-bold flex items-center gap-2 active:scale-95 transition-transform">
                <Download size={16} /> Install
              </button>
              <button onClick={handleDismissInstall} className="text-kerala-green/60 text-xs font-bold text-center underline">
                Not now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
