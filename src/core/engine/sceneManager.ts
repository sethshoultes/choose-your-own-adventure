/**
 * Scene Manager Module
 * 
 * This module manages scene generation and choice handling in the AdventureBuildr game engine.
 * It provides genre-specific initial scenes and choices, ensuring a consistent and engaging
 * start to each adventure. The manager works alongside the GameEngine to maintain narrative
 * coherence and proper game state progression.
 * 
 * Key Features:
 * - Genre-specific scene generation
 * - Dynamic choice creation
 * - Consistent story initialization
 * - Rich narrative content
 * - Genre-appropriate prompts
 * 
 * Data Flow:
 * 1. Genre selection
 * 2. Initial scene generation
 * 3. Choice preparation
 * 4. Scene delivery
 * 5. State integration
 * 
 * @module sceneManager
 */

import type { Genre, Scene, Choice } from '../types';

/**
 * Generates the initial scene description based on the selected genre
 * Each genre has a unique starting scenario that sets up the adventure's context
 * 
 * @param genre - The selected game genre
 * @returns A detailed scene description string
 * 
 * @example
 * ```typescript
 * const initialScene = getInitialScene('Fantasy');
 * ```
 */
export function getInitialScene(genre: Genre): string {
  switch (genre) {
    case 'Fantasy':
      return `In the ancient kingdom of Eldara, you find yourself standing before the towering gates of the Crystal Palace. The air shimmers with magical energy, and whispers of an impending doom echo through the streets.

The Royal Guard captain approaches you with urgency in his eyes. "Thank the gods you've arrived," he says. "We need your help. The Sacred Crystal has been stolen, and without it, our realm will fall into chaos."

Dark clouds gather overhead as you consider your next move.`;
    case 'Sci-Fi':
      return `Warning lights flash across the command console of your damaged starship. The emergency AI's voice crackles through the speakers: "Hull breach detected. Multiple systems failing. Emergency protocols initiated."

Through the viewport, you see the swirling anomaly that disabled your ship growing larger. The research station you were sent to investigate floats silently in the distance, its lights blinking in an odd pattern.

Time is running out, and you must make a decision.`;
    case 'Horror':
      return `The old mansion looms before you, its decrepit walls seeming to absorb what little moonlight filters through the clouds. The missing persons case that led you here suddenly feels much more sinister.

A crash echoes from inside, followed by an unnatural silence. Your flashlight flickers, and for a moment, you swear you see movement in one of the upper windows.

The wind carries what sounds like distant whispers.`;
    case 'Mystery':
      return `The detective's office is dimly lit, case files scattered across the desk. The photograph in your hand shows the victim, a prominent city councilor, found dead in mysterious circumstances.

Your phone buzzes - an anonymous tip about a warehouse at the edge of town. At the same time, the victim's daughter is waiting in the lobby, claiming to have vital information.

The clock strikes midnight.`;
    default:
      return 'Invalid genre selected.';
  }
}

/**
 * Generates initial choices for the player based on the selected genre
 * Each choice is designed to be meaningful and lead to different narrative paths
 * 
 * @param genre - The selected game genre
 * @returns An array of Choice objects with IDs and descriptive text
 * 
 * @example
 * ```typescript
 * const choices = getInitialChoices('Fantasy');
 * ```
 */
export function getInitialChoices(genre: Genre): Choice[] {
  switch (genre) {
    case 'Fantasy':
      return [
        { id: 1, text: 'Offer to help track down the crystal thief immediately' },
        { id: 2, text: 'Question the captain about recent suspicious activities in the palace' },
        { id: 3, text: 'Investigate the crystal\'s chamber for clues first' },
      ];
    case 'Sci-Fi':
      return [
        { id: 1, text: 'Attempt emergency repairs on the hull breach' },
        { id: 2, text: 'Try to dock with the research station' },
        { id: 3, text: 'Launch an emergency probe to study the anomaly' },
      ];
    case 'Horror':
      return [
        { id: 1, text: 'Enter through the front door with caution' },
        { id: 2, text: 'Circle the mansion to find another way in' },
        { id: 3, text: 'Call for backup before proceeding' },
      ];
    case 'Mystery':
      return [
        { id: 1, text: 'Head to the warehouse immediately' },
        { id: 2, text: 'Interview the victim\'s daughter' },
        { id: 3, text: 'Review the case files more thoroughly' },
      ];
    default:
      return [];
  }
}

/**
 * Integration Points:
 * 
 * 1. GameEngine
 *    ```typescript
 *    // In GameEngine
 *    public async initializeGame(genre: Genre, character: Character): Promise<void> {
 *      const initialScene = getInitialScene(genre);
 *      const initialChoices = getInitialChoices(genre);
 *      
 *      this.state = {
 *        currentScene: {
 *          id: 'scene-1',
 *          description: initialScene,
 *          choices: initialChoices
 *        },
 *        history: [],
 *        gameOver: false
 *      };
 *    }
 *    ```
 * 
 * 2. CharacterCreation
 *    ```typescript
 *    // In CharacterCreation component
 *    const handleSubmit = async () => {
 *      const initialScene = getInitialScene(character.genre);
 *      const initialChoices = getInitialChoices(character.genre);
 *      
 *      const gameState = {
 *        currentScene: {
 *          id: 'scene-1',
 *          description: initialScene,
 *          choices: initialChoices
 *        },
 *        history: [],
 *        gameOver: false
 *      };
 *      
 *      onComplete(character, gameState);
 *    };
 *    ```
 * 
 * 3. StoryService
 *    ```typescript
 *    // In StoryService
 *    public async startNewStory(genre: Genre): Promise<Scene> {
 *      return {
 *        id: 'scene-1',
 *        description: getInitialScene(genre),
 *        choices: getInitialChoices(genre)
 *      };
 *    }
 *    ```
 * 
 * Usage Examples:
 * ```typescript
 * // Basic scene initialization
 * const genre: Genre = 'Fantasy';
 * const scene = {
 *   id: 'scene-1',
 *   description: getInitialScene(genre),
 *   choices: getInitialChoices(genre)
 * };
 * 
 * // With error handling
 * try {
 *   const description = getInitialScene(genre);
 *   const choices = getInitialChoices(genre);
 *   
 *   if (!description || choices.length === 0) {
 *     throw new Error(`Invalid genre: ${genre}`);
 *   }
 *   
 *   return { description, choices };
 * } catch (error) {
 *   console.error('Failed to generate initial scene:', error);
 *   return getDefaultScene();
 * }
 * ```
 * 
 * Error Handling:
 * ```typescript
 * const validateGenre = (genre: string): genre is Genre => {
 *   return ['Fantasy', 'Sci-Fi', 'Horror', 'Mystery'].includes(genre);
 * };
 * 
 * const getSceneContent = (genre: string) => {
 *   if (!validateGenre(genre)) {
 *     throw new Error(`Invalid genre: ${genre}`);
 *   }
 *   
 *   const description = getInitialScene(genre);
 *   const choices = getInitialChoices(genre);
 *   
 *   return { description, choices };
 * };
 * ```
 * 
 * Best Practices:
 * 1. Keep scenes focused and engaging
 * 2. Provide meaningful choices
 * 3. Maintain genre consistency
 * 4. Consider character context
 * 5. Handle edge cases
 * 
 * Scene Guidelines:
 * 1. Fantasy Scenes
 *    - Include magical elements
 *    - Reference medieval settings
 *    - Add mystical atmosphere
 *    - Balance action and intrigue
 * 
 * 2. Sci-Fi Scenes
 *    - Focus on technology
 *    - Include space elements
 *    - Add scientific concepts
 *    - Create futuristic atmosphere
 * 
 * 3. Horror Scenes
 *    - Build tension gradually
 *    - Add atmospheric details
 *    - Include subtle threats
 *    - Create unease
 * 
 * 4. Mystery Scenes
 *    - Present clear stakes
 *    - Include relevant clues
 *    - Add multiple suspects
 *    - Create intrigue
 * 
 * Choice Design:
 * ```typescript
 * const designChoices = (genre: Genre, context: any): Choice[] => {
 *   const baseChoices = getInitialChoices(genre);
 *   
 *   return baseChoices.map(choice => ({
 *     ...choice,
 *     // Add character-specific modifiers
 *     success_chance: calculateSuccessChance(choice, context),
 *     // Add attribute requirements
 *     requirements: getChoiceRequirements(choice, genre)
 *   }));
 * };
 * 
 * const validateChoices = (choices: Choice[]): boolean => {
 *   if (choices.length !== 3) return false;
 *   
 *   const uniqueIds = new Set(choices.map(c => c.id));
 *   if (uniqueIds.size !== choices.length) return false;
 *   
 *   return choices.every(choice => 
 *     choice.text.length > 0 &&
 *     !choice.text.includes('Investigate further')
 *   );
 * };
 * ```
 * 
 * The manager works alongside the GameEngine to provide consistent story
 * initialization and proper game state progression.
 * 
 * @see GameEngine for game state integration
 * @see StoryService for story generation
 * @see Genre for available genres
 */