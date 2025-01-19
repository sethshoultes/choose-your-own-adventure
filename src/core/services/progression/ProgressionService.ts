import { supabase } from '../../../lib/supabase';
import { debugManager } from '../../debug/DebugManager';
import type { Character, GameHistoryEntry } from '../../types';

export interface LevelUpResult {
  newLevel: number;
  attributePoints: number;
  unlockedFeatures?: string[];
}

export class ProgressionService {
  private static readonly BASE_XP_PER_LEVEL = 1000;
  private static readonly XP_MULTIPLIER = 1.5;
  
  // XP awards for different actions
  private static readonly XP_AWARDS = {
    CHOICE_MADE: 50,
    STORY_MILESTONE: 200,
    ATTRIBUTE_CHECK_SUCCESS: 100,
    EQUIPMENT_USE: 75,
    STORY_COMPLETION: 500
  };

  // Calculate XP needed for a given level
  public static getXPForLevel(level: number): number {
    return Math.floor(this.BASE_XP_PER_LEVEL * Math.pow(this.XP_MULTIPLIER, level - 1));
  }

  // Calculate current level based on XP
  public static calculateLevel(xp: number): number {
    let level = 1;
    while (xp >= this.getXPForLevel(level + 1)) {
      level++;
    }
    return level;
  }

  // Calculate attribute points awarded for a level
  private static getAttributePointsForLevel(level: number): number {
    return Math.max(2, Math.floor(level / 5) + 1);
  }

  // Check if character can level up
  public static canLevelUp(character: Character): boolean {
    const currentLevel = this.calculateLevel(character.experience_points || 0);
    return currentLevel > (character.level || 1);
  }

  // Process level up
  public static async processLevelUp(character: Character): Promise<LevelUpResult | null> {
    try {
      const currentXP = character.experience_points || 0;
      const newLevel = this.calculateLevel(currentXP);
      const currentLevel = character.level || 1;

      if (newLevel <= currentLevel) {
        return null;
      }

      const attributePoints = this.getAttributePointsForLevel(newLevel);
      const unlockedFeatures = this.getUnlockedFeatures(newLevel);

      // Update character in database
      const { error } = await supabase
        .from('characters')
        .update({
          level: newLevel,
          attribute_points: attributePoints,
          updated_at: new Date().toISOString()
        })
        .eq('id', character.id);

      if (error) {
        throw error;
      }

      debugManager.log('Character leveled up', 'success', {
        characterId: character.id,
        oldLevel: currentLevel,
        newLevel,
        attributePoints
      });

      return {
        newLevel,
        attributePoints,
        unlockedFeatures
      };
    } catch (error) {
      debugManager.log('Error processing level up', 'error', { error });
      throw error;
    }
  }

  // Award XP for an action
  public static async awardXP(
    character: Character,
    action: keyof typeof ProgressionService.XP_AWARDS,
    context?: any
  ): Promise<{
    xpAwarded: number;
    newTotal: number;
    levelUp: boolean;
  }> {
    try {
      if (!character.id) {
        throw new Error('Character ID is required for XP awards');
      }

      const xpAward = this.XP_AWARDS[action];
      const currentXP = character.experience_points || 0;
      const newTotal = currentXP + xpAward;
      const oldLevel = this.calculateLevel(currentXP);
      const newLevel = this.calculateLevel(newTotal);

      // Validate XP calculation
      if (isNaN(newTotal) || newTotal < 0) {
        throw new Error('Invalid XP calculation');
      }

      // Update character XP in database
      const { error } = await supabase
        .from('characters')
        .update({
          experience_points: newTotal,
          updated_at: new Date().toISOString()
        })
        .eq('id', character.id);

      if (error) {
        debugManager.log('Database error awarding XP', 'error', { error });
        throw error;
      }

      debugManager.log('XP awarded', 'success', {
        characterId: character.id,
        action,
        xpAwarded: xpAward,
        newTotal,
        levelUp: newLevel > oldLevel
      });

      return {
        xpAwarded: xpAward,
        newTotal,
        levelUp: newLevel > oldLevel
      };
    } catch (error) {
      debugManager.log('Error awarding XP', 'error', { error });
      throw new Error(error instanceof Error ? error.message : 'Failed to award XP');
    }
  }

  // Get features unlocked at a specific level
  private static getUnlockedFeatures(level: number): string[] {
    const features: string[] = [];
    
    // Add level-specific unlocks
    switch (level) {
      case 5:
        features.push('Special Abilities');
        break;
      case 10:
        features.push('Advanced Equipment');
        break;
      case 15:
        features.push('Mastery Skills');
        break;
      case 20:
        features.push('Legendary Actions');
        break;
    }

    return features;
  }

  // Calculate XP multiplier based on choice quality
  public static calculateChoiceMultiplier(
    choice: string,
    history: GameHistoryEntry[],
    character: Character
  ): number {
    let multiplier = 1.0;

    // Check for attribute-based choices
    const relevantAttributes = character.attributes.filter(attr => 
      choice.toLowerCase().includes(attr.name.toLowerCase()) && attr.value >= 7
    );
    if (relevantAttributes.length > 0) {
      multiplier += 0.2 * relevantAttributes.length;
    }

    // Check for equipment usage
    const usedEquipment = character.equipment.filter(item =>
      choice.toLowerCase().includes(item.name.toLowerCase())
    );
    if (usedEquipment.length > 0) {
      multiplier += 0.1 * usedEquipment.length;
    }

    // Check for choice variety (avoid repetition)
    const recentChoices = history.slice(-3).map(h => h.choice);
    if (!recentChoices.includes(choice)) {
      multiplier += 0.1;
    }

    return multiplier;
  }
}