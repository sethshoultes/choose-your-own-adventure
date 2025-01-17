import type { Genre, Character, GameHistoryEntry } from '../../types';

export interface StoryContext {
  genre: Genre;
  character: Character;
  currentScene: string;
  history: GameHistoryEntry[];
}

export interface StoryPrompt {
  context: StoryContext;
  choice: string;
}

export interface OpenAIConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  presencePenalty: number;
  frequencyPenalty: number;
}

export interface OpenAIStreamCallbacks {
  onToken: (token: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

export interface OpenAIResponse {
  description: string;
  choices: Array<{
    id: number;
    text: string;
  }>;
}