import React, { useState, useEffect, useRef } from 'react';
import { Bot, User } from 'lucide-react';
import type { GameHistoryEntry } from '../types';
import { parseResponse } from '../utils/responseParser';

type Props = {
  currentScene: string;
  streamedContent: string;
  history: GameHistoryEntry[];
  isGenerating: boolean;
};

export function StoryView({ currentScene, streamedContent, history, isGenerating }: Props) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [displayContent, setDisplayContent] = useState('');
  const [processedHistory, setProcessedHistory] = useState<GameHistoryEntry[]>([]);

  useEffect(() => {
    if (isGenerating) {
      try {
        const parsed = parseResponse(streamedContent);
        setDisplayContent(parsed);
      } catch (error) {
        console.error('Error parsing streamed content:', error);
        setDisplayContent(streamedContent);
      }
    } else {
      try {
        const parsed = parseResponse(currentScene);
        setDisplayContent(parsed);
      } catch (error) {
        console.error('Error parsing current scene:', error);
        setDisplayContent(currentScene);
      }
    }
  }, [streamedContent, currentScene, isGenerating]);

  // Process history to remove duplicates
  useEffect(() => {
    const uniqueHistory = history.reduce((acc, entry) => {
      const isDuplicate = acc.some(
        e => e.sceneId === entry.sceneId && e.choice === entry.choice
      );
      return isDuplicate ? acc : [...acc, entry];
    }, [] as GameHistoryEntry[]);
    
    setProcessedHistory(uniqueHistory);
  }, [history]);

  // Auto-scroll to bottom when content changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayContent]);

  return (
    <div className="prose prose-lg mb-8 bg-white rounded-lg shadow-sm">
      <div className="space-y-4 p-6 min-h-[200px]">
        {/* History */}
        {processedHistory.map((entry, index) => (
          <div key={`${entry.sceneId}-${index}`} className="space-y-4">
            {/* Scene Description */}
            {entry.sceneDescription && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                  <Bot className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1 bg-gray-50 rounded-lg p-4">
                  {entry.sceneDescription.split('\n').map((paragraph, i) => (
                    <p key={i} className="leading-relaxed">{paragraph}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Player Choice */}
            {entry.choice && (
              <div className="flex items-start gap-3 pl-8">
                <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                  <User className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 bg-green-50 rounded-lg p-4">
                  <p className="text-gray-700">{entry.choice}</p>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Current Scene */}
        {displayContent && (
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
              <Bot className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1 bg-gray-50 rounded-lg p-6 relative min-h-[100px]">
              <div className={isGenerating ? 'typing-animation' : ''}>
                {displayContent.split('\n').map((paragraph, index) => (
                  <p key={index} className="leading-relaxed mb-4 last:mb-0">{paragraph}</p>
                ))}
              </div>
              {isGenerating && (
                <div className="typing-dots absolute -bottom-6 left-4">
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>
    </div>
  );
}