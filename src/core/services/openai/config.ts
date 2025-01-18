import type { OpenAIConfig } from './types';

import { AVAILABLE_MODELS } from './models';

const DEFAULT_MODEL = 'gpt-4-turbo-preview';

export const defaultConfig: OpenAIConfig = {
  ...AVAILABLE_MODELS[DEFAULT_MODEL],
  model: DEFAULT_MODEL,
};

export const RATE_LIMIT = {
  maxRequests: 3,
  windowMs: 60000, // 1 minute
};

export const TIMEOUT_MS = 30000; // 30 seconds