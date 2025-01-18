-- Drop existing function if it exists
DROP FUNCTION IF EXISTS upsert_api_credentials;

-- Create improved function to safely handle API credentials upsert
CREATE OR REPLACE FUNCTION upsert_api_credentials(
  p_user_id uuid,
  p_openai_key text,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS void AS $$
DECLARE
  v_existing_record api_credentials%ROWTYPE;
BEGIN
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Get existing record if any
  SELECT * INTO v_existing_record
  FROM api_credentials
  WHERE user_id = p_user_id;

  IF v_existing_record.id IS NULL THEN
    -- Insert new record
    INSERT INTO api_credentials (
      user_id,
      openai_key,
      metadata,
      updated_at
    ) VALUES (
      p_user_id,
      p_openai_key,
      COALESCE(p_metadata, '{}'::jsonb),
      CURRENT_TIMESTAMP
    );
  ELSE
    -- Update existing record
    UPDATE api_credentials
    SET 
      openai_key = p_openai_key,
      metadata = COALESCE(v_existing_record.metadata, '{}'::jsonb) || COALESCE(p_metadata, '{}'::jsonb),
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;