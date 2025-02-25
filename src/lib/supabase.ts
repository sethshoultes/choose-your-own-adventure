/**
 * Supabase Client Configuration
 * 
 * This module initializes and exports the Supabase client for database operations
 * and authentication in the AdventureBuildr application. It provides a type-safe
 * interface for interacting with the Supabase backend while maintaining proper
 * security and configuration management.
 * 
 * Key Features:
 * - Type-safe database operations
 * - Real-time subscriptions
 * - Row Level Security integration
 * - Authentication services
 * - Environment-based configuration
 * 
 * Data Flow:
 * 1. Environment variable loading
 * 2. Client initialization
 * 3. Type application
 * 4. Client export
 * 5. Service consumption
 * 
 * @module supabase
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Get configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Configured Supabase client instance with type safety
 * Uses Database type definition for type-safe queries
 * 
 * @example
 * ```typescript
 * // Authentication
 * const { data: { user } } = await supabase.auth.getUser();
 * 
 * // Database operations
 * const { data, error } = await supabase
 *   .from('characters')
 *   .select('*')
 *   .eq('user_id', user.id);
 * ```
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Integration Points:
 * 
 * 1. Authentication
 *    ```typescript
 *    // Sign in
 *    const { data, error } = await supabase.auth.signInWithPassword({
 *      email,
 *      password
 *    });
 * 
 *    // Get current user
 *    const { data: { user } } = await supabase.auth.getUser();
 * 
 *    // Sign out
 *    await supabase.auth.signOut();
 *    ```
 * 
 * 2. Database Operations
 *    ```typescript
 *    // Insert data
 *    const { data, error } = await supabase
 *      .from('characters')
 *      .insert({
 *        user_id: user.id,
 *        name: characterName,
 *        genre: selectedGenre
 *      });
 * 
 *    // Select data
 *    const { data: characters } = await supabase
 *      .from('characters')
 *      .select('*')
 *      .eq('user_id', user.id);
 * 
 *    // Update data
 *    const { error } = await supabase
 *      .from('characters')
 *      .update({ name: newName })
 *      .eq('id', characterId);
 *    ```
 * 
 * 3. Real-time Subscriptions
 *    ```typescript
 *    // Subscribe to changes
 *    const subscription = supabase
 *      .channel('game_updates')
 *      .on(
 *        'postgres_changes',
 *        {
 *          event: 'UPDATE',
 *          schema: 'public',
 *          table: 'game_sessions'
 *        },
 *        (payload) => {
 *          handleUpdate(payload);
 *        }
 *      )
 *      .subscribe();
 * 
 *    // Cleanup subscription
 *    return () => {
 *      subscription.unsubscribe();
 *    };
 *    ```
 * 
 * Security Features:
 * 1. Row Level Security (RLS)
 *    - Enforces user-level data access
 *    - Prevents unauthorized operations
 *    - Maintains data isolation
 * 
 * 2. Authentication Flow
 *    - Email/password authentication
 *    - Session management
 *    - Token handling
 * 
 * 3. Environment Variables
 *    - Secure configuration storage
 *    - Environment-specific settings
 *    - Protected API keys
 * 
 * Error Handling:
 * ```typescript
 * try {
 *   const { data, error } = await supabase
 *     .from('table_name')
 *     .select('*');
 *     
 *   if (error) {
 *     if (error.code === 'PGRST116') {
 *       // Handle not found
 *     } else {
 *       // Handle other errors
 *     }
 *     throw error;
 *   }
 *   
 *   return data;
 * } catch (error) {
 *   console.error('Database error:', error);
 *   throw error;
 * }
 * ```
 * 
 * Best Practices:
 * 1. Always handle database errors
 * 2. Use type-safe queries
 * 3. Implement proper RLS
 * 4. Clean up subscriptions
 * 5. Validate data before operations
 * 
 * Type Safety:
 * ```typescript
 * // Type-safe table operations
 * type Character = Database['public']['Tables']['characters']['Row'];
 * type CharacterInsert = Database['public']['Tables']['characters']['Insert'];
 * 
 * const insertCharacter = async (character: CharacterInsert) => {
 *   const { data, error } = await supabase
 *     .from('characters')
 *     .insert(character)
 *     .select()
 *     .single();
 *     
 *   return data as Character;
 * };
 * ```
 * 
 * Performance Considerations:
 * 1. Use appropriate select columns
 * 2. Implement proper indexing
 * 3. Batch operations when possible
 * 4. Handle real-time subscriptions efficiently
 * 5. Cache frequently accessed data
 * 
 * @see database.types for type definitions
 * @see GameEngine for game integration
 * @see Auth component for authentication
 */