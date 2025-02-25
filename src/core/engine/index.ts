/**
 * Game Engine Module Index
 * 
 * This module serves as the main entry point for the AdventureBuildr game engine.
 * It exports the core engine components and scene management utilities needed for
 * game state handling and story progression.
 * 
 * Key Features:
 * - Centralized engine exports
 * - Scene management utilities
 * - Type-safe engine access
 * 
 * The module provides a clean interface for other components to access the game
 * engine while maintaining proper encapsulation of implementation details.
 * 
 * @module engine
 */

export * from './GameEngine';
export * from './sceneManager';

/**
 * Integration Points:
 * 
 * 1. App Component
 *    ```typescript
 *    // In App.tsx
 *    import { GameEngine } from '../core/engine';
 *    
 *    function App() {
 *      const [gameEngine, setGameEngine] = useState<GameEngine | null>(null);
 *      
 *      useEffect(() => {
 *        const initEngine = async () => {
 *          const engine = new GameEngine();
 *          await engine.initialize();
 *          setGameEngine(engine);
 *        };
 *        initEngine();
 *      }, []);
 *    }
 *    ```
 * 
 * 2. Story Components
 *    ```typescript
 *    // In StoryScene.tsx
 *    import { GameEngine, type Scene } from '../core/engine';
 *    
 *    interface Props {
 *      engine: GameEngine;
 *      scene: Scene;
 *      onChoice: (choiceId: number) => void;
 *    }
 *    ```
 * 
 * 3. Character Management
 *    ```typescript
 *    // In CharacterCreation.tsx
 *    import { GameEngine } from '../core/engine';
 *    
 *    const handleCharacterCreation = async (character: Character) => {
 *      const engine = new GameEngine();
 *      await engine.initialize();
 *      await engine.initializeGame(character.genre, character);
 *      onComplete(engine.getCurrentState());
 *    };
 *    ```
 * 
 * Usage Examples:
 * ```typescript
 * // Basic engine initialization
 * import { GameEngine } from '../core/engine';
 * 
 * const engine = new GameEngine();
 * await engine.initialize();
 * await engine.initializeGame(genre, character);
 * 
 * // Scene management
 * import { GameEngine, sceneManager } from '../core/engine';
 * 
 * const initialScene = sceneManager.getInitialScene(genre);
 * const initialChoices = sceneManager.getInitialChoices(genre);
 * ```
 * 
 * Error Handling:
 * ```typescript
 * try {
 *   const engine = new GameEngine();
 *   await engine.initialize();
 * } catch (error) {
 *   console.error('Failed to initialize game engine:', error);
 *   // Handle initialization error
 * }
 * ```
 * 
 * Best Practices:
 * 1. Always initialize engine before use
 * 2. Handle initialization errors
 * 3. Clean up engine resources
 * 4. Use proper typing
 * 5. Follow module structure
 * 
 * Module Structure:
 * ```
 * engine/
 * ├── index.ts           - Main entry point (this file)
 * ├── GameEngine.ts      - Core engine implementation
 * ├── sceneManager.ts    - Scene management utilities
 * ├── StateManager.ts    - State management
 * ├── CheckpointManager.ts - Checkpoint handling
 * └── types.ts          - Type definitions
 * ```
 * 
 * @see GameEngine for core engine implementation
 * @see sceneManager for scene management
 * @see StateManager for state handling
 */