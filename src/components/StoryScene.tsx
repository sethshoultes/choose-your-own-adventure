import React, { useState } from 'react';
import type { Scene } from '../types';
import { LoadingIndicator } from './LoadingIndicator';
import { Save } from 'lucide-react';

type Props = {
  scene: Scene;
  onChoice: (choiceId: number) => void;
};

export function StoryScene({ scene, onChoice }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);

  const handleChoice = async (choiceId: number) => {
    setIsLoading(true);
    setStreamedText('');
    
    try {
      await onChoice(choiceId);
      // Clear streamed text after completion
      setStreamedText('');
    } catch (error) {
      console.error('Error handling choice:', error);
      // Show error to user
      setStreamedText('Error: Failed to generate next scene. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show save indicator when game state changes
  React.useEffect(() => {
    if (scene.description) {
      setShowSaveIndicator(true);
      const timer = setTimeout(() => setShowSaveIndicator(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [scene.description]);

  return (
    <>
      {showSaveIndicator && (
        <div className="fixed top-4 right-4 bg-green-50 text-green-700 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-out">
          <Save className="w-4 h-4" />
          <span className="text-sm">Game saved</span>
        </div>
      )}

    <div className="max-w-2xl mx-auto p-6">
      <div className="prose prose-lg mb-8">
        {scene.description.split('\n').map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
        {isLoading && streamedText && (
          <div className="mt-4 text-gray-600">
            {streamedText}
          </div>
        )}
      </div>
      
      {isLoading && !streamedText ? (
        <LoadingIndicator 
          message="Generating next scene..." 
          size="md" 
        />
      ) : (
        <div className="space-y-4">
        <h3 className="text-xl font-semibold mb-4">Your choices:</h3>
        {scene.choices.map((choice) => (
          <button
            key={choice.id}
            onClick={() => handleChoice(choice.id)}
            className="w-full p-4 text-left bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 group"
          >
            <span className="inline-flex items-center gap-3">
              <span className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors duration-200">
                {choice.id}
              </span>
              {choice.text}
            </span>
          </button>
        ))}
        </div>
      )}
    </div>
    </>
  );
}