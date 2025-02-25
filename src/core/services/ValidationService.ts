/**
 * ValidationService Class
 * 
 * This service provides centralized validation functionality for the AdventureBuildr game engine.
 * It manages a registry of validators for different data types and ensures data integrity
 * across the application. The service is used by various components to validate game state,
 * user input, and system configurations.
 * 
 * Key Features:
 * - Extensible validator registry
 * - Type-safe validation
 * - Custom validator support
 * - Comprehensive error reporting
 * - Integration with game systems
 * 
 * @see GameEngine for integration with game logic
 * @see StateManager for state validation
 * @see GameState for data structures
 */

import { debugManager } from '../debug/DebugManager';
import type { GameState, Scene, Character } from '../types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface Validator<T> {
  validate(data: T): ValidationResult;
}

export class ValidationService {
  /** Registry of validation functions */
  private validators: Map<string, Validator<any>> = new Map();

  constructor() {
    this.registerDefaultValidators();
  }

  /**
   * Registers a custom validator for a specific data type
   * 
   * @param type Data type identifier
   * @param validator Validator implementation
   * 
   * @example
   * ```typescript
   * validationService.registerValidator('customType', {
   *   validate: (data) => ({
   *     valid: true,
   *     errors: []
   *   })
   * });
   * ```
   */
  public registerValidator<T>(type: string, validator: Validator<T>): void {
    this.validators.set(type, validator);
    debugManager.log(`Validator registered for ${type}`, 'success');
  }

  /**
   * Validates data using the registered validator
   * 
   * @param type Data type identifier
   * @param data Data to validate
   * @returns Validation result with errors if any
   * @throws Error if no validator found for type
   * 
   * @example
   * ```typescript
   * const result = validationService.validate('gameState', currentState);
   * if (!result.valid) {
   *   console.error('Invalid state:', result.errors);
   * }
   * ```
   */
  public validate<T>(type: string, data: T): ValidationResult {
    const validator = this.validators.get(type);
    if (!validator) {
      throw new Error(`No validator found for type ${type}`);
    }

    try {
      const result = validator.validate(data);
      if (!result.valid) {
        debugManager.log(`Validation failed for ${type}`, 'error', { errors: result.errors });
      }
      return result;
    } catch (error) {
      debugManager.log(`Error during validation for ${type}`, 'error', { error });
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Unknown validation error']
      };
    }
  }

  /**
   * Registers the default set of validators
   * Called during service initialization
   * 
   * @private
   */
  private registerDefaultValidators(): void {
    // Game State Validator
    this.registerValidator<GameState>('gameState', {
      validate: (state) => {
        const errors: string[] = [];

        if (!state.currentScene) {
          errors.push('Missing current scene');
        }

        if (!Array.isArray(state.history)) {
          errors.push('History must be an array');
        }

        if (state.checkpoint) {
          if (!state.checkpoint.scene) {
            errors.push('Checkpoint missing scene');
          }
          if (!Array.isArray(state.checkpoint.history)) {
            errors.push('Checkpoint history must be an array');
          }
        }

        return {
          valid: errors.length === 0,
          errors
        };
      }
    });

    // Scene Validator
    this.registerValidator<Scene>('scene', {
      validate: (scene) => {
        const errors: string[] = [];

        if (!scene.id) {
          errors.push('Missing scene ID');
        }

        if (!scene.description) {
          errors.push('Missing scene description');
        }

        if (!Array.isArray(scene.choices)) {
          errors.push('Choices must be an array');
        } else {
          scene.choices.forEach((choice, index) => {
            if (!choice.id) {
              errors.push(`Choice ${index} missing ID`);
            }
            if (!choice.text) {
              errors.push(`Choice ${index} missing text`);
            }
          });
        }

        return {
          valid: errors.length === 0,
          errors
        };
      }
    });

    // Character Validator
    this.registerValidator<Character>('character', {
      validate: (character) => {
        const errors: string[] = [];

        if (!character.name) {
          errors.push('Missing character name');
        }

        if (!character.genre) {
          errors.push('Missing character genre');
        }

        if (!Array.isArray(character.attributes)) {
          errors.push('Attributes must be an array');
        } else {
          character.attributes.forEach((attr, index) => {
            if (!attr.name) {
              errors.push(`Attribute ${index} missing name`);
            }
            if (typeof attr.value !== 'number') {
              errors.push(`Attribute ${index} missing value`);
            }
          });
        }

        if (!Array.isArray(character.equipment)) {
          errors.push('Equipment must be an array');
        } else {
          character.equipment.forEach((item, index) => {
            if (!item.name) {
              errors.push(`Equipment ${index} missing name`);
            }
            if (!item.type) {
              errors.push(`Equipment ${index} missing type`);
            }
          });
        }

        return {
          valid: errors.length === 0,
          errors
        };
      }
    });
  }
}

/**
 * Integration Points:
 * 
 * 1. GameEngine
 *    ```typescript
 *    // In GameEngine
 *    private validateGameState(state: GameState): void {
 *      const result = this.validationService.validate('gameState', state);
 *      if (!result.valid) {
 *        throw new Error(`Invalid game state: ${result.errors.join(', ')}`);
 *      }
 *    }
 *    ```
 * 
 * 2. StateManager
 *    ```typescript
 *    // In StateManager
 *    public async saveState(state: GameState): Promise<void> {
 *      const result = this.validationService.validate('gameState', state);
 *      if (!result.valid) {
 *        throw new Error('Invalid state for saving');
 *      }
 *      await this.persistState(state);
 *    }
 *    ```
 * 
 * 3. CharacterService
 *    ```typescript
 *    // In CharacterService
 *    public async createCharacter(character: Character): Promise<void> {
 *      const result = this.validationService.validate('character', character);
 *      if (!result.valid) {
 *        throw new Error(`Invalid character data: ${result.errors.join(', ')}`);
 *      }
 *      await this.saveCharacter(character);
 *    }
 *    ```
 * 
 * Database Schema Integration:
 * ```sql
 * -- Validation triggers
 * CREATE OR REPLACE FUNCTION validate_game_state()
 * RETURNS trigger AS $$
 * BEGIN
 *   -- Validate required fields
 *   IF NEW.current_scene IS NULL THEN
 *     RAISE EXCEPTION 'Missing current scene';
 *   END IF;
 * 
 *   -- Validate history array
 *   IF NOT jsonb_typeof(NEW.game_state->'history') = 'array' THEN
 *     RAISE EXCEPTION 'History must be an array';
 *   END IF;
 * 
 *   RETURN NEW;
 * END;
 * $$ LANGUAGE plpgsql;
 * 
 * CREATE TRIGGER validate_game_state_trigger
 *   BEFORE INSERT OR UPDATE ON game_sessions
 *   FOR EACH ROW
 *   EXECUTE FUNCTION validate_game_state();
 * ```
 * 
 * Best Practices:
 * 1. Always validate before state changes
 * 2. Use both client and server validation
 * 3. Provide clear error messages
 * 4. Log validation failures
 * 5. Handle edge cases gracefully
 * 
 * Error Handling:
 * ```typescript
 * try {
 *   const result = validationService.validate('gameState', state);
 *   if (!result.valid) {
 *     throw new GameError(
 *       'Invalid game state',
 *       ErrorCode.VALIDATION,
 *       result.errors
 *     );
 *   }
 * } catch (error) {
 *   debugManager.log('Validation failed', 'error', { error });
 *   throw error;
 * }
 * ```
 * 
 * @see debugManager for error logging
 * @see GameEngine for game state validation
 * @see StateManager for state persistence
 */