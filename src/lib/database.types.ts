/**
 * Database Types Module
 * 
 * This module contains TypeScript type definitions generated from the Supabase database schema.
 * It provides type safety for database operations and ensures consistent data structures
 * across the application. The types are automatically generated using the Supabase CLI
 * and should not be modified manually.
 * 
 * Key Features:
 * - Type-safe database operations
 * - Complete table definitions
 * - Row level security types
 * - Function and enum definitions
 * - Relationship mappings
 * 
 * Generation:
 * Types are generated using:
 * ```bash
 * npm run db:types
 * ```
 * 
 * Validation:
 * Types can be checked against the database using:
 * ```bash
 * npm run db:check
 * ```
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

/**
 * Complete Database Interface
 * Provides type definitions for all database tables and operations
 */
export interface Database {
  public: {
    Tables: {
      /** Achievement tracking table */
      achievements: {
        Row: {
          id: string
          user_id: string
          achievement_type: string
          title: string
          description: string
          unlocked_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          achievement_type: string
          title: string
          description: string
          unlocked_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          achievement_type?: string
          title?: string
          description?: string
          unlocked_at?: string | null
        }
      }
      /** API credentials storage */
      api_credentials: {
        Row: {
          id: string
          user_id: string
          openai_key: string
          created_at: string | null
          updated_at: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          openai_key: string
          created_at?: string | null
          updated_at?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          openai_key?: string
          created_at?: string | null
          updated_at?: string | null
          metadata?: Json | null
        }
      }
      /** System audit logging */
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          old_data: Json | null
          new_data: Json | null
          ip_address: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          created_at?: string | null
        }
      }
      /** Character data storage */
      characters: {
        Row: {
          id: string
          user_id: string
          name: string
          genre: string
          attributes: Json
          equipment: Json
          backstory: string | null
          experience_points: number | null
          level: number | null
          attribute_points: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          genre: string
          attributes: Json
          equipment: Json
          backstory?: string | null
          experience_points?: number | null
          level?: number | null
          attribute_points?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          genre?: string
          attributes?: Json
          equipment?: Json
          backstory?: string | null
          experience_points?: number | null
          level?: number | null
          attribute_points?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      /** Game checkpoint history */
      checkpoint_history: {
        Row: {
          id: string
          session_id: string
          character_id: string
          scene: Json
          history: Json
          created_at: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          session_id: string
          character_id: string
          scene: Json
          history: Json
          created_at?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          session_id?: string
          character_id?: string
          scene?: Json
          history?: Json
          created_at?: string | null
          metadata?: Json | null
        }
      }
      /** Game history tracking */
      game_history: {
        Row: {
          id: string
          session_id: string
          character_id: string
          scene_description: string
          player_choice: string
          created_at: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          session_id: string
          character_id: string
          scene_description: string
          player_choice: string
          created_at?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          session_id?: string
          character_id?: string
          scene_description?: string
          player_choice?: string
          created_at?: string | null
          metadata?: Json | null
        }
      }
      /** Active game sessions */
      game_sessions: {
        Row: {
          id: string
          character_id: string
          current_scene: Json
          game_state: Json
          created_at: string | null
          updated_at: string | null
          session_version: string | null
          metadata: Json | null
          checkpoint: Json | null
          status: string
          session_id: string | null
        }
        Insert: {
          id?: string
          character_id: string
          current_scene: Json
          game_state: Json
          created_at?: string | null
          updated_at?: string | null
          session_version?: string | null
          metadata?: Json | null
          checkpoint?: Json | null
          status: string
          session_id?: string | null
        }
        Update: {
          id?: string
          character_id?: string
          current_scene?: Json
          game_state?: Json
          created_at?: string | null
          updated_at?: string | null
          session_version?: string | null
          metadata?: Json | null
          checkpoint?: Json | null
          status?: string
          session_id?: string | null
        }
      }
      /** User profiles */
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string | null
          avatar_url: string | null
          role: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          role?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          role?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      /** System configuration */
      system_config: {
        Row: {
          id: string
          key: string
          value: Json
          description: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          key: string
          value: Json
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          key?: string
          value?: Json
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      /** User statistics */
      user_stats: {
        Row: {
          id: string
          user_id: string
          total_playtime: string | null
          choices_made: number | null
          characters_created: number | null
          stories_completed: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          total_playtime?: string | null
          choices_made?: number | null
          characters_created?: number | null
          stories_completed?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          total_playtime?: string | null
          choices_made?: number | null
          characters_created?: number | null
          stories_completed?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      /** Get API credentials for a user */
      get_api_credentials: {
        Args: {
          p_user_id: string
        }
        Returns: {
          openai_key: string
          metadata: Json
        }[]
      }
      /** Get or create user profile */
      get_or_create_profile: {
        Args: {
          p_user_id: string
        }
        Returns: {
          username: string
          role: string
          created_at: string
          updated_at: string
        }[]
      }
      /** Check if user is admin */
      is_admin: {
        Args: {
          p_user_id: string
        }
        Returns: boolean
      }
      /** Handle game session state */
      safe_handle_game_session: {
        Args: {
          p_character_id: string
          p_current_scene: Json
          p_game_state: Json
          p_metadata?: Json
        }
        Returns: Json
      }
      /** Save game checkpoint */
      save_checkpoint: {
        Args: {
          p_session_id: string
          p_scene: Json
          p_history: Json
          p_metadata?: Json
        }
        Returns: Json
      }
      /** Update API credentials */
      upsert_api_credentials: {
        Args: {
          p_user_id: string
          p_openai_key: string
          p_metadata?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      /** Game session status */
      session_status: 'active' | 'paused' | 'completed'
    }
  }
}

/**
 * Integration Points:
 * 
 * 1. Supabase Client
 *    ```typescript
 *    // In supabase.ts
 *    import { createClient } from '@supabase/supabase-js';
 *    import type { Database } from './database.types';
 *    
 *    export const supabase = createClient<Database>(
 *      import.meta.env.VITE_SUPABASE_URL,
 *      import.meta.env.VITE_SUPABASE_ANON_KEY
 *    );
 *    ```
 * 
 * 2. Type-Safe Queries
 *    ```typescript
 *    // In character service
 *    const { data, error } = await supabase
 *      .from('characters')
 *      .select('*')
 *      .eq('user_id', userId)
 *      .returns<Database['public']['Tables']['characters']['Row'][]>();
 *    ```
 * 
 * 3. Function Calls
 *    ```typescript
 *    // In profile service
 *    const { data, error } = await supabase
 *      .rpc('get_or_create_profile', {
 *        p_user_id: userId
 *      });
 *    ```
 * 
 * Best Practices:
 * 1. Never modify this file manually
 * 2. Always use npm scripts for updates
 * 3. Commit type changes with schema changes
 * 4. Use proper type annotations
 * 5. Validate database operations
 * 
 * @see supabase.ts for client configuration
 * @see migrations for schema changes
 */