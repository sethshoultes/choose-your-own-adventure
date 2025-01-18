/*
  # Fix Profile Creation Flow
  
  1. Changes
    - Drop trigger before function
    - Recreate handle_new_user function
    - Add proper error handling
    - Add get_profile function
*/

-- First drop the trigger that depends on the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Now we can safely drop the function
DROP FUNCTION IF EXISTS handle_new_user();

-- Create improved handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Only try to create profile if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.id) THEN
    INSERT INTO profiles (id, username)
    VALUES (NEW.id, NEW.email);
  END IF;
  RETURN NEW;
END;
$$ language plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create function to safely get profile
CREATE OR REPLACE FUNCTION get_profile(user_id uuid)
RETURNS TABLE (
  id uuid,
  username text
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.username
  FROM profiles p
  WHERE p.id = user_id;
  
  -- Create profile if it doesn't exist
  IF NOT FOUND THEN
    INSERT INTO profiles (id, username)
    SELECT 
      user_id,
      (SELECT email FROM auth.users WHERE id = user_id)
    ON CONFLICT (id) DO NOTHING
    RETURNING id, username;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;