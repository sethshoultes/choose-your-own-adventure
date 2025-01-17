import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Settings, Key, Mail, User, AlertCircle, Check } from 'lucide-react';
import { LoadingIndicator } from './LoadingIndicator';

export function ProfileSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    email: '',
    username: '',
    apiKey: '',
  });
  const [newPassword, setNewPassword] = useState('');

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
        .select('openai_key')
        .eq('user_id', user.id)
        .single();

      if (apiError && apiError.code !== 'PGRST116') throw apiError;

      setProfile({
        email: user.email || '',
        username: profileData?.username || '',
        apiKey: apiData?.openai_key || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
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

      // Update API key
      if (profile.apiKey) {
        const { error: apiError } = await supabase
          .from('api_credentials')
          .upsert({
            user_id: user.id,
            openai_key: profile.apiKey,
            updated_at: new Date().toISOString(),
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
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-100 rounded-lg">
          <Settings className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Profile Settings</h1>
          <p className="text-gray-600">Manage your account and preferences</p>
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

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
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
      </form>
    </div>
  );
}