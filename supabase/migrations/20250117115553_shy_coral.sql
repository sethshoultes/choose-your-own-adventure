/*
  # Fix profile creation and triggers

  1. Changes
    - Improve profile creation to handle existing users
    - Add upsert functionality for profiles
    - Fix trigger syntax for profile handling
  
  2. Security
    - Maintain existing RLS policies
*/

-- Update the handle_new_user function to use upsert
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, username)
  VALUES (
    new.id,
    COALESCE(
      (SELECT username FROM profiles WHERE id = new.id),
      new.email
    )
  )
  ON CONFLICT (id) DO UPDATE
  SET username = EXCLUDED.username
  WHERE profiles.username IS NULL;
  
  RETURN new;
END;
$$ language plpgsql security definer;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create a function to ensure profile exists
CREATE OR REPLACE FUNCTION ensure_profile_exists(user_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO profiles (id, username)
  SELECT 
    user_id,
    COALESCE(
      (SELECT email FROM auth.users WHERE id = user_id),
      'user-' || user_id::text
    )
  ON CONFLICT (id) DO NOTHING;
END;
$$ language plpgsql security definer;

-- Create a function to handle profile access
CREATE OR REPLACE FUNCTION handle_profile_access()
RETURNS trigger AS $$
BEGIN
  PERFORM ensure_profile_exists(NEW.id);
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Create trigger for profile access
DROP TRIGGER IF EXISTS ensure_profile_exists_trigger ON profiles;
CREATE TRIGGER ensure_profile_exists_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_profile_access();