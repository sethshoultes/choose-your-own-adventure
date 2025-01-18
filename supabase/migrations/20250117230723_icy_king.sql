/*
  # Fix Game Sessions RLS Policies

  1. Changes
    - Drop existing game sessions policy
    - Create new comprehensive policy for upserts
    - Add explicit insert policy
    - Add explicit update policy
    - Add explicit select policy

  2. Security
    - Maintain user data isolation
    - Allow proper game state management
    - Enable session updates and upserts
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Users can manage their own game sessions" ON game_sessions;

-- Create separate policies for each operation
CREATE POLICY "Users can insert their own game sessions"
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

CREATE POLICY "Users can update their own game sessions"
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

CREATE POLICY "Users can read their own game sessions"
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

-- Create function to ensure game session exists
CREATE OR REPLACE FUNCTION ensure_game_session_exists(p_character_id uuid)
RETURNS uuid AS $$
DECLARE
  v_session_id uuid;
BEGIN
  -- Try to get existing session
  SELECT id INTO v_session_id
  FROM game_sessions
  WHERE character_id = p_character_id;
  
  -- If no session exists, create one
  IF v_session_id IS NULL THEN
    INSERT INTO game_sessions (
      character_id,
      current_scene,
      game_state
    ) VALUES (
      p_character_id,
      jsonb_build_object(
        'id', 'initial',
        'description', 'Starting your adventure...',
        'choices', '[]'::jsonb
      ),
      jsonb_build_object(
        'currentScene', jsonb_build_object(
          'id', 'initial',
          'description', 'Starting your adventure...',
          'choices', '[]'::jsonb
        ),
        'history', '[]'::jsonb,
        'gameOver', false
      )
    )
    RETURNING id INTO v_session_id;
  END IF;
  
  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;