/**
 * FormattedResponseView Component
 * 
 * This component provides a formatted display of OpenAI API responses in the AdventureBuildr admin interface.
 * It handles both user messages and assistant responses, providing a chat-like interface with proper
 * formatting, streaming indicators, and choice displays. The component works alongside RawResponseView
 * to provide comprehensive response inspection capabilities.
 * 
 * Key Features:
 * - Chat-style message display
 * - Streaming response indicators
 * - Choice option formatting
 * - Error message handling
 * - Auto-scrolling
 * 
 * Data Flow:
 * 1. Message reception
 * 2. Role-based formatting
 * 3. Streaming state handling
 * 4. Choice display
 * 5. Error presentation
 * 
 * @see TestPanel for admin interface integration
 * @see OpenAIService for response generation
 */

import React from 'react';
import { Bot, AlertCircle } from 'lucide-react';

interface FormattedResponseViewProps {
  /** Array of chat messages to display */
  messages: Array<{
    /** Message sender role */
    role: 'user' | 'assistant';
    /** Message content */
    content: string;
    /** Optional parsed content for display */
    parsedContent?: string;
    /** Indicates if message is currently streaming */
    streaming?: boolean;
    /** Available choices for the message */
    choices?: Array<{ id: number; text: string; }>;
  }>;
  /** Optional error message */
  error: string | null;
}

export function FormattedResponseView({ messages, error }: FormattedResponseViewProps) {
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="overflow-y-auto relative">
      <div className="sticky top-0 bg-white p-4 border-b z-10">
        <div className="text-sm font-medium text-gray-500">Formatted Response</div>
      </div>

      <div className="p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={`${msg.role}-${i}`}
            className={`flex items-start gap-3 transition-opacity duration-200 ${
              msg.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'
            } ${msg.streaming ? 'opacity-70' : 'opacity-100'}`}
          >
            <div
              className={`p-2 rounded-lg ${
                msg.role === 'assistant'
                  ? 'bg-indigo-100'
                  : 'bg-green-100'
              }`}
            >
              {msg.role === 'assistant' ? (
                <Bot className="w-5 h-5 text-indigo-600" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center text-xs">
                  U
                </div>
              )}
            </div>
            <div
              className={`flex-1 p-4 rounded-lg ${
                msg.role === 'assistant'
                  ? 'bg-gray-50'
                  : 'bg-green-50'
              }`}
            >
              <div className="space-y-4">
                {msg.role === 'assistant' ? (
                  <>
                    <div className={`whitespace-pre-wrap break-words ${
                      msg.streaming ? 'typing-animation' : ''
                    }`}>
                      {msg.parsedContent || (
                        msg.streaming ? 'Generating response...' : msg.content
                      )}
                    </div>
                    {!msg.streaming && msg.choices && msg.choices.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="font-medium text-gray-700 mb-2">Available choices:</p>
                        <div className="space-y-2">
                          {msg.choices.map((choice) => (
                            <div
                              key={choice.id}
                              className="flex items-center gap-2 text-gray-600"
                            >
                              <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full text-sm">
                                {choice.id}
                              </span>
                              <span className="text-sm">{choice.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="whitespace-pre-wrap break-words">
                    {msg.content}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div ref={chatEndRef} className="h-4" />
      </div>
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
 *      const [messages, setMessages] = useState<Message[]>([]);
 *      const [error, setError] = useState<string | null>(null);
 *      
 *      return (
 *        <div className="grid grid-rows-2">
 *          <RawResponseView content={rawContent} />
 *          <FormattedResponseView 
 *            messages={messages}
 *            error={error}
 *          />
 *        </div>
 *      );
 *    }
 *    ```
 * 
 * 2. OpenAI Testing
 *    ```typescript
 *    // In OpenAITester component
 *    function OpenAITester() {
 *      const handleMessage = (role: 'user' | 'assistant', content: string) => {
 *        setMessages(prev => [...prev, { role, content }]);
 *      };
 *      
 *      return (
 *        <div>
 *          <TestControls onMessage={handleMessage} />
 *          <FormattedResponseView 
 *            messages={messages}
 *            error={error}
 *          />
 *        </div>
 *      );
 *    }
 *    ```
 * 
 * 3. Streaming Responses
 *    ```typescript
 *    // In streaming handler
 *    const handleStream = async () => {
 *      setMessages(prev => [
 *        ...prev,
 *        { 
 *          role: 'assistant',
 *          content: '',
 *          streaming: true
 *        }
 *      ]);
 *      
 *      try {
 *        await streamResponse({
 *          onToken: (token) => {
 *            setMessages(prev => [
 *              ...prev.slice(0, -1),
 *              {
 *                ...prev[prev.length - 1],
 *                content: prev[prev.length - 1].content + token
 *              }
 *            ]);
 *          }
 *        });
 *      } catch (error) {
 *        setError(error.message);
 *      }
 *    };
 *    ```
 * 
 * Usage Examples:
 * ```typescript
 * // Basic usage
 * <FormattedResponseView
 *   messages={[
 *     { role: 'user', content: 'Hello' },
 *     { role: 'assistant', content: 'Hi there!' }
 *   ]}
 *   error={null}
 * />
 * 
 * // With streaming
 * <FormattedResponseView
 *   messages={[
 *     {
 *       role: 'assistant',
 *       content: 'Typing...',
 *       streaming: true
 *     }
 *   ]}
 *   error={null}
 * />
 * 
 * // With choices
 * <FormattedResponseView
 *   messages={[
 *     {
 *       role: 'assistant',
 *       content: 'Choose your path:',
 *       choices: [
 *         { id: 1, text: 'Go left' },
 *         { id: 2, text: 'Go right' }
 *       ]
 *     }
 *   ]}
 *   error={null}
 * />
 * ```
 * 
 * Error Handling:
 * ```typescript
 * try {
 *   await generateResponse();
 * } catch (error) {
 *   setMessages(prev => [
 *     ...prev,
 *     {
 *       role: 'assistant',
 *       content: 'Error: ' + error.message
 *     }
 *   ]);
 * }
 * ```
 * 
 * Best Practices:
 * 1. Handle streaming states properly
 * 2. Provide clear error feedback
 * 3. Maintain scroll position
 * 4. Format messages consistently
 * 5. Support choice display
 * 
 * The component works alongside RawResponseView to provide comprehensive
 * response inspection capabilities in the admin interface.
 * 
 * @see RawResponseView for unformatted display
 * @see TestPanel for admin interface
 * @see OpenAIService for response generation
 */