/*
  # Add metadata column to api_credentials

  1. Changes
    - Add metadata column to api_credentials table
    - Update existing policies to include metadata
    - Add index for faster metadata queries

  2. Security
    - Maintain existing RLS policies
    - Add metadata to policy checks
*/

-- Add metadata column to api_credentials
ALTER TABLE api_credentials
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Create index for metadata queries
CREATE INDEX IF NOT EXISTS idx_api_credentials_metadata ON api_credentials USING gin (metadata);

-- Update policies to include metadata
DROP POLICY IF EXISTS "Users can read own API credentials" ON api_credentials;
DROP POLICY IF EXISTS "Users can insert own API credentials" ON api_credentials;
DROP POLICY IF EXISTS "Users can update own API credentials" ON api_credentials;

-- Recreate policies with metadata support
CREATE POLICY "Users can read own API credentials"
  ON api_credentials FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own API credentials"
  ON api_credentials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API credentials"
  ON api_credentials FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add trigger to ensure metadata is always a valid JSON object
CREATE OR REPLACE FUNCTION ensure_valid_metadata()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.metadata IS NULL THEN
    NEW.metadata := '{}'::jsonb;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_api_credentials_metadata
  BEFORE INSERT OR UPDATE ON api_credentials
  FOR EACH ROW
  EXECUTE FUNCTION ensure_valid_metadata();