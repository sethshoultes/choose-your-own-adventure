import React, { useState, useEffect } from 'react';
import type { Choice } from '../types';
import { Send } from 'lucide-react';

interface Props {
  response: string;
  choices?: Choice[];
  onChoice?: (choiceId: number) => void;
  isLoading?: boolean;
}

export function ResponseView({ response, choices, onChoice, isLoading }: Props) {
  const [parsedContent, setParsedContent] = useState('');

  useEffect(() => {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(response);
      if (parsed.description) {
        setParsedContent(parsed.description);
      } else {
        setParsedContent(response);
      }
    } catch {
      // If not JSON, use as is
      setParsedContent(response);
    }
  }, [response]);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      {/* Story Content */}
      <div className="prose prose-lg bg-white rounded-lg shadow-sm p-6">
        {parsedContent.split('\n').map((paragraph, index) => (
          <p key={index} className="leading-relaxed">{paragraph}</p>
        ))}
      </div>

      {/* Choices */}
      {choices && choices.length > 0 && (
        <div className="space-y-4 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Send className="w-5 h-5 text-indigo-600" />
            Your choices:
          </h3>
          {choices.map((choice) => (
            <button
              key={choice.id}
              onClick={() => onChoice?.(choice.id)}
              disabled={isLoading}
              className="w-full p-4 text-left bg-gray-50 rounded-lg hover:bg-indigo-50 transition-colors duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="inline-flex items-center gap-3">
                <span className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-gray-600 group-hover:text-indigo-600 transition-colors duration-200">
                  {choice.id}
                </span>
                {choice.text}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}