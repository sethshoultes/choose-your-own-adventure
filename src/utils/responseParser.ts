import { debugManager } from '../core/debug/DebugManager';

export function parseResponse(response: string | undefined | null): string {
  if (!response?.trim()) {
    debugManager.log('Empty response received', 'warning');
    return '';
  }
  
  let cleanedResponse = '';

  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(response);
    if (parsed.description) {
      debugManager.log('Parsed JSON response', 'success', { parsed });
      cleanedResponse = parsed.description.trim();
      return cleanedResponse;
    }
  } catch {
    // Try to extract content between the description field if present
    const descriptionMatch = response.match(/"description":\s*"((?:[^"\\]|\\.)*)"/);
    if (descriptionMatch) {
      debugManager.log('Extracted description from partial JSON', 'info');
      cleanedResponse = descriptionMatch[1]
        .replace(/\\"/g, '"')
        .replace(/\\n/g, '\n')
        .trim();
      return cleanedResponse;
    }
  }
  
  // If not JSON or no description field found, return the original text
  // but filter out any JSON-like structures
  cleanedResponse = response
    // Remove complete JSON objects
    .replace(/^\s*{[\s\S]*}\s*$/gm, '')
    // Remove requirements objects
    .replace(/"requirements":\s*{[^}]*}/g, '')
    // Remove choices arrays
    .replace(/"choices":\s*\[[^\]]*\]/g, '')
    // Remove JSON punctuation
    .replace(/[{}\[\]"]/g, '')
    // Remove field names
    .replace(/^\s*(description|text|id):\s*/gm, '')
    // Remove trailing commas
    .replace(/,\s*$/gm, '')
    // Split into lines
    .split('\n')
    // Remove empty lines and trim each line
    .map(line => line.trim())
    .filter(Boolean)
    // Join with newlines
    .join('\n');

  // Remove any duplicate paragraphs
  const uniqueParagraphs = Array.from(new Set(cleanedResponse.split('\n')));
  cleanedResponse = uniqueParagraphs.join('\n');
  
  // Remove any remaining JSON artifacts
  cleanedResponse = cleanedResponse
    .replace(/^description:\s*/gim, '')
    .replace(/^choices:\s*/gim, '')
    .replace(/^\d+\.\s*/gm, '');

  debugManager.log('Using cleaned response', 'info', { original: response, cleaned: cleanedResponse });
  return cleanedResponse.trim();
}