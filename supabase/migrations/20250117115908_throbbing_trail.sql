/*
  # Improve profile handling

  1. Changes
    - Add default username generation
    - Improve profile creation logic
    - Add function to get or create profile
  
  2. Security
    - Maintain security definer for functions
    - Keep RLS intact
*/

-- Drop existing functions and triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS ensure_profile_exists(uuid);

-- Create function to generate default username
CREATE OR REPLACE FUNCTION generate_default_username(user_id uuid)
RETURNS text AS $$
DECLARE
  user_email text;
  base_username text;
  counter integer := 0;
  final_username text;
BEGIN
  -- Get user email
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id;

  -- Use email or generate fallback
  base_username := COALESCE(
    SPLIT_PART(user_email, '@', 1),
    'user-' || SUBSTRING(user_id::text, 1, 8)
  );

  -- Try username with increasing counter until unique
  LOOP
    final_username := CASE
      WHEN counter = 0 THEN base_username
      ELSE base_username || counter::text
    END;

    BEGIN
      INSERT INTO profiles (id, username)
      VALUES (user_id, final_username)
      ON CONFLICT DO NOTHING;
      
      IF FOUND THEN
        RETURN final_username;
      END IF;
    EXCEPTION WHEN unique_violation THEN
      -- Continue to next iteration
    END;
    
    counter := counter + 1;
    IF counter > 100 THEN
      -- Fallback if we somehow can't find a unique username
      RETURN 'user-' || user_id::text;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get or create profile
CREATE OR REPLACE FUNCTION get_or_create_profile(user_id uuid)
RETURNS TABLE (
  id uuid,
  username text,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
DECLARE
  new_username text;
BEGIN
  -- Try to return existing profile
  RETURN QUERY
  SELECT p.id, p.username, p.created_at, p.updated_at
  FROM profiles p
  WHERE p.id = user_id;

  -- If no rows returned, create profile
  IF NOT FOUND THEN
    new_username := generate_default_username(user_id);
    
    RETURN QUERY
    INSERT INTO profiles (id, username)
    VALUES (user_id, new_username)
    ON CONFLICT (id) DO UPDATE
    SET username = EXCLUDED.username
    RETURNING *;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;