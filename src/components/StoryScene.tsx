import React, { useState, useEffect } from 'react';
import type { Scene, GameHistoryEntry } from '../types';
import { LoadingIndicator } from './LoadingIndicator';
import { Save, Send, RefreshCw, History, RotateCcw, Bot, Trophy } from 'lucide-react';
import { StoryView } from './StoryView';
import { ChatHistory } from './ChatHistory'; 
import { XPNotification } from './progression/XPNotification';
import { ProgressBar } from './progression/ProgressBar';
import { AchievementPopup } from './achievements/AchievementPopup';
import { LevelUpModal } from './progression/LevelUpModal';
import { AttributePointsModal } from './progression/AttributePointsModal';
import type { LevelUpResult } from '../core/services/progression/ProgressionService';
import type { Achievement } from '../core/services/achievements/types';
import type { Character } from '../types';

type Props = {
  scene: Scene;
  onChoice: (choiceId: number) => void;
  history: GameHistoryEntry[];
  character: Character;
  onCharacterUpdate: (character: Character) => void;
  onCreateCheckpoint?: () => void;
  onRestoreCheckpoint?: () => void;
  hasCheckpoint?: boolean;
  levelUpResult?: LevelUpResult | null;
  xpNotification?: { xp: number; source: string } | null;
};

export function StoryScene({
  scene, 
  onChoice, 
  history,
  character,
  onCharacterUpdate,
  onCreateCheckpoint,
  onRestoreCheckpoint,
  hasCheckpoint,
  levelUpResult,
  xpNotification
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showAttributePoints, setShowAttributePoints] = useState(false);
  const [achievement, setAchievement] = useState<Achievement | null>(null);
  const [currentXPNotification, setXPNotification] = useState<{ xp: number; source: string } | null>(null);

  useEffect(() => {
    if (levelUpResult) {
      setShowLevelUp(true);
    }
  }, [levelUpResult]);

  useEffect(() => {
    if (xpNotification) {
      setXPNotification(xpNotification);
      const timer = setTimeout(() => setXPNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [xpNotification]);

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
      <div className="fixed top-0 left-0 right-0 z-10 bg-white shadow-lg">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-indigo-600" />
              <span className="font-medium">Level {character.level || 1}</span>
            </div>
            <div className="flex-1">
              <ProgressBar
                currentXP={character.experience_points || 0}
                level={character.level || 1}
              />
            </div>
          </div>
        </div>
      </div>

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

      <div className="max-w-4xl mx-auto p-6 pb-24 mt-20">
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
      
      <LevelUpModal
        result={levelUpResult!}
        visible={showLevelUp}
        onClose={() => setShowLevelUp(false)}
        onAttributePointsAssigned={() => {
          setShowLevelUp(false);
          setShowAttributePoints(true);
        }}
      />

      <AttributePointsModal
        character={character}
        visible={showAttributePoints}
        onClose={() => setShowAttributePoints(false)}
        onSave={onCharacterUpdate}
      />
      
      {achievement && (
        <AchievementPopup
          achievement={achievement}
          onClose={() => setAchievement(null)} 
        />
      )}
      
      {currentXPNotification && (
        <XPNotification
          xp={currentXPNotification.xp}
          source={currentXPNotification.source}
          onComplete={() => setXPNotification(null)}
        />
      )}
    </div>
  );
}