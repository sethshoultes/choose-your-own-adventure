/**
 * Navigation Hook
 * 
 * This custom React hook provides navigation functionality for the AdventureBuildr application.
 * It encapsulates navigation logic and provides a consistent interface for route changes while
 * maintaining proper state synchronization through custom events.
 * 
 * Key Features:
 * - Route navigation
 * - History state management
 * - Navigation event handling
 * - Component synchronization
 * - State persistence
 * 
 * Data Flow:
 * 1. Navigation request
 * 2. History state update
 * 3. Event dispatch
 * 4. Component notification
 * 5. State synchronization
 * 
 * @returns Object containing navigation functions
 * 
 * @example
 * ```typescript
 * function Navigation() {
 *   const { navigateToHome, navigateToCharacters } = useNavigate();
 *   
 *   return (
 *     <nav>
 *       <button onClick={navigateToHome}>Home</button>
 *       <button onClick={navigateToCharacters}>Characters</button>
 *     </nav>
 *   );
 * }
 * ```
 */

import { useCallback } from 'react';

export function useNavigate() {
  /**
   * Navigates to the home page
   * Updates history and dispatches navigation event
   */
  const navigateToHome = useCallback(() => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new CustomEvent('navigationChange', { 
      detail: { page: 'home' } 
    }));
  }, []);

  /**
   * Navigates to the characters page
   * Updates history and dispatches navigation event
   */
  const navigateToCharacters = useCallback(() => {
    window.history.pushState({}, '', '/characters');
    window.dispatchEvent(new CustomEvent('navigationChange', { 
      detail: { page: 'characters' } 
    }));
  }, []);

  return { navigateToHome, navigateToCharacters };
}

/**
 * Integration Points:
 * 
 * 1. Menu Component
 *    ```typescript
 *    // In Menu component
 *    function Menu() {
 *      const { navigateToHome } = useNavigate();
 *      
 *      return (
 *        <button onClick={navigateToHome}>
 *          Return Home
 *        </button>
 *      );
 *    }
 *    ```
 * 
 * 2. Character List
 *    ```typescript
 *    // In CharacterList component
 *    function CharacterList() {
 *      const { navigateToHome } = useNavigate();
 *      
 *      return (
 *        <div>
 *          <button onClick={navigateToHome}>
 *            Back to Home
 *          </button>
 *          <CharacterGrid />
 *        </div>
 *      );
 *    }
 *    ```
 * 
 * 3. App Component
 *    ```typescript
 *    // In App component
 *    function App() {
 *      useEffect(() => {
 *        const handleNavigation = (event: CustomEvent) => {
 *          const { page } = event.detail;
 *          setCurrentPage(page);
 *        };
 *        
 *        window.addEventListener(
 *          'navigationChange',
 *          handleNavigation as EventListener
 *        );
 *        
 *        return () => {
 *          window.removeEventListener(
 *            'navigationChange',
 *            handleNavigation as EventListener
 *          );
 *        };
 *      }, []);
 *    }
 *    ```
 * 
 * Usage Examples:
 * ```typescript
 * // Basic navigation
 * function Header() {
 *   const { navigateToHome } = useNavigate();
 *   return <button onClick={navigateToHome}>Home</button>;
 * }
 * 
 * // With confirmation
 * function NavigationButton() {
 *   const { navigateToHome } = useNavigate();
 *   
 *   const handleClick = () => {
 *     if (confirm('Navigate away?')) {
 *       navigateToHome();
 *     }
 *   };
 *   
 *   return <button onClick={handleClick}>Home</button>;
 * }
 * ```
 * 
 * Error Handling:
 * ```typescript
 * const handleNavigation = () => {
 *   try {
 *     navigateToHome();
 *   } catch (error) {
 *     console.error('Navigation failed:', error);
 *     // Fallback to direct URL change
 *     window.location.href = '/';
 *   }
 * };
 * ```
 * 
 * Best Practices:
 * 1. Use consistent navigation patterns
 * 2. Handle navigation errors
 * 3. Clean up event listeners
 * 4. Maintain history state
 * 5. Sync component state
 * 
 * Navigation Events:
 * ```typescript
 * // Custom navigation event
 * const navigateToPage = (page: string) => {
 *   window.history.pushState({}, '', `/${page}`);
 *   window.dispatchEvent(new CustomEvent('navigationChange', {
 *     detail: { page }
 *   }));
 * };
 * 
 * // Event listener
 * window.addEventListener('navigationChange', (event: CustomEvent) => {
 *   const { page } = event.detail;
 *   updateCurrentPage(page);
 * });
 * ```
 * 
 * The hook works alongside the useLocation hook to provide a complete
 * navigation system for the application.
 * 
 * @see useLocation for location tracking
 * @see App for navigation handling
 * @see Menu for navigation integration
 */