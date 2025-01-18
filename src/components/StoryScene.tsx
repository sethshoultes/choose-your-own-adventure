import React, { useState } from 'react';
import type { Scene, GameHistoryEntry } from '../types';
import { LoadingIndicator } from './LoadingIndicator';
import { Save, Send, RefreshCw, History } from 'lucide-react';
import { StoryView } from './StoryView';
import { ChatHistory } from './ChatHistory';
import { debugManager } from '../core/debug/DebugManager';


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

  const handleChoice = async (choiceId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      debugManager.log('Handling choice selection', 'info', { choiceId });
      
      await onChoice(choiceId);
    } catch (error) {
      console.error('Error handling choice:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      debugManager.log('Error in choice handling', 'error', { error: errorMessage });
      setError(errorMessage || 'Failed to process your choice. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ChatHistory 
        history={history} 
        onClose={() => setShowHistory(false)} 
        visible={showHistory} 
      />

      <div className="max-w-4xl mx-auto p-6 pb-24">
        {/* Story Controls */}
        <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={() => setShowHistory(true)}
            className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="View story history"
          >
            <History className="w-5 h-5" />
          </button>
          {onCreateCheckpoint && (
            <button
              onClick={onCreateCheckpoint}
              className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Create checkpoint"
            >
              <Save className="w-5 h-5" />
            </button>
          )}
          {hasCheckpoint && onRestoreCheckpoint && (
            <button
              onClick={onRestoreCheckpoint}
              className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Restore checkpoint"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Story Content */}
        <StoryView
          currentScene={scene.description}
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
    </>
  );
}