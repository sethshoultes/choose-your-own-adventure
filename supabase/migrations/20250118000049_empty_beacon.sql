-- Create function to safely handle API credentials upsert
CREATE OR REPLACE FUNCTION upsert_api_credentials(
  p_user_id uuid,
  p_openai_key text,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS void AS $$
BEGIN
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
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    openai_key = EXCLUDED.openai_key,
    metadata = api_credentials.metadata || EXCLUDED.metadata,
    updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;