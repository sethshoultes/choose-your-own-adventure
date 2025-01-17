import React, { useState } from 'react';
import { BookOpen, Rocket, Skull, Search, Plus } from 'lucide-react';
import type { Genre, Character } from '../types';
import { Menu } from './Menu';
import { useNavigate } from '../hooks/useNavigate';
import { LoadingIndicator } from './LoadingIndicator';

type Props = {
  genre: Genre;
  existingCharacters: Character[];
  onSelect: (character: Character) => void;
  onCreateNew: () => void;
  username?: string | null;
  onError?: (error: string) => void;
};

export function CharacterSelector({ 
  genre, 
  existingCharacters, 
  onSelect, 
  onCreateNew, 
  username,
  onError 
}: Props) {
  const { navigateToHome } = useNavigate();
  const [loadingCharacter, setLoadingCharacter] = useState<string | null>(null);

  const handleCharacterSelect = async (character: Character) => {
    try {
      setLoadingCharacter(character.id!);
      onSelect(character);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to load character');
    } finally {
      setLoadingCharacter(null);
    }
  };

  return (
    <div>
      <Menu username={username} />
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
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Choose Your Character</h2>
          <p className="text-gray-600">Select an existing character or create a new one</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <button
            onClick={onCreateNew}
            className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow border-2 border-dashed border-gray-200 hover:border-indigo-500 group"
          >
            <div className="flex items-center justify-center gap-4">
              <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-indigo-50">
                <Plus className="w-6 h-6 text-gray-400 group-hover:text-indigo-600" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-semibold mb-1">Create New Character</h3>
                <p className="text-gray-600 text-sm">Start a fresh adventure</p>
              </div>
            </div>
          </button>

          {existingCharacters.map((character) => (
            <button
              key={character.id}
              onClick={() => handleCharacterSelect(character)}
              disabled={loadingCharacter === character.id}
              className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-indigo-50">
                  {getGenreIcon(character.genre)}
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">{character.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">{character.genre}</p>
                  
                  {character.attributes && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Attributes:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {character.attributes.slice(0, 4).map((attr) => (
                          <div key={attr.name} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{attr.name}</span>
                            <span className="text-sm font-medium">{attr.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {loadingCharacter === character.id && (
                  <div className="mt-2">
                    <LoadingIndicator size="sm" message="Loading game state..." />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

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