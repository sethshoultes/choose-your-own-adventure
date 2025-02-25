import React, { useState, useRef } from 'react';
import type { Scene, GameHistoryEntry, Character } from '../types';
import { Bot, Play, History, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useNavigate } from '../hooks/useNavigate';
import { LoadingIndicator } from './LoadingIndicator';
import { ProgressBar } from './progression/ProgressBar';
import { XPNotification } from './progression/XPNotification';
import { LevelUpModal } from './progression/LevelUpModal';
import { AttributePointsModal } from './progression/AttributePointsModal';
import { debugManager } from '../core/debug/DebugManager';
import type { GameState } from '../types';
import type { LevelUpResult } from '../core/services/progression/types';

type Props = {
  scene?: Scene;
  onChoice: (choiceId: number) => void;
  history: GameHistoryEntry[];
  character: Character;
  sessionId?: string;
  onCreateCheckpoint?: () => void;
  onRestoreCheckpoint?: () => void;
  hasCheckpoint?: boolean;
};

export function StoryScene({ 
  scene, 
  onChoice, 
  history, 
  character,
  sessionId,
  onCreateCheckpoint,
  onRestoreCheckpoint,
  hasCheckpoint
}: Props) {
  const { navigateToHome } = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [xpNotification, setXPNotification] = useState<{xp: number; source: string} | null>(null);
  const [levelUpResult, setLevelUpResult] = useState<LevelUpResult | null>(null);
  const [showAttributePoints, setShowAttributePoints] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    if (showHistory && contentRef.current) {
      setIsScrolling(true);
      contentRef.current.scrollIntoView({ behavior: 'smooth' });
      const timer = setTimeout(() => setIsScrolling(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [showHistory]);

  const scrollToTop = () => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const [currentState, setCurrentState] = useState<GameState | null>(null);

  // Early return if scene is not available
  if (!scene) {
    return (
      <div className="max-w-4xl mx-auto p-6 pb-24">
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">Loading scene...</p>
        </div>
      </div>
    );
  }

  const handleChoice = async (choiceId: number) => {
    setIsLoading(true);
    setError(null);
    
    if (!character) {
      setError('No character selected');
      setIsLoading(false);
      return;
    }

    try {
      await onChoice(choiceId);
      debugManager.log('Choice handled successfully', 'success', { choiceId });
      // Progression is handled in GameEngine
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to handle choice';
      setError(message);
      debugManager.log('Error handling choice', 'error', { error: err });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCheckpoint = async () => {
    try {
      if (!onCreateCheckpoint) return;
      await onCreateCheckpoint();
      debugManager.log('Checkpoint created', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create checkpoint';
      setError(message);
      debugManager.log('Error creating checkpoint', 'error', { error: err });
    }
  };

  const handleRestoreCheckpoint = async () => {
    try {
      if (!onRestoreCheckpoint) return;
      await onRestoreCheckpoint();
      debugManager.log('Checkpoint restored', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to restore checkpoint';
      setError(message);
      debugManager.log('Error restoring checkpoint', 'error', { error: err });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 pb-24">
      {/* Logo */}
      <div className="flex justify-center mb-8">
        <button
          onClick={navigateToHome}
          className="hover:opacity-90 transition-opacity"
        >
          <img
            src="https://adventurebuildrstorage.storage.googleapis.com/wp-content/uploads/2024/10/11185818/AdventureBuildr-Logo-e1731351627826.png"
            alt="AdventureBuildr Logo"
            className="w-auto h-12"
          />
        </button>
      </div>

      {/* Character Stats */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Bot className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold">{character.name}</h2>
              <p className="text-gray-600">{character.genre}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title={showHistory ? "Hide History" : "Show History"}
            >
              <History className="w-4 h-4" />
              {showHistory ? "Hide History" : "Show History"}
            </button>
            <ProgressBar
              currentXP={character.experience_points || 0}
              level={character.level || 1}
              className="w-48"
            />
            {character.attributes?.map(attr => (
              <div key={attr.name} className="text-sm">
                <span className="font-medium">{attr.name}:</span> {attr.value}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Quick Scroll Controls - Only show when history is visible */}
      {showHistory && (
        <div className="fixed right-8 top-1/2 transform -translate-y-1/2 space-y-4">
          <button
            onClick={scrollToTop}
            className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
            title="Scroll to top"
          >
            <ArrowUp className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={scrollToBottom}
            className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
            title="Scroll to bottom"
          >
            <ArrowDown className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      )}

      {/* Game Scene */}
      <div ref={contentRef} className="prose prose-lg mb-8 bg-white rounded-lg shadow-sm">
        <div className="space-y-4 p-6">
          {/* History */}
          {showHistory && history.length > 0 && (
            <div className={`space-y-6 mb-8 transition-opacity duration-500 ${isScrolling ? 'opacity-50' : 'opacity-100'}`}>
              {history.map((entry, index) => (
                <div key={`${entry.sceneId}-${index}`} className="space-y-4">
                  {/* Scene Description */}
                  {entry.sceneDescription && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-50 rounded-lg flex-shrink-0">
                        <Bot className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div className="flex-1 bg-indigo-50/50 rounded-lg p-4">
                        {entry.sceneDescription.split('\n').map((paragraph, i) => (
                          <p key={i} className="leading-relaxed">{paragraph}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Player Choice */}
                  {entry.choice && (
                    <div className="flex items-start gap-3 pl-8">
                      <div className="p-2 bg-green-50 rounded-lg flex-shrink-0">
                        <Play className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="flex-1 bg-green-50/50 rounded-lg p-4">
                        <p className="text-gray-700">{entry.choice}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div className="relative mt-8 mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <div className="bg-white px-4 text-sm text-gray-500 flex items-center gap-2">
                    <ChevronDown className="w-4 h-4" />
                    Current Story
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Current Scene */}
          {scene && (
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                <Bot className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1 bg-gray-50 rounded-lg p-4 min-h-[100px] relative transition-all duration-300">
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <LoadingIndicator size="sm" message="Generating story..." />
                  </div>
                ) : (
                  scene.description?.split('\n').map((paragraph, index) => (
                    <p key={index} className="leading-relaxed mb-4 last:mb-0">{paragraph}</p>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Choices */}
      {!isLoading && scene?.choices?.length > 0 && (
        <div className="space-y-4 bg-white rounded-lg shadow-sm p-6 transition-all duration-300">
          <h3 className="text-xl font-semibold mb-4">Your choices:</h3>
          {scene.choices.map((choice) => (
            <button
              key={choice.id}
              onClick={() => handleChoice(choice.id)}
              disabled={isLoading}
              className={`w-full p-4 text-left bg-gray-50 rounded-lg transition-colors duration-200 group ${
                isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-50'
              }`}
            >
              <span className="inline-flex items-center gap-3">
                <span className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-gray-600 group-hover:text-indigo-600 transition-colors">
                  {choice.id}
                </span>
                {choice.text}
              </span>
            </button>
          ))}
        </div>
      )}
      <div ref={bottomRef} />
      
      {/* Progression UI */}
      {xpNotification && (
        <XPNotification
          xp={xpNotification.xp}
          source={xpNotification.source}
          onComplete={() => setXPNotification(null)}
        />
      )}

      {levelUpResult && (
        <LevelUpModal
          result={levelUpResult}
          visible={true}
          onClose={() => setLevelUpResult(null)}
          onAttributePointsAssigned={() => {
            setLevelUpResult(null);
            setShowAttributePoints(true);
          }}
        />
      )}

      {showAttributePoints && (
        <AttributePointsModal
          character={character}
          visible={true}
          onClose={() => setShowAttributePoints(false)}
          onSave={(updatedCharacter) => {
            onCharacterUpdate?.(updatedCharacter);
            setShowAttributePoints(false);
          }}
        />
      )}
    </div>
  );
}