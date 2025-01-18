import React from 'react';
import { Bot, AlertCircle } from 'lucide-react';

interface FormattedResponseViewProps {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    parsedContent?: string;
    streaming?: boolean;
    choices?: Array<{ id: number; text: string; }>;
  }>;
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