/*
  # Fix game sessions RLS policies

  1. Changes
    - Drop and recreate game sessions policies with proper permissions
    - Add explicit INSERT policy
    - Add explicit UPDATE policy
    - Add explicit SELECT policy

  2. Security
    - Maintain RLS protection
    - Ensure users can only access their own game sessions
    - Add proper validation checks
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own game sessions" ON game_sessions;

-- Create explicit policies for each operation
CREATE POLICY "Users can insert game sessions"
  ON game_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = character_id
      AND characters.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update game sessions"
  ON game_sessions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = character_id
      AND characters.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = character_id
      AND characters.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can select game sessions"
  ON game_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = character_id
      AND characters.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete game sessions"
  ON game_sessions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = character_id
      AND characters.user_id = auth.uid()
    )
  );