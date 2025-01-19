/*
  # Add Game History Tracking

  1. Changes
    - Add function to track game history
    - Add proper error handling
    - Add achievement tracking
    - Add user stats updates

  2. Security
    - Enable RLS
    - Add proper security checks
    - Use SECURITY DEFINER for elevated privileges
*/

-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS track_game_history(text, text, uuid);
DROP FUNCTION IF EXISTS track_game_history(uuid, text, text);

-- Create new function with proper error handling
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

  -- Insert history entry with error handling
  BEGIN
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
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to save game history: %', SQLERRM;
  END;

  -- Update user stats with error handling
  BEGIN
    INSERT INTO user_stats (
      user_id,
      choices_made,
      updated_at
    ) VALUES (
      v_user_id,
      1,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (user_id) DO UPDATE
    SET 
      choices_made = user_stats.choices_made + 1,
      updated_at = CURRENT_TIMESTAMP;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to update user stats: %', SQLERRM;
  END;

  -- Check for achievements with error handling
  BEGIN
    IF EXISTS (
      SELECT 1 FROM user_stats
      WHERE user_id = v_user_id
      AND choices_made >= 100
    ) THEN
      -- Try to unlock DECISION_MAKER achievement
      INSERT INTO achievements (
        user_id,
        achievement_type,
        title,
        description
      ) VALUES (
        v_user_id,
        'DECISION_MAKER',
        'Decision Maker',
        'Make 100 choices'
      )
      ON CONFLICT (user_id, achievement_type) DO NOTHING;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Log achievement error but don't fail the transaction
    RAISE WARNING 'Failed to process achievements: %', SQLERRM;
  END;

  RETURN v_history_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION track_game_history(text, text, uuid) TO authenticated;