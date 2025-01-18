/*
  # Fix Game Sessions RLS Policies

  1. Changes
    - Drop existing game sessions policies
    - Create comprehensive policies for all operations
    - Add explicit WITH CHECK clauses
    - Add helper function for session management

  2. Security
    - Maintain user data isolation
    - Enable proper game state persistence
    - Allow session creation and updates
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own game sessions" ON game_sessions;
DROP POLICY IF EXISTS "Users can update their own game sessions" ON game_sessions;
DROP POLICY IF EXISTS "Users can read their own game sessions" ON game_sessions;

-- Create comprehensive policies
CREATE POLICY "Users can manage their own game sessions"
  ON game_sessions
  FOR ALL
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

-- Create function to handle game session upserts
CREATE OR REPLACE FUNCTION upsert_game_session(
  p_character_id uuid,
  p_current_scene jsonb,
  p_game_state jsonb
) RETURNS uuid AS $$
DECLARE
  v_session_id uuid;
BEGIN
  -- Check if user owns the character
  IF NOT EXISTS (
    SELECT 1 FROM characters
    WHERE id = p_character_id
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Character not found or access denied';
  END IF;

  -- Try to update existing session
  UPDATE game_sessions
  SET 
    current_scene = p_current_scene,
    game_state = p_game_state,
    updated_at = CURRENT_TIMESTAMP
  WHERE character_id = p_character_id
  RETURNING id INTO v_session_id;

  -- If no session exists, create one
  IF v_session_id IS NULL THEN
    INSERT INTO game_sessions (
      character_id,
      current_scene,
      game_state
    ) VALUES (
      p_character_id,
      p_current_scene,
      p_game_state
    )
    RETURNING id INTO v_session_id;
  END IF;

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;