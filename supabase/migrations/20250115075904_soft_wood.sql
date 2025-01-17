/*
  # Game System Database Schema

  1. New Tables
    - `profiles`
      - User profiles with basic info
    - `characters`
      - Active game characters for each user
    - `game_sessions`
      - Tracks ongoing game sessions
    - `game_history`
      - Stores complete adventure history

  2. Security
    - Enable RLS on all tables
    - Add policies for user data access
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create characters table
CREATE TABLE IF NOT EXISTS characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  genre text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create game_sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid REFERENCES characters ON DELETE CASCADE NOT NULL,
  current_scene jsonb NOT NULL,
  game_state jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create game_history table
CREATE TABLE IF NOT EXISTS game_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES game_sessions ON DELETE CASCADE NOT NULL,
  scene_description text NOT NULL,
  player_choice text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can read own characters"
  ON characters FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own characters"
  ON characters FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own game sessions"
  ON game_sessions FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM characters
    WHERE characters.id = game_sessions.character_id
    AND characters.user_id = auth.uid()
  ));

CREATE POLICY "Users can read own game history"
  ON game_history FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM game_sessions
    JOIN characters ON characters.id = game_sessions.character_id
    WHERE game_sessions.id = game_history.session_id
    AND characters.user_id = auth.uid()
  ));