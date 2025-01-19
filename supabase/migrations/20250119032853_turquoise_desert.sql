/*
  # Fix User Stats RLS and Tracking

  1. Add RLS Policies
    - Enable RLS on user_stats table
    - Add policies for user operations
  
  2. Add Functions
    - Add function to safely update user stats
    - Add function to get user stats
*/

-- Enable RLS on user_stats
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for user_stats
CREATE POLICY "Users can read own stats"
  ON user_stats
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
  ON user_stats
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
  ON user_stats
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create function to safely update user stats
CREATE OR REPLACE FUNCTION update_user_stats(
  p_user_id uuid,
  p_choices_made integer DEFAULT NULL,
  p_stories_completed integer DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO user_stats (
    user_id,
    choices_made,
    stories_completed,
    updated_at
  ) VALUES (
    p_user_id,
    COALESCE(p_choices_made, 0),
    COALESCE(p_stories_completed, 0),
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    choices_made = CASE
      WHEN p_choices_made IS NOT NULL THEN p_choices_made
      ELSE user_stats.choices_made
    END,
    stories_completed = CASE
      WHEN p_stories_completed IS NOT NULL THEN p_stories_completed
      ELSE user_stats.stories_completed
    END,
    updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;