/**
 * Character Type Definitions Module
 * 
 * This module defines the core character types and interfaces for the AdventureBuildr game engine.
 * It provides type definitions for character attributes, equipment, and overall character structure,
 * ensuring type safety and consistent data handling throughout the application.
 * 
 * Key Features:
 * - Character attribute definitions
 * - Equipment type system
 * - Character state tracking
 * - Type-safe character management
 * - Progression integration
 * 
 * Data Flow:
 * 1. Character creation
 * 2. Attribute management
 * 3. Equipment handling
 * 4. State persistence
 * 5. Progression tracking
 * 
 * @module types/character
 */

import type { Genre } from './genre';

/**
 * Character attribute definition
 * Represents a single character attribute with value and description
 * 
 * @property name - Attribute name (e.g., "Strength", "Intelligence")
 * @property value - Current attribute value (1-10)
 * @property description - Attribute description for UI
 */
export interface CharacterAttribute {
  /** Attribute name */
  name: string;
  /** Current value (1-10) */
  value: number;
  /** Description for UI display */
  description: string;
}

/**
 * Character equipment definition
 * Represents a piece of equipment with type and description
 * 
 * @property name - Equipment name
 * @property type - Equipment category
 * @property description - Equipment description for UI
 */
export interface CharacterEquipment {
  /** Equipment name */
  name: string;
  /** Equipment category */
  type: 'weapon' | 'armor' | 'tool' | 'special';
  /** Description for UI display */
  description: string;
}

/**
 * Main character interface
 * Defines the complete character structure with all properties
 * 
 * @property id - Optional UUID for database storage
 * @property name - Character name
 * @property genre - Game genre
 * @property attributes - Array of character attributes
 * @property equipment - Array of character equipment
 * @property backstory - Optional character backstory
 * @property experience_points - Optional XP total
 * @property level - Optional character level
 * @property attribute_points - Optional available attribute points
 */
export interface Character {
  /** UUID for database storage */
  id?: string;
  /** Character name */
  name: string;
  /** Game genre */
  genre: Genre;
  /** Character attributes */
  attributes: CharacterAttribute[];
  /** Character equipment */
  equipment: CharacterEquipment[];
  /** Character backstory */
  backstory: string;
  /** Total XP earned */
  experience_points?: number;
  /** Current level */
  level?: number;
  /** Available attribute points */
  attribute_points?: number;
}

/**
 * Integration Points:
 * 
 * 1. Character Creation
 *    ```typescript
 *    // In CharacterCreation component
 *    const createCharacter = async (data: Omit<Character, 'id'>) => {
 *      const { data: character, error } = await supabase
 *        .from('characters')
 *        .insert({
 *          ...data,
 *          user_id: currentUser.id
 *        })
 *        .single();
 *        
 *      if (error) throw error;
 *      return character;
 *    };
 *    ```
 * 
 * 2. Game Engine
 *    ```typescript
 *    // In GameEngine
 *    export class GameEngine {
 *      private character: Character | null = null;
 *      
 *      public async initializeGame(
 *        genre: Genre,
 *        character: Character
 *      ): Promise<void> {
 *        this.character = character;
 *        // Initialize game state
 *      }
 *    }
 *    ```
 * 
 * 3. Progression System
 *    ```typescript
 *    // In ProgressionService
 *    export class ProgressionService {
 *      public async awardXP(
 *        character: Character,
 *        amount: number
 *      ): Promise<void> {
 *        const newXP = (character.experience_points || 0) + amount;
 *        const newLevel = this.calculateLevel(newXP);
 *        
 *        await this.updateCharacter({
 *          ...character,
 *          experience_points: newXP,
 *          level: newLevel
 *        });
 *      }
 *    }
 *    ```
 * 
 * Database Schema:
 * ```sql
 * -- Character table
 * CREATE TABLE characters (
 *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id uuid REFERENCES auth.users(id),
 *   name text NOT NULL,
 *   genre text NOT NULL,
 *   attributes jsonb NOT NULL DEFAULT '[]'::jsonb,
 *   equipment jsonb NOT NULL DEFAULT '[]'::jsonb,
 *   backstory text,
 *   experience_points integer DEFAULT 0,
 *   level integer DEFAULT 1,
 *   attribute_points integer DEFAULT 0,
 *   created_at timestamptz DEFAULT now(),
 *   updated_at timestamptz DEFAULT now()
 * );
 * 
 * -- Character validation trigger
 * CREATE OR REPLACE FUNCTION validate_character()
 * RETURNS trigger AS $$
 * BEGIN
 *   -- Validate required fields
 *   IF NEW.name IS NULL OR NEW.name = '' THEN
 *     RAISE EXCEPTION 'Character name is required';
 *   END IF;
 * 
 *   -- Validate arrays
 *   IF NOT jsonb_typeof(NEW.attributes) = 'array' THEN
 *     RAISE EXCEPTION 'Attributes must be an array';
 *   END IF;
 * 
 *   IF NOT jsonb_typeof(NEW.equipment) = 'array' THEN
 *     RAISE EXCEPTION 'Equipment must be an array';
 *   END IF;
 * 
 *   RETURN NEW;
 * END;
 * $$ LANGUAGE plpgsql;
 * ```
 * 
 * Usage Examples:
 * ```typescript
 * // Create new character
 * const character: Character = {
 *   name: 'Hero',
 *   genre: 'Fantasy',
 *   attributes: [
 *     {
 *       name: 'Strength',
 *       value: 5,
 *       description: 'Physical power'
 *     }
 *   ],
 *   equipment: [
 *     {
 *       name: 'Sword',
 *       type: 'weapon',
 *       description: 'Steel sword'
 *     }
 *   ],
 *   backstory: 'A brave adventurer...'
 * };
 * 
 * // Update character level
 * const updateLevel = async (character: Character, newLevel: number) => {
 *   return {
 *     ...character,
 *     level: newLevel,
 *     attribute_points: character.attribute_points + 2
 *   };
 * };
 * 
 * // Add equipment
 * const addEquipment = (
 *   character: Character,
 *   item: CharacterEquipment
 * ): Character => ({
 *   ...character,
 *   equipment: [...character.equipment, item]
 * });
 * ```
 * 
 * Type Validation:
 * ```typescript
 * // Validate attribute value
 * const isValidAttributeValue = (value: number): boolean =>
 *   Number.isInteger(value) && value >= 1 && value <= 10;
 * 
 * // Validate equipment type
 * const isValidEquipmentType = (
 *   type: string
 * ): type is CharacterEquipment['type'] =>
 *   ['weapon', 'armor', 'tool', 'special'].includes(type);
 * 
 * // Validate character structure
 * const validateCharacter = (char: Character): boolean => {
 *   if (!char.name || !char.genre) return false;
 *   
 *   if (!Array.isArray(char.attributes) || 
 *       !char.attributes.every(attr => 
 *         attr.name && 
 *         isValidAttributeValue(attr.value)
 *       )) {
 *     return false;
 *   }
 *   
 *   if (!Array.isArray(char.equipment) ||
 *       !char.equipment.every(item =>
 *         item.name &&
 *         isValidEquipmentType(item.type)
 *       )) {
 *     return false;
 *   }
 *   
 *   return true;
 * };
 * ```
 * 
 * Best Practices:
 * 1. Always validate character data
 * 2. Use proper type annotations
 * 3. Handle optional fields
 * 4. Maintain data consistency
 * 5. Follow naming conventions
 * 
 * @see Genre for available genres
 * @see GameEngine for character integration
 * @see ProgressionService for leveling system
 */