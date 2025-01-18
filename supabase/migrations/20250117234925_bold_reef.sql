/*
  # Checkpoint Alpha - Game State Management

  This migration creates a checkpoint before implementing OpenAI realtime sessions.
  It ensures we can track and rollback changes if needed.

  1. Game Sessions
    - Adds session_version column for tracking API versions
    - Adds metadata column for additional session data
    - Adds checkpoint column for state restoration
  
  2. Changes
    - Adds version tracking to game sessions
    - Preserves existing game state
    - Enables future API version migrations
*/

-- Add version tracking to game sessions
ALTER TABLE game_sessions
ADD COLUMN IF NOT EXISTS session_version text DEFAULT 'v1',
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS checkpoint jsonb;

-- Create index for version queries
CREATE INDEX IF NOT EXISTS idx_game_sessions_version ON game_sessions(session_version);

-- Create function to handle version updates
CREATE OR REPLACE FUNCTION handle_session_version_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Store the previous state as a checkpoint before version changes
  IF NEW.session_version IS DISTINCT FROM OLD.session_version THEN
    NEW.checkpoint = jsonb_build_object(
      'version', OLD.session_version,
      'state', OLD.game_state,
      'scene', OLD.current_scene,
      'updated_at', OLD.updated_at
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for version changes
CREATE TRIGGER on_session_version_change
  BEFORE UPDATE ON game_sessions
  FOR EACH ROW
  WHEN (NEW.session_version IS DISTINCT FROM OLD.session_version)
  EXECUTE FUNCTION handle_session_version_update();

-- Update existing sessions to current version
UPDATE game_sessions
SET session_version = 'v1',
    metadata = jsonb_build_object(
      'api_type', 'chat_completions',
      'created_at', created_at
    )
WHERE session_version IS NULL;