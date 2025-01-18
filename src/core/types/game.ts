import type { Genre } from './genre';

export interface Scene {
  id: string;
  description: string;
  choices: Choice[];
}

export interface Choice {
  id: number;
  text: string;
}

export interface GameState {
  currentScene: Scene;
  history: GameHistoryEntry[];
  gameOver: boolean;
}

export interface GameHistoryEntry {
  sceneId: string;
  choice: string;
  sceneDescription?: string;
  timestamp?: string;
}