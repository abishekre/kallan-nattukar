import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen w-screen bg-kerala-green text-white p-6 text-center">
          <AlertTriangle size={64} className="text-theyyam-red mb-4" />
          <h1 className="text-3xl font-display font-black text-mural-gold mb-2">Ayyo! Something broke.</h1>
          <p className="text-coconut/80 mb-8 max-w-md">
            The game encountered an unexpected error. Please restart the app.
          </p>
          
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary flex items-center gap-2 px-6 py-3"
          >
            <RotateCcw size={20} /> RESTART GAME
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
