import React, { useState } from 'react';
import { Bot, Send, Zap, AlertCircle, Check } from 'lucide-react';
import { OpenAIService } from '../../core/services/openai';
import { LoadingIndicator } from '../LoadingIndicator';

export function TestPanel() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamedResponse, setStreamedResponse] = useState('');
  const chatEndRef = React.useRef<HTMLDivElement>(null);
  const openai = React.useMemo(() => new OpenAIService(), []);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [chatHistory, streamedResponse]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;
    const userMessage = message.trim();
    setMessage('');
    setError(null);
    setIsLoading(true);
    setStreamedResponse('');
    // Add user message immediately
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);

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
        onToken: (token) => {
          setStreamedResponse(prev => prev + token);
        },
        onComplete: (choices) => {
          // Add the complete assistant message to chat history
          setChatHistory(prev => [
            ...prev,
            { role: 'assistant', content: streamedResponse + '\n\nAvailable choices:' + 
              choices.map(c => `\n${c.id}. ${c.text}`).join('') }
          ]);
          setStreamedResponse('');
          setIsLoading(false);
        },
        onError: (error) => {
          setError(error.message);
          setIsLoading(false);
          // Add error message to chat history
          setChatHistory(prev => [
            ...prev,
            { role: 'assistant', content: `Error: ${error.message}` }
          ]);
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setIsLoading(false);
      // Add error message to chat history
      setChatHistory(prev => [
        ...prev,
        { role: 'assistant', content: `Error: ${err instanceof Error ? err.message : 'Failed to send message'}` }
      ]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 bg-indigo-600 text-white flex items-center gap-2">
          <Zap className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Admin Test Panel</h2>
        </div>

        <div className="p-4 border-b">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Bot className="w-4 h-4" />
            <span>Test OpenAI Integration</span>
          </div>
        </div>

        <div className="h-[500px] flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.map((msg, i) => (
              <div
                key={`${msg.role}-${i}-${msg.content.substring(0, 20)}`}
                className={`flex items-start gap-3 ${
                  msg.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'
                }`}
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
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
              </div>
            ))}

            {streamedResponse && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Bot className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1 bg-gray-50 rounded-lg p-4">
                  <p className="whitespace-pre-wrap typing-animation">
                    {streamedResponse}
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div ref={chatEndRef} />
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
      </div>
    </div>
  );
}