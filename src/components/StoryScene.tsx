import React, { useState } from 'react';
import type { Scene } from '../types';
import { LoadingIndicator } from './LoadingIndicator';
import { Save, Send, RefreshCw, History } from 'lucide-react';
import { ChatHistory } from './ChatHistory';

type Props = {
  scene: Scene;
  onChoice: (choiceId: number) => void;
  history: GameHistoryEntry[];
};

export function StoryScene({ scene, onChoice, history }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  const [generatedChoices, setGeneratedChoices] = useState<Array<{ id: number; text: string }>>([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleChoice = async (choiceId: number) => {
    setIsLoading(true);
    setStreamedText('');
    setError(null);
    setGeneratedChoices([]);
    
    try {
      await onChoice(choiceId);
    } catch (error) {
      console.error('Error handling choice:', error);
      setError(error instanceof Error ? error.message : 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (scene.description) {
      setShowSaveIndicator(true);
      const timer = setTimeout(() => setShowSaveIndicator(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [scene.description]);

  return (
    <>
      <ChatHistory
        history={history}
        onClose={() => setShowHistory(false)}
        visible={showHistory}
      />
      
      {showSaveIndicator && (
        <div className="fixed top-4 right-4 bg-green-50 text-green-700 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-out">
          <Save className="w-4 h-4" />
          <span className="text-sm">Game saved</span>
        </div>
      )}
      
      <button
        onClick={() => setShowHistory(true)}
        className="fixed top-4 right-4 p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors z-10"
      >
        <History className="w-5 h-5 text-gray-600" />
        <span className="sr-only">View History</span>
      </button>

    <div className="max-w-2xl mx-auto p-6 pb-24">
      <div className="prose prose-lg mb-8 bg-white rounded-lg shadow-sm p-6">
        {scene.description.split('\n').map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
        {streamedText && (
          <div className="mt-4 text-gray-600">
            <div className="typing-animation">{streamedText}</div>
          </div>
        )}
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            <p className="text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-sm underline hover:no-underline"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
      
      {isLoading && !streamedText ? (
        <LoadingIndicator 
          message="Generating next scene..." 
          size="md" 
        />
      ) : (
        <div className="space-y-4 bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Send className="w-5 h-5 text-indigo-600" />
          Your choices:
        </h3>
        {(generatedChoices.length > 0 ? generatedChoices : scene.choices).map((choice) => (
          <button
            key={choice.id}
            onClick={() => handleChoice(choice.id)}
            disabled={isLoading}
            className="w-full p-4 text-left bg-gray-50 rounded-lg hover:bg-indigo-50 transition-colors duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="inline-flex items-center gap-3">
              <span className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-gray-600 group-hover:text-indigo-600 transition-colors duration-200">
                {choice.id}
              </span>
              {choice.text}
            </span>
          </button>
        ))}
        </div>
      )}
    </div>
    </>
  );
}