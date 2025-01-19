import { supabase } from '../../../lib/supabase';
import { debugManager } from '../../debug/DebugManager';
import type { Character } from '../../types';
import type { Achievement, AchievementProgress, AchievementType } from './types';

export class AchievementService {
  private static readonly ACHIEVEMENTS: Record<AchievementType, Achievement> = {
    STORY_MASTER: {
      id: 'STORY_MASTER',
      title: 'Story Master',
      description: 'Complete 10 story arcs',
      icon: 'Book',
      requirements: { storiesCompleted: 10 },
      xpReward: 1000
    },
    DECISION_MAKER: {
      id: 'DECISION_MAKER',
      title: 'Decision Maker',
      description: 'Make 100 choices',
      icon: 'GitBranch',
      requirements: { choicesMade: 100 },
      xpReward: 500
    },
    ATTRIBUTE_MASTER: {
      id: 'ATTRIBUTE_MASTER',
      title: 'Attribute Master',
      description: 'Reach level 10 in any attribute',
      icon: 'Dumbbell',
      requirements: { maxAttributeLevel: 10 },
      xpReward: 750
    },
    GENRE_EXPLORER: {
      id: 'GENRE_EXPLORER',
      title: 'Genre Explorer',
      description: 'Create characters in 3 different genres',
      icon: 'Compass',
      requirements: { uniqueGenres: 3 },
      xpReward: 500
    },
    EQUIPMENT_COLLECTOR: {
      id: 'EQUIPMENT_COLLECTOR',
      title: 'Equipment Collector',
      description: 'Collect 10 unique pieces of equipment',
      icon: 'Package',
      requirements: { uniqueEquipment: 10 },
      xpReward: 300
    }
  };

  public static async checkAchievements(
    character: Character,
    context: {
      choicesMade?: number;
      storiesCompleted?: number;
      onAchievementUnlocked?: (achievement: Achievement) => void;
    } = {}
  ): Promise<void> {
    try {
      const { data: unlockedAchievements } = await supabase
        .from('achievements')
        .select('achievement_type')
        .eq('user_id', character.user_id);

      const unlockedTypes = new Set(unlockedAchievements?.map(a => a.achievement_type));
      const progress = await this.getProgress(character);

      for (const [type, achievement] of Object.entries(this.ACHIEVEMENTS)) {
        if (unlockedTypes.has(type)) continue;

        if (await this.checkAchievementRequirements(achievement, character, progress, context)) {
          await this.unlockAchievement(character.user_id!, achievement);
          context.onAchievementUnlocked?.(achievement);
        }
      }
    } catch (error) {
      debugManager.log('Error checking achievements', 'error', { error });
    }
  }

  private static async checkAchievementRequirements(
    achievement: Achievement,
    character: Character,
    progress: AchievementProgress,
    context: any
  ): Promise<boolean> {
    const { requirements } = achievement;

    // Check each requirement
    if (requirements.choicesMade && (context.choicesMade || 0) < requirements.choicesMade) {
      return false;
    }

    if (requirements.storiesCompleted && (context.storiesCompleted || 0) < requirements.storiesCompleted) {
      return false;
    }

    if (requirements.maxAttributeLevel) {
      const hasHighAttribute = character.attributes.some(
        attr => attr.value >= requirements.maxAttributeLevel!
      );
      if (!hasHighAttribute) return false;
    }

    if (requirements.uniqueGenres && progress.uniqueGenres < requirements.uniqueGenres) {
      return false;
    }

    if (requirements.uniqueEquipment && progress.uniqueEquipment < requirements.uniqueEquipment) {
      return false;
    }

    return true;
  }

  private static async unlockAchievement(
    userId: string,
    achievement: Achievement
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('achievements')
        .insert({
          user_id: userId,
          achievement_type: achievement.id,
          title: achievement.title,
          description: achievement.description,
          unlocked_at: new Date().toISOString()
        });

      if (error) throw error;

      debugManager.log('Achievement unlocked', 'success', { achievement });
    } catch (error) {
      debugManager.log('Error unlocking achievement', 'error', { error });
      throw error;
    }
  }

  public static async getProgress(character: Character): Promise<AchievementProgress> {
    try {
      // Get all character data for the user
      const { data: characters } = await supabase
        .from('characters')
        .select('genre, equipment')
        .eq('user_id', character.user_id);

      if (!characters) return { uniqueGenres: 0, uniqueEquipment: 0 };

      // Calculate unique genres
      const uniqueGenres = new Set(characters.map(c => c.genre)).size;

      // Calculate unique equipment
      const uniqueEquipment = new Set(
        characters.flatMap(c => c.equipment.map(e => e.name))
      ).size;

      return {
        uniqueGenres,
        uniqueEquipment
      };
    } catch (error) {
      debugManager.log('Error getting achievement progress', 'error', { error });
      return { uniqueGenres: 0, uniqueEquipment: 0 };
    }
  }

  public static async getUnlockedAchievements(userId: string): Promise<Achievement[]> {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

      if (error) throw error;

      return data.map(record => ({
        ...this.ACHIEVEMENTS[record.achievement_type as AchievementType],
        unlockedAt: record.unlocked_at
      }));
    } catch (error) {
      debugManager.log('Error getting unlocked achievements', 'error', { error });
      return [];
    }
  }
}