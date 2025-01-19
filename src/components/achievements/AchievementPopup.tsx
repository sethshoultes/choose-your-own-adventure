import React, { useEffect } from 'react';
import { Trophy } from 'lucide-react';
import type { Achievement } from '../../core/services/achievements/types';

interface Props {
  achievement: Achievement;
  onClose: () => void;
}

export function AchievementPopup({ achievement, onClose }: Props) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-6 py-4 rounded-lg shadow-lg max-w-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-400 rounded-full">
            <Trophy className="w-6 h-6 text-yellow-700" />
          </div>
          <div>
            <p className="text-sm font-medium">Achievement Unlocked!</p>
            <p className="text-lg font-bold">{achievement.title}</p>
            <p className="text-sm text-yellow-100">{achievement.description}</p>
            <p className="text-xs text-yellow-200 mt-1">+{achievement.xpReward} XP</p>
          </div>
        </div>
      </div>
    </div>
  );
}