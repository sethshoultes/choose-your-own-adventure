import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BookOpen, Rocket, Skull, Search } from 'lucide-react';
import type { Character } from '../types';
import { useNavigate } from '../hooks/useNavigate';
import { getInitialScene, getInitialChoices } from '../core/engine/sceneManager';
import { LoadingIndicator } from './LoadingIndicator';

const getGenreIcon = (genre: string) => {
  switch (genre) {
    case 'Fantasy':
      return <BookOpen className="w-6 h-6 text-emerald-600" />;
    case 'Sci-Fi':
      return <Rocket className="w-6 h-6 text-blue-600" />;
    case 'Horror':
      return <Skull className="w-6 h-6 text-red-600" />;
    case 'Mystery':
      return <Search className="w-6 h-6 text-purple-600" />;
    default:
      return null;
  }
};

export function CharacterList() {
  const { navigateToHome } = useNavigate();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCharacters(data || []);
    } catch (err) {
      console.error('Error fetching characters:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <LoadingIndicator 
        message="Loading your characters..." 
        size="md" 
      />
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error loading characters: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-center mb-16">
        <button
          onClick={navigateToHome}
          className="hover:opacity-90 transition-opacity"
        >
          <img
            src="https://adventurebuildrstorage.storage.googleapis.com/wp-content/uploads/2024/10/11185818/AdventureBuildr-Logo-e1731351627826.png"
            alt="AdventureBuildr Logo"
            className="w-auto"
          />
        </button>
      </div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Characters</h1>
        <button
          onClick={navigateToHome}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Create New Character
        </button>
      </div>

      {characters.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-medium text-gray-600 mb-4">No Characters Yet</h3>
          <p className="text-gray-500 mb-6">Create your first character to begin your adventure!</p>
          <button
            onClick={navigateToHome}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Create Character
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {characters.map((character) => (
            <div
              key={character.id}
              className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  {getGenreIcon(character.genre)}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{character.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">{character.genre}</p>
                  
                  {character.attributes && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Attributes:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {character.attributes.map((attr) => (
                          <div key={attr.name} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{attr.name}</span>
                            <span className="text-sm font-medium">{attr.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t">
                    <button
                      onClick={() => {
                        const gameState = {
                          currentScene: {
                            id: 'scene-1',
                            description: getInitialScene(character.genre),
                            choices: getInitialChoices(character.genre),
                          },
                          history: [],
                          gameOver: false,
                        };
                        window.dispatchEvent(new CustomEvent('continueAdventure', { 
                          detail: { character, gameState } 
                        }));
                      }}
                      className="w-full py-2 text-center text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                    >
                      Continue Adventure
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}