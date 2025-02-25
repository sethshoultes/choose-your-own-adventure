import React from 'react';
import { Trophy, Star, Sparkles } from 'lucide-react';
import type { LevelUpResult } from '../../core/services/progression/types';

interface Props {
  result: LevelUpResult;
  onClose: () => void;
  onAttributePointsAssigned: () => void;
  visible: boolean;
}

export function LevelUpModal({ result, onClose, onAttributePointsAssigned, visible }: Props) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-indigo-100 rounded-full">
              <Trophy className="w-12 h-12 text-indigo-600" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Level Up!</h2>
          <p className="text-gray-600">
            Congratulations! You've reached level {result.newLevel}
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-lg">
            <Star className="w-6 h-6 text-indigo-600" />
            <div>
              <h3 className="font-medium">Attribute Points</h3>
              <p className="text-sm text-gray-600">
                You've earned {result.attributePoints} points to improve your attributes
              </p>
            </div>
          </div>

          {result.unlockedFeatures && result.unlockedFeatures.length > 0 && (
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <div>
                <h3 className="font-medium">New Features Unlocked</h3>
                <ul className="text-sm text-gray-600 list-disc list-inside">
                  {result.unlockedFeatures.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={onAttributePointsAssigned}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Assign Points
          </button>
        </div>
      </div>
    </div>
  );
}