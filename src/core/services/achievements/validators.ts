/**
 * Achievement Validation Module
 * 
 * This module provides validation functions for the achievement system in AdventureBuildr.
 * It ensures data integrity and type safety for achievements and progress tracking.
 * The validators integrate with the ValidationService to provide consistent validation
 * across the achievement system.
 * 
 * Key Features:
 * - Achievement structure validation
 * - Progress data validation
 * - Type safety checks
 * - Error reporting
 * - Database integration
 * 
 * @module achievements/validators
 */

import type { ValidationResult } from '../ValidationService';
import type { Achievement, AchievementProgress } from './types';

/**
 * Validates achievement data structure and values
 * Ensures achievements are properly formatted and contain required fields
 * 
 * @example
 * ```typescript
 * const award: Achievement = {
 *   id: 'STORY_MASTER',
 *   title: 'Story Master',
 *   description: 'Complete 10 story arcs',
 *   icon: 'Trophy',
 *   requirements: { storiesCompleted: 10 },
 *   xpReward: 1000
 * };
 * 
 * const result = achievementValidator.validate(award);
 * if (!result.valid) {
 *   console.error('Invalid achievement:', result.errors);
 * }
 * ```
 */
export const achievementValidator = {
  validate(achievement: Achievement): ValidationResult {
    const errors: string[] = [];

    if (!achievement.id) {
      errors.push('Missing achievement ID');
    }

    if (!achievement.title) {
      errors.push('Missing achievement title');
    }

    if (!achievement.description) {
      errors.push('Missing achievement description');
    }

    if (!achievement.icon) {
      errors.push('Missing achievement icon');
    }

    if (!achievement.requirements || Object.keys(achievement.requirements).length === 0) {
      errors.push('Missing achievement requirements');
    }

    if (typeof achievement.xpReward !== 'number' || achievement.xpReward < 0) {
      errors.push('Invalid XP reward');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};

/**
 * Validates achievement progress data
 * Ensures progress tracking data is valid and properly formatted
 * 
 * Integration Points:
 * - AchievementService: Used before state updates
 * - GameEngine: Used during progress tracking
 * - Achievement System: Used for progress validation
 * 
 * @example
 * ```typescript
 * // In AchievementService
 * const result = achievementProgressValidator.validate(progress);
 * if (result.valid) {
 *   await this.updateProgress(progress);
 * } else {
 *   throw new Error(`Invalid progress state: ${result.errors.join(', ')}`);
 * }
 * ```
 */
export const achievementProgressValidator = {
  validate(progress: AchievementProgress): ValidationResult {
    const errors: string[] = [];

    if (typeof progress.uniqueGenres !== 'number' || progress.uniqueGenres < 0) {
      errors.push('Invalid unique genres count');
    }

    if (typeof progress.uniqueEquipment !== 'number' || progress.uniqueEquipment < 0) {
      errors.push('Invalid unique equipment count');
    }

    if (progress.choicesMade !== undefined && (typeof progress.choicesMade !== 'number' || progress.choicesMade < 0)) {
      errors.push('Invalid choices made count');
    }

    if (progress.storiesCompleted !== undefined && (typeof progress.storiesCompleted !== 'number' || progress.storiesCompleted < 0)) {
      errors.push('Invalid stories completed count');
    }

    if (progress.maxAttributeLevel !== undefined && (typeof progress.maxAttributeLevel !== 'number' || progress.maxAttributeLevel < 0)) {
      errors.push('Invalid max attribute level');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};

/**
 * Database Schema Integration:
 * ```sql
 * -- Achievement validation triggers
 * CREATE OR REPLACE FUNCTION validate_achievement()
 * RETURNS trigger AS $$
 * BEGIN
 *   -- Validate required fields
 *   IF NEW.title IS NULL OR NEW.title = '' THEN
 *     RAISE EXCEPTION 'Missing achievement title';
 *   END IF;
 * 
 *   IF NEW.description IS NULL OR NEW.description = '' THEN
 *     RAISE EXCEPTION 'Missing achievement description';
 *   END IF;
 * 
 *   -- Validate XP reward
 *   IF NEW.xp_reward < 0 THEN
 *     RAISE EXCEPTION 'Invalid XP reward: %', NEW.xp_reward;
 *   END IF;
 * 
 *   RETURN NEW;
 * END;
 * $$ LANGUAGE plpgsql;
 * 
 * CREATE TRIGGER validate_achievement_trigger
 *   BEFORE INSERT OR UPDATE ON achievements
 *   FOR EACH ROW
 *   EXECUTE FUNCTION validate_achievement();
 * ```
 * 
 * Error Handling:
 * ```typescript
 * try {
 *   const result = achievementValidator.validate(achievement);
 *   if (!result.valid) {
 *     throw new GameError(
 *       'Invalid achievement',
 *       ErrorCode.VALIDATION,
 *       result.errors
 *     );
 *   }
 * } catch (error) {
 *   debugManager.log('Achievement validation failed', 'error', { error });
 *   throw error;
 * }
 * ```
 * 
 * Best Practices:
 * 1. Always validate before state updates
 * 2. Use both client and server validation
 * 3. Provide clear error messages
 * 4. Log validation failures
 * 5. Handle edge cases gracefully
 * 
 * Usage Examples:
 * ```typescript
 * // Validate new achievement
 * const validateNewAchievement = (achievement: Achievement) => {
 *   const result = achievementValidator.validate(achievement);
 *   if (!result.valid) {
 *     throw new Error(`Invalid achievement: ${result.errors.join(', ')}`);
 *   }
 *   return achievement;
 * };
 * 
 * // Validate progress update
 * const validateProgressUpdate = (
 *   oldProgress: AchievementProgress,
 *   newProgress: AchievementProgress
 * ) => {
 *   // Ensure progress only increases
 *   if (newProgress.choicesMade < oldProgress.choicesMade) {
 *     throw new Error('Progress cannot decrease');
 *   }
 *   
 *   const result = achievementProgressValidator.validate(newProgress);
 *   if (!result.valid) {
 *     throw new Error(`Invalid progress: ${result.errors.join(', ')}`);
 *   }
 *   
 *   return newProgress;
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
 * // Validate requirements
 * const validateRequirements = (requirements: any): boolean => {
 *   if (typeof requirements !== 'object') return false;
 *   
 *   const validFields = [
 *     'choicesMade',
 *     'storiesCompleted',
 *     'maxAttributeLevel',
 *     'uniqueGenres',
 *     'uniqueEquipment'
 *   ];
 *   
 *   return Object.keys(requirements).every(key => 
 *     validFields.includes(key) && 
 *     typeof requirements[key] === 'number' &&
 *     requirements[key] > 0
 *   );
 * };
 * ```
 * 
 * @see AchievementService for service implementation
 * @see ValidationService for validation framework
 * @see Achievement for achievement structure
 */