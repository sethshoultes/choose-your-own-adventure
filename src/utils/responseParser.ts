import { debugManager } from '../core/debug/DebugManager';

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