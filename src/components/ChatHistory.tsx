import React from 'react';
import { MessageSquare, User, Bot } from 'lucide-react';
import type { GameHistoryEntry } from '../types';

type Props = {
  history: GameHistoryEntry[];
  onClose: () => void;
  visible: boolean;
};

export function ChatHistory({ history, onClose, visible }: Props) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-2xl h-[80vh] rounded-lg shadow-xl flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold">Story History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <span className="sr-only">Close</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {history.map((entry, index) => (
            <div key={`${entry.sceneId}-${index}`} className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Bot className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1 bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{entry.sceneDescription}</p>
                </div>
              </div>
              
              {entry.choice && (
                <div className="flex items-start gap-3 pl-8">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 bg-green-50 rounded-lg p-4">
                    <p className="text-gray-700">{entry.choice}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t bg-gray-50">
          <p className="text-sm text-gray-600 text-center">
            Your adventure continues...
          </p>
        </div>
      </div>
    </div>
  );
}