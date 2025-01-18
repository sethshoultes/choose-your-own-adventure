-- Drop existing functions first
DROP FUNCTION IF EXISTS get_api_credentials(uuid);
DROP FUNCTION IF EXISTS get_or_create_profile(uuid);

-- Create function to safely get API credentials
CREATE OR REPLACE FUNCTION get_api_credentials(p_user_id uuid)
RETURNS TABLE (
  openai_key text,
  metadata jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT ac.openai_key, ac.metadata
  FROM api_credentials ac
  WHERE ac.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get or create profile with retry logic
CREATE OR REPLACE FUNCTION get_or_create_profile(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  username text,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
DECLARE
  v_retry_count int := 0;
  v_max_retries int := 3;
  v_user_email text;
  v_profile_id uuid;
  v_profile_username text;
  v_profile_created_at timestamptz;
  v_profile_updated_at timestamptz;
BEGIN
  WHILE v_retry_count < v_max_retries LOOP
    BEGIN
      -- Try to return existing profile
      SELECT p.id, p.username, p.created_at, p.updated_at
      INTO v_profile_id, v_profile_username, v_profile_created_at, v_profile_updated_at
      FROM profiles p
      WHERE p.id = p_user_id;

      IF FOUND THEN
        RETURN QUERY SELECT v_profile_id, v_profile_username, v_profile_created_at, v_profile_updated_at;
        RETURN;
      END IF;

      -- Get user email for new profile
      SELECT email INTO v_user_email
      FROM auth.users
      WHERE id = p_user_id;

      -- Create new profile
      INSERT INTO profiles (id, username)
      VALUES (p_user_id, COALESCE(v_user_email, 'user-' || p_user_id::text))
      RETURNING id, username, created_at, updated_at
      INTO v_profile_id, v_profile_username, v_profile_created_at, v_profile_updated_at;

      RETURN QUERY SELECT v_profile_id, v_profile_username, v_profile_created_at, v_profile_updated_at;
      RETURN;
    EXCEPTION WHEN unique_violation THEN
      -- Only retry on unique violations
      v_retry_count := v_retry_count + 1;
      IF v_retry_count >= v_max_retries THEN
        RAISE EXCEPTION 'Failed to create profile after % attempts', v_max_retries;
      END IF;
      -- Small delay before retry
      PERFORM pg_sleep(0.1 * v_retry_count);
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;