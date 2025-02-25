/**
 * ServiceRegistry Class
 * 
 * This class provides a centralized registry for managing services in the AdventureBuildr game engine.
 * It implements the Singleton pattern to ensure a single source of truth for service instances and
 * handles service registration, retrieval, and lifecycle management.
 * 
 * Key Features:
 * - Singleton pattern implementation
 * - Type-safe service registration and retrieval
 * - Service lifecycle management
 * - Error handling and logging
 * 
 * The registry works alongside the ServiceInitializer to ensure proper service initialization
 * and dependency management.
 * 
 * @see ServiceInitializer for service initialization
 * @see GameEngine for service consumption
 */

import { debugManager } from '../debug/DebugManager';

export class ServiceRegistry {
  /** Singleton instance */
  private static instance: ServiceRegistry;
  /** Map of registered services */
  private services: Map<string, any> = new Map();

  /** Private constructor to enforce singleton pattern */
  private constructor() {}

  /**
   * Gets the singleton instance of the registry
   * Creates new instance if one doesn't exist
   * 
   * @returns ServiceRegistry instance
   */
  public static getInstance(): ServiceRegistry {
    if (!this.instance) {
      this.instance = new ServiceRegistry();
    }
    return this.instance;
  }

  /**
   * Registers a service in the registry
   * 
   * @param name Service identifier
   * @param service Service instance
   * @throws Error if service is null or undefined
   * 
   * @example
   * ```typescript
   * const registry = ServiceRegistry.getInstance();
   * registry.register('validation', new ValidationService());
   * ```
   */
  public register<T>(name: string, service: T): void {
    if (!service) {
      throw new Error(`Cannot register null service for ${name}`);
    }
    
    this.services.set(name, service);
    debugManager.log(`Service ${name} registered`, 'success');
  }

  /**
   * Retrieves a service from the registry
   * 
   * @param name Service identifier
   * @returns Service instance
   * @throws Error if service not found
   * 
   * @example
   * ```typescript
   * const validationService = registry.get<ValidationService>('validation');
   * ```
   */
  public get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service ${name} not found`);
    }
    return service as T;
  }

  /**
   * Clears all registered services
   * Used for testing and error recovery
   * 
   * @example
   * ```typescript
   * registry.clear(); // Reset registry state
   * ```
   */
  public clear(): void {
    this.services.clear();
    debugManager.log('Service registry cleared', 'info');
  }
}

/**
 * Integration Points:
 * 
 * 1. ServiceInitializer
 *    ```typescript
 *    // In ServiceInitializer
 *    public static async initialize(): Promise<void> {
 *      const registry = ServiceRegistry.getInstance();
 *      registry.clear(); // Start fresh
 *      
 *      // Register core services
 *      registry.register('validation', new ValidationService());
 *      registry.register('database', new DatabaseService());
 *      registry.register('openai', new OpenAIService());
 *    }
 *    ```
 * 
 * 2. GameEngine
 *    ```typescript
 *    // In GameEngine constructor
 *    constructor() {
 *      const registry = ServiceRegistry.getInstance();
 *      this.storyService = registry.get<StoryService>('story');
 *      this.progressionService = registry.get<ProgressionService>('progression');
 *    }
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
 * Best Practices:
 * 1. Always use getInstance()
 * 2. Register services in dependency order
 * 3. Handle service not found errors
 * 4. Use proper typing
 * 5. Log service operations
 * 
 * Error Handling:
 * ```typescript
 * try {
 *   const service = registry.get<RequiredService>('serviceName');
 * } catch (error) {
 *   debugManager.log('Service not found', 'error', { error });
 *   // Handle missing service
 *   await ServiceInitializer.initialize();
 * }
 * ```
 * 
 * @see debugManager for logging
 * @see ServiceInitializer for initialization
 * @see GameEngine for service usage
 */