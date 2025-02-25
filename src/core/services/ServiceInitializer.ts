/**
 * ServiceInitializer Class
 * 
 * This class manages the initialization and lifecycle of core services in the AdventureBuildr game engine.
 * It ensures services are initialized in the correct order, handles dependencies, and provides a centralized
 * point for service management. The initializer works alongside the auto-save system to ensure all required
 * services are available before game state operations.
 * 
 * Key Features:
 * - Service initialization management
 * - Dependency resolution
 * - Singleton pattern implementation
 * - Initialization state tracking
 * - Error handling and recovery
 * 
 * @see ServiceRegistry for service management
 * @see GameEngine for service consumption
 */

import { ServiceRegistry } from './ServiceRegistry';
import { ValidationService } from './ValidationService';
import { DatabaseService } from './DatabaseService';
import { OpenAIService } from './openai/OpenAIService';
import { StoryService } from './story/StoryService';
import { ProgressionService } from './progression/ProgressionService';
import { debugManager } from '../debug/DebugManager';

export class ServiceInitializer {
  /** Tracks initialization state */
  private static initialized = false;
  /** Tracks ongoing initialization promise */
  private static initializationPromise: Promise<void> | null = null;

  /**
   * Checks if services are initialized
   * Used to prevent duplicate initialization
   * 
   * @returns true if services are initialized
   */
  public static isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Initializes all required services
   * Ensures single initialization attempt
   * 
   * @returns Promise that resolves when initialization is complete
   * @throws Error if initialization fails
   */
  public static async initialize(): Promise<void> {
    if (this.initialized) {
      debugManager.log('Services already initialized', 'info');
      return;
    }

    // Return existing promise if initialization is in progress
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.doInitialize();
    return this.initializationPromise;
  }

  /**
   * Performs actual service initialization
   * Initializes services in dependency order
   * 
   * @private
   * @returns Promise that resolves when initialization is complete
   * @throws Error if initialization fails
   */
  private static async doInitialize(): Promise<void> {
    try {
      // Get clean registry
      const registry = ServiceRegistry.getInstance();
      registry.clear();
      
      debugManager.log('Starting service initialization', 'info');

      // Initialize services in dependency order
      const validationService = new ValidationService();
      registry.register('validation', validationService);

      const databaseService = new DatabaseService();
      registry.register('database', databaseService);

      const openaiService = new OpenAIService();
      registry.register('openai', openaiService);

      const storyService = new StoryService();
      await storyService.initialize();
      registry.register('story', storyService);

      // Initialize progression service after its dependencies
      const progressionService = new ProgressionService();
      await progressionService.initialize();
      registry.register('progression', progressionService);

      // Verify required services
      const requiredServices = [
        'validation',
        'database', 
        'openai',
        'story',
        'progression'
      ];

      const missingServices = requiredServices.filter(service => {
        try {
          registry.get(service);
          return false;
        } catch {
          return true;
        }
      });

      if (missingServices.length > 0) {
        throw new Error(`Missing required services: ${missingServices.join(', ')}`);
      }

      this.initialized = true;
      debugManager.log('All services initialized successfully', 'success');
    } catch (error) {
      this.initializationPromise = null;
      this.initialized = false;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      debugManager.log('Service initialization failed', 'error', { error: errorMessage });
      throw new Error(`Failed to initialize services: ${errorMessage}`);
    }
  }

  /**
   * Resets initialization state
   * Used for testing and error recovery
   */
  public static reset(): void {
    this.initialized = false;
    this.initializationPromise = null;
    ServiceRegistry.getInstance().clear();
    debugManager.log('Service initialization state reset', 'info');
  }
}

/**
 * Integration Points:
 * 
 * 1. GameEngine
 *    ```typescript
 *    // In GameEngine constructor
 *    constructor() {
 *      if (!ServiceInitializer.isInitialized()) {
 *        await ServiceInitializer.initialize();
 *      }
 *      this.storyService = ServiceRegistry.getInstance().get('story');
 *      this.progressionService = ServiceRegistry.getInstance().get('progression');
 *    }
 *    ```
 * 
 * 2. App Component
 *    ```typescript
 *    // In App initialization
 *    useEffect(() => {
 *      const initializeApp = async () => {
 *        try {
 *          if (!ServiceInitializer.isInitialized()) {
 *            await ServiceInitializer.initialize();
 *            setServicesReady(true);
 *          }
 *          // Continue with app initialization
 *        } catch (error) {
 *          handleError(error);
 *        }
 *      };
 *      initializeApp();
 *    }, []);
 *    ```
 * 
 * 3. Service Dependencies
 *    ```typescript
 *    // In StoryService
 *    public async initialize(): Promise<void> {
 *      const registry = ServiceRegistry.getInstance();
 *      this.validator = registry.get('validation');
 *      this.database = registry.get('database');
 *      this.openai = registry.get('openai');
 *    }
 *    ```
 * 
 * Best Practices:
 * 1. Always check initialization state
 * 2. Handle initialization errors
 * 3. Maintain service dependencies
 * 4. Log initialization steps
 * 5. Implement proper cleanup
 * 
 * Error Handling:
 * ```typescript
 * try {
 *   await ServiceInitializer.initialize();
 * } catch (error) {
 *   debugManager.log('Service initialization failed', 'error', { error });
 *   // Attempt recovery
 *   ServiceInitializer.reset();
 *   await ServiceInitializer.initialize();
 * }
 * ```
 * 
 * Service Dependencies:
 * ```
 * ValidationService
 *   └─ No dependencies
 * 
 * DatabaseService
 *   └─ No dependencies
 * 
 * OpenAIService
 *   └─ No dependencies
 * 
 * StoryService
 *   ├─ ValidationService
 *   ├─ DatabaseService
 *   └─ OpenAIService
 * 
 * ProgressionService
 *   ├─ ValidationService
 *   └─ DatabaseService
 * ```
 * 
 * @see debugManager for logging
 * @see ServiceRegistry for service management
 * @see GameEngine for service consumption
 */