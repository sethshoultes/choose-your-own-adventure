/*
  # Add Achievement System

  1. New Tables
    - `achievements`: Stores unlocked achievements for users
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `achievement_type` (text)
      - `title` (text)
      - `description` (text)
      - `unlocked_at` (timestamptz)

  2. Security
    - Enable RLS on achievements table
    - Add policies for user access
    - Add function to check achievement requirements

  3. Changes
    - Add achievement tracking to game state
    - Add XP rewards for achievements
*/

-- Drop existing table and policies if they exist
DROP TABLE IF EXISTS achievements CASCADE;

-- Create achievements table
CREATE TABLE achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  achievement_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  unlocked_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_type)
);

-- Enable RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own achievements"
  ON achievements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON achievements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create function to check achievement requirements
CREATE OR REPLACE FUNCTION check_achievement_requirements(
  p_user_id uuid,
  p_achievement_type text
) RETURNS boolean AS $$
DECLARE
  v_choices_made integer;
  v_stories_completed integer;
  v_max_attribute_level integer;
  v_unique_genres integer;
  v_unique_equipment integer;
BEGIN
  -- Get user stats
  SELECT 
    COALESCE(choices_made, 0),
    COALESCE(stories_completed, 0)
  INTO v_choices_made, v_stories_completed
  FROM user_stats
  WHERE user_id = p_user_id;

  -- Get max attribute level
  SELECT MAX(attr.value)
  INTO v_max_attribute_level
  FROM characters c,
  jsonb_to_recordset(c.attributes) AS attr(name text, value integer)
  WHERE c.user_id = p_user_id;

  -- Get unique genres
  SELECT COUNT(DISTINCT genre)
  INTO v_unique_genres
  FROM characters
  WHERE user_id = p_user_id;

  -- Get unique equipment
  SELECT COUNT(DISTINCT eq.name)
  INTO v_unique_equipment
  FROM characters c,
  jsonb_to_recordset(c.equipment) AS eq(name text)
  WHERE c.user_id = p_user_id;

  -- Check requirements based on achievement type
  RETURN CASE p_achievement_type
    WHEN 'STORY_MASTER' THEN v_stories_completed >= 10
    WHEN 'DECISION_MAKER' THEN v_choices_made >= 100
    WHEN 'ATTRIBUTE_MASTER' THEN v_max_attribute_level >= 10
    WHEN 'GENRE_EXPLORER' THEN v_unique_genres >= 3
    WHEN 'EQUIPMENT_COLLECTOR' THEN v_unique_equipment >= 10
    ELSE false
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to award achievement XP
CREATE OR REPLACE FUNCTION award_achievement_xp(
  p_user_id uuid,
  p_achievement_type text
) RETURNS void AS $$
DECLARE
  v_xp_reward integer;
BEGIN
  -- Set XP reward based on achievement type
  v_xp_reward := CASE p_achievement_type
    WHEN 'STORY_MASTER' THEN 1000
    WHEN 'DECISION_MAKER' THEN 500
    WHEN 'ATTRIBUTE_MASTER' THEN 750
    WHEN 'GENRE_EXPLORER' THEN 500
    WHEN 'EQUIPMENT_COLLECTOR' THEN 300
    ELSE 0
  END;

  -- Award XP to all character(s)
  UPDATE characters
  SET experience_points = COALESCE(experience_points, 0) + v_xp_reward
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX idx_achievements_user_id ON achievements(user_id);
CREATE INDEX idx_achievements_type ON achievements(achievement_type);
CREATE INDEX idx_achievements_unlocked ON achievements(unlocked_at);

-- Add trigger for achievement unlocks
CREATE OR REPLACE FUNCTION handle_achievement_unlock()
RETURNS TRIGGER AS $$
BEGIN
  -- Award XP when achievement is unlocked
  PERFORM award_achievement_xp(NEW.user_id, NEW.achievement_type);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_achievement_unlock
  AFTER INSERT ON achievements
  FOR EACH ROW
  EXECUTE FUNCTION handle_achievement_unlock();