/**
 * Debug Management Module
 * 
 * This module provides centralized debug logging and management for the AdventureBuildr game engine.
 * It implements a Zustand store for managing debug state and provides a global debug manager instance
 * for non-React contexts. The system enables comprehensive logging, state tracking, and debug UI
 * integration while maintaining proper encapsulation of debugging functionality.
 * 
 * Key Features:
 * - Centralized debug logging
 * - Debug state management
 * - Log level control
 * - Debug UI integration
 * - Non-React context support
 * 
 * Data Flow:
 * 1. Debug event occurrence
 * 2. Log entry creation
 * 3. State update
 * 4. UI notification
 * 5. Log persistence
 * 
 * @module debug/DebugManager
 */

import { create } from 'zustand';

/** Available log types for categorizing debug messages */
export type LogType = 'info' | 'error' | 'warning' | 'success';

/** Structure for individual log entries */
export interface LogEntry {
  /** ISO timestamp of the log entry */
  timestamp: string;
  /** Type/severity of the log entry */
  type: LogType;
  /** Log message content */
  message: string;
  /** Optional additional data */
  data?: any;
}

/** Debug state management interface */
interface DebugState {
  /** Debug mode enabled state */
  enabled: boolean;
  /** Array of log entries */
  logs: LogEntry[];
  /** Toggles debug mode */
  toggleDebug: () => void;
  /** Adds a new log entry */
  log: (message: string, type?: LogType, data?: any) => void;
  /** Clears all log entries */
  clearLogs: () => void;
}

/**
 * Zustand store for managing debug state
 * Provides reactive state management for debug UI
 */
const store = create<DebugState>((set) => ({
  enabled: false,
  logs: [],
  toggleDebug: () => set((state) => ({ enabled: !state.enabled })),
  log: (message, type = 'info', data) =>
    set((state) => ({
      logs: [
        ...state.logs,
        {
          timestamp: new Date().toISOString(),
          type,
          message,
          data,
        },
      ],
    })),
  clearLogs: () => set({ logs: [] }),
}));

/**
 * Global debug manager instance for non-React contexts
 * Provides access to debug functionality outside React components
 */
export const debugManager = {
  /** Adds a new log entry */
  log: (message: string, type?: LogType, data?: any) => store.getState().log(message, type, data),
  /** Clears all log entries */
  clearLogs: () => store.getState().clearLogs(),
  /** Toggles debug mode */
  toggleDebug: () => store.getState().toggleDebug(),
  /** Gets current debug state */
  getState: () => store.getState(),
};

/** Export Zustand store for React components */
export const useDebugStore = store;

/**
 * Integration Points:
 * 
 * 1. GameEngine
 *    ```typescript
 *    // In GameEngine
 *    private async handleChoice(choiceId: number): Promise<void> {
 *      try {
 *        debugManager.log('Handling choice', 'info', { choiceId });
 *        await this.processChoice(choiceId);
 *        debugManager.log('Choice processed successfully', 'success');
 *      } catch (error) {
 *        debugManager.log('Error handling choice', 'error', { error });
 *        throw error;
 *      }
 *    }
 *    ```
 * 
 * 2. Debug Panel Component
 *    ```typescript
 *    // In DebugPanel component
 *    function DebugPanel() {
 *      const { enabled, logs, clearLogs } = useDebugStore();
 *      
 *      if (!enabled) return null;
 *      
 *      return (
 *        <div className="debug-panel">
 *          <div className="debug-controls">
 *            <button onClick={clearLogs}>Clear Logs</button>
 *          </div>
 *          <div className="debug-logs">
 *            {logs.map((log, index) => (
 *              <LogEntry key={index} log={log} />
 *            ))}
 *          </div>
 *        </div>
 *      );
 *    }
 *    ```
 * 
 * 3. Services
 *    ```typescript
 *    // In OpenAIService
 *    public async generateNextScene(): Promise<void> {
 *      try {
 *        debugManager.log('Generating scene', 'info');
 *        const scene = await this.generateScene();
 *        debugManager.log('Scene generated', 'success', { scene });
 *      } catch (error) {
 *        debugManager.log('Scene generation failed', 'error', { error });
 *        throw error;
 *      }
 *    }
 *    ```
 * 
 * Usage Examples:
 * ```typescript
 * // Basic logging
 * debugManager.log('Operation started', 'info');
 * 
 * // Logging with data
 * debugManager.log('State updated', 'success', { 
 *   oldState, 
 *   newState 
 * });
 * 
 * // Error logging
 * try {
 *   await operation();
 * } catch (error) {
 *   debugManager.log('Operation failed', 'error', { error });
 * }
 * 
 * // React component usage
 * function DebugControls() {
 *   const { enabled, toggleDebug } = useDebugStore();
 *   
 *   return (
 *     <button onClick={toggleDebug}>
 *       {enabled ? 'Disable' : 'Enable'} Debug Mode
 *     </button>
 *   );
 * }
 * ```
 * 
 * Error Handling:
 * ```typescript
 * try {
 *   await operation();
 * } catch (error) {
 *   debugManager.log('Operation failed', 'error', {
 *     error,
 *     context: 'Operation context',
 *     timestamp: new Date().toISOString()
 *   });
 *   
 *   // Handle different error types
 *   if (error instanceof NetworkError) {
 *     debugManager.log('Network error detected', 'warning');
 *   } else if (error instanceof ValidationError) {
 *     debugManager.log('Validation failed', 'error', { 
 *       validationErrors: error.errors 
 *     });
 *   }
 *   
 *   throw error;
 * }
 * ```
 * 
 * Best Practices:
 * 1. Always include context in logs
 * 2. Use appropriate log types
 * 3. Clean sensitive data
 * 4. Keep logs focused
 * 5. Handle errors properly
 * 
 * Performance Considerations:
 * ```typescript
 * // Conditional logging
 * if (debugManager.getState().enabled) {
 *   debugManager.log('Detailed debug info', 'info', { 
 *     largeObject 
 *   });
 * }
 * 
 * // Log cleanup
 * const MAX_LOGS = 1000;
 * if (debugManager.getState().logs.length > MAX_LOGS) {
 *   debugManager.clearLogs();
 * }
 * 
 * // Batch logging
 * const batchLogs = (logs: LogEntry[]) => {
 *   if (!debugManager.getState().enabled) return;
 *   
 *   logs.forEach(log => {
 *     debugManager.log(log.message, log.type, log.data);
 *   });
 * };
 * ```
 * 
 * Security Considerations:
 * ```typescript
 * // Clean sensitive data
 * const cleanSensitiveData = (data: any) => {
 *   const cleaned = { ...data };
 *   delete cleaned.password;
 *   delete cleaned.apiKey;
 *   return cleaned;
 * };
 * 
 * // Log with cleaned data
 * debugManager.log('User action', 'info', 
 *   cleanSensitiveData(userData)
 * );
 * ```
 * 
 * The debug manager works alongside the game engine to provide comprehensive
 * logging and debugging capabilities while maintaining proper encapsulation
 * and security.
 * 
 * @see GameEngine for game integration
 * @see DebugPanel for UI integration
 * @see ErrorService for error handling
 */