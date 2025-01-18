/*
  # Add game session policies
  
  1. Changes
    - Add trigger for updating game_sessions timestamp
    - Add policies for game sessions table:
      - Insert policy for own sessions
      - Update policy for own sessions  
      - Read policy for own sessions

  2. Security
    - All policies require authentication
    - Policies verify character ownership through user_id
*/

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_game_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_game_sessions_timestamp ON game_sessions;
CREATE TRIGGER update_game_sessions_timestamp
  BEFORE UPDATE ON game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_game_sessions_updated_at();

-- Add policies for game_sessions
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