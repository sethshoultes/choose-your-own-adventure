import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Genre, Character, CharacterAttribute, CharacterEquipment } from '../types';
import { Shield, Sword, Wrench, Zap } from 'lucide-react';
import { useNavigate } from '../hooks/useNavigate';

type Props = {
  genre: Genre;
  onComplete: (character: Character) => void;
};

const getInitialAttributes = (genre: Genre): CharacterAttribute[] => {
  const baseAttributes = [
    { name: 'Intelligence', value: 5, description: 'Mental acuity and problem-solving ability' },
    { name: 'Strength', value: 5, description: 'Physical power and carrying capacity' },
    { name: 'Agility', value: 5, description: 'Speed and coordination' },
  ];

  switch (genre) {
    case 'Fantasy':
      return [
        ...baseAttributes,
        { name: 'Magic', value: 5, description: 'Magical power and spell mastery' },
        { name: 'Spirit', value: 5, description: 'Connection to mystical forces' },
      ];
    case 'Sci-Fi':
      return [
        ...baseAttributes,
        { name: 'Tech', value: 5, description: 'Understanding of advanced technology' },
        { name: 'Hacking', value: 5, description: 'Ability to manipulate computer systems' },
      ];
    case 'Horror':
      return [
        ...baseAttributes,
        { name: 'Sanity', value: 5, description: 'Mental fortitude against the unknown' },
        { name: 'Perception', value: 5, description: 'Awareness of surroundings and hidden details' },
      ];
    case 'Mystery':
      return [
        ...baseAttributes,
        { name: 'Deduction', value: 5, description: 'Ability to solve puzzles and mysteries' },
        { name: 'Charisma', value: 5, description: 'Skill in social interactions' },
      ];
  }
};

const getInitialEquipment = (genre: Genre): CharacterEquipment[] => {
  switch (genre) {
    case 'Fantasy':
      return [
        { name: 'Iron Sword', type: 'weapon', description: 'A reliable blade for combat' },
        { name: 'Leather Armor', type: 'armor', description: 'Basic protection against attacks' },
        { name: 'Magic Scroll', type: 'special', description: 'Contains a basic spell' },
      ];
    case 'Sci-Fi':
      return [
        { name: 'Laser Pistol', type: 'weapon', description: 'Standard-issue energy weapon' },
        { name: 'Combat Suit', type: 'armor', description: 'Powered armor with life support' },
        { name: 'Multi-Tool', type: 'tool', description: 'Universal tech repair device' },
      ];
    case 'Horror':
      return [
        { name: 'Flashlight', type: 'tool', description: 'Battery-powered light source' },
        { name: 'First Aid Kit', type: 'special', description: 'Basic medical supplies' },
        { name: 'Camera', type: 'tool', description: 'For documenting evidence' },
      ];
    case 'Mystery':
      return [
        { name: 'Notepad', type: 'tool', description: 'For recording clues and observations' },
        { name: 'Lockpick Set', type: 'tool', description: 'Tools for accessing locked areas' },
        { name: 'Concealed Pistol', type: 'weapon', description: 'Last resort protection' },
      ];
  }
};

const getEquipmentIcon = (type: CharacterEquipment['type']) => {
  switch (type) {
    case 'weapon':
      return <Sword className="w-5 h-5" />;
    case 'armor':
      return <Shield className="w-5 h-5" />;
    case 'tool':
      return <Wrench className="w-5 h-5" />;
    case 'special':
      return <Zap className="w-5 h-5" />;
  }
};

export function CharacterCreation({ genre, onComplete }: Props) {
  const { navigateToHome } = useNavigate();
  const [step, setStep] = useState(1);
  const [character, setCharacter] = useState<Character>({
    name: '',
    genre,
    attributes: getInitialAttributes(genre),
    equipment: getInitialEquipment(genre),
    backstory: '',
  });

  const [remainingPoints, setRemainingPoints] = useState(10);

  const handleAttributeChange = (index: number, value: number) => {
    const oldValue = character.attributes[index].value;
    const pointDiff = value - oldValue;
    
    if (remainingPoints - pointDiff < 0 || value < 1 || value > 10) return;
    
    const newAttributes = [...character.attributes];
    newAttributes[index] = { ...newAttributes[index], value };
    setCharacter({ ...character, attributes: newAttributes });
    setRemainingPoints(remainingPoints - pointDiff);
  };

  const handleSubmit = async () => {
    try {
      debugManager.log('Creating character', 'info', { character });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No user found');
      }

      // Create initial scene and choices
      const initialScene = getInitialScene(genre);
      const initialChoices = getInitialChoices(genre);
      
      debugManager.log('Initial scene prepared', 'info', { 
        scene: initialScene,
        choices: initialChoices 
      });

      const { data, error } = await supabase
        .from('characters')
        .insert({
          user_id: user.id,
          name: character.name,
          genre,
          attributes: character.attributes,
          equipment: character.equipment,
          backstory: character.backstory,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating character:', error);
        throw error;
      }
      
      const newCharacter = { ...character, id: data.id };
      
      // Initialize game state with proper scene
      const initialGameState = {
        currentScene: {
          id: 'scene-1',
          description: initialScene,
          choices: initialChoices,
        },
        history: [],
        gameOver: false
      };

      debugManager.log('Character created successfully', 'success', { 
        character: newCharacter,
        gameState: initialGameState 
      });

      onComplete(newCharacter, initialGameState);
    } catch (error) {
      console.error('Error creating character:', error);
      debugManager.log('Error creating character', 'error', { error });
      alert(error.message || 'Failed to create character. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-xl">
      <div className="h-16" /> {/* Extra space at top */}
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
      <div className="mb-8">
        <div className="flex justify-between mb-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-1/3 h-2 rounded-full mx-1 ${
                s === step ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">{genre} Character Basics</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Character Name
            </label>
            <input
              type="text"
              value={character.name}
              onChange={(e) => setCharacter({ ...character, name: e.target.value })}
              className="w-full p-2 border rounded-md"
              placeholder="Enter character name"
            />
          </div>
          <button
            onClick={() => setStep(2)}
            disabled={!character.name}
            className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Attributes</h2>
            <span className="text-sm text-gray-600">
              Points remaining: {remainingPoints}
            </span>
          </div>
          <div className="space-y-4">
            {character.attributes.map((attr, index) => (
              <div key={attr.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-700">
                    {attr.name}
                    <span className="block text-xs text-gray-500">
                      {attr.description}
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAttributeChange(index, attr.value - 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-full border hover:bg-gray-100"
                      disabled={attr.value <= 1}
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{attr.value}</span>
                    <button
                      onClick={() => handleAttributeChange(index, attr.value + 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-full border hover:bg-gray-100"
                      disabled={attr.value >= 10 || remainingPoints <= 0}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setStep(3)}
            className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Next
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Equipment & Background</h2>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Starting Equipment</h3>
            <div className="grid grid-cols-1 gap-4">
              {character.equipment.map((item) => (
                <div
                  key={item.name}
                  className="p-4 border rounded-lg flex items-start gap-3"
                >
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {getEquipmentIcon(item.type)}
                  </div>
                  <div>
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Character Backstory
            </label>
            <textarea
              value={character.backstory}
              onChange={(e) => setCharacter({ ...character, backstory: e.target.value })}
              className="w-full p-2 border rounded-md h-32"
              placeholder="Write a brief backstory for your character..."
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!character.backstory}
            className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            Create Character
          </button>
        </div>
      )}
    </div>
  );
}