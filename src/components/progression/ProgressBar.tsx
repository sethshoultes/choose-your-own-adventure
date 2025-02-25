import React, { useState, useEffect } from 'react';
import { ServiceRegistry } from '../../core/services/ServiceRegistry';
import { ServiceInitializer } from '../../core/services/ServiceInitializer';
import type { ProgressionService } from '../../core/services/progression/ProgressionService';
import { debugManager } from '../../core/debug/DebugManager';

interface Props {
  currentXP: number;
  level: number;
  className?: string;
}

export function ProgressBar({ currentXP, level, className = '' }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [nextLevelXP, setNextLevelXP] = useState<number>(0);
  const [currentLevelXP, setCurrentLevelXP] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const progressionService = React.useMemo(() => {
    try {
      if (!ServiceInitializer.isInitialized()) {
        ServiceInitializer.initialize();
      }
      return ServiceRegistry.getInstance().get<ProgressionService>('progression');
    } catch (error) {
      debugManager.log('Failed to get progression service', 'error', { error });
      return null;
    }
  }, []);

  useEffect(() => {
    if (progressionService) {
      try {
        const nextXP = progressionService.getXPForLevel(level + 1);
        const currentXPForLevel = progressionService.getXPForLevel(level);
        setNextLevelXP(nextXP);
        setCurrentLevelXP(currentXPForLevel);
        setProgress(((currentXP - currentXPForLevel) / (nextXP - currentXPForLevel)) * 100);
      } catch (error) {
        debugManager.log('Failed to calculate progression', 'error', { error });
        setError(error instanceof Error ? error.message : 'Failed to calculate progression');
      }
    }
  }, [currentXP, level, progressionService]);

  if (error) {
    return (
      <div className={`space-y-1 ${className}`}>
        <div className="flex justify-between text-xs text-gray-600">
          <span>Level {level}</span>
          <span>0%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gray-300 w-0" />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>0 XP</span>
          <span>Service unavailable</span>
        </div>
      </div>
    );
  }

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