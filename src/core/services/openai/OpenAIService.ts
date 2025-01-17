import { supabase } from '../../../lib/supabase';
import { defaultConfig, RATE_LIMIT, TIMEOUT_MS } from './config';
import { generateSystemPrompt, generateUserPrompt } from './prompts';
import type { OpenAIConfig, OpenAIStreamCallbacks, StoryPrompt, OpenAIResponse } from './types';

export class OpenAIService {
  private config: OpenAIConfig;
  private requestTimes: number[] = [];

  constructor(config: Partial<OpenAIConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  private async getApiKey(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('api_credentials')
      .select('openai_key')
      .eq('user_id', user.id)
      .single();

    if (error) {
      throw new Error('Error fetching API key: ' + error.message);
    }
    
    if (!data?.openai_key) {
      throw new Error('OpenAI API key not set. Please add your API key in Profile Settings.');
    }

    return data.openai_key;
  }

  private checkRateLimit() {
    const now = Date.now();
    this.requestTimes = this.requestTimes.filter(
      time => now - time < RATE_LIMIT.windowMs
    );

    if (this.requestTimes.length >= RATE_LIMIT.maxRequests) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    this.requestTimes.push(now);
  }

  public async generateNextScene(
    prompt: StoryPrompt,
    callbacks: OpenAIStreamCallbacks
  ): Promise<void> {
    try {
      this.checkRateLimit();
      const apiKey = await this.getApiKey();

      const messages = [
        {
          role: 'system' as const,
          content: generateSystemPrompt(prompt.context.genre),
        },
        {
          role: 'user' as const,
          content: generateUserPrompt(prompt),
        },
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
          presence_penalty: this.config.presencePenalty,
          frequency_penalty: this.config.frequencyPenalty,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentScene = {
        description: '',
        choices: []
      };

      if (!reader) throw new Error('No response reader available');

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim() !== '');

          for (const line of lines) {
            if (line.includes('[DONE]')) continue;
            if (!line.startsWith('data: ')) continue;

            const json = JSON.parse(line.replace('data: ', ''));
            if (!json.choices[0].delta.content) continue;

            const token = json.choices[0].delta.content;
            callbacks.onToken(token);
            currentScene.description += token;
          }
        }

        // Parse the complete response
        try {
          const response: OpenAIResponse = JSON.parse(buffer);
          if (!this.validateResponse(response)) {
            throw new Error('Invalid response format');
          }
          
          // Generate dynamic choices based on the scene
          currentScene.choices = [
            { id: 1, text: 'Investigate the situation further' },
            { id: 2, text: 'Take immediate action' },
            { id: 3, text: 'Consider alternative approaches' }
          ];
          
          // Update game state with new scene
          this.state = {
            ...this.state,
            currentScene
          };
          
          callbacks.onComplete(currentScene);
        } catch (error) {
          callbacks.onError(new Error('Failed to parse OpenAI response'));
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      callbacks.onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  private validateResponse(response: any): response is OpenAIResponse {
    return (
      typeof response === 'object' &&
      typeof response.description === 'string' &&
      Array.isArray(response.choices) &&
      response.choices.length === 3 &&
      response.choices.every(
        (choice: any) =>
          typeof choice === 'object' &&
          typeof choice.id === 'number' &&
          typeof choice.text === 'string'
      )
    );
  }
}