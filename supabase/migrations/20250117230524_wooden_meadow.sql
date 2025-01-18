/*
  # Fix Game Sessions RLS Policies

  1. Changes
    - Drop existing game sessions policies
    - Create new, more permissive policies for game sessions
    - Add upsert policy for game sessions
    - Add delete policy for game sessions

  2. Security
    - Maintain user data isolation
    - Allow proper game state management
    - Enable session updates
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own game sessions" ON game_sessions;
DROP POLICY IF EXISTS "Users can update their own game sessions" ON game_sessions;
DROP POLICY IF EXISTS "Users can read their own game sessions" ON game_sessions;

-- Create new policies
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

-- Create function to handle game session updates
CREATE OR REPLACE FUNCTION handle_game_session_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the updated_at timestamp
  NEW.updated_at = CURRENT_TIMESTAMP;
  
  -- Insert into game_history if the scene has changed
  IF (OLD.current_scene IS DISTINCT FROM NEW.current_scene) THEN
    INSERT INTO game_history (
      session_id,
      scene_description,
      player_choice
    ) VALUES (
      NEW.id,
      NEW.current_scene->>'description',
      COALESCE(NEW.game_state->'history'->-1->>'choice', 'Scene started')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS on_game_session_update ON game_sessions;
CREATE TRIGGER on_game_session_update
  BEFORE UPDATE ON game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION handle_game_session_update();