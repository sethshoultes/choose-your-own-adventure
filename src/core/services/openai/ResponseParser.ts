/**
 * ResponseParser Class
 * 
 * This class handles parsing and validation of OpenAI responses in the AdventureBuildr game engine.
 * It processes both streaming and complete responses, ensuring valid scene and choice generation
 * while handling various edge cases and malformed responses. The parser works alongside the
 * OpenAIService to maintain consistent story generation.
 * 
 * Key Features:
 * - JSON response parsing
 * - Streaming content handling
 * - Response validation
 * - Error recovery
 * - Content cleaning
 * 
 * Data Flow:
 * 1. Raw response reception
 * 2. Content validation
 * 3. JSON parsing attempt
 * 4. Fallback parsing
 * 5. Response cleaning
 * 
 * @see OpenAIService for service integration
 * @see Scene for scene structure
 */

import { debugManager } from '../../debug/DebugManager';
import type { Scene, Choice } from '../../types';

export class ResponseParser {
  /**
   * Parses a complete or partial response into a valid scene
   * Handles both streaming and complete responses
   * 
   * @param response Raw response string
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
  public parseResponse(response: string | undefined | null): Scene {
    if (!response?.trim()) {
      debugManager.log('Empty response received', 'warning');
      return {
        id: `scene-${Date.now()}`,
        description: '',
        choices: []
      };
    }

    // Clean up the buffer first
    const cleanBuffer = this.cleanBuffer(response);
    
    // Try different parsing strategies in order
    return (
      this.tryParseJSON(cleanBuffer) ||
      this.tryParseMarkdown(cleanBuffer) ||
      this.tryParseStructured(cleanBuffer) ||
      this.createFallbackScene(cleanBuffer)
    );
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
 * 1. OpenAIService
 *    ```typescript
 *    // In OpenAIService
 *    export class OpenAIService {
 *      private parser: ResponseParser;
 *      
 *      constructor() {
 *        this.parser = new ResponseParser();
 *      }
 *      
 *      public async generateNextScene(): Promise<void> {
 *        let buffer = '';
 *        
 *        await this.streamCompletion({
 *          onToken: (token) => {
 *            buffer += token;
 *            try {
 *              const scene = this.parser.parseResponse(buffer);
 *              if (scene.choices.length > 0) {
 *                this.completeGeneration(scene);
 *              }
 *            } catch {
 *              // Continue collecting tokens
 *            }
 *          }
 *        });
 *      }
 *    }
 *    ```
 * 
 * 2. GameEngine
 *    ```typescript
 *    // In GameEngine
 *    private async generateScene(buffer: string): Promise<Scene> {
 *      try {
 *        const parsedScene = this.parser.parseResponse(buffer);
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
 * 3. Admin Test Panel
 *    ```typescript
 *    // In TestPanel component
 *    const handleResponse = (response: string) => {
 *      try {
 *        const scene = parser.parseResponse(response);
 *        setCurrentScene(scene);
 *        setError(null);
 *      } catch (error) {
 *        setError('Failed to parse response');
 *        console.error(error);
 *      }
 *    };
 *    ```
 * 
 * Error Handling:
 * ```typescript
 * try {
 *   const scene = parser.parseResponse(buffer);
 *   if (!scene.choices.length) {
 *     throw new Error('No valid choices generated');
 *   }
 *   return scene;
 * } catch (error) {
 *   debugManager.log('Parsing failed', 'error', { error, buffer });
 *   return createFallbackScene(buffer);
 * }
 * ```
 * 
 * Best Practices:
 * 1. Always handle parsing errors
 * 2. Validate parsed content
 * 3. Use appropriate fallbacks
 * 4. Log parsing failures
 * 5. Clean input data
 * 
 * Performance Optimization:
 * ```typescript
 * // Cache regex patterns
 * const CHOICE_REGEX = /Choice (\d+):\s*([^\n]+)/gi;
 * const MARKDOWN_REGEX = /\*\*([^*]+)\*\*\/g;
 * 
 * // Optimize buffer handling
 * const cleanBuffer = (() => {
 *   const cache = new Map<string, string>();
 *   return (buffer: string) => {
 *     if (cache.has(buffer)) {
 *       return cache.get(buffer)!;
 *     }
 *     const cleaned = // cleaning logic
 *     cache.set(buffer, cleaned);
 *     return cleaned;
 *   };
 * })();
 * 
 * // Batch processing for large responses
 * const processBatch = (chunks: string[]) => {
 *   return chunks.reduce((buffer, chunk) => {
 *     try {
 *       return parser.parseResponse(buffer + chunk);
 *     } catch {
 *       return buffer;
 *     }
 *   }, '');
 * };
 * ```
 * 
 * Content Validation:
 * ```typescript
 * const validateScene = (scene: Scene): boolean => {
 *   if (!scene.description?.trim()) {
 *     return false;
 *   }
 *   
 *   if (!Array.isArray(scene.choices) || 
 *       scene.choices.length === 0) {
 *     return false;
 *   }
 *   
 *   return scene.choices.every(choice => 
 *     choice.id && 
 *     typeof choice.text === 'string' &&
 *     choice.text.trim().length > 0
 *   );
 * };
 * 
 * const validateChoices = (choices: Choice[]): boolean => {
 *   const uniqueTexts = new Set(
 *     choices.map(c => c.text.toLowerCase())
 *   );
 *   return uniqueTexts.size === choices.length;
 * };
 * ```
 * 
 * @see OpenAIService for service integration
 * @see Scene for scene structure
 * @see Choice for choice structure
 */