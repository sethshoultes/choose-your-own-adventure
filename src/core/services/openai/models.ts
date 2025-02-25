/**
 * OpenAI Models Configuration Module
 * 
 * This module defines the available OpenAI models and their configurations for the AdventureBuildr
 * game engine. It provides a centralized registry of model specifications, including parameters,
 * costs, and recommendations for different use cases.
 * 
 * Key Features:
 * - Model configuration registry
 * - Performance parameters
 * - Cost tracking
 * - Usage recommendations
 * - Type-safe model definitions
 * 
 * The configurations are used by the OpenAIService to ensure appropriate model selection
 * and parameter settings for different content generation scenarios.
 * 
 * @module openai/models
 */

import type { OpenAIModelConfig } from './types';

/**
 * Registry of available OpenAI models with their configurations
 * Each model includes parameters optimized for story generation
 */
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

/**
 * Integration Points:
 * 
 * 1. OpenAIService
 *    ```typescript
 *    // In OpenAIService
 *    constructor(config: Partial<OpenAIConfig> = {}) {
 *      const modelConfig = AVAILABLE_MODELS[config.model || 'gpt-4-turbo-preview'];
 *      this.config = {
 *        ...modelConfig,
 *        ...config
 *      };
 *    }
 *    ```
 * 
 * 2. Admin Test Panel
 *    ```typescript
 *    // In TestPanel component
 *    function ModelSelector() {
 *      return (
 *        <select>
 *          {Object.values(AVAILABLE_MODELS).map(model => (
 *            <option 
 *              key={model.id}
 *              value={model.id}
 *            >
 *              {model.name} 
 *              {model.recommended && ' (Recommended)'}
 *            </option>
 *          ))}
 *        </select>
 *      );
 *    }
 *    ```
 * 
 * 3. Cost Tracking
 *    ```typescript
 *    // In billing service
 *    function calculateCost(model: string, tokens: number): number {
 *      const { costPer1kTokens } = AVAILABLE_MODELS[model];
 *      return (tokens / 1000) * costPer1kTokens;
 *    }
 *    ```
 * 
 * Usage Examples:
 * ```typescript
 * // Get recommended model
 * const recommendedModel = Object.values(AVAILABLE_MODELS)
 *   .find(model => model.recommended);
 * 
 * // Calculate cost estimate
 * const estimateCost = (model: string, wordCount: number) => {
 *   const tokenEstimate = wordCount * 1.3; // Rough token estimate
 *   const { costPer1kTokens } = AVAILABLE_MODELS[model];
 *   return (tokenEstimate / 1000) * costPer1kTokens;
 * };
 * 
 * // Get model by context length
 * const getLongContextModel = () => {
 *   return Object.values(AVAILABLE_MODELS)
 *     .reduce((a, b) => a.maxTokens > b.maxTokens ? a : b);
 * };
 * ```
 * 
 * Model Selection Guidelines:
 * 1. GPT-4 Turbo (Recommended)
 *    - Best for complex narratives
 *    - Dynamic story generation
 *    - Advanced context handling
 *    - Balanced cost/performance
 * 
 * 2. GPT-4
 *    - High consistency
 *    - Longer context window
 *    - Premium quality
 *    - Higher cost
 * 
 * 3. GPT-3.5 Turbo
 *    - Simple narratives
 *    - Cost-effective
 *    - Faster responses
 *    - Limited complexity
 * 
 * Parameter Guidelines:
 * - temperature: Controls randomness (0.0-1.0)
 * - presencePenalty: Reduces repetition (-2.0-2.0)
 * - frequencyPenalty: Encourages diversity (-2.0-2.0)
 * - maxTokens: Limits response length
 * 
 * Best Practices:
 * 1. Use recommended models by default
 * 2. Consider context length requirements
 * 3. Monitor token usage and costs
 * 4. Adjust parameters for content type
 * 5. Test model performance
 * 
 * Error Handling:
 * ```typescript
 * const getModelConfig = (modelId: string) => {
 *   const config = AVAILABLE_MODELS[modelId];
 *   if (!config) {
 *     throw new Error(`Invalid model: ${modelId}`);
 *   }
 *   return config;
 * };
 * ```
 * 
 * Cost Management:
 * ```typescript
 * const estimateMonthlyCost = (
 *   requestsPerDay: number,
 *   avgTokensPerRequest: number,
 *   model: string
 * ) => {
 *   const { costPer1kTokens } = AVAILABLE_MODELS[model];
 *   const dailyCost = (avgTokensPerRequest / 1000) * 
 *     costPer1kTokens * requestsPerDay;
 *   return dailyCost * 30;
 * };
 * ```
 * 
 * @see OpenAIService for service implementation
 * @see config for default configurations
 * @see types for type definitions
 */