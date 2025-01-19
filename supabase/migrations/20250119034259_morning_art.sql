/*
  # Fix Choice Tracking

  1. Changes
    - Add trigger to track choices in game_history
    - Add function to get total choices made
    - Add function to check achievement progress
  
  2. Security
    - All functions are SECURITY DEFINER
    - RLS policies already in place
*/

-- Create function to track choices
CREATE OR REPLACE FUNCTION track_game_choice()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment choice count in user_stats
  INSERT INTO user_stats (
    user_id,
    choices_made,
    updated_at
  )
  SELECT 
    c.user_id,
    1,
    CURRENT_TIMESTAMP
  FROM game_sessions gs
  JOIN characters c ON c.id = gs.character_id
  WHERE gs.id = NEW.session_id
  ON CONFLICT (user_id) 
  DO UPDATE SET
    choices_made = user_stats.choices_made + 1,
    updated_at = CURRENT_TIMESTAMP;

  -- Check for achievements
  PERFORM check_achievement_requirements(
    (SELECT c.user_id 
     FROM game_sessions gs
     JOIN characters c ON c.id = gs.character_id
     WHERE gs.id = NEW.session_id),
    'DECISION_MAKER'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for choice tracking
DROP TRIGGER IF EXISTS on_game_choice_made ON game_history;
CREATE TRIGGER on_game_choice_made
  AFTER INSERT ON game_history
  FOR EACH ROW
  EXECUTE FUNCTION track_game_choice();

-- Create function to get total choices
CREATE OR REPLACE FUNCTION get_total_choices(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  v_total integer;
BEGIN
  SELECT choices_made INTO v_total
  FROM user_stats
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(v_total, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;