/**
 * Progression Testing Widget
 * 
 * This component provides an administrative interface for testing the progression system
 * in AdventureBuildr. It allows testing XP awards, level-ups, and attribute point
 * allocation before implementing these features in the main game.
 */

import React, { useState } from 'react';
import { Trophy, Star, Dumbbell, Zap } from 'lucide-react';
import { ProgressBar } from '../../progression/ProgressBar';
import { XPNotification } from '../../progression/XPNotification';
import { LevelUpModal } from '../../progression/LevelUpModal';
import { AttributePointsModal } from '../../progression/AttributePointsModal';
import { LoadingIndicator } from '../../LoadingIndicator';
import type { Character } from '../../../core/types';
import type { LevelUpResult } from '../../../core/services/progression/types';
import { debugManager } from '../../../core/debug/DebugManager';

export function ProgressionTester() {
  // Test character state
  const [character, setCharacter] = useState<Character>({
    name: 'Test Character',
    genre: 'Fantasy',
    attributes: [
      { name: 'Strength', value: 5, description: 'Physical power' },
      { name: 'Intelligence', value: 5, description: 'Mental acuity' },
      { name: 'Agility', value: 5, description: 'Speed and coordination' }
    ],
    equipment: [],
    backstory: '',
    experience_points: 0,
    level: 1,
    attribute_points: 0
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [xpNotification, setXPNotification] = useState<{xp: number; source: string} | null>(null);
  const [levelUpResult, setLevelUpResult] = useState<LevelUpResult | null>(null);
  const [showAttributePoints, setShowAttributePoints] = useState(false);

  // XP award testing
  const handleAwardXP = async (amount: number, source: string) => {
    setLoading(true);
    try {
      // Simulate XP calculation
      const newXP = (character.experience_points || 0) + amount;
      const oldLevel = Math.floor((character.experience_points || 0) / 1000) + 1;
      const newLevel = Math.floor(newXP / 1000) + 1;
      
      // Show XP notification
      setXPNotification({ xp: amount, source });

      // Update character
      setCharacter(prev => ({
        ...prev,
        experience_points: newXP,
        level: newLevel,
        attribute_points: prev.attribute_points + (newLevel > oldLevel ? 2 : 0)
      }));

      // Check for level up
      if (newLevel > oldLevel) {
        const result: LevelUpResult = {
          newLevel,
          attributePoints: 2,
          unlockedFeatures: newLevel % 5 === 0 ? ['New Feature Unlocked!'] : undefined
        };
        setLevelUpResult(result);
      }

      debugManager.log('XP awarded in test', 'success', { amount, newXP, newLevel });
    } catch (error) {
      debugManager.log('Error awarding XP in test', 'error', { error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      {/* Character Stats */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Trophy className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{character.name}</h3>
              <p className="text-sm text-gray-600">Level {character.level}</p>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            XP: {character.experience_points || 0}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <ProgressBar
            currentXP={character.experience_points || 0}
            level={character.level || 1}
          />
        </div>
      </div>

      {/* Test Controls */}
      <div className="p-4 space-y-6">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Test XP Awards</h4>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleAwardXP(50, 'Choice Made')}
              disabled={loading}
              className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Star className="w-5 h-5 text-yellow-500" />
              <div className="text-left">
                <div className="font-medium">Choice Made</div>
                <div className="text-sm text-gray-600">+50 XP</div>
              </div>
            </button>
            
            <button
              onClick={() => handleAwardXP(200, 'Story Milestone')}
              disabled={loading}
              className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Trophy className="w-5 h-5 text-indigo-500" />
              <div className="text-left">
                <div className="font-medium">Story Milestone</div>
                <div className="text-sm text-gray-600">+200 XP</div>
              </div>
            </button>

            <button
              onClick={() => handleAwardXP(100, 'Attribute Check')}
              disabled={loading}
              className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Dumbbell className="w-5 h-5 text-green-500" />
              <div className="text-left">
                <div className="font-medium">Attribute Check</div>
                <div className="text-sm text-gray-600">+100 XP</div>
              </div>
            </button>

            <button
              onClick={() => handleAwardXP(500, 'Story Completion')}
              disabled={loading}
              className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Zap className="w-5 h-5 text-purple-500" />
              <div className="text-left">
                <div className="font-medium">Story Completion</div>
                <div className="text-sm text-gray-600">+500 XP</div>
              </div>
            </button>
          </div>
        </div>

        {/* Character Attributes */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Attributes</h4>
          <div className="space-y-3">
            {character.attributes.map(attr => (
              <div key={attr.name} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{attr.name}</div>
                  <div className="text-sm text-gray-600">{attr.description}</div>
                </div>
                <div className="font-medium">{attr.value}</div>
              </div>
            ))}
          </div>
          {character.attribute_points > 0 && (
            <button
              onClick={() => setShowAttributePoints(true)}
              className="mt-4 w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Assign Attribute Points ({character.attribute_points})
            </button>
          )}
        </div>
      </div>

      {/* Notifications and Modals */}
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
            setCharacter(updatedCharacter);
            setShowAttributePoints(false);
          }}
        />
      )}
    </div>
  );
}