/*
  # Add character details columns

  1. Changes
    - Add attributes column to characters table
    - Add equipment column to characters table
    - Add backstory column to characters table
    - Add trigger to automatically create profile on user creation
  
  2. Security
    - Maintain existing RLS policies
*/

-- Add JSON columns to characters table
ALTER TABLE characters ADD COLUMN IF NOT EXISTS attributes jsonb;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS equipment jsonb;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS backstory text;

-- Create a function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, username)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ language plpgsql security definer;

-- Create a trigger to automatically create a profile for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();