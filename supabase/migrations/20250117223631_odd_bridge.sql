@@ .. @@
   BEFORE UPDATE ON game_sessions
   FOR EACH ROW
   EXECUTE FUNCTION update_game_sessions_updated_at();
+
+-- Add policies for game_sessions
+CREATE POLICY "Users can insert their own game sessions"
+  ON game_sessions
+  FOR INSERT
+  TO authenticated
+  WITH CHECK (
+    EXISTS (
+      SELECT 1 FROM characters
+      WHERE characters.id = character_id
+      AND characters.user_id = auth.uid()
+    )
+  );
+
+CREATE POLICY "Users can update their own game sessions"
+  ON game_sessions
+  FOR UPDATE
+  TO authenticated
+  USING (
+    EXISTS (
+      SELECT 1 FROM characters
+      WHERE characters.id = character_id
+      AND characters.user_id = auth.uid()
+    )
+  );
+
+CREATE POLICY "Users can read their own game sessions"
+  ON game_sessions
+  FOR SELECT
+  TO authenticated
+  USING (
+    EXISTS (
+      SELECT 1 FROM characters
+      WHERE characters.id = character_id
+      AND characters.user_id = auth.uid()
+    )
+  );