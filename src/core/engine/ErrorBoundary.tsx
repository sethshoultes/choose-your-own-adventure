/**
 * GameErrorBoundary Component
 * 
 * A React error boundary component specifically designed for the AdventureBuildr game engine.
 * This component catches and handles errors that occur during game rendering and state updates,
 * providing graceful fallback UI and error recovery options.
 * 
 * Key Features:
 * - Catches runtime errors in child components
 * - Provides fallback UI for error states
 * - Logs errors for debugging
 * - Supports custom error handlers
 * - Maintains game state integrity
 * 
 * Usage:
 * ```tsx
 * <GameErrorBoundary
 *   fallback={<CustomErrorUI />}
 *   onError={(error, errorInfo) => handleError(error, errorInfo)}
 * >
 *   <GameComponent />
 * </GameErrorBoundary>
 * ```
 */

import React, { Component, ErrorInfo } from 'react';
import { debugManager } from '../debug/DebugManager';

interface Props {
  /** Child components to be rendered and monitored for errors */
  children: React.ReactNode;
  /** Optional custom fallback UI to display when an error occurs */
  fallback?: React.ReactNode;
  /** Optional callback function to handle errors */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  /** Indicates whether an error has occurred */
  hasError: boolean;
  /** The error object if one exists */
  error: Error | null;
}

export class GameErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  /**
   * Static method called when an error occurs during rendering
   * Returns the new state to be used for error handling
   */
  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  /**
   * Lifecycle method called after an error has been caught
   * Handles error logging and custom error callbacks
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to debug system
    debugManager.log('Error caught by boundary', 'error', { error, errorInfo });
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  render(): React.ReactNode {
    // If an error occurred, show fallback UI
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="p-6 bg-red-50 rounded-lg">
          <h2 className="text-lg font-semibold text-red-700 mb-2">
            Something went wrong
          </h2>
          <p className="text-red-600 mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Reload Game
          </button>
        </div>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}