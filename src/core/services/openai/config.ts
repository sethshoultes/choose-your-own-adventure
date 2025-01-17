import type { OpenAIConfig } from './types';

export const defaultConfig: OpenAIConfig = {
  model: 'gpt-4',
  temperature: 0.8,
  maxTokens: 1000,
  presencePenalty: 0.6,
  frequencyPenalty: 0.3,
};

export const RATE_LIMIT = {
  maxRequests: 3,
  windowMs: 60000, // 1 minute
};

export const TIMEOUT_MS = 30000; // 30 seconds