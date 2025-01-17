/*
  # Simplify profile handling

  1. Changes
    - Remove all triggers except new user creation
    - Simplify ensure_profile_exists function
    - Remove unnecessary checks and recursion
  
  2. Security
    - Maintain security definer for functions
    - Keep RLS intact
*/

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS ensure_profile_exists_trigger ON profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_profile_access();

-- Create a simple function to handle new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, username)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ language plpgsql security definer;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create a simple function to ensure profile exists
CREATE OR REPLACE FUNCTION ensure_profile_exists(user_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO profiles (id, username)
  SELECT user_id, email
  FROM auth.users
  WHERE id = user_id
  ON CONFLICT (id) DO NOTHING;
END;
$$ language plpgsql security definer;