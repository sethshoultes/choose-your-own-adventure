/*
  # Add Achievement Tracking

  1. New Functions
    - track_game_history: Records game choices and unlocks achievements
    
  2. Changes
    - Adds transaction handling
    - Adds achievement unlocking
    - Updates user stats
    
  3. Security
    - Function is security definer
    - Only authenticated users can execute
*/

-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS track_game_history(text, text, uuid);
DROP FUNCTION IF EXISTS track_game_history(uuid, text, text);

-- Create improved function with proper transaction handling
CREATE OR REPLACE FUNCTION track_game_history(
  p_session_id uuid,
  p_scene_description text,
  p_player_choice text
) RETURNS uuid AS $$
DECLARE
  v_history_id uuid;
  v_user_id uuid;
  v_current_choices integer;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Start transaction
  BEGIN
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

    -- Get current choice count
    SELECT choices_made INTO v_current_choices
    FROM user_stats
    WHERE user_id = v_user_id;

    -- Initialize or increment choice count
    IF v_current_choices IS NULL THEN
      INSERT INTO user_stats (
        user_id,
        choices_made,
        updated_at
      ) VALUES (
        v_user_id,
        1,
        CURRENT_TIMESTAMP
      );
      v_current_choices := 1;
    ELSE
      UPDATE user_stats
      SET 
        choices_made = choices_made + 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = v_user_id;
      v_current_choices := v_current_choices + 1;
    END IF;

    -- Check for achievement unlock
    IF v_current_choices >= 100 THEN
      INSERT INTO achievements (
        user_id,
        achievement_type,
        title,
        description,
        unlocked_at
      ) VALUES (
        v_user_id,
        'DECISION_MAKER',
        'Decision Maker',
        'Make 100 choices',
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (user_id, achievement_type) DO NOTHING;
    END IF;

    -- Return the history ID
    RETURN v_history_id;
  EXCEPTION WHEN OTHERS THEN
    -- Rollback transaction on error
    RAISE EXCEPTION 'Failed to track game history: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION track_game_history(uuid, text, text) TO authenticated;