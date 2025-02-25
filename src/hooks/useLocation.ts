/**
 * Location Hook
 * 
 * This custom React hook manages location and component tracking in the AdventureBuildr application.
 * It provides a way to track both the current pathname and active component, handling both regular
 * browser navigation and custom navigation events. The hook is essential for maintaining proper
 * navigation state and component rendering throughout the application.
 * 
 * Key Features:
 * - Pathname tracking
 * - Component state management
 * - Custom navigation event handling
 * - Browser history integration
 * - Navigation synchronization
 * 
 * Data Flow:
 * 1. Location change detection
 * 2. Component determination
 * 3. State updates
 * 4. Navigation event handling
 * 5. History synchronization
 * 
 * @returns Object containing current pathname and component name
 * 
 * @example
 * ```typescript
 * function Navigation() {
 *   const { pathname, currentComponent } = useLocation();
 *   
 *   return (
 *     <nav>
 *       <div>Current path: {pathname}</div>
 *       <div>Active component: {currentComponent}</div>
 *     </nav>
 *   );
 * }
 * ```
 */

import { useState, useEffect } from 'react';

export function useLocation() {
  const [pathname, setPathname] = useState(window.location.pathname);
  const [currentComponent, setCurrentComponent] = useState('Home');

  useEffect(() => {
    /**
     * Handles location changes from both browser and custom events
     * Updates pathname and component state accordingly
     */
    const handleLocationChange = (event?: CustomEvent) => {
      // If it's a custom navigation event, use the component from the event
      if (event?.detail?.page) {
        setCurrentComponent(getComponentName(event.detail.page));
        return;
      }

      // Otherwise determine component from pathname
      const path = window.location.pathname;
      setPathname(path);
      setCurrentComponent(getComponentFromPath(path));
    };

    /**
     * Handles custom navigation events
     * Updates component state based on navigation event details
     */
    const handleNavigationEvent = (event: CustomEvent) => {
      setPathname(window.location.pathname);
      setCurrentComponent(getComponentName(event.detail.page));
    };

    // Handle both regular navigation and custom navigation events
    window.addEventListener('popstate', () => handleLocationChange());
    window.addEventListener('navigationChange', handleNavigationEvent as EventListener);

    // Initial component determination
    handleLocationChange();

    return () => {
      window.removeEventListener('popstate', () => handleLocationChange());
      window.removeEventListener('navigationChange', handleNavigationEvent as EventListener);
    };
  }, []);

  return { pathname, currentComponent };
}

/**
 * Maps page names to component names
 * Provides consistent component naming across the application
 * 
 * @param page Page identifier
 * @returns Component name for the page
 */
function getComponentName(page: string): string {
  const componentMap: Record<string, string> = {
    'home': 'GenreSelector',
    'characters': 'CharacterList',
    'achievements': 'AchievementsPage',
    'profile': 'ProfileSettings',
    'test': 'TestPanel',
    'story': 'StoryScene'
  };

  return componentMap[page] || 'Unknown';
}

/**
 * Determines component name from URL path
 * Handles both regular routes and special cases
 * 
 * @param path Current URL path
 * @returns Component name for the path
 */
function getComponentFromPath(path: string): string {
  switch (path) {
    case '/':
      return 'GenreSelector';
    case '/characters':
      return 'CharacterList';
    case '/achievements':
      return 'AchievementsPage';
    case '/profile':
      return 'ProfileSettings';
    case '/test':
      return 'TestPanel';
    case '/story':
      return 'StoryScene';
    default:
      // Check if we're in a game state
      if (path.includes('story') || window.location.hash.includes('story')) {
        return 'StoryScene';
      }
      return 'Unknown';
  }
}

/**
 * Integration Points:
 * 
 * 1. App Component
 *    ```typescript
 *    // In App component
 *    function App() {
 *      const { currentComponent } = useLocation();
 *      
 *      return (
 *        <div>
 *          <Menu currentComponent={currentComponent} />
 *          <main>
 *            {renderComponent(currentComponent)}
 *          </main>
 *        </div>
 *      );
 *    }
 *    ```
 * 
 * 2. Navigation System
 *    ```typescript
 *    // In navigation utility
 *    const navigateTo = (page: string) => {
 *      window.history.pushState({}, '', `/${page}`);
 *      window.dispatchEvent(new CustomEvent('navigationChange', {
 *        detail: { page }
 *      }));
 *    };
 *    ```
 * 
 * 3. Menu Component
 *    ```typescript
 *    // In Menu component
 *    function Menu() {
 *      const { currentComponent } = useLocation();
 *      
 *      return (
 *        <nav>
 *          <MenuItem
 *            active={currentComponent === 'GenreSelector'}
 *            onClick={() => navigateTo('home')}
 *          >
 *            Home
 *          </MenuItem>
 *          {/* Other menu items *\/}
 *        </nav>
 *      );
 *    }
 *    ```
 * 
 * Usage Examples:
 * ```typescript
 * // Basic usage
 * function Header() {
 *   const { currentComponent } = useLocation();
 *   return <h1>{currentComponent}</h1>;
 * }
 * 
 * // With navigation
 * function Navigation() {
 *   const { pathname } = useLocation();
 *   
 *   const isActive = (path: string) => pathname === path;
 *   
 *   return (
 *     <nav>
 *       <Link active={isActive('/')} to="/">Home</Link>
 *       <Link active={isActive('/characters')} to="/characters">
 *         Characters
 *       </Link>
 *     </nav>
 *   );
 * }
 * ```
 * 
 * Error Handling:
 * ```typescript
 * const getComponent = (path: string) => {
 *   try {
 *     return getComponentFromPath(path);
 *   } catch (error) {
 *     console.error('Error determining component:', error);
 *     return 'Unknown';
 *   }
 * };
 * ```
 * 
 * Best Practices:
 * 1. Always clean up event listeners
 * 2. Handle unknown routes gracefully
 * 3. Maintain consistent naming
 * 4. Use type-safe navigation
 * 5. Handle edge cases properly
 * 
 * @see App for main application integration
 * @see Menu for navigation integration
 * @see Footer for component display
 */