/*
  # Add admin user

  1. Changes
    - Updates the first user to be an admin
    - Adds admin role to profiles table if not exists
*/

-- First ensure the user_role type exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');
  END IF;
END $$;

-- Add role column if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'user'::user_role;
  END IF;
END $$;

-- Update the first user to be an admin
UPDATE profiles
SET role = 'admin'::user_role
WHERE id IN (
  SELECT id FROM profiles
  ORDER BY created_at
  LIMIT 1
);