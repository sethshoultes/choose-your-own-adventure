/**
 * Response Parser Hook
 * 
 * This custom React hook manages the parsing and processing of streaming responses in the AdventureBuildr
 * game engine. It handles both complete and partial responses, providing real-time content updates
 * while maintaining proper error handling and state management.
 * 
 * Key Features:
 * - Streaming response parsing
 * - Content state management
 * - Error handling
 * - Debounced updates
 * - Buffer management
 * 
 * Data Flow:
 * 1. Response reception
 * 2. Buffer accumulation
 * 3. Parse attempts
 * 4. State updates
 * 5. Error handling
 * 
 * @param response Current response string
 * @param onUpdate Optional callback for parsed content updates
 * @returns Object containing parsed content, loading state, and errors
 * 
 * @example
 * ```typescript
 * function StoryView({ response }) {
 *   const { parsedContent, isLoading, error } = useResponseParser(
 *     response,
 *     (content) => console.log('Content updated:', content)
 *   );
 *   
 *   if (isLoading) return <LoadingIndicator />;
 *   if (error) return <ErrorMessage error={error} />;
 *   
 *   return <div>{parsedContent}</div>;
 * }
 * ```
 */

import { useState, useEffect, useRef } from 'react';
import { debugManager } from '../core/debug/DebugManager';
import { parseResponse } from '../utils/responseParser';

export function useResponseParser(
  response: string | undefined | null,
  onUpdate?: (parsed: string) => void
) {
  const [parsedContent, setParsedContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bufferRef = useRef('');
  const parserTimeoutRef = useRef<NodeJS.Timeout>();
  const lastResponseRef = useRef(response);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    if (response !== lastResponseRef.current) {
      lastResponseRef.current = response;
      bufferRef.current += response;

      // Clear existing timeout
      if (parserTimeoutRef.current) {
        clearTimeout(parserTimeoutRef.current);
      }

      if (!bufferRef.current.trim()) {
        setParsedContent('');
        setIsLoading(false);
        return;
      }

      // Debounce parsing for streaming
      parserTimeoutRef.current = setTimeout(() => {
        try {
          const parsed = parseResponse(bufferRef.current);
          if (parsed) {
            setParsedContent(parsed);
            onUpdate?.(parsed);
            debugManager.log('Response parsed successfully', 'success', { 
              original: bufferRef.current,
              parsed 
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to parse response';
          setError(errorMessage);
          debugManager.log('Error parsing response', 'error', { 
            error, 
            response: bufferRef.current 
          });
        } finally {
          setIsLoading(false);
        }
      }, 100);
    }

    return () => {
      if (parserTimeoutRef.current) {
        clearTimeout(parserTimeoutRef.current);
      }
    };
  }, [response, onUpdate]);

  // Reset buffer when component unmounts
  useEffect(() => {
    return () => {
      bufferRef.current = '';
    };
  }, []);

  return { parsedContent, isLoading, error };
}

/**
 * Integration Points:
 * 
 * 1. StoryScene Component
 *    ```typescript
 *    // In StoryScene component
 *    function StoryScene({ streamingResponse }) {
 *      const { parsedContent, isLoading } = useResponseParser(
 *        streamingResponse,
 *        (content) => {
 *          updateGameState(content);
 *        }
 *      );
 *      
 *      return (
 *        <div>
 *          {isLoading ? (
 *            <LoadingIndicator />
 *          ) : (
 *            <div>{parsedContent}</div>
 *          )}
 *        </div>
 *      );
 *    }
 *    ```
 * 
 * 2. Admin Test Panel
 *    ```typescript
 *    // In TestPanel component
 *    function ResponseView({ rawResponse }) {
 *      const { parsedContent, error } = useResponseParser(rawResponse);
 *      
 *      if (error) {
 *        return <ErrorMessage error={error} />;
 *      }
 *      
 *      return (
 *        <div>
 *          <h3>Parsed Response:</h3>
 *          <pre>{parsedContent}</pre>
 *        </div>
 *      );
 *    }
 *    ```
 * 
 * 3. OpenAI Integration
 *    ```typescript
 *    // In OpenAIService
 *    function StreamingResponse({ stream }) {
 *      const { parsedContent } = useResponseParser(stream, (content) => {
 *        processStreamContent(content);
 *      });
 *      
 *      return <ResponseDisplay content={parsedContent} />;
 *    }
 *    ```
 * 
 * Usage Examples:
 * ```typescript
 * // Basic usage
 * function ResponseHandler({ response }) {
 *   const { parsedContent, isLoading, error } = useResponseParser(response);
 *   
 *   if (isLoading) return <LoadingIndicator />;
 *   if (error) return <ErrorMessage error={error} />;
 *   
 *   return <div>{parsedContent}</div>;
 * }
 * 
 * // With update callback
 * function StreamHandler({ stream }) {
 *   const handleUpdate = (content: string) => {
 *     console.log('New content:', content);
 *   };
 *   
 *   const { parsedContent } = useResponseParser(stream, handleUpdate);
 *   
 *   return <div>{parsedContent}</div>;
 * }
 * ```
 * 
 * Error Handling:
 * ```typescript
 * function ErrorAwareParser({ response }) {
 *   const { parsedContent, error } = useResponseParser(
 *     response,
 *     (content) => {
 *       try {
 *         processContent(content);
 *       } catch (error) {
 *         console.error('Processing error:', error);
 *       }
 *     }
 *   );
 *   
 *   if (error) {
 *     return (
 *       <div className="error-container">
 *         <h3>Parsing Error</h3>
 *         <p>{error}</p>
 *         <pre>{response}</pre>
 *       </div>
 *     );
 *   }
 *   
 *   return <div>{parsedContent}</div>;
 * }
 * ```
 * 
 * Best Practices:
 * 1. Always handle loading states
 * 2. Provide error feedback
 * 3. Clean up timeouts
 * 4. Handle empty responses
 * 5. Debounce updates
 * 
 * Performance Optimization:
 * ```typescript
 * // Implement content caching
 * const contentCache = new Map<string, string>();
 * 
 * const getCachedContent = (response: string) => {
 *   if (contentCache.has(response)) {
 *     return contentCache.get(response);
 *   }
 *   
 *   const parsed = parseResponse(response);
 *   contentCache.set(response, parsed);
 *   return parsed;
 * };
 * 
 * // Optimize buffer management
 * const optimizeBuffer = (buffer: string) => {
 *   // Remove old content if buffer gets too large
 *   if (buffer.length > MAX_BUFFER_SIZE) {
 *     return buffer.slice(-MAX_BUFFER_SIZE);
 *   }
 *   return buffer;
 * };
 * ```
 * 
 * The hook works alongside the OpenAIService to provide real-time
 * content updates while maintaining proper state management and error handling.
 * 
 * @see OpenAIService for content generation
 * @see parseResponse for response parsing
 * @see StoryScene for integration
 */