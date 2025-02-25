/**
 * Response Parser Utility
 * 
 * This utility module provides parsing functionality for OpenAI responses in the AdventureBuildr game engine.
 * It handles both streaming and complete responses, ensuring proper formatting and structure for game content.
 * The parser works alongside the useResponseParser hook to provide real-time content updates while
 * maintaining proper error handling and content validation.
 * 
 * Key Features:
 * - Response cleaning and normalization
 * - JSON parsing and validation
 * - Content formatting
 * - Error handling
 * - Streaming support
 * 
 * Data Flow:
 * 1. Raw response reception
 * 2. Content sanitization
 * 3. JSON parsing attempt
 * 4. Content formatting
 * 5. Error handling
 * 
 * @module utils/responseParser
 */

import { debugManager } from '../core/debug/DebugManager';

/**
 * Parses and formats OpenAI response content
 * Handles both complete and partial responses
 * 
 * @param response Raw response string
 * @returns Formatted response content
 * @throws Error if parsing fails
 * 
 * @example
 * ```typescript
 * const content = parseResponse(`{
 *   "description": "The cave entrance looms before you..."
 * }`);
 * ```
 */
export function parseResponse(response: string | undefined | null): string {
  if (!response?.trim()) {
    debugManager.log('Empty response received', 'warning');
    return '';
  }

  // Remove control characters and normalize newlines
  const sanitizedResponse = response
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .trim();

  try {
    // Try to parse complete JSON first
    try {
      const parsed = JSON.parse(sanitizedResponse);
      if (parsed?.description) {
        debugManager.log('Parsed complete JSON response', 'success', { parsed });
        return parsed.description
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\s+/g, ' ')
          .split(/\.\s+/)
          .map(sentence => sentence.trim())
          .filter(Boolean)
          .join('.\n\n')
          .trim();
      }
    } catch {
      // Continue to other parsing methods
    }

    // If not valid JSON, clean up the response
    const cleanedResponse = sanitizedResponse
      // Remove JSON formatting
      .replace(/{|}|\[|\]|"|'/g, '')
      // Remove field names
      .replace(/description:|choices:|text:|id:/g, '')
      // Remove commas at end of lines
      .replace(/,\s*(?:\n|$)/g, '\n')
      // Split into sentences
      .split(/\.\s+/)
      .map(sentence => sentence.trim())
      .filter(Boolean)
      .join('.\n\n');

    debugManager.log('Using cleaned response', 'info', { 
      original: response,
      cleaned: cleanedResponse 
    });
    
    return cleanedResponse;
  } catch (error) {
    debugManager.log('Error parsing response', 'error', { error });
    return sanitizedResponse;
  }
}

/**
 * Integration Points:
 * 
 * 1. useResponseParser Hook
 *    ```typescript
 *    // In useResponseParser hook
 *    const { parsedContent } = useResponseParser(response, (content) => {
 *      try {
 *        const parsed = parseResponse(content);
 *        updateGameState(parsed);
 *      } catch (error) {
 *        handleError(error);
 *      }
 *    });
 *    ```
 * 
 * 2. StoryScene Component
 *    ```typescript
 *    // In StoryScene component
 *    const handleStreamingResponse = (token: string) => {
 *      try {
 *        const parsed = parseResponse(buffer + token);
 *        setDescription(parsed);
 *      } catch (error) {
 *        console.error('Parsing error:', error);
 *      }
 *    };
 *    ```
 * 
 * 3. Admin Test Panel
 *    ```typescript
 *    // In TestPanel component
 *    const handleResponse = (response: string) => {
 *      try {
 *        const formatted = parseResponse(response);
 *        setFormattedContent(formatted);
 *      } catch (error) {
 *        setError('Failed to parse response');
 *      }
 *    };
 *    ```
 * 
 * Usage Examples:
 * ```typescript
 * // Basic parsing
 * const content = parseResponse(rawResponse);
 * 
 * // With error handling
 * try {
 *   const parsed = parseResponse(response);
 *   updateContent(parsed);
 * } catch (error) {
 *   console.error('Parse error:', error);
 *   showFallbackContent();
 * }
 * 
 * // Streaming content
 * let buffer = '';
 * const handleToken = (token: string) => {
 *   buffer += token;
 *   try {
 *     const parsed = parseResponse(buffer);
 *     updateStreamingContent(parsed);
 *   } catch {
 *     // Continue collecting tokens
 *   }
 * };
 * ```
 * 
 * Error Handling:
 * ```typescript
 * try {
 *   const parsed = parseResponse(response);
 *   return parsed;
 * } catch (error) {
 *   debugManager.log('Parsing failed', 'error', { error });
 *   return response.trim(); // Fallback to raw content
 * }
 * ```
 * 
 * Best Practices:
 * 1. Always handle parsing errors
 * 2. Clean input content
 * 3. Validate parsed output
 * 4. Provide fallback content
 * 5. Log parsing failures
 * 
 * Performance Optimization:
 * ```typescript
 * // Cache cleaned responses
 * const responseCache = new Map<string, string>();
 * 
 * const getCachedResponse = (response: string) => {
 *   if (responseCache.has(response)) {
 *     return responseCache.get(response);
 *   }
 *   
 *   const parsed = parseResponse(response);
 *   responseCache.set(response, parsed);
 *   return parsed;
 * };
 * 
 * // Optimize content cleaning
 * const cleanContent = (content: string) => {
 *   return content
 *     .replace(/\s+/g, ' ')
 *     .replace(/[^\w\s.,!?-]/g, '')
 *     .trim();
 * };
 * ```
 * 
 * The parser works alongside the useResponseParser hook to provide real-time
 * content updates while maintaining proper error handling and content validation.
 * 
 * @see useResponseParser for hook integration
 * @see OpenAIService for content generation
 * @see StoryScene for content display
 */