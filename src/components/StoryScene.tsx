import React, { useState } from 'react';
import type { Scene, GameHistoryEntry } from '../types';
import { LoadingIndicator } from './LoadingIndicator';
import { Save, Send, RefreshCw, History, RotateCcw, Bot } from 'lucide-react';
import { StoryView } from './StoryView';
import { ChatHistory } from './ChatHistory';

type Props = {
  scene: Scene;
  onChoice: (choiceId: number) => void;
  history: GameHistoryEntry[];
  onCreateCheckpoint?: () => void;
  onRestoreCheckpoint?: () => void;
  hasCheckpoint?: boolean;
};

export function StoryScene({ 
  scene, 
  onChoice, 
  history,
  onCreateCheckpoint,
  onRestoreCheckpoint,
  hasCheckpoint
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');

  const handleChoice = async (choiceId: number) => {
    try {
      setIsLoading(true);
      setStreamedContent('');
      setError(null);
      const currentChoice = scene.choices.find(c => c.id === choiceId);
      if (!currentChoice) throw new Error('Invalid choice');
      
      await onChoice(choiceId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      setStreamedContent(''); // Clear any partial content
      
      // Show error in scene description
      scene.description = `Error: ${errorMessage}\n\nPlease try again or choose a different option.`;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2 bg-white p-2 rounded-lg shadow-lg">
        <button
          onClick={() => setShowHistory(true)}
          className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
          title="View story history"
        >
          <History className="w-5 h-5 text-gray-600" />
        </button>
        {onCreateCheckpoint && (
          <button
            onClick={onCreateCheckpoint}
            className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
            title="Create checkpoint"
          >
            <Save className="w-5 h-5 text-gray-600" />
          </button>
        )}
        {hasCheckpoint && onRestoreCheckpoint && (
          <button
            onClick={onRestoreCheckpoint}
            className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
            title="Restore checkpoint"
          >
            <RotateCcw className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>

      <ChatHistory
        isGenerating={isLoading}
        history={history}
        onClose={() => setShowHistory(false)}
        visible={showHistory}
      />

      <div className="max-w-4xl mx-auto p-6 pb-24">
        <StoryView
          currentScene={scene.description}
          streamedContent={streamedContent}
          history={history}
          isGenerating={isLoading}
        />

        {/* Choices */}
        <div className="space-y-4 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Send className="w-5 h-5 text-indigo-600" />
            Your choices:
          </h3>
          {scene.choices.map((choice) => (
            <button
              key={choice.id}
              onClick={() => handleChoice(choice.id)}
              disabled={isLoading}
              className="w-full p-4 text-left bg-gray-50 rounded-lg hover:bg-indigo-50 transition-colors duration-200 group disabled:opacity-50"
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

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}