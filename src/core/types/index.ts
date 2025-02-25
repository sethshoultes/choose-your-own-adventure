/**
 * Core Types Index Module
 * 
 * This module serves as the central export point for all core type definitions in the AdventureBuildr
 * game engine. It provides a clean, organized interface for accessing type definitions used throughout
 * the application, ensuring proper type safety and consistent data structures.
 * 
 * Key Features:
 * - Centralized type exports
 * - Game state types
 * - Genre definitions
 * - Character types
 * - Type consistency enforcement
 * 
 * The module aggregates and re-exports types from:
 * - game.ts: Game state and scene types
 * - genre.ts: Available game genres
 * - character.ts: Character and attribute types
 * 
 * @module types
 */

export * from './game';
export * from './genre';
export * from './character';

/**
 * Integration Points:
 * 
 * 1. Game Components
 *    ```typescript
 *    // In game components
 *    import type { 
 *      Scene, 
 *      Choice, 
 *      GameState,
 *      Character 
 *    } from '../core/types';
 *    
 *    interface Props {
 *      scene: Scene;
 *      character: Character;
 *      onChoice: (choice: Choice) => void;
 *    }
 *    ```
 * 
 * 2. Services
 *    ```typescript
 *    // In game services
 *    import type { 
 *      Genre,
 *      GameState,
 *      Character 
 *    } from '../types';
 *    
 *    export class GameService {
 *      public async initializeGame(
 *        genre: Genre,
 *        character: Character
 *      ): Promise<GameState> {
 *        // Implementation
 *      }
 *    }
 *    ```
 * 
 * 3. State Management
 *    ```typescript
 *    // In state management
 *    import type { 
 *      GameState,
 *      Scene,
 *      GameHistoryEntry 
 *    } from '../types';
 *    
 *    export class StateManager {
 *      private state: GameState;
 *      
 *      public async saveState(): Promise<void> {
 *        // Implementation
 *      }
 *    }
 *    ```
 * 
 * Usage Examples:
 * ```typescript
 * // Import multiple types
 * import type { 
 *   Genre,
 *   Character,
 *   GameState,
 *   Scene,
 *   Choice 
 * } from '../core/types';
 * 
 * // Use in component props
 * interface StoryProps {
 *   scene: Scene;
 *   character: Character;
 *   gameState: GameState;
 *   onChoice: (choice: Choice) => void;
 * }
 * 
 * // Use in service methods
 * class GameEngine {
 *   public async initializeGame(
 *     genre: Genre,
 *     character: Character
 *   ): Promise<GameState> {
 *     // Implementation
 *   }
 * }
 * ```
 * 
 * Type Relationships:
 * ```
 * GameState
 * ├── currentScene: Scene
 * │   ├── id: string
 * │   ├── description: string
 * │   └── choices: Choice[]
 * ├── history: GameHistoryEntry[]
 * └── checkpoint?: {
 *     scene: Scene
 *     history: GameHistoryEntry[]
 *     timestamp: string
 *   }
 * 
 * Character
 * ├── name: string
 * ├── genre: Genre
 * ├── attributes: CharacterAttribute[]
 * └── equipment: CharacterEquipment[]
 * ```
 * 
 * Best Practices:
 * 1. Always use type imports
 * 2. Maintain type consistency
 * 3. Document type changes
 * 4. Use proper type annotations
 * 5. Keep types organized
 * 
 * Type Safety:
 * ```typescript
 * // Type guard example
 * const isValidGameState = (state: any): state is GameState => {
 *   return (
 *     state &&
 *     typeof state === 'object' &&
 *     'currentScene' in state &&
 *     'history' in state &&
 *     Array.isArray(state.history)
 *   );
 * };
 * 
 * // Type assertion example
 * const assertValidScene = (scene: any): Scene => {
 *   if (!scene?.id || !scene?.description || !Array.isArray(scene?.choices)) {
 *     throw new Error('Invalid scene structure');
 *   }
 *   return scene as Scene;
 * };
 * ```
 * 
 * The types exported from this module are fundamental to the game engine's
 * type safety and data consistency. They should be used throughout the application
 * to ensure proper typing and prevent runtime errors.
 * 
 * @see game for game state types
 * @see genre for genre definitions
 * @see character for character types
 */