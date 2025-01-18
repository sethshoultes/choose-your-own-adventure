import { supabase } from '../../../lib/supabase';
import { defaultConfig, RATE_LIMIT, TIMEOUT_MS } from './config';
import { AVAILABLE_MODELS } from './models';
import { generateSystemPrompt, generateUserPrompt } from './prompts';
import { debugManager } from '../../debug/DebugManager';
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
  private currentResponse = {
    buffer: '',
    parsed: null as OpenAIResponse | null,
    choices: [] as Array<{ id: number; text: string; }>,
    isComplete: false
  };

  private cleanResponse(response: string): string {
    try {
      // Try to parse complete JSON first
      const parsed = JSON.parse(response.trim());
      if (parsed.description) {
        return parsed.description.trim();
      }
    } catch {
      // If not valid JSON, clean up the response
      const cleanedResponse = response
        // Remove complete JSON objects
        .replace(/^\s*{[\s\S]*}\s*$/gm, '')
        // Remove requirements objects
        .replace(/"requirements":\s*{[^}]*}/g, '')
        // Remove choices arrays
        .replace(/"choices":\s*\[[^\]]*\]/g, '')
        // Remove JSON punctuation
        .replace(/[{}\[\]"]/g, '')
        // Remove field names
        .replace(/^\s*(description|text|id):\s*/gm, '')
        // Remove trailing commas
        .replace(/,\s*$/gm, '')
        // Split into lines
        .split('\n')
        // Remove empty lines and trim each line
        .map(line => line.trim())
        .filter(Boolean)
        // Join with newlines
        .join('\n')
        .trim();

      return cleanedResponse;
    }
    return response.trim();
  }

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
    if (error instanceof StreamError) {
      const retryableStatuses = [
        429, // Rate limit
        500, // Internal server error
        502, // Bad gateway
        503, // Service unavailable
        504  // Gateway timeout
      ];
      return retryableStatuses.includes(error.status);
    }
    return false;
  }

  private async generateDynamicChoices(
    scene: string,
    context: StoryContext
  ): Promise<Choice[]> {
    debugManager.log('Generating dynamic choices', 'info', { scene, context });

    const choicePrompt = `Based on the current scene and character attributes, generate 3 meaningful choices. Format as JSON array:
    Scene: ${scene}
    Character Attributes: ${context.character.attributes.map(a => `${a.name}: ${a.value}`).join(', ')}
    Previous Choices: ${context.history.map(h => h.choice).join(', ')}
    
    Guidelines:
    - Each choice should be distinct and meaningful
    - Consider character attributes and equipment
    - Avoid repetitive or similar choices
    - Make choices that could lead to different outcomes
    - Keep choices consistent with the genre and tone`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await this.getApiKey()}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [{
          role: 'system',
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
      debugManager.log('Generated choices', 'success', { choices });
      return choices.map((choice: any, index: number) => ({ id: index + 1, text: choice.text }));
    } catch {
      debugManager.log('Failed to parse choices, using fallback', 'warning');
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
        throw new StreamError(
          error.error?.message || 'Failed to generate choices',
          response.status
        );
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
    debugManager.log('Starting scene generation', 'info', { prompt });
    
    this.currentResponse = { 
      buffer: '', 
      parsed: null, 
      choices: [],
      isComplete: false 
    };
    let abortController: AbortController | null = null;
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

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

      abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController?.abort(), TIMEOUT_MS);

      try {
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

        if (!response.ok) {
          const error = await response.json();
          throw new StreamError(
            error.error?.message || `OpenAI API error: ${response.statusText}`,
            response.status
          );
        }

        reader = response.body?.getReader() || null;
        const decoder = new TextDecoder('utf-8');

        if (!reader) {
          throw new Error('No response reader available');
        }

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
              this.currentResponse.buffer += token;

              // Try to parse the accumulated response
              try {
                const parsed = JSON.parse(this.currentResponse.buffer.trim());
                if (parsed.description) {
                  this.currentResponse.parsed = parsed;
                  this.currentResponse.choices = parsed.choices || [];
                  this.currentResponse.isComplete = true;
                  callbacks.onResponse(this.cleanResponse(parsed.description));
                  debugManager.log('Parsed complete response', 'success', { 
                    description: parsed.description,
                    choices: parsed.choices 
                  });
                }
              } catch {
                // If not valid JSON yet, continue buffering
                callbacks.onResponse(token);
              }
            } catch (e) {
              console.error('Error parsing stream:', e);
            }
          }
        }

        // Generate dynamic choices if none were parsed
        let finalChoices = this.currentResponse.choices;
        if (!this.currentResponse.isComplete || finalChoices.length === 0) {
          debugManager.log('Generating fallback choices', 'warning');
          finalChoices = [
              { id: 1, text: 'Investigate further' },
              { id: 2, text: 'Take action' },
              { id: 3, text: 'Consider alternatives' }
            ];
        }

        callbacks.onComplete(finalChoices);

      } catch (error) {
        throw error;
      } finally {
        if (reader) {
          reader.releaseLock();
        }
      }
    } catch (error) {
      const streamError = this.handleStreamError(error);
      debugManager.log('Stream error occurred', 'error', { error });
      callbacks.onError(streamError);
    } finally {
      if (abortController) {
        abortController.abort();
      }
    }
  }

  private validateResponse(response: string): boolean {
    try {
      const parsed = JSON.parse(response);
      return (
        typeof parsed.description === 'string' &&
        Array.isArray(parsed.choices) &&
        parsed.choices.length === 3 &&
        parsed.choices.every(c => 
          typeof c.id === 'number' && 
          typeof c.text === 'string'
        )
      );
    } catch {
      return false;
    }
  }
}