import React, { useState, useEffect } from 'react';
import { Trophy, Lock, Check, Star } from 'lucide-react';
import { AchievementService } from '../../core/services/achievements/AchievementService';
import type { Achievement, AchievementProgress } from '../../core/services/achievements/types';
import { supabase } from '../../lib/supabase';
import { LoadingIndicator } from '../LoadingIndicator';

export function AchievementList() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [progress, setProgress] = useState<AchievementProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const unlockedAchievements = await AchievementService.getUnlockedAchievements(user.id);
      setAchievements(unlockedAchievements);
      
      // Get character for progress tracking
      const { data: characters } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', user.id);

      if (characters && characters.length > 0) {
        const progress = await AchievementService.getProgress(characters[0]);
        setProgress(progress);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (achievement: Achievement): number => {
    if (!progress) return 0;
    
    const { requirements } = achievement;
    
    switch (achievement.id) {
      case 'STORY_MASTER':
        return Math.min((progress.storiesCompleted || 0) / requirements.storiesCompleted! * 100, 100);
      case 'DECISION_MAKER':
        return Math.min((progress.choicesMade || 0) / requirements.choicesMade! * 100, 100);
      case 'ATTRIBUTE_MASTER':
        return Math.min((progress.maxAttributeLevel || 0) / requirements.maxAttributeLevel! * 100, 100);
      case 'GENRE_EXPLORER':
        return Math.min(progress.uniqueGenres / requirements.uniqueGenres! * 100, 100);
      case 'EQUIPMENT_COLLECTOR':
        return Math.min(progress.uniqueEquipment / requirements.uniqueEquipment! * 100, 100);
      default:
        return 0;
    }
  };

  const getProgressText = (achievement: Achievement): string => {
    if (!progress) return '';
    
    const { requirements } = achievement;
    
    switch (achievement.id) {
      case 'STORY_MASTER':
        return `${progress.storiesCompleted || 0}/${requirements.storiesCompleted} stories`;
      case 'DECISION_MAKER':
        return `${progress.choicesMade || 0}/${requirements.choicesMade} choices`;
      case 'ATTRIBUTE_MASTER':
        return `Level ${progress.maxAttributeLevel || 0}/${requirements.maxAttributeLevel}`;
      case 'GENRE_EXPLORER':
        return `${progress.uniqueGenres}/${requirements.uniqueGenres} genres`;
      case 'EQUIPMENT_COLLECTOR':
        return `${progress.uniqueEquipment}/${requirements.uniqueEquipment} items`;
      default:
        return '';
    }
  };
  if (loading) {
    return <LoadingIndicator message="Loading achievements..." />;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        Error loading achievements: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-yellow-100 rounded-lg">
          <Trophy className="w-6 h-6 text-yellow-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Achievements</h2>
          <p className="text-sm text-gray-600">
            {achievements.length} achievements unlocked
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {Object.values(AchievementService.ACHIEVEMENTS).map((achievement) => {
          const unlocked = achievements.find(a => a.id === achievement.id);
          
          return (
            <div
              key={achievement.id}
              className={`p-4 rounded-lg border ${
                unlocked ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200' : 'bg-gray-50 border-gray-200'
              } relative overflow-hidden`}
            >
              {/* Progress Bar Background */}
              {!unlocked && (
                <div 
                  className="absolute inset-0 bg-gray-100 opacity-50"
                  style={{ 
                    width: `${getProgressPercentage(achievement)}%`,
                    transition: 'width 0.5s ease-out'
                  }}
                />
              )}
              
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  unlocked ? 'bg-yellow-200' : 'bg-gray-200'
                }`}>
                  {unlocked ? (
                    <Check className={`w-5 h-5 text-yellow-700`} />
                  ) : (
                    <Star className="w-5 h-5 text-gray-500" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium">{achievement.title}</h3>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                  {!unlocked && (
                    <p className="text-xs text-gray-500 mt-1">
                      {getProgressText(achievement)}
                    </p>
                  )}
                  {unlocked && (
                    <p className="text-xs text-yellow-600 mt-1">
                      Unlocked {new Date(unlocked.unlockedAt!).toLocaleDateString()}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    +{achievement.xpReward} XP
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}