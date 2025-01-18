import type { OpenAIModelConfig } from './types';

export const AVAILABLE_MODELS: Record<string, OpenAIModelConfig> = {
  'gpt-4-turbo-preview': {
    id: 'gpt-4-turbo-preview',
    name: 'GPT-4 Turbo',
    description: 'Most capable model, best for creative storytelling and complex narratives',
    maxTokens: 4096,
    temperature: 0.8,
    presencePenalty: 0.6,
    frequencyPenalty: 0.3,
    costPer1kTokens: 0.01,
    recommended: true,
  },
  'gpt-4': {
    id: 'gpt-4',
    name: 'GPT-4',
    description: 'High-quality model with consistent narrative generation',
    maxTokens: 8192,
    temperature: 0.7,
    presencePenalty: 0.5,
    frequencyPenalty: 0.3,
    costPer1kTokens: 0.03,
    recommended: true,
  },
  'gpt-3.5-turbo': {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Fast and cost-effective for simpler narratives',
    maxTokens: 4096,
    temperature: 0.7,
    presencePenalty: 0.4,
    frequencyPenalty: 0.2,
    costPer1kTokens: 0.001,
    recommended: false,
  },
};