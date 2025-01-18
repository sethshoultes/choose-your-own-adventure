/*
  # Fix game sessions RLS policies

  1. Changes
    - Drop and recreate game sessions policies
    - Add missing DELETE policy
    - Simplify policy conditions
    - Add proper error handling

  2. Security
    - Maintain RLS protection
    - Ensure users can only access their own game sessions
    - Add proper validation checks
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own game sessions" ON game_sessions;

-- Create comprehensive policy for all operations
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

-- Create function to safely handle game session operations
CREATE OR REPLACE FUNCTION safe_handle_game_session(
  p_character_id uuid,
  p_current_scene jsonb,
  p_game_state jsonb
) RETURNS uuid AS $$
DECLARE
  v_session_id uuid;
  v_user_id uuid;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Verify user owns the character
  IF NOT EXISTS (
    SELECT 1 FROM characters
    WHERE id = p_character_id
    AND user_id = v_user_id
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