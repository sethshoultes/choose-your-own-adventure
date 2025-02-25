/**
 * OpenAI Testing Widget
 * 
 * This component provides an administrative interface for testing OpenAI integration in the AdventureBuildr
 * game engine. It enables real-time testing of content generation, response streaming, and formatting
 * while providing both raw and formatted views of the responses.
 * 
 * Key Features:
 * - Real-time response streaming
 * - Raw response viewing
 * - Formatted output display
 * - Error handling
 * - Debug logging
 * 
 * Data Flow:
 * 1. Test input reception
 * 2. OpenAI request processing
 * 3. Response streaming
 * 4. Content parsing
 * 5. Display updates
 * 
 * @see OpenAIService for content generation
 * @see ResponseParser for content formatting
 */

import React, { useState } from 'react';
import { Bot, Send } from 'lucide-react';
import { RawResponseView } from '../ResponseViews/RawResponseView';
import { FormattedResponseView } from '../ResponseViews/FormattedResponseView';
import { OpenAIService } from '../../../core/services/openai';
import { LoadingIndicator } from '../../LoadingIndicator';
import { debugManager } from '../../../core/debug/DebugManager';

interface ChatMessage {
  /** Message role (user/assistant) */
  role: 'user' | 'assistant';
  /** Message content */
  content: string;
  /** Raw response content */
  rawContent: string;
  /** Parsed content for display */
  parsedContent?: string;
  /** Streaming status */
  streaming?: boolean;
  /** Available choices */
  choices?: Array<{ id: number; text: string; }>;
}

export function OpenAITester() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const openai = React.useMemo(() => new OpenAIService(), []);

  /**
   * Handles test message submission
   * Processes OpenAI request and manages response streaming
   * 
   * @param e Form submit event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;
    
    const userMessage = message.trim();
    setMessage('');
    setError(null);
    setIsLoading(true);
    
    debugManager.log('Sending test message', 'info', { message: userMessage });
    
    // Add user message
    setChatHistory(prev => [
      ...prev,
      { 
        role: 'user', 
        content: userMessage,
        rawContent: userMessage 
      }
    ]);

    // Initialize assistant message
    setChatHistory(prev => [
      ...prev,
      {
        role: 'assistant', 
        content: '',
        rawContent: '',
        streaming: true 
      }
    ]);

    try {
      await openai.generateNextScene({
        context: {
          genre: 'Test',
          character: {
            name: 'Test User',
            genre: 'Test',
            attributes: [],
            equipment: [],
            backstory: ''
          },
          currentScene: userMessage,
          history: []
        },
        choice: 'test'
      }, {
        onToken: (token: string) => {
          setChatHistory(prev => {
            const lastMessage = prev[prev.length - 1];
            const newRawContent = lastMessage.rawContent + token;
            let newContent = lastMessage.content;
            let newParsedContent = null;
            
            try {
              const parsed = JSON.parse(newRawContent);
              if (parsed.description) {
                newParsedContent = parsed.description;
              }
            } catch {
              // Keep existing parsed content if available
            }
            
            return [
              ...prev.slice(0, -1),
              { 
                ...lastMessage, 
                content: newRawContent,
                rawContent: newRawContent,
                parsedContent: newParsedContent
              }
            ];
          });
        },
        onComplete: (choices) => {
          debugManager.log('Response complete', 'success', { choices });
          
          setChatHistory(prev => [
            ...prev.slice(0, -1),
            {
              ...prev[prev.length - 1],
              streaming: false,
              choices
            }
          ]);
          setIsLoading(false);
        },
        onError: (error) => {
          debugManager.log('Error in response', 'error', { error });
          setError(error.message);
          setIsLoading(false);
          
          setChatHistory(prev => [
            ...prev.slice(0, -1),
            {
              ...prev[prev.length - 1],
              streaming: false,
              content: `Error: ${error.message}`,
              rawContent: `Error: ${error.message}`
            }
          ]);
        }
      });
    } catch (err) {
      debugManager.log('Error in test panel', 'error', { error: err });
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      setIsLoading(false);
      
      setChatHistory(prev => [
        ...prev.slice(0, -1),
        {
          ...prev[prev.length - 1],
          streaming: false,
          content: `Error: ${errorMessage}`,
          rawContent: `Error: ${errorMessage}`
        }
      ]);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Bot className="w-4 h-4" />
          <span>Test OpenAI Integration</span>
        </div>
      </div>

      <div className="h-[700px] grid grid-rows-2 divide-y">
        <RawResponseView 
          content={chatHistory.length > 0 ? chatHistory[chatHistory.length - 1].rawContent : ''}
        />
        <FormattedResponseView 
          messages={chatHistory}
          error={error}
        />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t bg-gray-50">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Test the OpenAI integration..."
            className="flex-1 p-2 border rounded-lg"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !message.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <LoadingIndicator size="sm" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            Send
          </button>
        </div>
      </form>
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
 *      return (
 *        <div>
 *          <h2>Admin Test Panel</h2>
 *          <OpenAITester />
 *        </div>
 *      );
 *    }
 *    ```
 * 
 * 2. OpenAI Service
 *    ```typescript
 *    // In OpenAIService
 *    const openai = new OpenAIService();
 *    await openai.generateNextScene(prompt, {
 *      onToken: handleToken,
 *      onComplete: handleComplete,
 *      onError: handleError
 *    });
 *    ```
 * 
 * 3. Response Views
 *    ```typescript
 *    // Raw response display
 *    <RawResponseView content={rawContent} />
 *    
 *    // Formatted response display
 *    <FormattedResponseView
 *      messages={messages}
 *      error={error}
 *    />
 *    ```
 * 
 * Usage Examples:
 * ```typescript
 * // Basic test panel
 * function AdminDashboard() {
 *   return (
 *     <div>
 *       <h1>Admin Tools</h1>
 *       <OpenAITester />
 *     </div>
 *   );
 * }
 * 
 * // With access control
 * function ProtectedTester() {
 *   const { isAdmin } = useAdminStatus();
 *   
 *   if (!isAdmin) return <AccessDenied />;
 *   return <OpenAITester />;
 * }
 * ```
 * 
 * Error Handling:
 * ```typescript
 * try {
 *   await handleTest();
 * } catch (error) {
 *   debugManager.log('Test failed', 'error', { error });
 *   setError('Test failed: ' + error.message);
 * }
 * ```
 * 
 * Best Practices:
 * 1. Always handle streaming errors
 * 2. Provide clear feedback
 * 3. Log test results
 * 4. Clean up resources
 * 5. Validate responses
 * 
 * The widget provides essential testing capabilities for administrators
 * while maintaining proper error handling and user feedback.
 * 
 * @see OpenAIService for content generation
 * @see ResponseParser for content formatting
 * @see TestPanel for admin interface
 */