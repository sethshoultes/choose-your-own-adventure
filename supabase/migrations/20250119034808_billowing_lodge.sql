/*
  # Fix Game History Function Parameters

  1. Changes
    - Update track_game_history function parameter order
    - Add parameter validation
    - Improve error handling

  2. Security
    - Maintain RLS policies
    - Keep security definer
*/

-- Drop existing function
DROP FUNCTION IF EXISTS track_game_history(uuid, text, text);

-- Recreate with proper parameter order and validation
CREATE OR REPLACE FUNCTION track_game_history(
  p_scene_description text,
  p_player_choice text,
  p_session_id uuid
) RETURNS uuid AS $$
DECLARE
  v_history_id uuid;
  v_user_id uuid;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate parameters
  IF p_session_id IS NULL THEN
    RAISE EXCEPTION 'Session ID is required';
  END IF;

  IF p_scene_description IS NULL OR p_player_choice IS NULL THEN
    RAISE EXCEPTION 'Scene description and player choice are required';
  END IF;

  -- Verify user owns the session
  IF NOT EXISTS (
    SELECT 1 
    FROM game_sessions gs
    JOIN characters c ON c.id = gs.character_id
    WHERE gs.id = p_session_id
    AND c.user_id = v_user_id
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

  -- Increment choice count
  PERFORM increment_choice_count(v_user_id);

  RETURN v_history_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;