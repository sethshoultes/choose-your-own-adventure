/*
  # Consolidated Database Schema

  1. Core Tables
    - `profiles`: User profiles and preferences
    - `characters`: Character data and attributes
    - `game_sessions`: Active game sessions and state
    - `game_history`: Historical game choices and outcomes
    - `api_credentials`: OpenAI API key storage
    - `progression_history`: Character progression tracking
    - `achievements`: Player achievements
    - `audit_logs`: System audit logging
    - `system_config`: System configuration storage

  2. Core Functions
    - Character progression tracking
    - Game session management
    - Achievement tracking
    - API credential management
    - Profile management
    - Admin status checking

  3. Changes
    - Removed RLS policies
    - Consolidated progression functions
    - Optimized indexes
    - Improved error handling
*/

-- Create custom types
DO $$ BEGIN
  CREATE TYPE session_status AS ENUM ('active', 'paused', 'completed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create tables
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  display_name text,
  avatar_url text,
  role text DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS api_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  openai_key text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb,
  CONSTRAINT api_credentials_user_id_key UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  genre text NOT NULL,
  attributes jsonb NOT NULL DEFAULT '[]'::jsonb,
  equipment jsonb NOT NULL DEFAULT '[]'::jsonb,
  backstory text,
  experience_points integer DEFAULT 0,
  level integer DEFAULT 1,
  attribute_points integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  current_scene jsonb NOT NULL,
  game_state jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  session_version text,
  metadata jsonb,
  checkpoint jsonb,
  status session_status NOT NULL DEFAULT 'active',
  session_id uuid
);

CREATE TABLE IF NOT EXISTS game_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  scene_description text NOT NULL,
  player_choice text NOT NULL,
  created_at timestamptz DEFAULT now(),
  metadata jsonb
);

CREATE TABLE IF NOT EXISTS progression_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  xp_amount integer NOT NULL,
  source text NOT NULL,
  level_before integer,
  level_after integer,
  attribute_changes jsonb,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  unlocked_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS system_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_game_sessions_character ON game_sessions(character_id);
CREATE INDEX IF NOT EXISTS idx_game_history_session ON game_history(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_history_character ON game_history(character_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_progression_history_character ON progression_history(character_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id, achievement_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Create functions
CREATE OR REPLACE FUNCTION get_api_credentials(
  p_user_id uuid
) RETURNS TABLE (
  openai_key text,
  metadata jsonb
) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT ac.openai_key, ac.metadata
  FROM api_credentials ac
  WHERE ac.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_or_create_profile(
  p_user_id uuid
) RETURNS TABLE (
  username text,
  role text,
  created_at timestamptz,
  updated_at timestamptz
) SECURITY DEFINER AS $$
DECLARE
  v_username text;
BEGIN
  -- First try to get existing profile
  SELECT p.username INTO v_username
  FROM profiles p
  WHERE p.id = p_user_id;

  -- If no profile exists, create one
  IF v_username IS NULL THEN
    INSERT INTO profiles (
      id,
      username,
      role,
      created_at,
      updated_at
    )
    VALUES (
      p_user_id,
      'user-' || substr(p_user_id::text, 1, 8),
      'user',
      now(),
      now()
    );
  END IF;

  -- Return the profile data
  RETURN QUERY
  SELECT 
    p.username,
    p.role,
    p.created_at,
    p.updated_at
  FROM profiles p
  WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION is_admin(
  p_user_id uuid
) RETURNS boolean SECURITY DEFINER AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role
  FROM profiles
  WHERE id = p_user_id;
  
  RETURN COALESCE(v_role = 'admin', false);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION upsert_api_credentials(
  p_user_id uuid,
  p_openai_key text,
  p_metadata jsonb DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Insert or update credentials
  INSERT INTO api_credentials (
    user_id,
    openai_key,
    metadata,
    updated_at
  ) VALUES (
    p_user_id,
    p_openai_key,
    COALESCE(p_metadata, '{}'::jsonb),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    openai_key = EXCLUDED.openai_key,
    metadata = COALESCE(api_credentials.metadata, '{}'::jsonb) || COALESCE(EXCLUDED.metadata, '{}'::jsonb),
    updated_at = now()
  RETURNING jsonb_build_object(
    'status', CASE WHEN xmax::text::int > 0 THEN 'updated' ELSE 'created' END,
    'timestamp', updated_at
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION safe_handle_game_session(
  p_character_id uuid,
  p_current_scene jsonb,
  p_game_state jsonb,
  p_metadata jsonb DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_session_id uuid;
  v_result jsonb;
BEGIN
  -- Try to update existing active session
  UPDATE game_sessions
  SET 
    current_scene = COALESCE(p_current_scene, current_scene),
    game_state = COALESCE(p_game_state, game_state),
    metadata = COALESCE(metadata, '{}'::jsonb) || COALESCE(p_metadata, '{}'::jsonb),
    updated_at = now()
  WHERE character_id = p_character_id
  AND status = 'active'
  RETURNING id INTO v_session_id;

  -- If no active session exists, create one
  IF v_session_id IS NULL THEN
    -- First, mark any existing sessions as paused
    UPDATE game_sessions
    SET status = 'paused',
        updated_at = now()
    WHERE character_id = p_character_id
    AND status = 'active';

    -- Then create new active session
    INSERT INTO game_sessions (
      character_id,
      current_scene,
      game_state,
      status,
      metadata
    ) VALUES (
      p_character_id,
      COALESCE(p_current_scene, '{}'::jsonb),
      COALESCE(p_game_state, '{}'::jsonb),
      'active',
      COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object(
        'created_at', now(),
        'status_history', jsonb_build_array(
          jsonb_build_object(
            'status', 'active',
            'timestamp', now()
          )
        )
      )
    )
    RETURNING id INTO v_session_id;
  END IF;

  -- Build result object
  SELECT jsonb_build_object(
    'session_id', v_session_id,
    'character_id', p_character_id,
    'status', gs.status,
    'version', gs.session_version,
    'metadata', gs.metadata,
    'has_checkpoint', (gs.checkpoint IS NOT NULL)
  ) INTO v_result
  FROM game_sessions gs
  WHERE gs.id = v_session_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION track_progression(
  p_character_id uuid,
  p_action_type text,
  p_xp_amount integer,
  p_source text,
  p_metadata jsonb DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_character_data record;
  v_new_xp integer;
  v_new_level integer;
  v_attribute_points integer;
  v_result jsonb;
BEGIN
  -- Get current character data
  SELECT 
    COALESCE(c.experience_points, 0) as current_xp,
    COALESCE(c.level, 1) as current_level,
    COALESCE(c.attribute_points, 0) as current_points
  INTO v_character_data
  FROM characters c
  WHERE c.id = p_character_id;

  -- Calculate new values
  v_new_xp := v_character_data.current_xp + p_xp_amount;
  v_new_level := calculate_level_for_xp(v_new_xp);
  
  -- Calculate attribute points if leveled up
  IF v_new_level > v_character_data.current_level THEN
    v_attribute_points := GREATEST(2, FLOOR(v_new_level / 5) + 1);
  ELSE
    v_attribute_points := 0;
  END IF;

  -- Update character
  UPDATE characters
  SET 
    experience_points = v_new_xp,
    level = v_new_level,
    attribute_points = COALESCE(attribute_points, 0) + v_attribute_points,
    updated_at = now()
  WHERE id = p_character_id;

  -- Record progression event
  INSERT INTO progression_history (
    character_id,
    action_type,
    xp_amount,
    source,
    level_before,
    level_after,
    metadata
  ) VALUES (
    p_character_id,
    p_action_type,
    p_xp_amount,
    p_source,
    v_character_data.current_level,
    v_new_level,
    COALESCE(p_metadata, '{}'::jsonb)
  );

  -- Build result
  v_result := jsonb_build_object(
    'old_xp', v_character_data.current_xp,
    'new_xp', v_new_xp,
    'old_level', v_character_data.current_level,
    'new_level', v_new_level,
    'attribute_points_gained', v_attribute_points,
    'timestamp', now()
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_level_for_xp(
  p_xp integer
) RETURNS integer AS $$
DECLARE
  v_level integer := 1;
  v_xp_required integer := 1000;
BEGIN
  WHILE p_xp >= v_xp_required LOOP
    v_level := v_level + 1;
    v_xp_required := FLOOR(v_xp_required * 1.5);
  END LOOP;
  
  RETURN v_level;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION calculate_xp_requirements(
  p_start_level integer,
  p_end_level integer
) RETURNS TABLE (
  level integer,
  xp_required integer,
  total_xp integer
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE level_calc AS (
    -- Base case
    SELECT 
      p_start_level as level,
      1000 as base_xp,
      FLOOR(1000 * POWER(1.5, p_start_level - 1)) as xp_required,
      FLOOR(1000 * (POWER(1.5, p_start_level - 1) - 1) / 0.5) as total_xp
    
    UNION ALL
    
    -- Recursive case
    SELECT 
      level + 1,
      base_xp,
      FLOOR(base_xp * POWER(1.5, level)) as xp_required,
      total_xp + FLOOR(base_xp * POWER(1.5, level)) as total_xp
    FROM level_calc
    WHERE level < p_end_level
  )
  SELECT level, xp_required, total_xp
  FROM level_calc;
END;
$$ LANGUAGE plpgsql IMMUTABLE;