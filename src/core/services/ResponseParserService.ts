/**
 * ResponseParserService Class
 * 
 * This service handles parsing and validation of OpenAI responses in the AdventureBuildr game engine.
 * It provides robust parsing of streaming and complete responses, ensuring valid scene and choice
 * generation while handling various edge cases and malformed responses.
 * 
 * Key Features:
 * - Streaming response parsing
 * - JSON validation and recovery
 * - Scene structure validation
 * - Choice formatting
 * - Error handling
 * 
 * The service works alongside the auto-save system to ensure valid state updates
 * during scene generation.
 * 
 * @see GameEngine for integration with the main game loop
 * @see OpenAIService for content generation
 * @see Scene for scene structure
 */

import { debugManager } from '../debug/DebugManager';
import type { Scene, Choice } from '../types';

export class ResponseParserService {
  /**
   * Parses a complete or partial response into a valid scene
   * Handles both streaming and complete responses
   * 
   * @param buffer Raw response buffer
   * @returns Parsed scene object
   * @throws Error if parsing fails
   * 
   * @example
   * ```typescript
   * const scene = parser.parseResponse(`{
   *   "description": "The cave entrance looms before you...",
   *   "choices": [
   *     "Enter the cave cautiously",
   *     "Search for another way in",
   *     "Set up camp and wait for dawn"
   *   ]
   * }`);
   * ```
   */
  public parseResponse(buffer: string): Scene {
    try {
      // Clean up the buffer first
      const cleanBuffer = this.cleanBuffer(buffer);
      
      // Try different parsing strategies in order
      return (
        this.tryParseJSON(cleanBuffer) ||
        this.tryParseMarkdown(cleanBuffer) ||
        this.tryParseStructured(cleanBuffer) ||
        this.createFallbackScene(cleanBuffer)
      );
    } catch (error) {
      debugManager.log('Failed to parse response', 'error', { error, buffer });
      throw error;
    }
  }

  /**
   * Cleans and normalizes the response buffer
   * Handles escape characters and whitespace
   * 
   * @param buffer Raw response buffer
   * @returns Cleaned buffer string
   */
  private cleanBuffer(buffer: string): string {
    return buffer
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Attempts to parse response as JSON
   * Primary parsing strategy for well-formed responses
   * 
   * @param buffer Cleaned response buffer
   * @returns Parsed scene or null if parsing fails
   */
  private tryParseJSON(buffer: string): Scene | null {
    try {
      const parsed = JSON.parse(buffer);
      if (parsed.description && Array.isArray(parsed.choices)) {
        const choices = parsed.choices
          .map((choice: any, index: number) => ({
            id: index + 1,
            text: typeof choice === 'string' ? choice : choice.text || ''
          }))
          .filter((choice: Choice) => choice.text.trim().length > 0);

        if (choices.length > 0) {
          debugManager.log('Successfully parsed JSON response', 'success', { 
            choicesCount: choices.length 
          });
          
          return {
            id: `scene-${Date.now()}`,
            description: parsed.description.trim(),
            choices
          };
        }
      }
    } catch (e) {
      debugManager.log('JSON parsing failed', 'info');
    }
    return null;
  }

  /**
   * Attempts to parse response as markdown
   * Fallback for responses with markdown formatting
   * 
   * @param buffer Cleaned response buffer
   * @returns Parsed scene or null if parsing fails
   */
  private tryParseMarkdown(buffer: string): Scene | null {
    try {
      const choiceRegex = /\*\*Choice (\d+):\s*([^*]+?)\*\*\s*([^*]+?)(?=\*\*Choice|\s*$)/g;
      const choices: Choice[] = [];
      let match;

      while ((match = choiceRegex.exec(buffer)) !== null) {
        const [_, id, title, description] = match;
        choices.push({
          id: parseInt(id),
          text: `${title.trim()} - ${description.trim()}`
        });
      }

      if (choices.length > 0) {
        // Remove choice text from description
        const description = buffer
          .replace(/\*\*Choice \d+:[^*]+\*\*\s*[^*]+/g, '')
          .trim();

        debugManager.log('Successfully parsed markdown response', 'success', { 
          choicesCount: choices.length 
        });

        return {
          id: `scene-${Date.now()}`,
          description,
          choices
        };
      }
    } catch (e) {
      debugManager.log('Markdown parsing failed', 'info');
    }
    return null;
  }

  /**
   * Attempts to parse response as structured text
   * Fallback for responses with consistent formatting
   * 
   * @param buffer Cleaned response buffer
   * @returns Parsed scene or null if parsing fails
   */
  private tryParseStructured(buffer: string): Scene | null {
    try {
      // Look for numbered choices in the text
      const choiceRegex = /(?:Choice|Option)\s*(\d+):\s*([^\n]+)/gi;
      const choices: Choice[] = [];
      let match;

      while ((match = choiceRegex.exec(buffer)) !== null) {
        const [_, id, text] = match;
        choices.push({
          id: parseInt(id),
          text: text.trim()
        });
      }

      if (choices.length > 0) {
        // Get description by removing choice text
        const description = buffer
          .replace(/(?:Choice|Option)\s*\d+:\s*[^\n]+\n*/gi, '')
          .trim();

        debugManager.log('Successfully parsed structured response', 'success', { 
          choicesCount: choices.length 
        });

        return {
          id: `scene-${Date.now()}`,
          description,
          choices
        };
      }
    } catch (e) {
      debugManager.log('Structured parsing failed', 'info');
    }
    return null;
  }

  /**
   * Creates a fallback scene when parsing fails
   * Ensures game can continue even with malformed responses
   * 
   * @param buffer Cleaned response buffer
   * @returns Basic scene with generic choices
   */
  private createFallbackScene(buffer: string): Scene {
    debugManager.log('Using fallback scene creation', 'warning');
    
    return {
      id: `scene-${Date.now()}`,
      description: buffer,
      choices: [
        { id: 1, text: 'Continue exploring' },
        { id: 2, text: 'Take a different approach' },
        { id: 3, text: 'Consider your options' }
      ]
    };
  }
}

/**
 * Integration Points:
 * 
 * 1. GameEngine
 *    ```typescript
 *    // In GameEngine
 *    private async generateScene(buffer: string): Promise<Scene> {
 *      try {
 *        const parsedScene = this.responseParser.parseResponse(buffer);
 *        debugManager.log('Scene generated successfully', 'success', {
 *          description: parsedScene.description.substring(0, 50) + '...',
 *          choicesCount: parsedScene.choices.length
 *        });
 *        return parsedScene;
 *      } catch (error) {
 *        debugManager.log('Scene generation failed', 'error', { error });
 *        throw error;
 *      }
 *    }
 *    ```
 * 
 * 2. OpenAIService
 *    ```typescript
 *    // In OpenAIService
 *    public async generateNextScene(prompt: StoryPrompt): Promise<void> {
 *      let buffer = '';
 *      
 *      await this.streamCompletion(prompt, {
 *        onToken: (token) => {
 *          buffer += token;
 *          try {
 *            const scene = this.parser.parseResponse(buffer);
 *            if (scene.choices.length > 0) {
 *              this.completeGeneration(scene);
 *            }
 *          } catch {
 *            // Continue collecting tokens
 *          }
 *        }
 *      });
 *    }
 *    ```
 * 
 * 3. UI Components
 *    ```typescript
 *    // In StoryScene component
 *    const handleStreamingResponse = (token: string) => {
 *      try {
 *        const scene = parser.parseResponse(buffer + token);
 *        setCurrentScene(scene);
 *      } catch {
 *        // Update raw description
 *        setDescription(prev => prev + token);
 *      }
 *    };
 *    ```
 * 
 * Best Practices:
 * 1. Always validate parsed scenes
 * 2. Handle streaming responses gracefully
 * 3. Provide meaningful error messages
 * 4. Use fallback options when needed
 * 5. Log parsing failures
 * 
 * Error Handling:
 * ```typescript
 * try {
 *   const scene = parser.parseResponse(buffer);
 * } catch (error) {
 *   debugManager.log('Parsing failed', 'error', { error });
 *   return createFallbackScene(buffer);
 * }
 * ```
 * 
 * @see debugManager for error logging
 * @see GameEngine for game state management
 * @see OpenAIService for response generation
 */