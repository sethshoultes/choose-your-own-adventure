/**
 * Admin Test Panel Component
 * 
 * This component provides an administrative interface for testing OpenAI integration and game scene
 * loading in the AdventureBuildr game engine. It offers real-time response streaming, formatted
 * output display, and debugging tools for content generation testing.
 * 
 * Key Features:
 * - OpenAI integration testing
 * - Game scene loading simulation
 * - Response streaming visualization
 * - Raw and formatted response views
 * - Error handling and logging
 * 
 * Data Flow:
 * 1. Test input reception
 * 2. API request processing
 * 3. Response streaming
 * 4. Content parsing
 * 5. Display updates
 * 
 * @see OpenAIService for content generation
 * @see GameSceneLoader for scene testing
 */

import React, { useState, useCallback } from 'react';
import { Menu as MenuIcon, X, Home, User, Users, Settings, Bug, Zap, Trophy, Terminal, Bot, Dumbbell } from 'lucide-react';
import { RawResponseView } from './ResponseViews/RawResponseView';
import { FormattedResponseView } from './ResponseViews/FormattedResponseView';
import { OpenAITester } from './widgets/OpenAITester';
import { ProgressionTester } from './widgets/ProgressionTester';
import { OpenAIService } from '../../core/services/openai';
import { LoadingIndicator } from '../LoadingIndicator';
import { debugManager } from '../../core/debug/DebugManager';

/** Available test widgets */
type Widget = 'openai' | 'progression';

export function TestPanel() {
  /** Currently active test widget */
  const [activeWidget, setActiveWidget] = useState<Widget>('openai');

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Logo */}
        <div className="flex justify-center mb-4 pt-4">
          <img
            src="https://adventurebuildrstorage.storage.googleapis.com/wp-content/uploads/2024/10/11185818/AdventureBuildr-Logo-e1731351627826.png"
            alt="AdventureBuildr Logo"
            className="h-12 w-auto"
          />
        </div>
        {/* Header */}
        <div className="p-4 bg-indigo-600 text-white flex items-center gap-2">
          <Zap className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Admin Test Panel</h2>
        </div>

        {/* Widget Selector */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveWidget('openai')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeWidget === 'openai' 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>OpenAI Integration</span>
            </button>
            <button
              onClick={() => setActiveWidget('progression')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeWidget === 'progression' 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Dumbbell className="w-4 h-4" />
              <span>Progression Testing</span>
            </button>
          </div>
        </div>

        {/* Active Widget */}
        <div className="p-4">
          {activeWidget === 'openai' && <OpenAITester />}
          {activeWidget === 'progression' && <ProgressionTester />}
        </div>
      </div>
    </div>
  );
}

/**
 * Integration Points:
 * 
 * 1. OpenAI Testing
 *    ```typescript
 *    // In OpenAITester component
 *    const handleTest = async (input: string) => {
 *      const openai = new OpenAIService();
 *      await openai.generateNextScene({
 *        context: testContext,
 *        choice: input
 *      }, {
 *        onToken: updateDisplay,
 *        onComplete: showChoices,
 *        onError: handleError
 *      });
 *    };
 *    ```
 * 
 * 2. Scene Loading
 *    ```typescript
 *    // In GameSceneLoader component
 *    const loadScene = async (character: Character) => {
 *      const engine = new GameEngine();
 *      await engine.initialize();
 *      await engine.initializeGame(character.genre, character);
 *      setGameState(engine.getCurrentState());
 *    };
 *    ```
 * 
 * 3. Admin Access
 *    ```typescript
 *    // In App component
 *    function AdminRoute() {
 *      const { isAdmin } = useAdminStatus();
 *      
 *      if (!isAdmin) {
 *        return <AccessDenied />;
 *      }
 *      
 *      return <TestPanel />;
 *    }
 *    ```
 * 
 * Usage Examples:
 * ```typescript
 * // Basic test panel
 * function AdminDashboard() {
 *   return (
 *     <div>
 *       <h1>Admin Dashboard</h1>
 *       <TestPanel />
 *     </div>
 *   );
 * }
 * 
 * // With access control
 * function ProtectedTestPanel() {
 *   const { isAdmin, loading } = useAdminStatus();
 *   
 *   if (loading) return <LoadingIndicator />;
 *   if (!isAdmin) return <AccessDenied />;
 *   
 *   return <TestPanel />;
 * }
 * ```
 * 
 * Error Handling:
 * ```typescript
 * try {
 *   await runTest();
 * } catch (error) {
 *   debugManager.log('Test failed', 'error', { error });
 *   showErrorNotification('Test failed: ' + error.message);
 * }
 * ```
 * 
 * Best Practices:
 * 1. Always validate admin access
 * 2. Handle streaming errors
 * 3. Provide clear feedback
 * 4. Log test results
 * 5. Clean up resources
 * 
 * Security Considerations:
 * 1. Verify admin permissions
 * 2. Sanitize test inputs
 * 3. Rate limit requests
 * 4. Log access attempts
 * 5. Handle sensitive data
 * 
 * The panel provides essential testing capabilities for administrators
 * while maintaining proper security and access control.
 * 
 * @see OpenAIService for content generation
 * @see GameEngine for scene loading
 * @see useAdminStatus for access control
 */