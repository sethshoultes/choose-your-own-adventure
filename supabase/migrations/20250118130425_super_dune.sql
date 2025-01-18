/*
  # Fix Game Session Management

  1. Changes
    - Remove unique constraint on character_id
    - Add composite unique constraint for active sessions
    - Add status column to track session state
    - Add function to handle session state transitions
    - Add trigger to manage session states

  2. Security
    - Maintain existing RLS policies
    - Add validation for state transitions

  3. Notes
    - Allows multiple sessions per character but only one active
    - Preserves game history
    - Handles concurrent session management
*/

-- Add status enum type
CREATE TYPE session_status AS ENUM ('active', 'paused', 'completed', 'archived');

-- Add status column to game_sessions
ALTER TABLE game_sessions 
ADD COLUMN status session_status NOT NULL DEFAULT 'active';

-- Drop the old unique constraint
ALTER TABLE game_sessions 
DROP CONSTRAINT IF EXISTS unique_character_session;

-- Add new composite unique constraint for active sessions
CREATE UNIQUE INDEX idx_active_game_sessions 
ON game_sessions (character_id) 
WHERE status = 'active';

-- Create function to handle session state transitions
CREATE OR REPLACE FUNCTION handle_game_session_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- If inserting or updating to active status
  IF (TG_OP = 'INSERT' AND NEW.status = 'active') OR
     (TG_OP = 'UPDATE' AND NEW.status = 'active' AND OLD.status != 'active') THEN
    -- Set all other sessions for this character to paused
    UPDATE game_sessions
    SET status = 'paused'
    WHERE character_id = NEW.character_id
    AND id != NEW.id
    AND status = 'active';
  END IF;

  -- Update the timestamp
  NEW.updated_at = CURRENT_TIMESTAMP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for session state management
DROP TRIGGER IF EXISTS on_game_session_transition ON game_sessions;
CREATE TRIGGER on_game_session_transition
  BEFORE INSERT OR UPDATE ON game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION handle_game_session_transition();

-- Update existing sessions to active status
UPDATE game_sessions SET status = 'active';

-- Add index for faster status queries
CREATE INDEX idx_game_sessions_status ON game_sessions(status);

-- Update RLS policies to handle status
DROP POLICY IF EXISTS "Users can read their own game sessions" ON game_sessions;
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

-- Add function to safely handle game session upserts
CREATE OR REPLACE FUNCTION safe_upsert_game_session(
  p_character_id uuid,
  p_current_scene jsonb,
  p_game_state jsonb
) RETURNS uuid AS $$
DECLARE
  v_session_id uuid;
BEGIN
  -- First try to update existing active session
  UPDATE game_sessions
  SET 
    current_scene = p_current_scene,
    game_state = p_game_state,
    updated_at = CURRENT_TIMESTAMP
  WHERE character_id = p_character_id
  AND status = 'active'
  RETURNING id INTO v_session_id;

  -- If no active session exists, create one
  IF v_session_id IS NULL THEN
    INSERT INTO game_sessions (
      character_id,
      current_scene,
      game_state,
      status
    ) VALUES (
      p_character_id,
      p_current_scene,
      p_game_state,
      'active'
    )
    RETURNING id INTO v_session_id;
  END IF;

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;