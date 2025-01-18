import { supabase } from '../../../lib/supabase';
import { defaultConfig, RATE_LIMIT, TIMEOUT_MS } from './config';
import { AVAILABLE_MODELS } from './models';
import { generateSystemPrompt, generateUserPrompt } from './prompts';
import type { 
  OpenAIConfig, 
  OpenAIStreamCallbacks, 
  StoryPrompt, 
  OpenAIResponse,
  StreamError 
} from './types';

export class OpenAIService {
  private config: OpenAIConfig;
  private requestTimes: number[] = [];
  private maxRetries = 3;
  private retryDelay = 1000;
  private streamBuffer = '';

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async retryWithExponentialBackoff<T>(
    operation: () => Promise<T>,
    retries = this.maxRetries
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retries === 0 || !this.isRetryableError(error)) {
        throw error;
      }
      
      await this.delay(this.retryDelay * Math.pow(2, this.maxRetries - retries));
      return this.retryWithExponentialBackoff(operation, retries - 1);
    }
  }

  private isRetryableError(error: any): boolean {
    // Retry on rate limits, timeouts, and temporary server errors
    if (error instanceof StreamError) {
      return error.status === 429 || // Rate limit
             error.status === 503 || // Service unavailable
             error.status === 504;   // Gateway timeout
    }
    return false;
  }

  private parseStreamedContent(content: string): { text: string; isComplete: boolean } {
    this.streamBuffer += content;
    
    try {
      // Try to parse as JSON if we have a complete response
      const parsed = JSON.parse(this.streamBuffer);
      this.streamBuffer = '';
      return {
        text: parsed.description,
        isComplete: true
      };
    } catch {
      // If we can't parse as JSON, it's an incomplete response
      return {
        text: content,
        isComplete: false
      };
    }
  }

  private async generateDynamicChoices(
    scene: string,
    context: StoryContext
  ): Promise<Array<{ id: number; text: string }>> {
    const choicePrompt = `Based on the current scene and character attributes, generate 3 meaningful choices. Format as JSON array:
    Scene: ${scene}
    Character Attributes: ${context.character.attributes.map(a => `${a.name}: ${a.value}`).join(', ')}
    Previous Choices: ${context.history.map(h => h.choice).join(', ')}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await this.getApiKey()}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [{
          role: 'user',
          content: choicePrompt
        }],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate choices');
    }

    const data = await response.json();
    try {
      const choices = JSON.parse(data.choices[0].message.content);
      return choices.map((choice: string, index: number) => ({
        id: index + 1,
        text: choice
      }));
    } catch {
      // Fallback choices if parsing fails
      return [
        { id: 1, text: 'Investigate further' },
        { id: 2, text: 'Take action' },
        { id: 3, text: 'Consider alternatives' }
      ];
    }
  }

  private handleStreamError(error: any): StreamError {
    if (error instanceof StreamError) {
      return error;
    }
    
    if (error.name === 'AbortError') {
      return new StreamError('Request timed out', 408);
    }
    
    return new StreamError(
      error.message || 'An unknown error occurred',
      error.status || 500
    );
  }

  public async testConnection(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Invalid API key');
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Failed to validate API key'
      };
    }
  }

  constructor(config: Partial<OpenAIConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  private async getApiKey(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('api_credentials')
      .select('openai_key, metadata')
      .eq('user_id', user.id)
      .single();

    if (error) {
      throw new Error('Error fetching API key: ' + error.message);
    }
    
    if (!data?.openai_key) {
      throw new Error('OpenAI API key not set. Please add your API key in Profile Settings.');
    }

    // Update config with user's preferred model if set
    if (data.metadata?.preferredModel && AVAILABLE_MODELS[data.metadata.preferredModel]) {
      const modelConfig = AVAILABLE_MODELS[data.metadata.preferredModel];
      this.config = {
        ...this.config,
        model: modelConfig.id,
        temperature: modelConfig.temperature,
        maxTokens: modelConfig.maxTokens,
        presencePenalty: modelConfig.presencePenalty,
        frequencyPenalty: modelConfig.frequencyPenalty,
      };
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
    let abortController: AbortController | null = null;

    try {
      this.checkRateLimit();
      const apiKey = await this.getApiKey();
      let generatedText = '';

      // Prepare messages for the API
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

      const response = await this.retryWithExponentialBackoff(async () => {
        abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController?.abort(), TIMEOUT_MS);

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
          signal: abortController.signal,
      });

        clearTimeout(timeoutId);
        return response;
      });

      if (!response.ok) {
        const error = await response.json();
        throw new StreamError(
          error.error?.message || `OpenAI API error: ${response.statusText}`,
          response.status
        );
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

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

            try {
              const json = JSON.parse(line.replace('data: ', ''));
              if (!json.choices[0].delta.content) continue;
              
              const token = json.choices[0].delta.content;
              const { text, isComplete } = this.parseStreamedContent(token);
              
              if (text) {
                callbacks.onToken(text);
                generatedText += text;
              }
              
              if (isComplete) {
                const choices = await this.generateDynamicChoices(
                  generatedText,
                  prompt.context
                );
                callbacks.onComplete(choices);
                break;
              }
            } catch (e) {
              console.error('Error parsing stream:', e);
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      const streamError = this.handleStreamError(error);
      callbacks.onError(streamError);
    } finally {
      abortController?.abort();
    }
  }
}