/**
 * ProgressionService Class
 * 
 * This service manages character progression, experience points, leveling, and achievements
 * in the AdventureBuildr game engine. It provides a comprehensive system for tracking and
 * rewarding player actions with XP, handling level-ups, and managing character advancement.
 */

import { ServiceRegistry } from '../ServiceRegistry';
import { ValidationService } from '../ValidationService';
import { DatabaseService } from '../DatabaseService';
import { ErrorService, ErrorCode, GameError } from '../ErrorService';
import { debugManager } from '../../debug/DebugManager';
import type { Character, GameHistoryEntry } from '../../types';
import type { LevelUpResult } from './types';

export class ProgressionService {
  /** Base XP required for first level */
  private static readonly BASE_XP_PER_LEVEL = 1000;
  /** XP multiplier for each level */
  private static readonly XP_MULTIPLIER = 1.5;

  /** XP awards for different actions */
  private static readonly XP_AWARDS = {
    CHOICE_MADE: 50,
    STORY_MILESTONE: 200,
    ATTRIBUTE_CHECK_SUCCESS: 100,
    EQUIPMENT_USE: 75,
    STORY_COMPLETION: 500,
    ACHIEVEMENT_UNLOCKED: {
      DECISION_MAKER: 500,
      ATTRIBUTE_MASTER: 750,
      STORY_MASTER: 1000,
      GENRE_EXPLORER: 500,
      EQUIPMENT_COLLECTOR: 300
    }
  };

  /** Required services */
  private validator: ValidationService;
  private database: DatabaseService;
  private errorService: ErrorService;
  private initialized: boolean = false;

  constructor() {
    this.errorService = ErrorService.getInstance();
  }

  /**
   * Initializes the progression service
   * Must be called before any other operations
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    const registry = ServiceRegistry.getInstance();
    try {
      this.validator = registry.get('validation');
      this.database = registry.get('database');
      this.initialized = true;
      debugManager.log('Progression service initialized', 'success');
    } catch (error) {
      debugManager.log('Failed to initialize progression service', 'error', { error });
      throw error;
    }
  }

  /**
   * Handles progression after a player makes a choice
   * Awards XP, checks for level-ups, and triggers achievements
   */
  public async handleChoiceMade(params: {
    character: Character;
    choice: string;
    history: GameHistoryEntry[];
    callbacks: {
      onXP?: (amount: number, source: string) => void;
      onLevelUp?: (result: LevelUpResult) => void;
      onAchievementUnlocked?: (achievement: Achievement) => void;
    };
  }): Promise<void> {
    const { character, choice, history, callbacks } = params;

    try {
      // Calculate XP multiplier based on choice context
      const multiplier = this.calculateChoiceMultiplier(choice, history, character);
      
      // Award XP for the choice
      const { levelUp, xpAwarded } = await this.awardXP(
        character,
        'CHOICE_MADE',
        { multiplier }
      );

      // Notify about XP gain
      callbacks.onXP?.(xpAwarded, 'Choice made');

      // Handle level up if triggered
      if (levelUp) {
        const levelUpResult = await this.processLevelUp(character);
        if (levelUpResult) {
          debugManager.log('Character leveled up', 'success', { levelUpResult });
          callbacks.onLevelUp?.(levelUpResult);
        }
      }

      // Check for achievements
      await this.checkAchievements(character, {
        choicesMade: history.length,
        onAchievementUnlocked: callbacks.onAchievementUnlocked
      });
    } catch (error) {
      this.errorService.handleError(error);
      throw error;
    }
  }

  /**
   * Awards XP to a character for an action
   * Automatically saves progress to database
   */
  public async awardXP(
    character: Character,
    action: keyof typeof ProgressionService.XP_AWARDS,
    context?: {
      multiplier?: number;
      achievementType?: string;
    }
  ): Promise<{
    xpAwarded: number;
    newTotal: number;
    levelUp: boolean;
  }> {
    try {
      if (!character.id) {
        throw new GameError(
          'Character ID is required for XP awards',
          ErrorCode.CHARACTER_NOT_FOUND
        );
      }

      // Calculate XP award
      let xpAward = typeof ProgressionService.XP_AWARDS[action] === 'object' 
        ? ProgressionService.XP_AWARDS[action][context?.achievementType || ''] || 0
        : ProgressionService.XP_AWARDS[action];

      // Apply multiplier if provided
      if (context?.multiplier) {
        xpAward = Math.floor(xpAward * context.multiplier);
      }

      // Save progression to database
      const { data: result, error } = await supabase.rpc('track_progression', {
        p_character_id: character.id,
        p_action_type: action,
        p_xp_amount: xpAward,
        p_source: action.toString(),
        p_metadata: {
          multiplier: context?.multiplier,
          achievementType: context?.achievementType,
          timestamp: new Date().toISOString()
        }
      });

      if (error) throw error;

      debugManager.log('XP awarded', 'success', {
        characterId: character.id,
        action,
        xpAwarded: xpAward,
        result
      });

      return {
        xpAwarded: xpAward,
        newTotal: result.new_xp,
        levelUp: result.new_level > result.old_level
      };
    } catch (error) {
      this.errorService.handleError(error);
      throw error;
    }
  }

  /**
   * Calculates XP multiplier based on choice context
   * Considers attributes, equipment, and choice variety
   */
  private calculateChoiceMultiplier(
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

    // Check for choice variety
    const recentChoices = history.slice(-3).map(h => h.choice);
    if (!recentChoices.includes(choice)) {
      multiplier += 0.1;
    }

    return multiplier;
  }

  /**
   * Processes a character level-up
   * Awards attribute points and unlocks features
   */
  private async processLevelUp(character: Character): Promise<LevelUpResult | null> {
    try {
      const currentXP = character.experience_points || 0;
      const newLevel = this.calculateLevel(currentXP);
      const currentLevel = character.level || 1;

      if (newLevel <= currentLevel) {
        return null;
      }

      const attributePoints = this.getAttributePointsForLevel(newLevel);
      const unlockedFeatures = this.getUnlockedFeatures(newLevel);

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
      this.errorService.handleError(error);
      throw error;
    }
  }

  /**
   * Gets XP required for a specific level
   */
  public getXPForLevel(level: number): number {
    return Math.floor(
      ProgressionService.BASE_XP_PER_LEVEL * 
      Math.pow(ProgressionService.XP_MULTIPLIER, level - 1)
    );
  }

  /**
   * Calculates character level based on total XP
   */
  private calculateLevel(xp: number): number {
    let level = 1;
    while (xp >= this.getXPForLevel(level + 1)) {
      level++;
    }
    return level;
  }

  /**
   * Gets attribute points awarded for a level
   */
  private getAttributePointsForLevel(level: number): number {
    return Math.max(2, Math.floor(level / 5) + 1);
  }

  /**
   * Gets features unlocked at a specific level
   */
  private getUnlockedFeatures(level: number): string[] {
    const features: string[] = [];
    
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
}