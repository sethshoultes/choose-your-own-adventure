import React from 'react';
import { BookOpen, Rocket, Skull, Search } from 'lucide-react';
import type { Genre } from '../types';
import { useNavigate } from '../hooks/useNavigate';

type Props = {
  onSelect: (genre: Genre) => void;
};

const genres: { id: Genre; icon: React.ReactNode; title: string; description: string }[] = [
  {
    id: 'Fantasy',
    icon: <BookOpen className="w-8 h-8 text-emerald-600" />,
    title: 'Fantasy',
    description: 'Embark on an epic journey through magical realms',
  },
  {
    id: 'Sci-Fi',
    icon: <Rocket className="w-8 h-8 text-blue-600" />,
    title: 'Sci-Fi',
    description: 'Explore the far reaches of space and technology',
  },
  {
    id: 'Horror',
    icon: <Skull className="w-8 h-8 text-red-600" />,
    title: 'Horror',
    description: 'Face your fears in a terrifying adventure',
  },
  {
    id: 'Mystery',
    icon: <Search className="w-8 h-8 text-purple-600" />,
    title: 'Mystery',
    description: 'Solve intricate puzzles and uncover dark secrets',
  },
];

export function GenreSelector({ onSelect }: Props) {
  const { navigateToHome } = useNavigate();

  return (
    <div className="max-w-4xl mx-auto p-8">
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
      <h1 className="text-4xl font-bold text-center mb-8">Choose Your Adventure</h1>
      <p className="text-gray-600 text-center mb-12">Select a genre to begin your journey</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {genres.map((genre) => (
          <button
            key={genre.id}
            onClick={() => onSelect(genre.id)}
            className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200 text-left group"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="p-2 bg-gray-50 rounded-lg group-hover:scale-110 transition-transform duration-200">
                {genre.icon}
              </div>
              <h2 className="text-2xl font-semibold">{genre.title}</h2>
            </div>
            <p className="text-gray-600">{genre.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}