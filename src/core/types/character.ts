import type { Genre } from './genre';

export interface CharacterAttribute {
  name: string;
  value: number;
  description: string;
}

export interface CharacterEquipment {
  name: string;
  type: 'weapon' | 'armor' | 'tool' | 'special';
  description: string;
}

export interface Character {
  id?: string;
  name: string;
  genre: Genre;
  attributes: CharacterAttribute[];
  equipment: CharacterEquipment[];
  backstory: string;
  experience_points?: number;
  level?: number;
  attribute_points?: number;
}