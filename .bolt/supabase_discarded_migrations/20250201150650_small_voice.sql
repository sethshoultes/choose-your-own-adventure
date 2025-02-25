@@ .. @@
 CREATE TABLE IF NOT EXISTS game_sessions (
   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
   character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
   current_scene jsonb NOT NULL,
   game_state jsonb NOT NULL,
   created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
   updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
   session_version text,
   metadata jsonb DEFAULT NULL,
-  checkpoint jsonb DEFAULT NULL,
+  checkpoint jsonb DEFAULT NULL,  -- Stores complete checkpoint data: scene, history, timestamp
   status session_status NOT NULL DEFAULT 'active',
   session_id uuid DEFAULT NULL
 );

-CREATE TABLE IF NOT EXISTS checkpoint_history (
-  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
-  session_id uuid NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
-  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
-  scene jsonb NOT NULL,
-  history jsonb NOT NULL,
-  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
-  metadata jsonb DEFAULT NULL
-);
-
 -- Create indexes
 DROP INDEX IF EXISTS idx_unique_active_session;
 CREATE UNIQUE INDEX idx_unique_active_session 
@@ .. @@
 CREATE INDEX IF NOT EXISTS idx_user_stats_user_id 
 ON user_stats(user_id);

-CREATE INDEX IF NOT EXISTS idx_checkpoint_history_session 
-ON checkpoint_history(session_id, created_at DESC);
-
-CREATE INDEX IF NOT EXISTS idx_checkpoint_history_character 
-ON checkpoint_history(character_id, created_at DESC);
-
 -- Enable Row Level Security
 ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
 ALTER TABLE api_credentials ENABLE ROW LEVEL SECURITY;
@@ .. @@
 ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
 ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
 ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
-ALTER TABLE checkpoint_history ENABLE ROW LEVEL SECURITY;
 
 -- Create RLS Policies
 DO $$ BEGIN
@@ .. @@
   CREATE POLICY "Users can view own stats" ON user_stats
     FOR SELECT TO authenticated
     USING (user_id = auth.uid());
-
-  CREATE POLICY "Users can manage own checkpoints" ON checkpoint_history
-    FOR ALL TO authenticated
-    USING (EXISTS (
-      SELECT 1 FROM characters c
-      WHERE c.id = checkpoint_history.character_id
-      AND c.user_id = auth.uid()
-    ))
-    WITH CHECK (EXISTS (
-      SELECT 1 FROM characters c
-      WHERE c.id = character_id
-      AND c.user_id = auth.uid()
-    ));
 EXCEPTION
   WHEN duplicate_object THEN NULL;
 END $$;
@@ .. @@
 CREATE OR REPLACE FUNCTION save_checkpoint(
   p_session_id uuid,
   p_scene jsonb,
-  p_history jsonb,
-  p_metadata jsonb DEFAULT NULL
+  p_history jsonb
 ) RETURNS jsonb AS $$
 DECLARE
   v_character_id uuid;
-  v_checkpoint_id uuid;
 BEGIN
   -- Get character_id from session
   SELECT character_id INTO v_character_id
@@ -  -- Save checkpoint
-  INSERT INTO checkpoint_history (
-    session_id,
-    character_id,
-    scene,
-    history,
-    metadata
-  ) VALUES (
-    p_session_id,
-    v_character_id,
-    p_scene,
-    p_history,
-    COALESCE(p_metadata, jsonb_build_object(
-      'created_at', CURRENT_TIMESTAMP,
-      'created_by', auth.uid()
-    ))
-  )
-  RETURNING id INTO v_checkpoint_id;
-
-  -- Update game session with checkpoint reference
+  -- Update game session with checkpoint data
   UPDATE game_sessions
   SET 
     checkpoint = jsonb_build_object(
-      'id', v_checkpoint_id,
       'scene', p_scene,
       'history', p_history,
       'timestamp', CURRENT_TIMESTAMP
@@ -  RETURN jsonb_build_object(
-    'checkpoint_id', v_checkpoint_id,
     'timestamp', CURRENT_TIMESTAMP,
     'session_id', p_session_id
   );
@@ .. @@
 CREATE OR REPLACE FUNCTION get_latest_checkpoint(
   p_session_id uuid
 ) RETURNS TABLE (
-  checkpoint_id uuid,
   scene jsonb,
   history jsonb,
   created_at timestamptz,
@@ -  RETURN QUERY
-  SELECT 
-    ch.id,
-    ch.scene,
-    ch.history,
-    ch.created_at,
-    ch.metadata
-  FROM checkpoint_history ch
-  WHERE ch.session_id = p_session_id
-  ORDER BY ch.created_at DESC
-  LIMIT 1;
+  SELECT
+    (gs.checkpoint->>'scene')::jsonb,
+    (gs.checkpoint->>'history')::jsonb,
+    (gs.checkpoint->>'timestamp')::timestamptz,
+    gs.metadata
+  FROM game_sessions gs
+  WHERE gs.id = p_session_id
+  AND gs.checkpoint IS NOT NULL;
 END;
 $$ LANGUAGE plpgsql SECURITY DEFINER;