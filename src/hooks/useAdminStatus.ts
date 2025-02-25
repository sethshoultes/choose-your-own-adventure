/**
 * Admin Status Hook
 * 
 * This custom React hook manages admin status checking in the AdventureBuildr application.
 * It provides a way to determine if the current user has admin privileges by checking
 * their role in the database. The hook handles loading states and error conditions
 * while maintaining proper authentication state.
 * 
 * Key Features:
 * - Admin status checking
 * - Loading state management
 * - Error handling
 * - Real-time status updates
 * 
 * Data Flow:
 * 1. User authentication check
 * 2. Database role verification
 * 3. Admin status determination
 * 4. State updates
 * 
 * @returns Object containing admin status, loading state, and any errors
 * 
 * @example
 * ```typescript
 * function AdminPanel() {
 *   const { isAdmin, loading, error } = useAdminStatus();
 *   
 *   if (loading) return <LoadingIndicator />;
 *   if (error) return <ErrorMessage error={error} />;
 *   if (!isAdmin) return <AccessDenied />;
 *   
 *   return <AdminDashboard />;
 * }
 * ```
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { debugManager } from '../core/debug/DebugManager';

export function useAdminStatus() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  /**
   * Checks if the current user has admin privileges
   * Verifies user authentication and role status
   */
  const checkAdminStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        debugManager.log('No user found for admin check', 'warning');
        setIsAdmin(false);
        return;
      }

      const { data, error } = await supabase
        .rpc('is_admin', { p_user_id: user.id });

      if (error) {
        debugManager.log('Error checking admin status', 'error', { error });
        throw error;
      }

      setIsAdmin(data || false);
      debugManager.log('Admin status checked', 'info', { isAdmin: data });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to check admin status';
      debugManager.log('Failed to check admin status', 'error', { error });
      setError(message);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  return { isAdmin, loading, error };
}

/**
 * Integration Points:
 * 
 * 1. Admin Components
 *    ```typescript
 *    // In TestPanel component
 *    function TestPanel() {
 *      const { isAdmin, loading } = useAdminStatus();
 *      
 *      if (loading) return <LoadingIndicator />;
 *      if (!isAdmin) return <AccessDenied />;
 *      
 *      return <AdminTestInterface />;
 *    }
 *    ```
 * 
 * 2. Navigation Guards
 *    ```typescript
 *    // In Menu component
 *    function AdminMenu() {
 *      const { isAdmin } = useAdminStatus();
 *      
 *      if (!isAdmin) return null;
 *      
 *      return (
 *        <div>
 *          <AdminMenuItems />
 *        </div>
 *      );
 *    }
 *    ```
 * 
 * 3. Feature Flags
 *    ```typescript
 *    // In DebugPanel component
 *    function DebugControls() {
 *      const { isAdmin } = useAdminStatus();
 *      
 *      return (
 *        <div>
 *          {isAdmin && (
 *            <DebugOptions />
 *          )}
 *        </div>
 *      );
 *    }
 *    ```
 * 
 * Database Integration:
 * ```sql
 * -- Admin check function
 * CREATE OR REPLACE FUNCTION is_admin(p_user_id uuid)
 * RETURNS boolean AS $$
 * DECLARE
 *   v_role text;
 * BEGIN
 *   SELECT role INTO v_role
 *   FROM profiles
 *   WHERE id = p_user_id;
 *   
 *   RETURN COALESCE(v_role = 'admin', false);
 * END;
 * $$ LANGUAGE plpgsql SECURITY DEFINER;
 * 
 * -- Profiles table
 * CREATE TABLE profiles (
 *   id uuid PRIMARY KEY REFERENCES auth.users(id),
 *   role text DEFAULT 'user'
 * );
 * ```
 * 
 * Error Handling:
 * ```typescript
 * try {
 *   const { data, error } = await supabase.rpc('is_admin');
 *   if (error) throw error;
 *   return data;
 * } catch (error) {
 *   debugManager.log('Admin check failed', 'error', { error });
 *   return false;
 * }
 * ```
 * 
 * Best Practices:
 * 1. Always handle loading states
 * 2. Provide clear error messages
 * 3. Default to non-admin
 * 4. Cache results when possible
 * 5. Log status changes
 * 
 * Security Considerations:
 * 1. Use RPC for role checks
 * 2. Implement proper RLS
 * 3. Validate on server
 * 4. Handle edge cases
 * 5. Log access attempts
 * 
 * @see Menu for navigation integration
 * @see TestPanel for admin interface
 * @see DebugPanel for debug controls
 */