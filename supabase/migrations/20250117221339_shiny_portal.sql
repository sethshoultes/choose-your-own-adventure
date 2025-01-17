/*
  # Add game sessions index and constraints

  1. Changes
    - Add index on character_id for faster lookups
    - Add unique constraint to prevent duplicate sessions
    - Add trigger to update updated_at timestamp

  2. Performance
    - Improves query performance for game state lookups
    - Ensures data consistency
*/

-- Add index for faster character lookups
CREATE INDEX IF NOT EXISTS idx_game_sessions_character_id ON game_sessions (character_id);

-- Add unique constraint to prevent duplicate sessions
ALTER TABLE game_sessions
ADD CONSTRAINT unique_character_session UNIQUE (character_id);

-- Create updated_at trigger if it doesn't exist
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