/*
  # Fix profile handling and triggers

  1. Changes
    - Simplify profile creation logic
    - Remove recursive triggers
    - Add direct profile creation function
    - Update handle_new_user function
  
  2. Security
    - Maintain security definer for functions
    - Keep RLS intact
*/

-- Update the handle_new_user function to be simpler
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, username)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ language plpgsql security definer;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create a simpler function to ensure profile exists
CREATE OR REPLACE FUNCTION ensure_profile_exists(user_id uuid)
RETURNS void AS $$
DECLARE
  user_email text;
BEGIN
  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM profiles WHERE id = user_id) THEN
    RETURN;
  END IF;

  -- Get user email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id;

  -- Create profile if it doesn't exist
  INSERT INTO profiles (id, username)
  VALUES (user_id, COALESCE(user_email, 'user-' || user_id::text))
  ON CONFLICT (id) DO NOTHING;
END;
$$ language plpgsql security definer;