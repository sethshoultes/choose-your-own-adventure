/**
 * OpenAI Prompts Module
 * 
 * This module provides prompt generation and management for OpenAI interactions in the AdventureBuildr
 * game engine. It generates structured prompts for story generation, ensuring consistent narrative
 * quality and proper context handling across different genres. The prompts integrate with the
 * OpenAIService to guide the AI in generating appropriate story content.
 * 
 * Key Features:
 * - Genre-specific prompt generation
 * - Dynamic context integration
 * - History management
 * - Response formatting guidelines
 * - Quality control parameters
 * 
 * Data Flow:
 * 1. Genre selection
 * 2. Context preparation
 * 3. History integration
 * 4. Prompt formatting
 * 5. Response structure definition
 * 
 * @module openai/prompts
 */

import type { StoryPrompt } from './types';

/**
 * Generates the system prompt for story generation
 * Configures AI behavior based on genre
 * 
 * @param genre Game genre for context
 * @returns Formatted system prompt
 * 
 * @example
 * ```typescript
 * const systemPrompt = generateSystemPrompt('Fantasy');
 * ```
 */
export function generateSystemPrompt(genre: string): string {
  const basePrompt = `You are a creative and engaging storyteller specializing in ${genre} narratives. 
Your task is to continue the story based on the player's choices. Your response MUST be valid JSON in this exact format:

{
  "description": "Scene description here...",
  "choices": [
    "First choice",
    "Second choice", 
    "Third choice"
  ]
}

Guidelines:
1. Description:
   - Keep descriptions vivid but concise (150-200 words)
   - Maintain consistent tone and style
   - Reference character attributes and equipment when relevant
   - Avoid repetitive scenarios
   - Keep track of story continuity

2. Choices:
   - ALWAYS provide exactly 3 choices
   - Each choice should be a direct string
   - Make choices meaningful and distinct
   - Consider character attributes
   - Lead to different narrative paths
   - Choices should be specific to the scene and story
   - Avoid generic choices like "Investigate" or "Take action"

3. Response Format:
   - MUST be valid JSON
   - MUST include both description and choices
   - NO additional fields or formatting
   - NO markdown or special characters`;

  // Add genre-specific guidelines
  switch (genre) {
    case 'Fantasy':
      return `${basePrompt}

Fantasy-specific guidelines:
- Include magical elements and fantastical creatures
- Reference the medieval/magical setting
- Consider magical abilities in choices
- Balance combat, diplomacy, and mystical solutions`;

    case 'Sci-Fi':
      return `${basePrompt}

Sci-Fi-specific guidelines:
- Include advanced technology and scientific concepts
- Reference space, future tech, or advanced civilizations
- Consider technological solutions in choices
- Balance action, problem-solving, and exploration`;

    case 'Horror':
      return `${basePrompt}

Horror-specific guidelines:
- Build tension and atmosphere
- Include psychological and supernatural elements
- Consider fight-or-flight responses in choices
- Balance investigation, survival, and confrontation`;

    case 'Mystery':
      return `${basePrompt}

Mystery-specific guidelines:
- Include clues and red herrings
- Reference investigation techniques
- Consider deductive reasoning in choices
- Balance interrogation, investigation, and action`;

    default:
      return basePrompt;
  }
}

/**
 * Generates the user prompt for story continuation
 * Integrates character context and history
 * 
 * @param prompt Story generation context
 * @returns Formatted user prompt
 * 
 * @example
 * ```typescript
 * const userPrompt = generateUserPrompt({
 *   context: {
 *     genre: 'Fantasy',
 *     character: currentCharacter,
 *     currentScene: activeScene,
 *     history: gameHistory
 *   },
 *   choice: selectedChoice
 * });
 * ```
 */
export function generateUserPrompt({ context, choice }: StoryPrompt): string {
  const { character, currentScene, history } = context;

  let prompt = `IMPORTANT: Your response MUST be valid JSON matching the format specified in the system prompt.

Character Information:
Name: ${character.name}
Attributes:
${character.attributes.map(a => `  * ${a.name} (${a.value}): ${a.description}`).join('\n')}
Equipment:
${character.equipment.map(e => `  * ${e.name}: ${e.description}`).join('\n')}
${character.backstory ? `Backstory: ${character.backstory}` : ''}

Current Scene:
${currentScene}

Player Choice:
${choice}


Guidelines:
- Description should be 150-200 words
- Each choice must be distinct and meaningful
- Choices should consider character attributes
- Maintain consistent tone and genre
- Reference previous choices for continuity`;

  // Add recent history for context
  if (history.length > 0) {
    prompt = `${prompt}\n\nStory History:\n${history
      .map(h => `- Scene: ${h.sceneDescription}\n  Choice: ${h.choice}`)
      .join('\n\n')}`;
  }

  return prompt;
}

/**
 * Integration Points:
 * 
 * 1. OpenAIService
 *    ```typescript
 *    // In OpenAIService
 *    public async generateNextScene(prompt: StoryPrompt): Promise<void> {
 *      await this.client.streamCompletion(
 *        [
 *          {
 *            role: 'system',
 *            content: generateSystemPrompt(prompt.context.genre)
 *          },
 *          {
 *            role: 'user',
 *            content: generateUserPrompt(prompt)
 *          }
 *        ],
 *        this.config,
 *        callbacks
 *      );
 *    }
 *    ```
 * 
 * 2. GameEngine
 *    ```typescript
 *    // In GameEngine
 *    private buildPrompt(): StoryPrompt {
 *      return {
 *        context: {
 *          genre: this.character.genre,
 *          character: this.character,
 *          currentScene: this.state.currentScene,
 *          history: this.state.history
 *        },
 *        choice: this.lastChoice
 *      };
 *    }
 *    ```
 * 
 * 3. StoryService
 *    ```typescript
 *    // In StoryService
 *    public async generateScene(context: StoryContext): Promise<Scene> {
 *      const prompt = {
 *        context,
 *        choice: context.lastChoice
 *      };
 *      
 *      return this.openai.generateNextScene(prompt, callbacks);
 *    }
 *    ```
 * 
 * Usage Examples:
 * ```typescript
 * // Basic prompt generation
 * const systemPrompt = generateSystemPrompt('Fantasy');
 * const userPrompt = generateUserPrompt({
 *   context: gameContext,
 *   choice: playerChoice
 * });
 * 
 * // With history management
 * const recentHistory = gameHistory.slice(-5);
 * const prompt = generateUserPrompt({
 *   context: {
 *     ...gameContext,
 *     history: recentHistory
 *   },
 *   choice: playerChoice
 * });
 * ```
 * 
 * Error Handling:
 * ```typescript
 * try {
 *   const prompt = generateUserPrompt(storyContext);
 *   if (prompt.length > MAX_PROMPT_LENGTH) {
 *     // Truncate history or context
 *     const optimizedContext = optimizeContext(storyContext);
 *     return generateUserPrompt(optimizedContext);
 *   }
 *   return prompt;
 * } catch (error) {
 *   console.error('Error generating prompt:', error);
 *   return generateFallbackPrompt(storyContext);
 * }
 * ```
 * 
 * Best Practices:
 * 1. Keep prompts focused and concise
 * 2. Maintain consistent formatting
 * 3. Include relevant context only
 * 4. Consider token limits
 * 5. Handle edge cases
 * 
 * Performance Optimization:
 * ```typescript
 * // Optimize context for token efficiency
 * const optimizeContext = (context: StoryContext) => ({
 *   ...context,
 *   history: context.history.slice(-5),
 *   currentScene: truncateIfNeeded(context.currentScene),
 *   character: {
 *     ...context.character,
 *     backstory: summarizeBackstory(context.character.backstory)
 *   }
 * });
 * 
 * // Cache frequently used prompts
 * const promptCache = new Map<string, string>();
 * const getCachedPrompt = (genre: string) => {
 *   if (!promptCache.has(genre)) {
 *     promptCache.set(genre, generateSystemPrompt(genre));
 *   }
 *   return promptCache.get(genre)!;
 * };
 * ```
 * 
 * Quality Control:
 * ```typescript
 * // Validate prompt structure
 * const validatePrompt = (prompt: string): boolean => {
 *   const required = [
 *     'Character Information',
 *     'Current Scene',
 *     'Player Choice'
 *   ];
 *   return required.every(section => prompt.includes(section));
 * };
 * 
 * // Ensure proper formatting
 * const formatPrompt = (prompt: string): string => {
 *   return prompt
 *     .replace(/\n{3,}/g, '\n\n')
 *     .trim()
 *     .split('\n')
 *     .map(line => line.trim())
 *     .join('\n');
 * };
 * ```
 * 
 * @see OpenAIService for service integration
 * @see StoryService for story management
 * @see GameEngine for game state context
 */