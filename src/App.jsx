import { useGame } from './GameContext';
import SetupPhase from './components/SetupPhase';
import PassPhase from './components/PassPhase';
import DiscussPhase from './components/DiscussPhase';
import VotingPhase from './components/VotingPhase';
import ResultsPhase from './components/ResultsPhase';
import AboutPhase from './components/AboutPhase';
import { AnimatePresence } from 'framer-motion';

function App() {
  const { gameState } = useGame();

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
      {/* Background decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-theyyam-red rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-mural-gold rounded-full mix-blend-screen filter blur-[120px] opacity-20"></div>
      </div>
      
      <main className="z-10 w-full max-w-md h-full flex flex-col">
        <AnimatePresence mode="wait">
          {renderPhase()}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
