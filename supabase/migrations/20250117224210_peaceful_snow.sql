/*
  # Admin Features and Improvements

  1. New Features
    - Admin role and permissions
    - Audit logging
    - System configuration
    - Analytics tracking

  2. Security
    - Admin role policies
    - Audit trail
    - Enhanced RLS policies

  3. Improvements
    - Performance optimizations
    - Additional indexes
    - Monitoring capabilities
*/

-- Create admin roles
CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');

-- Add role to profiles
ALTER TABLE profiles
ADD COLUMN role user_role DEFAULT 'user'::user_role;

-- Create system_config table
CREATE TABLE system_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Create analytics table
CREATE TABLE analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  event_data jsonb NOT NULL,
  user_id uuid REFERENCES auth.users ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Admin policies for system_config
CREATE POLICY "Admins can manage system config"
  ON system_config
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'::user_role
  ));

-- Admin policies for audit_logs
CREATE POLICY "Admins can view audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'::user_role
  ));

-- Admin policies for analytics
CREATE POLICY "Admins can view analytics"
  ON analytics
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'::user_role
  ));

CREATE POLICY "Insert analytics events"
  ON analytics
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create audit logging function
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
  _user_id uuid;
  _ip_address text;
BEGIN
  -- Get current user ID
  SELECT auth.uid() INTO _user_id;
  
  -- Get IP address from request headers
  _ip_address := current_setting('request.headers', true)::jsonb->>'x-forwarded-for';
  
  INSERT INTO audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    old_data,
    new_data,
    ip_address
  ) VALUES (
    _user_id,
    TG_OP,
    TG_TABLE_NAME,
    CASE
      WHEN TG_OP = 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    CASE
      WHEN TG_OP = 'UPDATE' OR TG_OP = 'DELETE'
      THEN to_jsonb(OLD)
      ELSE NULL
    END,
    CASE
      WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE'
      THEN to_jsonb(NEW)
      ELSE NULL
    END,
    _ip_address
  );
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit log triggers
CREATE TRIGGER audit_characters
  AFTER INSERT OR UPDATE OR DELETE ON characters
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_game_sessions
  AFTER INSERT OR UPDATE OR DELETE ON game_sessions
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_api_credentials
  AFTER INSERT OR UPDATE OR DELETE ON api_credentials
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- Create analytics tracking function
CREATE OR REPLACE FUNCTION track_analytics_event(
  event_type text,
  event_data jsonb
) RETURNS void AS $$
BEGIN
  INSERT INTO analytics (event_type, event_data, user_id)
  VALUES (event_type, event_data, auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add indexes for better query performance
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_analytics_event_type ON analytics(event_type);
CREATE INDEX idx_analytics_created_at ON analytics(created_at);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Insert default system configuration
INSERT INTO system_config (key, value, description) VALUES
  ('rate_limits', '{"requests_per_minute": 60, "tokens_per_minute": 4000}'::jsonb, 'API rate limiting configuration'),
  ('openai_config', '{"model": "gpt-4", "temperature": 0.8, "max_tokens": 1000}'::jsonb, 'OpenAI API configuration'),
  ('feature_flags', '{"achievements_enabled": true, "social_features_enabled": false}'::jsonb, 'Feature toggle configuration');

-- Grant first user admin role
UPDATE profiles
SET role = 'admin'::user_role
WHERE id IN (
  SELECT id FROM profiles
  ORDER BY created_at
  LIMIT 1
);

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id
    AND role = 'admin'::user_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;