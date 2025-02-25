/**
 * Story Validation Module
 * 
 * This module provides validation functions for the story generation and management system
 * in AdventureBuildr. It ensures data integrity and type safety for story context,
 * choices, and scene generation.
 * 
 * The validators integrate with the ValidationService to provide consistent
 * validation across the story system.
 * 
 * @module story/validators
 */

import type { ValidationResult } from '../ValidationService';
import type { StoryContext } from './types';
import type { Choice } from '../../types';

/**
 * Validates story context before scene generation
 * Ensures all required data is present and properly formatted
 * 
 * @example
 * ```typescript
 * const context: StoryContext = {
 *   genre: 'Fantasy',
 *   character: currentCharacter,
 *   currentScene: activeScene,
 *   history: gameHistory
 * };
 * 
 * const result = storyContextValidator.validate(context);
 * if (!result.valid) {
 *   console.error('Invalid story context:', result.errors);
 * }
 * ```
 */
export const storyContextValidator = {
  validate(context: StoryContext): ValidationResult {
    const errors: string[] = [];

    // Validate genre
    if (!context.genre) {
      errors.push('Missing genre');
    }

    // Validate character
    if (!context.character) {
      errors.push('Missing character');
    } else {
      if (!context.character.name) {
        errors.push('Character missing name');
      }
      if (!context.character.genre) {
        errors.push('Character missing genre');
      }
      if (!Array.isArray(context.character.attributes)) {
        errors.push('Character missing attributes');
      }
    }

    // Validate current scene
    if (!context.currentScene) {
      errors.push('Missing current scene');
    } else {
      if (!context.currentScene.id) {
        errors.push('Scene missing ID');
      }
      if (!context.currentScene.description) {
        errors.push('Scene missing description');
      }
      if (!Array.isArray(context.currentScene.choices)) {
        errors.push('Scene missing choices array');
      }
    }

    // Validate history
    if (!Array.isArray(context.history)) {
      errors.push('Missing history array');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};

/**
 * Validates generated choices
 * Ensures choices are meaningful and properly structured
 * 
 * Integration Points:
 * - StoryService: Used before finalizing scene generation
 * - GameEngine: Used during choice handling
 * - Scene Generation: Used for validating AI responses
 * 
 * @example
 * ```typescript
 * // In StoryService
 * const result = choiceValidator.validate(generatedChoices);
 * if (result.valid) {
 *   await this.finalizeScene(scene, choices);
 * } else {
 *   throw new Error(`Invalid choices: ${result.errors.join(', ')}`);
 * }
 * ```
 */
export const choiceValidator = {
  validate(choices: Choice[]): ValidationResult {
    const errors: string[] = [];

    // Must have exactly 3 choices
    if (choices.length !== 3) {
      errors.push(`Expected 3 choices, got ${choices.length}`);
    }

    // Each choice must be valid
    choices.forEach((choice, index) => {
      if (!choice.id || typeof choice.id !== 'number') {
        errors.push(`Choice ${index} has invalid ID`);
      }
      if (!choice.text || choice.text.trim().length === 0) {
        errors.push(`Choice ${index} has empty text`);
      }
      if (choice.text.toLowerCase().includes('investigate further')) {
        errors.push(`Choice ${index} contains generic text`);
      }
    });

    // Choices must be unique
    const uniqueTexts = new Set(choices.map(c => c.text.toLowerCase()));
    if (uniqueTexts.size !== choices.length) {
      errors.push('Choices must be unique');
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
 * -- Story validation triggers
 * CREATE OR REPLACE FUNCTION validate_story_context()
 * RETURNS trigger AS $$
 * BEGIN
 *   -- Validate genre
 *   IF NEW.genre IS NULL THEN
 *     RAISE EXCEPTION 'Missing genre';
 *   END IF;
 * 
 *   -- Validate scene
 *   IF NEW.current_scene IS NULL THEN
 *     RAISE EXCEPTION 'Missing current scene';
 *   END IF;
 * 
 *   -- Validate choices
 *   IF NOT EXISTS (
 *     SELECT 1 FROM jsonb_array_elements(NEW.current_scene->'choices')
 *   ) THEN
 *     RAISE EXCEPTION 'Missing choices';
 *   END IF;
 * 
 *   RETURN NEW;
 * END;
 * $$ LANGUAGE plpgsql;
 * 
 * CREATE TRIGGER validate_story_context_trigger
 *   BEFORE INSERT OR UPDATE ON game_sessions
 *   FOR EACH ROW
 *   EXECUTE FUNCTION validate_story_context();
 * ```
 * 
 * Error Handling:
 * ```typescript
 * try {
 *   const result = storyContextValidator.validate(context);
 *   if (!result.valid) {
 *     throw new GameError(
 *       'Invalid story context',
 *       ErrorCode.VALIDATION,
 *       result.errors
 *     );
 *   }
 * } catch (error) {
 *   debugManager.log('Story validation failed', 'error', { error });
 *   throw error;
 * }
 * ```
 * 
 * Best Practices:
 * 1. Always validate before scene generation
 * 2. Use both client and server validation
 * 3. Provide clear error messages
 * 4. Log validation failures
 * 5. Handle edge cases gracefully
 * 
 * @see StoryService for implementation details
 * @see ValidationService for validation framework
 * @see GameEngine for integration with game logic
 */