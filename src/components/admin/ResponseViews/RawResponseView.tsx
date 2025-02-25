/**
 * RawResponseView Component
 * 
 * This component provides a raw view of OpenAI API responses in the AdventureBuildr admin interface.
 * It displays unformatted response content for debugging and testing purposes, allowing administrators
 * to inspect the exact data received from the API before any parsing or formatting is applied.
 * 
 * Key Features:
 * - Raw response display
 * - Sticky header
 * - Scrollable content
 * - Pre-formatted text
 * - Loading state handling
 * 
 * Data Flow:
 * 1. Raw response reception
 * 2. Content display
 * 3. Scroll management
 * 4. Loading state
 * 
 * @see TestPanel for admin interface integration
 * @see OpenAIService for response generation
 */

import React from 'react';

interface RawResponseViewProps {
  /** Raw response content to display */
  content: string;
}

export function RawResponseView({ content }: RawResponseViewProps) {
  return (
    <div className="overflow-y-auto p-4">
      <div className="sticky top-0 bg-white pb-2 mb-2 border-b z-10">
        <div className="text-sm font-medium text-gray-500">Raw Response</div>
      </div>
      <pre className="whitespace-pre-wrap break-words">
        {content || '// Waiting for response...'}
      </pre>
    </div>
  );
}

/**
 * Integration Points:
 * 
 * 1. TestPanel Component
 *    ```typescript
 *    // In TestPanel component
 *    function TestPanel() {
 *      const [rawResponse, setRawResponse] = useState('');
 *      
 *      return (
 *        <div className="grid grid-rows-2">
 *          <RawResponseView content={rawResponse} />
 *          <FormattedResponseView content={rawResponse} />
 *        </div>
 *      );
 *    }
 *    ```
 * 
 * 2. OpenAI Testing
 *    ```typescript
 *    // In OpenAITester component
 *    function OpenAITester() {
 *      const handleResponse = (response: string) => {
 *        setRawResponse(response);
 *      };
 *      
 *      return (
 *        <div>
 *          <TestControls onResponse={handleResponse} />
 *          <RawResponseView content={response} />
 *        </div>
 *      );
 *    }
 *    ```
 * 
 * 3. Response Debugging
 *    ```typescript
 *    // In debugging tools
 *    function ResponseDebugger() {
 *      return (
 *        <div className="debug-panel">
 *          <h3>Raw Response</h3>
 *          <RawResponseView content={rawResponse} />
 *          <h3>Parsed Response</h3>
 *          <ParsedResponseView content={parsedResponse} />
 *        </div>
 *      );
 *    }
 *    ```
 * 
 * Usage Examples:
 * ```typescript
 * // Basic usage
 * <RawResponseView content={apiResponse} />
 * 
 * // With loading state
 * <RawResponseView 
 *   content={isLoading ? 'Loading...' : response} 
 * />
 * 
 * // In split view
 * <div className="grid grid-cols-2 gap-4">
 *   <RawResponseView content={rawResponse} />
 *   <FormattedView content={formattedResponse} />
 * </div>
 * ```
 * 
 * Error Handling:
 * ```typescript
 * // In parent component
 * try {
 *   const response = await makeRequest();
 *   setContent(response);
 * } catch (error) {
 *   setContent(`Error: ${error.message}`);
 * }
 * ```
 * 
 * Best Practices:
 * 1. Always handle empty states
 * 2. Preserve whitespace formatting
 * 3. Enable text wrapping
 * 4. Maintain scrollability
 * 5. Show loading states
 * 
 * The component works alongside the FormattedResponseView to provide
 * comprehensive response inspection capabilities in the admin interface.
 * 
 * @see FormattedResponseView for parsed display
 * @see TestPanel for admin interface
 * @see OpenAIService for response generation
 */