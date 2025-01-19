import { useState, useEffect, useRef } from 'react';
import { debugManager } from '../core/debug/DebugManager';
import { parseResponse } from '../utils/responseParser';

export function useResponseParser(
  response: string,
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