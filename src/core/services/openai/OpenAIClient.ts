/**
 * OpenAIClient Class
 * 
 * This class provides a low-level client for interacting with the OpenAI API in the AdventureBuildr
 * game engine. It handles API authentication, request streaming, error handling, and response
 * processing. The client is used by the OpenAIService to manage API interactions while providing
 * proper error handling and timeout management.
 * 
 * Key Features:
 * - Secure API key management
 * - Streaming response handling
 * - Request timeout management
 * - Error classification
 * - Response validation
 * 
 * Data Flow:
 * 1. API key retrieval from Supabase
 * 2. Request preparation and validation
 * 3. Stream initialization and processing
 * 4. Token parsing and callback handling
 * 5. Error handling and recovery
 * 
 * @see OpenAIService for high-level service implementation
 * @see StreamError for error handling
 */

import { supabase } from '../../../lib/supabase';
import { debugManager } from '../../debug/DebugManager';
import { StreamError } from './types';
import { TIMEOUT_MS } from './config';

export class OpenAIClient {
  /**
   * Retrieves the OpenAI API key from Supabase
   * Uses RPC function for secure key access
   * 
   * @returns Promise with API key
   * @throws Error if key not found or user not authenticated
   */
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

  /**
   * Streams completion responses from OpenAI
   * Handles token streaming and error cases
   * 
   * @param messages Array of chat messages
   * @param options Model configuration options
   * @param callbacks Streaming callbacks
   * @throws StreamError for API and timeout errors
   * 
   * @example
   * ```typescript
   * await client.streamCompletion(
   *   messages,
   *   { model: 'gpt-4', temperature: 0.7 },
   *   {
   *     onToken: (token) => console.log(token),
   *     onError: (error) => console.error(error)
   *   }
   * );
   * ```
   */
  public async streamCompletion(
    messages: Array<{ role: string; content: string }>,
    options: {
      model: string;
      temperature: number;
      maxTokens: number;
      presencePenalty: number;
      frequencyPenalty: number;
    },
    callbacks: {
      onToken: (token: string) => void;
      onError: (error: Error) => void;
    }
  ): Promise<void> {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), TIMEOUT_MS);

    try {
      const apiKey = await this.getApiKey();
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: options.model,
          messages,
          temperature: options.temperature,
          max_tokens: options.maxTokens,
          presence_penalty: options.presencePenalty,
          frequency_penalty: options.frequencyPenalty,
          stream: true,
        }),
        signal: abortController.signal
      });

      if (!response.ok) {
        let errorMessage = 'OpenAI API error';
        try {
          const error = await response.json();
          errorMessage = error.error?.message || error.message || `OpenAI API error: ${response.statusText}`;
        } catch {
          errorMessage = `OpenAI API error: ${response.statusText}`;
        }
        throw new StreamError(errorMessage, response.status);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response reader available');

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.includes('[DONE]') || !line.startsWith('data: ')) continue;
          
          try {
            const json = JSON.parse(line.replace('data: ', ''));
            if (json.choices?.[0]?.delta?.content) {
              callbacks.onToken(json.choices[0].delta.content);
            }
          } catch (e) {
            // Ignore parsing errors for incomplete chunks
            if (!(e instanceof SyntaxError)) {
              debugManager.log('Error parsing stream chunk', 'error', { error: e });
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof StreamError) {
        callbacks.onError(error);
      } else if (error.name === 'AbortError') {
        callbacks.onError(new StreamError('Request timed out', 408));
      } else {
        callbacks.onError(new StreamError(
          error.message || 'An unknown error occurred',
          500
        ));
      }
    } finally {
      clearTimeout(timeoutId);
      abortController.abort();
    }
  }

  /**
   * Tests API key validity and connection
   * Used for validating user-provided keys
   * 
   * @param apiKey OpenAI API key to test
   * @returns Validation result with error if any
   * 
   * @example
   * ```typescript
   * const result = await client.testConnection('sk-...');
   * if (result.valid) {
   *   console.log('API key is valid');
   * } else {
   *   console.error('Invalid key:', result.error);
   * }
   * ```
   */
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
          error.error?.message || 'Failed to validate API key',
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
}

/**
 * Integration Points:
 * 
 * 1. OpenAIService
 *    ```typescript
 *    // In OpenAIService
 *    export class OpenAIService {
 *      private client: OpenAIClient;
 *      
 *      constructor() {
 *        this.client = new OpenAIClient();
 *      }
 *      
 *      public async generateNextScene(prompt: StoryPrompt): Promise<void> {
 *        await this.client.streamCompletion(
 *          this.formatMessages(prompt),
 *          this.config,
 *          this.callbacks
 *        );
 *      }
 *    }
 *    ```
 * 
 * 2. ProfileSettings
 *    ```typescript
 *    // In ProfileSettings component
 *    const handleTestConnection = async () => {
 *      const client = new OpenAIClient();
 *      const result = await client.testConnection(apiKey);
 *      if (result.valid) {
 *        showSuccess('API key is valid');
 *      } else {
 *        showError(result.error);
 *      }
 *    };
 *    ```
 * 
 * 3. Admin Test Panel
 *    ```typescript
 *    // In TestPanel component
 *    const handleTest = async () => {
 *      const client = new OpenAIClient();
 *      await client.streamCompletion(
 *        messages,
 *        options,
 *        {
 *          onToken: updateDisplay,
 *          onError: handleError
 *        }
 *      );
 *    };
 *    ```
 * 
 * Error Handling:
 * ```typescript
 * try {
 *   await client.streamCompletion(messages, options, {
 *     onToken: handleToken,
 *     onError: (error) => {
 *       if (error instanceof StreamError) {
 *         switch (error.status) {
 *           case 401:
 *             handleUnauthorized();
 *             break;
 *           case 429:
 *             handleRateLimit();
 *             break;
 *           case 408:
 *             handleTimeout();
 *             break;
 *           default:
 *             handleGenericError(error);
 *         }
 *       }
 *     }
 *   });
 * } catch (error) {
 *   handleUnexpectedError(error);
 * }
 * ```
 * 
 * Best Practices:
 * 1. Always handle timeouts
 * 2. Implement proper error handling
 * 3. Clean up resources
 * 4. Validate API keys
 * 5. Log errors appropriately
 * 
 * Security Considerations:
 * 1. Never expose API keys in client code
 * 2. Use secure key storage
 * 3. Implement proper authentication
 * 4. Validate user permissions
 * 5. Handle sensitive data carefully
 * 
 * @see OpenAIService for high-level service
 * @see config for timeout settings
 * @see types for error definitions
 */