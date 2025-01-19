import { supabase } from '../../../lib/supabase';
import { defaultConfig, RATE_LIMIT, TIMEOUT_MS } from './config';
import { AVAILABLE_MODELS } from './models';
import { generateSystemPrompt, generateUserPrompt } from './prompts';
import { debugManager } from '../../debug/DebugManager';
import { 
  OpenAIConfig, 
  OpenAIStreamCallbacks, 
  StoryPrompt, 
  OpenAIResponse,
  StreamError,
  Choice,
  StoryContext
} from './types';

export class OpenAIService {
  private config: OpenAIConfig;
  private requestTimes: number[] = [];
  private maxRetries = 3;
  private retryDelay = 2000;
  private maxTokens = 4096;  // Reduced from 8192 to stay well under the limit

  private parseResponse(responseBuffer: string): OpenAIResponse | null {
    try {
      const parsed = JSON.parse(responseBuffer.trim());
      if (parsed.description && Array.isArray(parsed.choices)) {
        // Ensure exactly 3 unique choices
        const uniqueChoices = Array.from(
          new Map(parsed.choices.map(c => [c.text, c])).values()
        ).slice(0, 3).map((choice, index) => ({
          id: index + 1,
          text: choice.text
        }));

        return {
          description: parsed.description,
          choices: uniqueChoices
        };
      }
    } catch (e) {
      debugManager.log('Failed to parse response', 'warning', { error: e });
    }
    return null;
  }

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
    let attempt = 1;

    try {
      return await operation();
    } catch (error) {
      if (retries === 0 || !this.shouldRetry(error)) {
        throw error;
      }
      
      const waitTime = this.calculateRetryDelay(error, attempt);
      debugManager.log('Retrying request', 'info', { 
        attempt,
        waitTime,
        error 
      });
      
      await this.delay(waitTime);
      attempt++;
      return this.retryWithExponentialBackoff(operation, retries - 1);
    }
  }

  private shouldRetry(error: any): boolean {
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
    const { character, history } = context;
    const relevantAttributes = character.attributes
      .filter(attr => attr.value >= 7)
      .map(attr => attr.name);
    
    const recentChoices = history
      .slice(-3)
      .map(h => h.choice);

    debugManager.log('Generating dynamic choices', 'info', { scene, context });
    let responseBuffer = '';

    try {
      const choicePrompt = `Generate 3 meaningful choices based on:

Current Scene:
${scene}

Character Strengths:
${relevantAttributes.join(', ')}

Recent Choices:
${recentChoices.join('\n')}

Format response as JSON array:
      [
        { "id": 1, "text": "First choice" },
        { "id": 2, "text": "Second choice" },
        { "id": 3, "text": "Third choice" }
      ]

      Guidelines:
      - Leverage character's high attributes (${relevantAttributes.join(', ')})
      - Avoid repeating recent choices
      - Each choice should lead to different outcomes
      - Consider available equipment: ${character.equipment.map(e => e.name).join(', ')}
      - Maintain genre consistency
      - Choices should affect story progression`;

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
        const error = await response.json();
        throw new StreamError(
          error.error?.message || 'Failed to generate choices',
          response.status
        );
      }

      const data = await response.json();
      let choices = [];
      try {
        choices = JSON.parse(data.choices[0].message.content);
      } catch (parseError) {
        debugManager.log('Failed to parse choices', 'warning', { error: parseError });
        return this.getFallbackChoices();
      }

      debugManager.log('Generated choices', 'success', { choices });
      return choices.map((choice: any, index: number) => ({ id: index + 1, text: choice.text }));
    } catch (error) {
      debugManager.log('Failed to generate choices, using fallback', 'warning', { error });
      return this.getFallbackChoices();
    }
  }

  private getFallbackChoices(): Choice[] {
    return [
      { id: 1, text: 'Investigate further' },
      { id: 2, text: 'Take action' },
      { id: 3, text: 'Consider alternatives' }
    ];
  }

  private handleStreamError(error: any): StreamError {
    if (error instanceof StreamError) {
      return error;
    }

    if (error.response) {
      return new StreamError(
        error.response.data?.error?.message || error.response.statusText,
        error.response.status
      );
    }
    
    if (error.name === 'AbortError') {
      return new StreamError('Request timed out', 408);
    }
    
    // Handle network errors
    if (error.message?.includes('Failed to fetch')) {
      return new StreamError('Network error - please check your connection', 503);
    }

    return new StreamError(
      error.message || 'An unknown error occurred',
      500
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

  private calculateRetryDelay(error: any, attempt: number): number {
    // For rate limits, use the retry-after header if available
    if (error instanceof StreamError && error.status === 429) {
      const retryAfter = parseInt(error.headers?.['retry-after'] || '0', 10);
      if (retryAfter > 0) {
        return retryAfter * 1000;
      }
    }
    
    // Otherwise use exponential backoff
    return this.retryDelay * Math.pow(2, attempt - 1);
  }

  private truncateHistory(history: GameHistoryEntry[]): GameHistoryEntry[] {
    // Keep only the last 5 entries to reduce context size
    return history.slice(-5);
  }

  private estimateTokenCount(text: string): number {
    // Rough estimation: ~4 chars per token
    return Math.ceil(text.length / 4);
  }

  public async generateNextScene(
    prompt: StoryPrompt,
    callbacks: OpenAIStreamCallbacks
  ): Promise<void> {
    let buffer = '';
    let completeResponse = '';
    let responseComplete = false;
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), TIMEOUT_MS);
    let validTokenCount = 0;
    let tokenCount = 0;
    let lastLogTime = Date.now();
    const LOG_INTERVAL = 1000; // Log every second
    let choices: Array<{ id: number; text: string }> = [
      { id: 1, text: 'Investigate further' },
      { id: 2, text: 'Take action' },
      { id: 3, text: 'Consider alternatives' }
    ];

    try {
      this.checkRateLimit();
      const apiKey = await this.getApiKey();
      
      // Truncate history to reduce token usage
      prompt.context.history = this.truncateHistory(prompt.context.history);
      
      // Estimate token count
      const contextTokens = this.estimateTokenCount(
        JSON.stringify(prompt.context) + prompt.choice
      );
      
      // Adjust max tokens based on context size
      const availableTokens = Math.max(
        1000,
        this.maxTokens - contextTokens
      );
      
      debugManager.log('Starting scene generation', 'info', { 
        genre: prompt.context.genre,
        choice: prompt.choice,
        contextTokens,
        availableTokens
      });

      // Validate the prompt
      if (!prompt.context || !prompt.choice) {
        throw new Error('Invalid prompt: Missing required fields');
      }

      const response = await this.retryWithExponentialBackoff(async () => fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: generateSystemPrompt(prompt.context.genre),
            },
            {
              role: 'user',
              content: generateUserPrompt(prompt),
            },
          ],
          temperature: this.config.temperature,
          max_tokens: availableTokens,
          presence_penalty: this.config.presencePenalty,
          frequency_penalty: this.config.frequencyPenalty,
          stream: true,
        }),
        signal: abortController.signal
      }).catch(error => { throw this.handleStreamError(error); }));
      
      if (!response.ok) {
        let errorMessage = 'OpenAI API error';
        try {
          const error = await response.json();
          errorMessage = error.error?.message || `OpenAI API error: ${response.statusText}`;
        } catch {
          errorMessage = `OpenAI API error: ${response.statusText}`;
        }
        const streamError = new StreamError(errorMessage, response.status);
        debugManager.log('API error response', 'error', { 
          status: response.status,
          message: errorMessage
        });
        throw streamError;
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response reader available');

      const decoder = new TextDecoder();
      let validResponse = false;

      debugManager.log('Starting stream read', 'info');
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // Final parse attempt
            try {
              const parsed = JSON.parse(buffer);
              if (parsed.description && parsed.choices) {
                validResponse = true;
                debugManager.log('Valid response parsed', 'success', { parsed });
                callbacks.onComplete(parsed.choices.map((c: any, i: number) => ({
                  // Ensure valid choice IDs
                  id: i + 1,
                  text: c.text
                })));
              } else {
                debugManager.log('Invalid response format', 'warning', { parsed });
                throw new Error('Invalid response format');
              }
            } catch (e) {
              debugManager.log('Final parse failed', 'warning', { error: e, bufferLength: buffer.length });
              // Only log empty response if buffer is actually empty
              if (!buffer.trim()) {
                debugManager.log('Empty response received', 'warning');
              }
            }
            break;
          }

          if (responseComplete || !value) {
            debugManager.log('Response already complete, ignoring additional data');
            continue;
          }

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim() !== '');

          for (const line of lines) {
            if (line.includes('[DONE]') || !line.startsWith('data: ')) {
              continue;
            }

            // Skip empty data lines silently
            if (line === 'data: ' || !line.trim()) continue;
            
            try {
              const json = JSON.parse(line.replace('data: ', ''));
              if (!json.choices?.[0]?.delta?.content) {
                continue;
              }
              
              const token = json.choices[0].delta.content;
              tokenCount++;
              
              // Always accumulate tokens
              buffer += token;
              completeResponse += token;
              validTokenCount++;
              callbacks.onToken(token);
                
              // Log progress periodically
              const now = Date.now();
              if (now - lastLogTime >= LOG_INTERVAL) {
                debugManager.log('Generation progress', 'info', {
                  tokens: tokenCount,
                  validTokens: validTokenCount,
                  bufferLength: buffer.length
                });
                lastLogTime = now;
              }

              // Try to parse complete response
              try {
                const parsed = JSON.parse(completeResponse);
                if (parsed.description && parsed.choices) {
                  // Validate choices
                  if (!Array.isArray(parsed.choices) || parsed.choices.length === 0) {
                    throw new Error('Invalid choices format');
                  }
                  
                  responseComplete = true;
                  debugManager.log('Complete response parsed', 'success');
                  debugManager.log('Response stats', 'info', {
                    totalTokens: tokenCount,
                    bufferLength: buffer.length
                  });
                  
                  // Ensure exactly 3 valid choices
                  choices = parsed.choices.slice(0, 3).map((c: any, i: number) => ({
                    id: i + 1,
                    text: typeof c.text === 'string' ? c.text.trim() : 'Investigate further'
                  }));
                  
                  // If we don't have enough choices, add defaults
                  while (choices.length < 3) {
                    choices.push({
                      id: choices.length + 1,
                      text: choices.length === 1 ? 'Take action' : 'Consider alternatives'
                    });
                  }
                  
                  callbacks.onComplete(parsed.choices.map((c, i) => ({ id: i + 1, text: c.text })));
                }
              } catch {
                // Not a complete response yet, continue
              }
            } catch (e) {
              // Only log actual parsing errors, not incomplete JSON
              if (!(e instanceof SyntaxError)) {
                debugManager.log('Error parsing stream chunk', 'error', { error: e });
              }
            }
          }
        }

        if (!validResponse) {
          debugManager.log('No valid response generated', 'error', {
            totalTokens: tokenCount,
            bufferLength: buffer.length
          });
          // Use the accumulated buffer as the response
          if (buffer.trim()) {
            callbacks.onToken(buffer);
            callbacks.onComplete(choices);
          } else {
            throw new Error('Failed to generate valid response');
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      const streamError = this.handleStreamError(error);
      debugManager.log('Stream error occurred', 'error', { error });
      
      callbacks.onError(streamError);
    } finally {
      clearTimeout(timeoutId);
      abortController.abort();
    }
  }
}