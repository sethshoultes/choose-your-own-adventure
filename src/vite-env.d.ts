/**
 * Vite Environment Type Declarations
 * 
 * This module provides TypeScript type declarations for Vite's client types in the AdventureBuildr
 * application. It enables proper type checking for Vite-specific features and environment variables.
 * The declarations are automatically referenced by the TypeScript compiler to provide type safety
 * for Vite's runtime features.
 * 
 * Key Features:
 * - Environment variable typing
 * - Vite client types
 * - Module declarations
 * - Import assertions
 * 
 * Integration Points:
 * 
 * 1. Environment Variables
 *    ```typescript
 *    // Access typed environment variables
 *    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
 *    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
 *    ```
 * 
 * 2. Asset Imports
 *    ```typescript
 *    // Import assets with proper typing
 *    import logo from './assets/logo.png';
 *    import styles from './styles.module.css';
 *    ```
 * 
 * 3. Module Declarations
 *    ```typescript
 *    // Use module augmentation for custom types
 *    declare module '*.svg' {
 *      const content: string;
 *      export default content;
 *    }
 *    ```
 */

/// <reference types="vite/client" />

/**
 * Best Practices:
 * 1. Keep declarations minimal
 * 2. Use proper module augmentation
 * 3. Document environment variables
 * 4. Maintain type safety
 * 5. Follow Vite conventions
 * 
 * @see vite.config.ts for Vite configuration
 * @see tsconfig.json for TypeScript settings
 */