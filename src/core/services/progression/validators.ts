/**
 * Progression System Validators
 * 
 * This module provides validation functions for the progression system in AdventureBuildr.
 * It ensures data integrity and type safety for XP awards, progression state updates,
 * and achievement tracking.
 * 
 * The validators integrate with the ValidationService to provide consistent
 * validation across the progression system.
 * 
 * @module progression/validators
 */

import type { ValidationResult } from '../ValidationService';
import type { Character } from '../../types';
import type { XPAward } from './types';

/**
 * Validates XP award data structure and values
 * Ensures XP awards are properly formatted and contain valid amounts
 * 
 * @example
 * ```typescript
 * const award: XPAward = {
 *   amount: 100,
 *   source: "Quest completion",
 *   timestamp: new Date().toISOString()
 * };
 * 
 * const result = xpAwardValidator.validate(award);
 * if (!result.valid) {
 *   console.error('Invalid XP award:', result.errors);
 * }
 * ```
 */
export const xpAwardValidator = {
  validate(award: XPAward): ValidationResult {
    const errors: string[] = [];

    // Validate XP amount
    if (typeof award.amount !== 'number' || award.amount < 0) {
      errors.push('Invalid XP amount');
    }

    // Validate source description
    if (!award.source) {
      errors.push('Missing XP source');
    }

    // Validate timestamp
    if (!award.timestamp) {
      errors.push('Missing timestamp');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};

/**
 * Validates character progression state
 * Ensures character progression data is valid before updates
 * 
 * Integration Points:
 * - ProgressionService: Used before state updates
 * - GameEngine: Used during character progression
 * - Achievement System: Used for progression-based achievements
 * 
 * @example
 * ```typescript
 * // In ProgressionService
 * const result = progressionStateValidator.validate(character);
 * if (result.valid) {
 *   await this.updateCharacterProgression(character);
 * } else {
 *   throw new Error(`Invalid progression state: ${result.errors.join(', ')}`);
 * }
 * ```
 */
export const progressionStateValidator = {
  validate(character: Character): ValidationResult {
    const errors: string[] = [];

    // Validate character level
    if (typeof character.level !== 'number' || character.level < 1) {
      errors.push('Invalid character level');
    }

    // Validate experience points
    if (typeof character.experience_points !== 'number' || character.experience_points < 0) {
      errors.push('Invalid experience points');
    }

    // Validate attribute points
    if (typeof character.attribute_points !== 'number' || character.attribute_points < 0) {
      errors.push('Invalid attribute points');
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
 * -- Progression validation triggers
 * CREATE OR REPLACE FUNCTION validate_progression()
 * RETURNS trigger AS $$
 * BEGIN
 *   -- Validate level
 *   IF NEW.level < 1 THEN
 *     RAISE EXCEPTION 'Invalid level: %', NEW.level;
 *   END IF;
 * 
 *   -- Validate XP
 *   IF NEW.experience_points < 0 THEN
 *     RAISE EXCEPTION 'Invalid XP: %', NEW.experience_points;
 *   END IF;
 * 
 *   -- Validate attribute points
 *   IF NEW.attribute_points < 0 THEN
 *     RAISE EXCEPTION 'Invalid attribute points: %', NEW.attribute_points;
 *   END IF;
 * 
 *   RETURN NEW;
 * END;
 * $$ LANGUAGE plpgsql;
 * 
 * CREATE TRIGGER validate_progression_trigger
 *   BEFORE INSERT OR UPDATE ON characters
 *   FOR EACH ROW
 *   EXECUTE FUNCTION validate_progression();
 * ```
 * 
 * Error Handling:
 * ```typescript
 * try {
 *   const result = progressionStateValidator.validate(character);
 *   if (!result.valid) {
 *     throw new GameError(
 *       'Invalid progression state',
 *       ErrorCode.VALIDATION,
 *       result.errors
 *     );
 *   }
 * } catch (error) {
 *   debugManager.log('Progression validation failed', 'error', { error });
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
 * @see ProgressionService for implementation details
 * @see ValidationService for validation framework
 * @see Character for character data structure
 */