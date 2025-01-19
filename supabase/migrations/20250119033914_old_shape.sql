/*
  # Initialize User Stats

  1. Changes
    - Add trigger to initialize user_stats on user creation
    - Add function to safely increment choice count
    - Add function to get current choice count
  
  2. Security
    - All functions are SECURITY DEFINER
    - RLS policies already in place
*/

-- Create function to initialize user stats
CREATE OR REPLACE FUNCTION initialize_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_stats (
    user_id,
    choices_made,
    stories_completed,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    0,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to initialize stats for new users
DROP TRIGGER IF EXISTS on_auth_user_created_stats ON auth.users;
CREATE TRIGGER on_auth_user_created_stats
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_stats();

-- Create function to increment choice count
CREATE OR REPLACE FUNCTION increment_choice_count(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  v_new_count integer;
BEGIN
  INSERT INTO user_stats (
    user_id,
    choices_made,
    updated_at
  ) VALUES (
    p_user_id,
    1,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    choices_made = user_stats.choices_made + 1,
    updated_at = CURRENT_TIMESTAMP
  RETURNING choices_made INTO v_new_count;

  RETURN v_new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get current choice count
CREATE OR REPLACE FUNCTION get_choice_count(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT choices_made INTO v_count
  FROM user_stats
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;