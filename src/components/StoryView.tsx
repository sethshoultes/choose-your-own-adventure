import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, User } from 'lucide-react';
import type { GameHistoryEntry } from '../types';
import { useResponseParser } from '../hooks/useResponseParser';
import { LoadingIndicator } from './LoadingIndicator';

type Props = {
  currentScene: string;
  history: GameHistoryEntry[];
  isGenerating: boolean;
  onStreamUpdate?: (content: string) => void;
};

export function StoryView({ 
  currentScene, 
  history, 
  isGenerating,
  onStreamUpdate 
}: Props) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lastHeightRef = useRef<number>(0);
  const [displayContent, setDisplayContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const contentUpdateTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Clear any existing timeout
    if (contentUpdateTimeoutRef.current) {
      clearTimeout(contentUpdateTimeoutRef.current);
    }

    // Immediately set processing state
    setIsProcessing(isGenerating);

    // Update content with a small delay to ensure state is ready
    contentUpdateTimeoutRef.current = setTimeout(() => {
      setDisplayContent(currentScene || '');
    }, 10);

    return () => {
      if (contentUpdateTimeoutRef.current) {
        clearTimeout(contentUpdateTimeoutRef.current);
      }
    };
  }, [currentScene, isGenerating]);

  // Scroll handling with proper dependency tracking
  useEffect(() => {
    if (!contentRef.current) return;

    const currentHeight = contentRef.current.offsetHeight;
    const shouldScroll = currentHeight > lastHeightRef.current || isGenerating;
    lastHeightRef.current = currentHeight;

    if (shouldScroll) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [displayContent, history.length, isGenerating]);

  // Memoize the unique paragraphs function
  const getUniqueParagraphs = useCallback((text: string) => {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .reduce((unique, paragraph) => {
        // Only add if not already present or significantly different
        if (!unique.some(p => p.toLowerCase() === paragraph.toLowerCase())) {
          unique.push(paragraph);
        }
        return unique;
      }, [] as string[]);
  }, []);

  return (
    <div className="prose prose-lg mb-8 bg-white rounded-lg shadow-sm">
      <div className="space-y-4 p-6 min-h-[200px]" ref={contentRef}>
        {history.filter(entry => entry.sceneDescription).map((entry, index) => (
          <div key={`${entry.sceneId}-${index}`} className="space-y-4">
            {/* Scene Description */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                <Bot className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1 bg-gray-50 rounded-lg p-4">
                <div className="space-y-4">
                  {entry.sceneDescription && 
                    getUniqueParagraphs(entry.sceneDescription).map((paragraph, i) => (
                      <p key={i} className="leading-relaxed">{paragraph}</p>
                    ))
                  }
                </div>
              </div>
            </div>

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
        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
            <Bot className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="flex-1 bg-gray-50 rounded-lg p-4 relative">
            {isProcessing && displayContent === '' ? (
              <div className="flex items-center justify-center h-full">
                <LoadingIndicator size="sm" message="Loading your adventure..." />
              </div>
            ) : (
            <div className="space-y-4 min-h-[100px]">
              {getUniqueParagraphs(displayContent)
                .filter(paragraph => !history.some(entry => 
                  entry.sceneDescription?.includes(paragraph)
                ))
                .map((paragraph, index) => (
                <p key={`${paragraph}-${index}`} className={`leading-relaxed ${isProcessing ? 'typing-animation' : ''}`}>
                  {paragraph}
                </p>
              ))}
              {isProcessing && (
                <div className="typing-dots mt-2">
                  <span>.</span><span>.</span><span>.</span>
                </div>
              )}
            </div>
            )}
          </div>
        </div>

        <div ref={chatEndRef} className="h-px" />
      </div>
    </div>
  );
}