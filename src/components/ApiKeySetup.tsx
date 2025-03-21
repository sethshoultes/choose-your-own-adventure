/**
 * ApiKeySetup Component
 * 
 * This component handles the secure storage and management of OpenAI API keys for the AdventureBuildr application.
 * It provides a user interface for entering and saving API keys, with proper validation and error handling.
 * 
 * Key Features:
 * - Secure API key storage using Supabase's encrypted columns
 * - Real-time validation of API key format
 * - Clear user feedback for success/error states
 * - Instructions for obtaining an API key
 * 
 * The component is used in the main application flow after authentication but before game access
 * to ensure the OpenAI integration is properly configured.
 */

import React, { useState } from 'react';
import { Key, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { LoadingIndicator } from './LoadingIndicator';

interface Props {
  /** Callback function called when API key setup is completed successfully */
  onComplete: () => void;
}

export function ApiKeySetup({ onComplete }: Props) {
  // State management for form handling
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /**
   * Handles the submission of the API key form
   * Validates and stores the API key in the database
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Set up metadata for API key storage
      const metadata = {
        preferredModel: 'gpt-4-turbo-preview',
        lastUpdated: new Date().toISOString()
      };

      // Store API key using secure RPC function
      const { data, error } = await supabase
        .rpc('upsert_api_credentials', { 
          p_user_id: user.id, 
          p_openai_key: apiKey, 
          p_metadata: metadata 
        });

      if (error) {
        throw error;
      }

      // Show appropriate success message based on operation
      setSuccess(data?.status === 'created' ? 'API key saved successfully' : 'API key updated successfully');
      onComplete();
    } catch (err) {
      console.error('Error saving API key:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save API key';
      setError(errorMessage.includes('Failed to fetch') ? 
        'Connection error. Please try again.' : errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-100 rounded-lg">
          <Key className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Set up OpenAI API Key</h2>
          <p className="text-gray-600">Required for story generation</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="text-sm text-blue-700">
          <p className="mb-2">To get your API key:</p>
          <ol className="list-decimal ml-5 space-y-1">
            <li>Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI API Keys</a></li>
            <li>Create a new secret key</li>
            <li>Copy and paste it below</li>
          </ol>
        </div>
      </div>
      
      {/* API Key Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            OpenAI API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full p-2 border rounded-md"
            required
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
            <Check className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{success}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !apiKey.startsWith('sk-')}
          className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <LoadingIndicator size="sm" />
          ) : (
            <Check className="w-5 h-5" />
          )}
          Save API Key
        </button>
      </form>
    </div>
  );
}