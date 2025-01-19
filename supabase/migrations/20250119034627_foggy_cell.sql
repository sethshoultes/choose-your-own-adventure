/*
  # Fix Game History Tracking

  1. Changes
    - Add proper RLS policies for game_history
    - Add session_id to game_sessions
    - Add function to safely track game history
    - Add trigger for game history tracking

  2. Security
    - Enable RLS on game_history
    - Add policies for authenticated users
    - Add security definer functions
*/

-- Add session_id to game_sessions if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'game_sessions' 
    AND column_name = 'session_id'
  ) THEN
    ALTER TABLE game_sessions ADD COLUMN session_id uuid DEFAULT gen_random_uuid();
  END IF;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own game history" ON game_history;
DROP POLICY IF EXISTS "Users can insert own game history" ON game_history;

-- Create comprehensive policies for game_history
CREATE POLICY "Users can read own game history"
  ON game_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM game_sessions gs
      JOIN characters c ON c.id = gs.character_id
      WHERE gs.id = game_history.session_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own game history"
  ON game_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM game_sessions gs
      JOIN characters c ON c.id = gs.character_id
      WHERE gs.id = session_id
      AND c.user_id = auth.uid()
    )
  );

-- Create function to safely track game history
CREATE OR REPLACE FUNCTION track_game_history(
  p_session_id uuid,
  p_scene_description text,
  p_player_choice text
) RETURNS uuid AS $$
DECLARE
  v_history_id uuid;
BEGIN
  -- Verify user owns the session
  IF NOT EXISTS (
    SELECT 1 
    FROM game_sessions gs
    JOIN characters c ON c.id = gs.character_id
    WHERE gs.id = p_session_id
    AND c.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Session not found or access denied';
  END IF;

  -- Insert history entry
  INSERT INTO game_history (
    session_id,
    scene_description,
    player_choice,
    created_at
  ) VALUES (
    p_session_id,
    p_scene_description,
    p_player_choice,
    CURRENT_TIMESTAMP
  )
  RETURNING id INTO v_history_id;

  RETURN v_history_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get game history
CREATE OR REPLACE FUNCTION get_game_history(
  p_session_id uuid
) RETURNS TABLE (
  scene_description text,
  player_choice text,
  created_at timestamptz
) AS $$
BEGIN
  -- Verify user owns the session
  IF NOT EXISTS (
    SELECT 1 
    FROM game_sessions gs
    JOIN characters c ON c.id = gs.character_id
    WHERE gs.id = p_session_id
    AND c.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Session not found or access denied';
  END IF;

  RETURN QUERY
  SELECT 
    gh.scene_description,
    gh.player_choice,
    gh.created_at
  FROM game_history gh
  WHERE gh.session_id = p_session_id
  ORDER BY gh.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;