import React, { useState } from 'react';
import { Bot, Send, Zap } from 'lucide-react';
import { RawResponseView } from './ResponseViews/RawResponseView';
import { FormattedResponseView } from './ResponseViews/FormattedResponseView';
import { OpenAIService } from '../../core/services/openai';
import { LoadingIndicator } from '../LoadingIndicator';
import { debugManager } from '../../core/debug/DebugManager';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  rawContent: string;
  parsedContent?: string;
  streaming?: boolean;
  choices?: Array<{ id: number; text: string; }>;
}

export function TestPanel() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const openai = React.useMemo(() => new OpenAIService(), []);

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
              // Don't update content here
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="flex justify-center mb-4 pt-4">
          <img
            src="https://adventurebuildrstorage.storage.googleapis.com/wp-content/uploads/2024/10/11185818/AdventureBuildr-Logo-e1731351627826.png"
            alt="AdventureBuildr Logo"
            className="h-12 w-auto"
          />
        </div>
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
    </div>
  );
}