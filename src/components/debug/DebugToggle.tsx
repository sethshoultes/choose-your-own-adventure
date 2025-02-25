/**
 * Debug Toggle Component
 * 
 * This component provides a UI control for toggling the debug mode in the AdventureBuildr game engine.
 * It integrates with the DebugManager to control debug state visibility and provides visual feedback
 * for the current debug mode status. The component is typically rendered in a fixed position for
 * easy access during development and testing.
 * 
 * Key Features:
 * - Debug mode toggle control
 * - Visual state feedback
 * - Fixed positioning
 * - Accessibility support
 * - Hover effects
 * 
 * Data Flow:
 * 1. Debug state from useDebugStore
 * 2. Toggle action dispatch
 * 3. Debug panel visibility update
 * 4. Visual state reflection
 * 
 * @see DebugManager for debug state management
 * @see DebugPanel for debug information display
 */

import React from 'react';
import { Bug } from 'lucide-react';
import { useDebugStore } from '../../core/debug/DebugManager';

export function DebugToggle() {
  /** Get debug state and toggle function from store */
  const { enabled, toggleDebug } = useDebugStore();

  return (
    <button
      onClick={toggleDebug}
      className={`fixed top-4 left-4 p-2 rounded-full shadow-lg transition-colors ${
        enabled ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
      }`}
      title={enabled ? 'Disable debug mode' : 'Enable debug mode'}
    >
      <Bug className="w-5 h-5" />
      <span className="sr-only">
        {enabled ? 'Disable debug mode' : 'Enable debug mode'}
      </span>
    </button>
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
 *          {/* Other components *\/}
 *        </div>
 *      );
 *    }
 *    ```
 * 
 * 2. Debug Manager
 *    ```typescript
 *    // In DebugManager.ts
 *    const useDebugStore = create<DebugState>((set) => ({
 *      enabled: false,
 *      toggleDebug: () => set((state) => ({ 
 *        enabled: !state.enabled 
 *      }))
 *    }));
 *    ```
 * 
 * 3. Debug Panel
 *    ```typescript
 *    // In DebugPanel.tsx
 *    function DebugPanel() {
 *      const { enabled } = useDebugStore();
 *      if (!enabled) return null;
 *      return <div>{/* Debug content *\/}</div>;
 *    }
 *    ```
 * 
 * Usage Examples:
 * ```typescript
 * // Basic usage
 * function DevTools() {
 *   return (
 *     <>
 *       <DebugToggle />
 *       <DebugPanel />
 *     </>
 *   );
 * }
 * 
 * // With custom positioning
 * function CustomDebugToggle() {
 *   return (
 *     <div className="custom-position">
 *       <DebugToggle />
 *     </div>
 *   );
 * }
 * ```
 * 
 * Error Handling:
 * ```typescript
 * function SafeDebugToggle() {
 *   try {
 *     return <DebugToggle />;
 *   } catch (error) {
 *     console.error('Debug toggle error:', error);
 *     return null;
 *   }
 * }
 * ```
 * 
 * Best Practices:
 * 1. Keep toggle easily accessible
 * 2. Provide clear visual feedback
 * 3. Include proper accessibility
 * 4. Handle state changes safely
 * 5. Maintain consistent styling
 * 
 * Accessibility Features:
 * 1. Screen reader support
 * 2. Keyboard navigation
 * 3. Clear visual states
 * 4. Proper ARIA labels
 * 5. Focus management
 * 
 * The component works alongside the DebugPanel to provide comprehensive
 * debugging capabilities during development and testing.
 * 
 * @see DebugManager for state management
 * @see DebugPanel for debug interface
 * @see App for component integration
 */