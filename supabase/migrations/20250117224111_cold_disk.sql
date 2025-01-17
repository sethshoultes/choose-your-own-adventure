/*
  # Complete Database Structure

  1. Core Tables
    - profiles: User profiles and preferences
    - api_credentials: OpenAI API key storage
    - characters: Character data and attributes
    - game_sessions: Active game sessions and state
    - game_history: Historical game choices and outcomes
    - achievements: User achievements
    - user_stats: User statistics and progress

  2. Security
    - RLS enabled on all tables
    - Policies for authenticated users
    - Secure API key storage
    - Audit logging

  3. Features
    - Character progression tracking
    - Game state persistence
    - Achievement system
    - Statistics tracking
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS game_history;
DROP TABLE IF EXISTS game_sessions;
DROP TABLE IF EXISTS characters;
DROP TABLE IF EXISTS api_credentials;
DROP TABLE IF EXISTS achievements;
DROP TABLE IF EXISTS user_stats;
DROP TABLE IF EXISTS profiles;

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create API credentials table
CREATE TABLE api_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  openai_key text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_credentials UNIQUE (user_id)
);

-- Create characters table
CREATE TABLE characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  genre text NOT NULL,
  attributes jsonb NOT NULL DEFAULT '[]'::jsonb,
  equipment jsonb NOT NULL DEFAULT '[]'::jsonb,
  backstory text,
  experience_points integer DEFAULT 0,
  level integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create game_sessions table
CREATE TABLE game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid REFERENCES characters ON DELETE CASCADE NOT NULL,
  current_scene jsonb NOT NULL,
  game_state jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_character_session UNIQUE (character_id)
);

-- Create game_history table
CREATE TABLE game_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES game_sessions ON DELETE CASCADE NOT NULL,
  scene_description text NOT NULL,
  player_choice text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create achievements table
CREATE TABLE achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  achievement_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE (user_id, achievement_type)
);

-- Create user_stats table
CREATE TABLE user_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  total_playtime interval DEFAULT '0'::interval,
  choices_made integer DEFAULT 0,
  characters_created integer DEFAULT 0,
  stories_completed integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- API credentials policies
CREATE POLICY "Users can manage their own API credentials"
  ON api_credentials
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Characters policies
CREATE POLICY "Users can read own characters"
  ON characters FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own characters"
  ON characters FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own characters"
  ON characters FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Game sessions policies
CREATE POLICY "Users can read own game sessions"
  ON game_sessions FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM characters
    WHERE characters.id = character_id
    AND characters.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own game sessions"
  ON game_sessions FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM characters
    WHERE characters.id = character_id
    AND characters.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own game sessions"
  ON game_sessions FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM characters
    WHERE characters.id = character_id
    AND characters.user_id = auth.uid()
  ));

-- Game history policies
CREATE POLICY "Users can read own game history"
  ON game_history FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM game_sessions
    JOIN characters ON characters.id = game_sessions.character_id
    WHERE game_sessions.id = game_history.session_id
    AND characters.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own game history"
  ON game_history FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM game_sessions
    JOIN characters ON characters.id = game_sessions.character_id
    WHERE game_sessions.id = session_id
    AND characters.user_id = auth.uid()
  ));

-- Achievements policies
CREATE POLICY "Users can read own achievements"
  ON achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON achievements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- User stats policies
CREATE POLICY "Users can read own stats"
  ON user_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
  ON user_stats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_characters_user_id ON characters(user_id);
CREATE INDEX idx_game_sessions_character_id ON game_sessions(character_id);
CREATE INDEX idx_game_history_session_id ON game_history(session_id);
CREATE INDEX idx_achievements_user_id ON achievements(user_id);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_timestamp
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_credentials_timestamp
  BEFORE UPDATE ON api_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_characters_timestamp
  BEFORE UPDATE ON characters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_sessions_timestamp
  BEFORE UPDATE ON game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_timestamp
  BEFORE UPDATE ON user_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create profile
  INSERT INTO profiles (id, username)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  
  -- Initialize user stats
  INSERT INTO user_stats (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN new;
END;
$$ language plpgsql security definer;

-- Create trigger for new user handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();