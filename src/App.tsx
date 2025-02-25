/**
 * App Component
 * 
 * This is the root component of the AdventureBuildr application. It manages the core application state,
 * authentication flow, game initialization, and component rendering. The component coordinates between
 * various services and sub-components to provide a seamless gaming experience.
 * 
 * Key Features:
 * - Authentication management
 * - Game state coordination
 * - Component navigation
 * - API key validation
 * - Service initialization
 * - Error handling
 * 
 * Data Flow:
 * 1. Authentication check
 * 2. Service initialization
 * 3. API key validation
 * 4. Game state management
 * 5. Component rendering
 * 
 * @module App
 */

import React, { useState, useEffect, useRef } from 'react';
import { GenreSelector } from './components/GenreSelector';
import { StoryScene } from './components/StoryScene';
import { Auth } from './components/Auth';
import { supabase } from './lib/supabase';
import type { Genre, GameState, Scene, Character } from './types';
import { LogoutButton } from './components/LogoutButton';
import { AuthStatus } from './components/AuthStatus';
import { CharacterCreation } from './components/CharacterCreation';
import { Footer } from './components/Footer';
import { ArrowLeft } from 'lucide-react';
import { CharacterList } from './components/CharacterList';
import { Menu } from './components/Menu';
import { CharacterSelector } from './components/CharacterSelector';
import { LoadingIndicator } from './components/LoadingIndicator';
import { ApiKeySetup } from './components/ApiKeySetup';
import { Achievements } from './components/Achievements';
import { ProfileSettings } from './components/ProfileSettings';
import { TestPanel } from './components/admin/TestPanel';
import { GameEngine } from './core/engine/GameEngine';
import { ServiceInitializer } from './core/services/ServiceInitializer';
import { ServiceRegistry } from './core/services/ServiceRegistry';
import { debugManager } from './core/debug/DebugManager';
import { getInitialScene, getInitialChoices } from './core/engine/sceneManager';
import { AchievementsPage } from './components/achievements/AchievementsPage';

/** Initial scene state */
const initialScene: Scene = {
  id: 'start',
  description: 'Welcome to your adventure. Choose a genre to begin.',
  choices: [],
};

/**
 * Main application component
 * Manages application state and routing
 */
function App() {
  // Authentication and initialization state
  const [session, setSession] = useState<any>(null);
  const [appState, setAppState] = useState<'loading' | 'auth' | 'api' | 'game'>('loading');
  const [apiKeySet, setApiKeySet] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [servicesReady, setServicesReady] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  // Game state
  const [gameState, setGameState] = useState<GameState>({
    currentScene: initialScene,
    history: [],
    gameOver: false,
  });
  const [genre, setGenre] = useState<Genre | null>(null);
  const [character, setCharacter] = useState(null);
  const [gameEngine, setGameEngine] = useState<GameEngine | null>(null);
  const [engineInitialized, setEngineInitialized] = useState(false);

  // UI state
  const [currentPage, setCurrentPage] = useState<'home' | 'characters' | 'profile' | 'test' | 'achievements'>('home');
  const [activeComponent, setActiveComponent] = useState<string>('GenreSelector');
  const [existingCharacters, setExistingCharacters] = useState<Character[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Game progression state
  const [levelUpResult, setLevelUpResult] = useState<LevelUpResult | null>(null);
  const [xpNotification, setXPNotification] = useState<{xp: number; source: string} | null>(null);

  /**
   * Initialize application on mount
   * Handles authentication, services, and API key validation
   */
  useEffect(() => {
    const initializeApp = async () => {
      try {
        debugManager.log('Starting app initialization', 'info');
        
        // Initialize services first
        if (!ServiceInitializer.isInitialized()) {
          await ServiceInitializer.initialize();
          setServicesReady(true);
        }

        // First check auth
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        
        if (!session) {
          debugManager.log('No session found, showing auth', 'info');
          setAppState('auth');
          return;
        }

        // Fetch username in parallel with other operations
        fetchUsername(session.user.id).catch(err => {
          debugManager.log('Error fetching username', 'warning', { error: err });
        });

        // Then check API key
        const hasApiKey = await checkApiKey(session?.user?.id);
        if (!hasApiKey) {
          debugManager.log('No API key found, showing setup', 'info');
          setAppState('api');
          return;
        }

        setAppState('game');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initialize application';
        debugManager.log('App initialization failed', 'error', { error: err });
        setAppState('auth'); // Fallback to auth state on error
      }
    };

    initializeApp();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        initializeApp();
      } else {
        setAppState('auth');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array for initial load

  /**
   * Handle navigation events
   * Updates current page and component state
   */
  useEffect(() => {
    const handleNavigation = (event: CustomEvent) => {
      const { page } = event.detail;
      setCurrentPage(page);
      if (page === 'home') {
        setGenre(null);
        setCharacter(null);
      }
    };

    const handleContinueAdventure = (event: CustomEvent) => {
      const { character, gameState } = event.detail;
      setGenre(character.genre);
      setCharacter(character);
      setGameState(gameState);
      setCurrentPage('home');
    };

    window.addEventListener('navigationChange', handleNavigation as EventListener);
    window.addEventListener('continueAdventure', handleContinueAdventure as EventListener);

    return () => {
      window.removeEventListener('navigationChange', handleNavigation as EventListener);
      window.removeEventListener('continueAdventure', handleContinueAdventure as EventListener);
    };
  }, []); // Empty dependency array for event listeners

  /**
   * Checks if user has set up their API key
   */
  const checkApiKey = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_api_credentials', { p_user_id: userId })
        .maybeSingle();
    
      if (error) {
        if (error.code === 'PGRST116') {
          // No API key found
          setApiKeySet(false);
          return false;
        }
        console.error('Error checking API key:', error);
        return false;
      }
      
      setApiKeySet(!!data?.openai_key);
      return !!data?.openai_key;
    } catch (err) {
      console.error('Error checking API key:', err);
      setApiKeySet(false);
      return false;
    }
  };

  /**
   * Fetches or creates username for current user
   */
  const fetchUsername = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_or_create_profile', { p_user_id: userId })
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile not found, retry once
          const { data: retryData, error: retryError } = await supabase
            .rpc('get_or_create_profile', { p_user_id: userId })
            .maybeSingle();
            
          if (retryError) throw retryError;
          setUsername(retryData?.username || null);
          return;
        }
        console.error('Error fetching profile:', error);
        return;
      }

      setUsername(data?.username || null);
    } catch (err) {
      console.error('Error in fetchUsername:', err);
      // Set a fallback username
      setUsername(`user-${userId.slice(0, 8)}`);
    }
  };

  /**
   * Fetches characters for selected genre
   */
  const fetchCharactersByGenre = async (genre: Genre) => {
    try {
      setLoadingCharacters(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', user.id)
        .eq('genre', genre)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExistingCharacters(data || []);
    } catch (err) {
      console.error('Error fetching characters:', err);
    } finally {
      setLoadingCharacters(false);
    }
  };

  /**
   * Handles navigation between pages
   */
  const handleNavigate = (page: 'home' | 'characters' | 'profile' | 'test') => {
    if (page === 'home') {
      setGenre(null);
      setCharacter(null);
      setActiveComponent('GenreSelector');
    } else {
      const componentMap = {
        'characters': 'CharacterList',
        'profile': 'ProfileSettings',
        'test': 'TestPanel',
        'achievements': 'AchievementsPage'
      };
      setActiveComponent(componentMap[page] || 'GenreSelector');
    }
    setCurrentPage(page);
  };

  /**
   * Handles genre selection
   * Fetches existing characters for the genre
   */
  const handleGenreSelect = (selectedGenre: Genre) => {
    setGenre(selectedGenre);
    fetchCharactersByGenre(selectedGenre);
    setActiveComponent('CharacterSelector');
  };

  /**
   * Handles character creation completion
   * Initializes game state with new character
   */
  const handleCharacterCreation = (newCharacter: Character, initialGameState: GameState) => {
    setCharacter(newCharacter);
    setGameState(initialGameState);
    setActiveComponent('StoryScene');
  };

  /**
   * Handles character selection
   * Loads or initializes game state for selected character
   */
  const handleCharacterSelect = async (selectedCharacter: Character) => {
    try {
      setLoading(true);
      setError(null);
      debugManager.log('Loading game state', 'info', { characterId: selectedCharacter.id });

      // Initialize game engine
      const engine = new GameEngine();
      await engine.initialize();
      await engine.initializeGame(selectedCharacter.genre as Genre, selectedCharacter);

      const state = engine.getCurrentState();
      setGameState(state);
      setGameEngine(engine);
      setCharacter(selectedCharacter);
      setActiveComponent('StoryScene');

      debugManager.log('Game state loaded', 'success', {
        characterId: selectedCharacter.id,
        sessionId: state.sessionId
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load game state';
      setError(message);
      debugManager.log('Error loading game state', 'error', { error: err });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles player choice selection
   * Processes choice and updates game state
   */
  const handleChoice = async (choiceId: number) => {
    try {
      if (!servicesReady) {
        await ServiceInitializer.initialize();
        setServicesReady(true);
      }

      if (!engineInitialized || !gameEngine) {
        const newEngine = new GameEngine();
        await newEngine.initialize();
        setGameEngine(newEngine);
        setEngineInitialized(true);
        await newEngine.initializeGame(character.genre as Genre, character);
      }

      debugManager.log('Handling choice', 'info', { choiceId });

      await gameEngine.handleChoice(choiceId, {
        onXP: (xp, source) => {
          setXPNotification({ xp, source });
        },
        onAchievementUnlocked: (achievement) => {
          setAchievement(achievement);
        },
        onLevelUp: (result) => {
          setLevelUpResult(result);
        },
        onToken: (token) => {
          setGameState(prev => ({
            ...prev,
            currentScene: {
              ...prev.currentScene,
              description: token
            }
          }));
        },
        onComplete: () => {
          setGameState(gameEngine.getCurrentState());
          debugManager.log('Choice completed successfully', 'success');
        },
        onError: (error) => {
          debugManager.log('Error in story generation', 'error', { error });
          setGameState(prev => ({
            ...prev,
            currentScene: {
              ...prev.currentScene,
              description: prev.currentScene.description + '\n\nError: ' + error.message
            }
          }));
        }
      });
    } catch (error) {
      debugManager.log('Error handling choice', 'error', { error });
      setGameState(prev => ({
        ...prev,
        currentScene: {
          ...prev.currentScene,
          description: prev.currentScene.description + '\n\nError: ' + (error instanceof Error ? error.message : 'An unknown error occurred')
        }
      }));
    }
  };

  /**
   * Handles back navigation
   */
  const handleBack = () => {
    if (character) {
      setCharacter(null);
      setActiveComponent('CharacterCreation');
    } else if (genre) {
      setGenre(null);
      setActiveComponent('GenreSelector');
    }
  };

  // Render loading state
  if (appState === 'loading') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <LoadingIndicator
          fullScreen 
          message="Loading your adventure..." 
          size="lg" 
          currentComponent={activeComponent}
        />
      </div>
    );
  }

  // Render auth screen
  if (appState === 'auth') {
    return <Auth />;
  }

  // Render API key setup
  if (appState === 'api') {
    return <ApiKeySetup onComplete={() => setAppState('game')} />;
  }

  // Render main game interface
  return (
    <div className="relative min-h-screen bg-gray-50">
      <Menu username={username} onNavigate={handleNavigate} />
      {currentPage === 'characters' ? (
        <CharacterList />
      ) : currentPage === 'achievements' ? (
        <AchievementsPage />
      ) : currentPage === 'profile' ? (
        <ProfileSettings />
      ) : currentPage === 'test' ? (
        <TestPanel />
      ) : !genre ? (
        <GenreSelector onSelect={handleGenreSelect} currentComponent={activeComponent} />
      ) : !character ? (
        <div>
          <button
            onClick={handleBack}
            className="absolute top-4 left-4 p-2 text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Genre Selection
          </button>
          {loadingCharacters ? (
            <LoadingIndicator 
              message="Loading your characters..." 
              size="md" 
              currentComponent={activeComponent}
            />
          ) : existingCharacters.length > 0 && character === null ? (
            <div className="max-w-4xl mx-auto p-6">
              <CharacterSelector
                username={username}
                genre={genre}
                existingCharacters={existingCharacters}
                onSelect={handleCharacterSelect}
                onCreateNew={() => setCharacter(undefined)}
              />
            </div>
          ) : (
            <CharacterCreation genre={genre} onComplete={handleCharacterCreation} />
          )}
        </div>
      ) : (
        <>
          <button
            onClick={handleBack}
            className="absolute top-4 left-4 p-2 text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Character Creation
          </button>
          <StoryScene 
            scene={gameState.currentScene}
            onChoice={handleChoice}
            history={gameState.history}
            character={character}
            sessionId={gameState.sessionId}
            onCharacterUpdate={(updatedCharacter) => {
              if (!engineInitialized || !gameEngine) return;
              setCharacter(updatedCharacter);
              gameEngine.updateCharacter(updatedCharacter);
            }}
            onCreateCheckpoint={() => gameEngine?.createCheckpoint()}
            onRestoreCheckpoint={() => {
              if (!engineInitialized || !gameEngine) return;
              gameEngine.restoreCheckpoint();
              setGameState(gameEngine.getCurrentState());
            }}
            hasCheckpoint={!!gameState.checkpoint}
            xpNotification={xpNotification}
            levelUpResult={levelUpResult}
          />
        </>
      )}
      <Footer username={username} currentComponent={activeComponent} />
    </div>
  );
}

export default App;