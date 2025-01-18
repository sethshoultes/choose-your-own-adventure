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
  metadata?: {
    costPer1kTokens?: number;
    recommended?: boolean;
  };
}

export interface OpenAIModelConfig {
  id: string;
  name: string;
  description: string;
  maxTokens: number;
  temperature: number;
  presencePenalty: number;
  frequencyPenalty: number;
  costPer1kTokens: number;
  recommended: boolean;
}

export interface OpenAIStreamCallbacks {
  onResponse: (response: string) => void;
  onComplete: (choices: Array<{ id: number; text: string }>) => void;
  onError: (error: Error) => void;
}

export class StreamError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'StreamError';
  }
}

export interface OpenAIResponse {
  description: string;
  choices: Array<{
    id: number;
    text: string;
  }>;
}