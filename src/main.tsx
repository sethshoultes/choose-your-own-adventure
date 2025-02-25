/**
 * Application Entry Point
 * 
 * This module serves as the main entry point for the AdventureBuildr application.
 * It initializes the React application with StrictMode enabled and mounts the root
 * component to the DOM. The module is responsible for the initial application
 * bootstrap and React runtime configuration.
 * 
 * Key Features:
 * - React application initialization
 * - StrictMode enforcement
 * - Root component mounting
 * - Global style imports
 * 
 * Data Flow:
 * 1. Style imports
 * 2. React imports
 * 3. Root component import
 * 4. DOM mounting
 * 
 * @module main
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

/**
 * Initialize React application with StrictMode
 * StrictMode enables additional development checks and warnings
 * 
 * Integration Points:
 * 1. Global Styles
 *    - Imports index.css for application-wide styling
 *    - Includes Tailwind CSS utilities
 * 
 * 2. React Runtime
 *    - Configures StrictMode for development checks
 *    - Handles component mounting and updates
 * 
 * 3. DOM Integration
 *    - Mounts application to root element
 *    - Manages React reconciliation
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

/**
 * Best Practices:
 * 1. Use StrictMode in development
 * 2. Handle root element null case
 * 3. Keep entry point minimal
 * 4. Maintain clear dependencies
 * 5. Document runtime configuration
 * 
 * Error Handling:
 * - Non-null assertion used for root element
 * - React error boundary should be implemented in App component
 * - Development warnings enabled via StrictMode
 * 
 * Performance:
 * - Minimal entry point reduces initial load
 * - StrictMode helps catch issues early
 * - Single root render call
 * 
 * @see App for main application component
 * @see index.css for global styles
 */