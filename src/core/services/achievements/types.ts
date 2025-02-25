/**
 * Achievement System Types Module
 * 
 * This module defines the core types and interfaces for the achievement system in AdventureBuildr.
 * It provides type definitions for achievements, progress tracking, and requirements validation.
 * These types ensure type safety and consistent data structures across the achievement system.
 * 
 * Key Features:
 * - Achievement type definitions
 * - Progress tracking interfaces
 * - Requirement specifications
 * - Type-safe achievement registry
 * 
 * @module achievements/types
 */

/**
 * Available achievement types in the system
 * Each type represents a unique accomplishment category
 */
export type AchievementType = 
  | 'STORY_MASTER'    // Complete story arcs
  | 'DECISION_MAKER'  // Make choices
  | 'ATTRIBUTE_MASTER' // Level up attributes
  | 'GENRE_EXPLORER'  // Try different genres
  | 'EQUIPMENT_COLLECTOR'; // Collect equipment

/**
 * Achievement definition interface
 * Defines the structure and requirements for achievements
 * 
 * @property id - Unique achievement identifier
 * @property title - Display title
 * @property description - Achievement description
 * @property icon - Icon identifier for UI
 * @property requirements - Unlock conditions
 * @property xpReward - XP awarded on unlock
 * @property unlockedAt - Optional unlock timestamp
 */
export interface Achievement {
  /** Achievement type identifier */
  id: AchievementType;
  /** Display title */
  title: string;
  /** Achievement description */
  description: string;
  /** Icon identifier */
  icon: string;
  /** Unlock requirements */
  requirements: {
    /** Required number of choices made */
    choicesMade?: number;
    /** Required number of stories completed */
    storiesCompleted?: number;
    /** Required attribute level */
    maxAttributeLevel?: number;
    /** Required number of unique genres */
    uniqueGenres?: number;
    /** Required number of unique equipment */
    uniqueEquipment?: number;
  };
  /** XP reward for unlocking */
  xpReward: number;
  /** Optional unlock timestamp */
  unlockedAt?: string;
}

/**
 * Achievement progress tracking interface
 * Tracks progress towards achievement requirements
 * 
 * @property uniqueGenres - Count of unique genres played
 * @property uniqueEquipment - Count of unique equipment collected
 * @property choicesMade - Optional count of choices made
 * @property storiesCompleted - Optional count of completed stories
 * @property maxAttributeLevel - Optional highest attribute level
 */
export interface AchievementProgress {
  /** Count of unique genres played */
  uniqueGenres: number;
  /** Count of unique equipment collected */
  uniqueEquipment: number;
  /** Optional count of choices made */
  choicesMade?: number;
  /** Optional count of completed stories */
  storiesCompleted?: number;
  /** Optional highest attribute level */
  maxAttributeLevel?: number;
}

/**
 * Integration Points:
 * 
 * 1. AchievementService
 *    ```typescript
 *    // In AchievementService
 *    export class AchievementService {
 *      private static readonly ACHIEVEMENTS: Record<AchievementType, Achievement> = {
 *        STORY_MASTER: {
 *          id: 'STORY_MASTER',
 *          title: 'Story Master',
 *          description: 'Complete 10 story arcs',
 *          requirements: { storiesCompleted: 10 },
 *          xpReward: 1000
 *        },
 *        // Other achievements...
 *      };
 *    }
 *    ```
 * 
 * 2. UI Components
 *    ```typescript
 *    // In AchievementList component
 *    interface Props {
 *      achievements: Achievement[];
 *      progress: AchievementProgress;
 *      onUnlock: (achievement: Achievement) => void;
 *    }
 *    
 *    function AchievementList({ achievements, progress, onUnlock }: Props) {
 *      return (
 *        <div>
 *          {achievements.map(achievement => (
 *            <AchievementCard
 *              key={achievement.id}
 *              achievement={achievement}
 *              progress={progress}
 *              onUnlock={onUnlock}
 *            />
 *          ))}
 *        </div>
 *      );
 *    }
 *    ```
 * 
 * 3. Database Schema
 *    ```sql
 *    -- Achievements table
 *    CREATE TABLE achievements (
 *      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *      user_id uuid REFERENCES auth.users(id),
 *      achievement_type text NOT NULL,
 *      title text NOT NULL,
 *      description text NOT NULL,
 *      unlocked_at timestamptz DEFAULT now()
 *    );
 *    
 *    -- Achievement progress table
 *    CREATE TABLE achievement_progress (
 *      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *      user_id uuid REFERENCES auth.users(id),
 *      achievement_type text NOT NULL,
 *      progress jsonb NOT NULL,
 *      updated_at timestamptz DEFAULT now()
 *    );
 *    ```
 * 
 * Usage Examples:
 * ```typescript
 * // Define new achievement
 * const achievement: Achievement = {
 *   id: 'STORY_MASTER',
 *   title: 'Story Master',
 *   description: 'Complete 10 story arcs',
 *   icon: 'Trophy',
 *   requirements: {
 *     storiesCompleted: 10
 *   },
 *   xpReward: 1000
 * };
 * 
 * // Track progress
 * const progress: AchievementProgress = {
 *   uniqueGenres: 2,
 *   uniqueEquipment: 5,
 *   choicesMade: 50,
 *   storiesCompleted: 3
 * };
 * 
 * // Check requirements
 * const meetsRequirements = (
 *   achievement: Achievement,
 *   progress: AchievementProgress
 * ): boolean => {
 *   const { requirements } = achievement;
 *   
 *   if (requirements.storiesCompleted && 
 *       progress.storiesCompleted < requirements.storiesCompleted) {
 *     return false;
 *   }
 *   
 *   // Check other requirements...
 *   return true;
 * };
 * ```
 * 
 * Type Validation:
 * ```typescript
 * // Validate achievement type
 * const isValidAchievementType = (type: string): type is AchievementType => {
 *   return [
 *     'STORY_MASTER',
 *     'DECISION_MAKER',
 *     'ATTRIBUTE_MASTER',
 *     'GENRE_EXPLORER',
 *     'EQUIPMENT_COLLECTOR'
 *   ].includes(type);
 * };
 * 
 * // Validate achievement structure
 * const validateAchievement = (achievement: Achievement): boolean => {
 *   if (!isValidAchievementType(achievement.id)) {
 *     return false;
 *   }
 *   
 *   if (!achievement.title || !achievement.description) {
 *     return false;
 *   }
 *   
 *   if (!achievement.requirements || 
 *       Object.keys(achievement.requirements).length === 0) {
 *     return false;
 *   }
 *   
 *   return true;
 * };
 * ```
 * 
 * Best Practices:
 * 1. Use proper type annotations
 * 2. Validate achievement data
 * 3. Track progress accurately
 * 4. Handle optional fields
 * 5. Maintain type consistency
 * 
 * @see AchievementService for implementation
 * @see ProgressionService for XP integration
 * @see GameEngine for achievement triggers
 */