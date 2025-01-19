import React from 'react';
import { ProgressionService } from '../../core/services/progression/ProgressionService';

interface Props {
  currentXP: number;
  level: number;
  className?: string;
}

export function ProgressBar({ currentXP, level, className = '' }: Props) {
  const nextLevelXP = ProgressionService.getXPForLevel(level + 1);
  const currentLevelXP = ProgressionService.getXPForLevel(level);
  const progress = ((currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex justify-between text-xs text-gray-600">
        <span>Level {level}</span>
        <span>{Math.floor(progress)}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-indigo-600 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>{currentXP - currentLevelXP} XP</span>
        <span>{nextLevelXP - currentLevelXP} XP needed</span>
      </div>
    </div>
  );
}