/**
 * AchievementService Class
 * 
 * This service manages the achievement system in the AdventureBuildr game engine. It handles achievement
 * tracking, unlocking, progress monitoring, and reward distribution. The service integrates with the
 * game's progression system to provide meaningful rewards and track player accomplishments.
 * 
 * Key Features:
 * - Achievement tracking and unlocking
 * - Progress monitoring
 * - XP reward distribution
 * - Achievement validation
 * - Database persistence
 * 
 * Data Flow:
 * 1. Achievement progress tracking
 * 2. Condition validation
 * 3. Achievement unlocking
 * 4. Reward distribution
 * 5. State persistence
 * 
 * @see ProgressionService for XP integration
 * @see GameEngine for game state integration
 */

import { ServiceRegistry } from '../ServiceRegistry';
import { ValidationService } from '../ValidationService';
import { DatabaseService } from '../DatabaseService';
import { ErrorService, ErrorCode, GameError } from '../ErrorService';
import { debugManager } from '../../debug/DebugManager';
import type { Character } from '../../types';
import type { Achievement, AchievementProgress, AchievementType } from './types';

export class AchievementService {
  /** Registry of available achievements with requirements */
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

  /** Required services */
  private validator: ValidationService;
  private database: DatabaseService;
  private errorService: ErrorService;
  private initialized: boolean = false;

  constructor() {
    this.errorService = ErrorService.getInstance();
  }

  /**
   * Initializes the achievement service
   * Must be called before any other operations
   * 
   * @throws Error if initialization fails
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    const registry = ServiceRegistry.getInstance();
    try {
      this.validator = registry.get('validation');
      this.database = registry.get('database');
      this.initialized = true;
      debugManager.log('Achievement service initialized', 'success');
    } catch (error) {
      debugManager.log('Failed to initialize achievement service', 'error', { error });
      throw error;
    }
  }

  /**
   * Checks for achievement unlocks based on current state
   * Triggers rewards and notifications for unlocked achievements
   * 
   * @param character Current character
   * @param context Achievement check context
   * @throws Error if check fails
   * 
   * @example
   * ```typescript
   * await achievementService.checkAchievements(character, {
   *   choicesMade: totalChoices,
   *   onAchievementUnlocked: showNotification
   * });
   * ```
   */
  public async checkAchievements(
    character: Character,
    context: {
      choicesMade?: number;
      storiesCompleted?: number;
      onAchievementUnlocked?: (achievement: Achievement) => void;
    }
  ): Promise<void> {
    try {
      const unlockedAchievements = await this.getUnlockedAchievements(character.user_id!);
      const unlockedTypes = new Set(unlockedAchievements.map(a => a.id));
      const progress = await this.getProgress(character);

      for (const [type, achievement] of Object.entries(AchievementService.ACHIEVEMENTS)) {
        if (unlockedTypes.has(type)) continue;

        if (await this.checkAchievementRequirements(achievement, character, progress, context)) {
          await this.unlockAchievement(character, achievement);
          context.onAchievementUnlocked?.(achievement);

          // Get progression service to award XP
          const progressionService = ServiceRegistry.getInstance().get('progression');
          await progressionService.awardXP(character, 'ACHIEVEMENT_UNLOCKED', {
            achievementType: achievement.id
          });
        }
      }
    } catch (error) {
      this.errorService.handleError(error);
    }
  }

  /**
   * Checks if achievement requirements are met
   * Validates conditions based on character state
   * 
   * @param achievement Achievement to check
   * @param character Current character
   * @param progress Achievement progress
   * @param context Check context
   * @returns true if requirements are met
   */
  private async checkAchievementRequirements(
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

  /**
   * Unlocks an achievement for a character
   * Persists achievement state and triggers rewards
   * 
   * @param character Character unlocking achievement
   * @param achievement Achievement to unlock
   * @throws Error if unlock fails
   */
  private async unlockAchievement(
    character: Character,
    achievement: Achievement
  ): Promise<void> {
    try {
      await this.database.operation(
        `achievement:${character.id}:${achievement.id}`,
        async () => {
          const { error } = await supabase
            .from('achievements')
            .insert({
              user_id: character.user_id,
              character_id: character.id,
              achievement_type: achievement.id,
              title: achievement.title,
              description: achievement.description,
              unlocked_at: new Date().toISOString()
            });

          if (error) throw error;
        }
      );

      debugManager.log('Achievement unlocked', 'success', { achievement });
    } catch (error) {
      this.errorService.handleError(error);
      throw error;
    }
  }

  /**
   * Gets current achievement progress for a character
   * Tracks progress across multiple metrics
   * 
   * @param character Character to check progress for
   * @returns Achievement progress metrics
   */
  public async getProgress(character: Character): Promise<AchievementProgress> {
    try {
      const result = await this.database.operation(
        `achievementProgress:${character.user_id}`,
        async () => {
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
        }
      );

      return result;
    } catch (error) {
      this.errorService.handleError(error);
      return { uniqueGenres: 0, uniqueEquipment: 0 };
    }
  }

  /**
   * Gets all unlocked achievements for a user
   * 
   * @param userId User ID to get achievements for
   * @returns Array of unlocked achievements
   */
  public async getUnlockedAchievements(userId: string): Promise<Achievement[]> {
    try {
      const result = await this.database.operation(
        `unlockedAchievements:${userId}`,
        async () => {
          const { data, error } = await supabase
            .from('achievements')
            .select('*')
            .eq('user_id', userId)
            .order('unlocked_at', { ascending: false });

          if (error) throw error;

          return data.map(record => ({
            ...AchievementService.ACHIEVEMENTS[record.achievement_type as AchievementType],
            unlockedAt: record.unlocked_at
          }));
        }
      );

      return result;
    } catch (error) {
      this.errorService.handleError(error);
      return [];
    }
  }
}

/**
 * Integration Points:
 * 
 * 1. GameEngine
 *    ```typescript
 *    // In GameEngine
 *    private async handleChoice(choiceId: number): Promise<void> {
 *      await this.achievementService.checkAchievements(
 *        this.character,
 *        {
 *          choicesMade: this.state.history.length,
 *          onAchievementUnlocked: this.showAchievement
 *        }
 *      );
 *    }
 *    ```
 * 
 * 2. ProgressionService
 *    ```typescript
 *    // In ProgressionService
 *    public async handleLevelUp(character: Character): Promise<void> {
 *      await this.achievementService.checkAchievements(
 *        character,
 *        { maxAttributeLevel: newLevel }
 *      );
 *    }
 *    ```
 * 
 * 3. UI Components
 *    ```typescript
 *    // In AchievementList component
 *    const [achievements, setAchievements] = useState<Achievement[]>([]);
 *    
 *    useEffect(() => {
 *      const loadAchievements = async () => {
 *        const unlocked = await achievementService
 *          .getUnlockedAchievements(userId);
 *        setAchievements(unlocked);
 *      };
 *      loadAchievements();
 *    }, []);
 *    ```
 * 
 * Database Schema:
 * ```sql
 * -- Achievements table
 * CREATE TABLE achievements (
 *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id uuid REFERENCES auth.users(id),
 *   character_id uuid REFERENCES characters(id),
 *   achievement_type text NOT NULL,
 *   title text NOT NULL,
 *   description text NOT NULL,
 *   unlocked_at timestamptz DEFAULT now(),
 *   metadata jsonb
 * );
 * 
 * -- Achievement progress tracking
 * CREATE TABLE achievement_progress (
 *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id uuid REFERENCES auth.users(id),
 *   achievement_type text NOT NULL,
 *   progress jsonb NOT NULL,
 *   updated_at timestamptz DEFAULT now()
 * );
 * ```
 * 
 * Error Handling:
 * ```typescript
 * try {
 *   await achievementService.checkAchievements(character, context);
 * } catch (error) {
 *   debugManager.log('Achievement check failed', 'error', { error });
 *   // Handle error but don't block game progress
 * }
 * ```
 * 
 * Best Practices:
 * 1. Always handle achievement errors gracefully
 * 2. Cache achievement progress when possible
 * 3. Batch achievement checks
 * 4. Validate requirements thoroughly
 * 5. Maintain achievement consistency
 * 
 * Performance Optimization:
 * ```typescript
 * // Cache achievement progress
 * const progressCache = new Map<string, AchievementProgress>();
 * 
 * const getCachedProgress = async (userId: string) => {
 *   if (!progressCache.has(userId)) {
 *     const progress = await loadProgress(userId);
 *     progressCache.set(userId, progress);
 *   }
 *   return progressCache.get(userId)!;
 * };
 * 
 * // Batch achievement checks
 * const batchCheckAchievements = async (
 *   characters: Character[],
 *   context: any
 * ) => {
 *   const results = await Promise.all(
 *     characters.map(char => 
 *       checkAchievements(char, context)
 *         .catch(error => {
 *           debugManager.log('Achievement check failed', 'error', { error });
 *           return null;
 *         })
 *     )
 *   );
 *   return results.filter(Boolean);
 * };
 * ```
 * 
 * @see ProgressionService for XP rewards
 * @see GameEngine for game integration
 * @see Achievement for achievement structure
 */