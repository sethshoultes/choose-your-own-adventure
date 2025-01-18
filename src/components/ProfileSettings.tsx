import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Settings, Key, Mail, User, AlertCircle, Check, Zap } from 'lucide-react';
import { LoadingIndicator } from './LoadingIndicator';
import { useNavigate } from '../hooks/useNavigate';
import { AVAILABLE_MODELS, OpenAIService } from '../core/services/openai'; 

export function ProfileSettings() {
  const { navigateToHome } = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [profile, setProfile] = useState({
    email: '',
    username: '',
    apiKey: '',
    preferredModel: '',
  });
  const [newPassword, setNewPassword] = useState('');
  const openai = useMemo(() => new OpenAIService(), []);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Load profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Load API key
      const { data: apiData, error: apiError } = await supabase
        .from('api_credentials')
        .select('openai_key, metadata')
        .eq('user_id', user.id)
        .single();

      if (apiError && apiError.code !== 'PGRST116') throw apiError;

      setProfile({
        email: user.email || '',
        username: profileData?.username || '',
        apiKey: apiData?.openai_key || '',
        preferredModel: apiData?.metadata?.preferredModel || 'gpt-4-turbo-preview',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!profile.apiKey) {
      setError('Please enter an API key first');
      return;
    }

    setTesting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await openai.testConnection(profile.apiKey);
      if (result.valid) {
        setSuccess('API key is valid and working correctly');
      } else {
        setError(result.error || 'Invalid API key');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to test API key');
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ username: profile.username })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Only update API credentials if the key or model changed
      const { data: currentCreds } = await supabase
        .from('api_credentials')
        .select('openai_key, metadata')
        .eq('user_id', user.id)
        .single();

      if (profile.apiKey !== currentCreds?.openai_key || 
          profile.preferredModel !== currentCreds?.metadata?.preferredModel) {
        const { error: apiError } = await supabase
          .rpc('upsert_api_credentials', {
            p_user_id: user.id,
            p_openai_key: profile.apiKey,
            p_metadata: {
              preferredModel: profile.preferredModel
            }
          });

        if (apiError) throw apiError;
      }

      // Update password if provided
      if (newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (passwordError) throw passwordError;
      }

      setSuccess('Profile updated successfully');
      setNewPassword(''); // Clear password field after successful update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingIndicator message="Loading profile..." />;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 pb-24">
      <div className="mb-8">
        <div className="flex justify-center mb-8">
          <button
            onClick={navigateToHome}
            className="hover:opacity-90 transition-opacity"
          >
            <img
              src="https://adventurebuildrstorage.storage.googleapis.com/wp-content/uploads/2024/10/11185818/AdventureBuildr-Logo-e1731351627826.png"
              alt="AdventureBuildr Logo"
              className="w-auto"
            />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 rounded-lg">
            <Settings className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Profile Settings</h1>
            <p className="text-gray-600">Manage your account and preferences</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Username Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold">Username</h2>
          </div>
          <input
            type="text"
            value={profile.username}
            onChange={(e) => setProfile({ ...profile, username: e.target.value })}
            className="w-full p-2 border rounded-md"
            placeholder="Enter username"
          />
        </div>

        {/* Email Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold">Email Address</h2>
          </div>
          <input
            type="email"
            value={profile.email}
            disabled
            className="w-full p-2 border rounded-md bg-gray-50"
          />
          <p className="mt-2 text-sm text-gray-500">
            Contact support to change your email address
          </p>
        </div>

        {/* API Key Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <Key className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold">OpenAI API Key</h2>
          </div>
          <input
            type="password"
            value={profile.apiKey}
            onChange={(e) => setProfile({ ...profile, apiKey: e.target.value })}
            className="w-full p-2 border rounded-md"
            placeholder="sk-..."
          />
          {success && success.includes('API key') && (
            <div className="mt-2 flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
              <Check className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{success}</p>
            </div>
          )}
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || !profile.apiKey.startsWith('sk-')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {testing ? (
                <LoadingIndicator size="sm" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Test Connection
            </button>
            {testing && <span className="text-sm text-gray-600">Testing connection...</span>}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Your API key is encrypted and stored securely
          </p>
        </div>

        {/* Password Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <Key className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold">Change Password</h2>
          </div>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="Enter new password"
            minLength={6}
          />
          <p className="mt-2 text-sm text-gray-500">
            Leave blank to keep current password
          </p>
        </div>

        {/* Model Selection Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold">AI Model Selection</h2>
          </div>
          <div className="space-y-4">
            {Object.values(AVAILABLE_MODELS).map((model) => (
              <label
                key={model.id}
                className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
                  profile.preferredModel === model.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="model"
                    value={model.id}
                    checked={profile.preferredModel === model.id}
                    onChange={(e) =>
                      setProfile({ ...profile, preferredModel: e.target.value })
                    }
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium">
                      {model.name}
                      {model.recommended && (
                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{model.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Cost: ${model.costPer1kTokens.toFixed(3)} per 1k tokens
                    </p>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && !success.includes('API key') && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg">
            <Check className="w-5 h-5 flex-shrink-0" />
            <p>{success}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <LoadingIndicator size="sm" />
          ) : (
            <Check className="w-5 h-5" />
          )}
          Save Changes
        </button>
        <div className="h-16" /> {/* Extra space at bottom */}
      </form>
    </div>
  );
}