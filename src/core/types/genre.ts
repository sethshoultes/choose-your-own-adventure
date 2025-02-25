/**
 * Genre Type Definition Module
 * 
 * This module defines the available game genres in the AdventureBuildr game engine.
 * It provides a type-safe enumeration of supported genres, ensuring consistent
 * genre handling throughout the application. The genre system is fundamental to
 * story generation, character creation, and game content.
 * 
 * Key Features:
 * - Type-safe genre definition
 * - Core game genre support
 * - Genre-specific content integration
 * - Type consistency enforcement
 * 
 * Available Genres:
 * - Fantasy: Medieval and magical settings
 * - Sci-Fi: Futuristic and technological themes
 * - Horror: Suspense and supernatural elements
 * - Mystery: Investigation and detective work
 * 
 * @module types/genre
 */

/**
 * Genre type definition
 * Defines available game genres for type safety
 * 
 * @example
 * ```typescript
 * const genre: Genre = 'Fantasy';
 * ```
 */
export type Genre = 'Fantasy' | 'Sci-Fi' | 'Horror' | 'Mystery';

/**
 * Integration Points:
 * 
 * 1. Character Creation
 *    ```typescript
 *    // In CharacterCreation component
 *    interface Props {
 *      genre: Genre;
 *      onComplete: (character: Character) => void;
 *    }
 *    
 *    function CharacterCreation({ genre, onComplete }: Props) {
 *      const getInitialAttributes = (genre: Genre) => {
 *        switch (genre) {
 *          case 'Fantasy':
 *            return [
 *              { name: 'Magic', value: 5 },
 *              { name: 'Combat', value: 5 }
 *            ];
 *          // Other genre cases...
 *        }
 *      };
 *    }
 *    ```
 * 
 * 2. Story Generation
 *    ```typescript
 *    // In StoryService
 *    class StoryService {
 *      private getPromptForGenre(genre: Genre): string {
 *        switch (genre) {
 *          case 'Fantasy':
 *            return 'You are in a magical realm...';
 *          case 'Sci-Fi':
 *            return 'In the distant future...';
 *          case 'Horror':
 *            return 'Dark shadows loom...';
 *          case 'Mystery':
 *            return 'A puzzling case unfolds...';
 *        }
 *      }
 *    }
 *    ```
 * 
 * 3. Scene Management
 *    ```typescript
 *    // In sceneManager
 *    export function getInitialScene(genre: Genre): string {
 *      switch (genre) {
 *        case 'Fantasy':
 *          return 'The crystal palace towers before you...';
 *        case 'Sci-Fi':
 *          return 'Warning lights flash across your console...';
 *        case 'Horror':
 *          return 'The old mansion looms in darkness...';
 *        case 'Mystery':
 *          return 'The detective\'s office is dimly lit...';
 *      }
 *    }
 *    ```
 * 
 * Database Schema:
 * ```sql
 * -- Genre validation in characters table
 * ALTER TABLE characters
 * ADD CONSTRAINT valid_genre 
 * CHECK (genre IN ('Fantasy', 'Sci-Fi', 'Horror', 'Mystery'));
 * 
 * -- Genre statistics tracking
 * CREATE TABLE genre_stats (
 *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   genre text NOT NULL,
 *   total_characters integer DEFAULT 0,
 *   total_playtime interval DEFAULT '0',
 *   created_at timestamptz DEFAULT now()
 * );
 * ```
 * 
 * Usage Examples:
 * ```typescript
 * // Type validation
 * const isValidGenre = (genre: string): genre is Genre => {
 *   return ['Fantasy', 'Sci-Fi', 'Horror', 'Mystery'].includes(genre);
 * };
 * 
 * // Genre-specific content
 * const getGenreDescription = (genre: Genre): string => {
 *   switch (genre) {
 *     case 'Fantasy':
 *       return 'Epic quests and magical realms';
 *     case 'Sci-Fi':
 *       return 'Space exploration and technology';
 *     case 'Horror':
 *       return 'Supernatural thrills and suspense';
 *     case 'Mystery':
 *       return 'Detective work and investigation';
 *   }
 * };
 * 
 * // Genre selection
 * const genres: Genre[] = ['Fantasy', 'Sci-Fi', 'Horror', 'Mystery'];
 * 
 * // Genre-based initialization
 * const initializeGame = (genre: Genre) => {
 *   const config = getGenreConfig(genre);
 *   const scene = getInitialScene(genre);
 *   const attributes = getGenreAttributes(genre);
 *   return { config, scene, attributes };
 * };
 * ```
 * 
 * Type Validation:
 * ```typescript
 * // Validate genre at runtime
 * const validateGenre = (genre: unknown): Genre => {
 *   if (typeof genre !== 'string') {
 *     throw new Error('Genre must be a string');
 *   }
 *   
 *   if (!isValidGenre(genre)) {
 *     throw new Error(`Invalid genre: ${genre}`);
 *   }
 *   
 *   return genre;
 * };
 * 
 * // Type guard
 * function isGenre(value: any): value is Genre {
 *   return [
 *     'Fantasy',
 *     'Sci-Fi',
 *     'Horror',
 *     'Mystery'
 *   ].includes(value);
 * }
 * ```
 * 
 * Best Practices:
 * 1. Always use type annotations
 * 2. Validate genre inputs
 * 3. Handle all genre cases
 * 4. Maintain genre consistency
 * 5. Consider genre context
 * 
 * Genre-Specific Features:
 * 
 * 1. Fantasy
 *    - Magical abilities
 *    - Medieval settings
 *    - Mythical creatures
 *    - Quest-based narratives
 * 
 * 2. Sci-Fi
 *    - Advanced technology
 *    - Space exploration
 *    - Future settings
 *    - Scientific concepts
 * 
 * 3. Horror
 *    - Supernatural elements
 *    - Psychological tension
 *    - Survival scenarios
 *    - Mystery elements
 * 
 * 4. Mystery
 *    - Investigation mechanics
 *    - Character interrogation
 *    - Evidence collection
 *    - Puzzle solving
 * 
 * The genre system is fundamental to the game's content generation and
 * storytelling mechanics, ensuring appropriate themes and elements for
 * each game type.
 * 
 * @see Character for character integration
 * @see StoryService for content generation
 * @see GameEngine for game logic
 */