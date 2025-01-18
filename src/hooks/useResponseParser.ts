import { useState, useEffect, useRef } from 'react';
import { debugManager } from '../core/debug/DebugManager';

export function useResponseParser(
  response: string,
  onUpdate?: (parsed: string) => void
) {
  const [parsedContent, setParsedContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const responseBufferRef = useRef('');
  const parsingTimeoutRef = useRef<NodeJS.Timeout>();
  const lastParsedRef = useRef('');
  const lastResponseRef = useRef(response);

  useEffect(() => {
    setIsLoading(true);
    
    // Skip if response hasn't changed and we have parsed content
    if (response === lastResponseRef.current && lastParsedRef.current) {
      setIsLoading(false);
      return;
    }
    
    lastResponseRef.current = response;

    // Clear any existing timeout
    if (parsingTimeoutRef.current) {
      clearTimeout(parsingTimeoutRef.current);
    }

    if (!response) {
      setParsedContent('');
      responseBufferRef.current = '';
      return;
    }

    // Accumulate response in buffer
    responseBufferRef.current = response;

    // Debounce parsing to prevent rapid updates
    parsingTimeoutRef.current = setTimeout(() => {
      try {
        let content = responseBufferRef.current;
        let parsed = null;
        let cleanedContent = '';

        // Try to parse as JSON
        try {
          parsed = JSON.parse(content);
          if (parsed.description) {
            cleanedContent = parsed.description.trim();
            debugManager.log('Response parsed successfully', 'success', { parsed });
          }
        } catch {
          // Try to extract content between the description field if present
          const descriptionMatch = content.match(/"description":\s*"([^"]+)"/);
          if (descriptionMatch) {
            cleanedContent = descriptionMatch[1].trim();
            debugManager.log('Extracted description from partial JSON', 'info');
          } else {
            // Clean up raw response
            cleanedContent = content
              .replace(/^\s*{[\s\S]*}\s*$/gm, '') // Remove complete JSON objects
              .replace(/"requirements":\s*{[^}]*}/g, '') // Remove requirements objects
              .replace(/"choices":\s*\[[^\]]*\]/g, '') // Remove choices arrays
              .replace(/[{}\[\]"]/g, '') // Remove JSON punctuation
              .replace(/^\s*(description|text|id):\s*/gm, '') // Remove field names
              .replace(/,\s*$/gm, '') // Remove trailing commas
              .split('\n')
              .map(line => line.trim())
              .filter(Boolean)
              .join('\n');
            
            debugManager.log('Using cleaned raw response', 'info');
          }
        }

        // Only update if we have new content
        if (cleanedContent && cleanedContent !== lastParsedRef.current) {
          lastParsedRef.current = cleanedContent;
          setParsedContent(cleanedContent);
          onUpdate?.(cleanedContent);
        }
        
        setIsLoading(false);
      } catch (error) {
        debugManager.log('Error parsing response', 'error', { error, response });
        setIsLoading(false);
      }
    }, 100); // Slightly longer delay to ensure stable parsing

    return () => {
      if (parsingTimeoutRef.current) {
        clearTimeout(parsingTimeoutRef.current);
      }
    };
  }, [response, onUpdate, parsedContent]);

  return { parsedContent, isLoading };
}