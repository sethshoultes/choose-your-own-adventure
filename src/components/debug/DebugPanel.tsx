/**
 * Debug Panel Component
 * 
 * This component provides a real-time debug interface for the AdventureBuildr game engine.
 * It displays debug logs, system state, and provides debugging controls during development
 * and testing. The panel integrates with the DebugManager to provide comprehensive
 * visibility into the application's behavior.
 * 
 * Key Features:
 * - Real-time log display
 * - Log level filtering
 * - Log clearing
 * - Debug state visibility
 * - Collapsible interface
 * 
 * Data Flow:
 * 1. Debug state subscription
 * 2. Log entry reception
 * 3. Visual update
 * 4. User interaction handling
 * 5. State persistence
 * 
 * @see DebugManager for debug state management
 * @see DebugToggle for visibility control
 */

import React from 'react';
import { Bug, X, Trash2, AlertCircle, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { useDebugStore } from '../../core/debug/DebugManager';

export function DebugPanel() {
  /** Get debug state and actions from store */
  const { enabled, logs, clearLogs } = useDebugStore();
  
  /** Early return if debug mode is disabled */
  if (!enabled) return null;

  /**
   * Gets the appropriate icon for log type
   * 
   * @param type Log entry type
   * @returns Icon component for the log type
   */
  const getIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="fixed bottom-24 right-4 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
      {/* Panel Header */}
      <div className="p-3 border-b flex items-center justify-between bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-gray-600" />
          <h3 className="text-sm font-medium text-gray-700">Debug Console</h3>
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
            {logs.length} entries
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearLogs}
            className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-red-600 transition-colors"
            title="Clear logs"
          >
            <Trash2 className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => useDebugStore.getState().toggleDebug()}
            className="p-1 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
      
      {/* Log Display */}
      <div className="h-64 overflow-y-auto p-3 space-y-2 text-sm">
        {logs.map((log, index) => (
          <div
            key={index}
            className="flex items-start gap-2 p-2 rounded bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            {getIcon(log.type)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-gray-700">{log.message}</span>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
              {log.data && (
                <pre className="mt-1 text-xs bg-white p-2 rounded overflow-x-auto">
                  {JSON.stringify(log.data, null, 2)}
                </pre>
              )}
            </div>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            No logs yet
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Integration Points:
 * 
 * 1. App Component
 *    ```typescript
 *    // In App.tsx
 *    function App() {
 *      return (
 *        <div>
 *          <DebugToggle />
 *          <DebugPanel />
 *          {/* Other components *\/}
 *        </div>
 *      );
 *    }
 *    ```
 * 
 * 2. Debug Manager
 *    ```typescript
 *    // In DebugManager.ts
 *    debugManager.log('Operation started', 'info', {
 *      details: 'Operation details',
 *      timestamp: new Date().toISOString()
 *    });
 *    ```
 * 
 * 3. Game Engine
 *    ```typescript
 *    // In GameEngine.ts
 *    try {
 *      await this.processChoice(choice);
 *      debugManager.log('Choice processed', 'success', { choice });
 *    } catch (error) {
 *      debugManager.log('Error processing choice', 'error', { error });
 *    }
 *    ```
 * 
 * Usage Examples:
 * ```typescript
 * // Basic debug panel
 * function DevTools() {
 *   return (
 *     <>
 *      <DebugToggle />
 *      <DebugPanel />
 *     </>
 *   );
 * }
 * 
 * // With custom positioning
 * function CustomDebugPanel() {
 *   return (
 *     <div className="custom-position">
 *       <DebugPanel />
 *     </div>
 *   );
 * }
 * ```
 * 
 * Error Handling:
 * ```typescript
 * function SafeDebugPanel() {
 *   try {
 *     return <DebugPanel />;
 *   } catch (error) {
 *     console.error('Debug panel error:', error);
 *     return null;
 *   }
 * }
 * ```
 * 
 * Best Practices:
 * 1. Keep logs focused and relevant
 * 2. Use appropriate log levels
 * 3. Include context in logs
 * 4. Clean sensitive data
 * 5. Limit log history
 * 
 * Performance Considerations:
 * 1. Limit log entry count
 * 2. Optimize re-renders
 * 3. Clean up old logs
 * 4. Handle large data sets
 * 5. Manage memory usage
 * 
 * The panel works alongside the DebugToggle component to provide comprehensive
 * debugging capabilities during development and testing.
 * 
 * @see DebugManager for state management
 * @see DebugToggle for visibility control
 * @see GameEngine for debug integration
 */