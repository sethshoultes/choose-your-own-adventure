import React, { useState, useEffect } from 'react';
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
import { getInitialScene, getInitialChoices } from './core/engine/sceneManager';
import { AchievementsPage } from './components/achievements/AchievementsPage';

const initialScene: Scene = {
  id: 'start',
  description: 'Welcome to your adventure. Choose a genre to begin.',
  choices: [],
};

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState<GameState>({
    currentScene: initialScene,
    history: [],
    gameOver: false,
  });
  const [genre, setGenre] = useState<Genre | null>(null);
  const [apiKeySet, setApiKeySet] = useState(false);
  const [character, setCharacter] = useState(null);
  const [username, setUsername] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<'home' | 'characters' | 'profile' | 'test' | 'achievements'>('home');
  const [existingCharacters, setExistingCharacters] = useState<Character[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(false);
  const [gameEngine] = useState(() => new GameEngine());
  const [levelUpResult, setLevelUpResult] = useState<LevelUpResult | null>(null);
  const [xpNotification, setXPNotification] = useState<{xp: number; source: string} | null>(null);

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
  }, []);

  const handleNavigate = (page: 'home' | 'characters' | 'profile' | 'test') => {
    if (page === 'home') {
      setGenre(null);
      setCharacter(null);
    }
    setCurrentPage(page);
  };

  const handleGenreSelect = (selectedGenre: Genre) => {
    setGenre(selectedGenre);
    fetchCharactersByGenre(selectedGenre);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session?.user) {
        fetchUsername(session.user.id);
        checkApiKey(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
      if (session?.user) {
        fetchUsername(session.user.id);
        checkApiKey(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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

  const handleCharacterCreation = (newCharacter: Character, initialGameState: GameState) => {
    setCharacter(newCharacter);
    setGameState(initialGameState);
  };

  const handleCharacterSelect = (selectedCharacter: Character) => {
    setCharacter(selectedCharacter);
    gameEngine.initializeGame(selectedCharacter.genre, selectedCharacter);
    setGameState(gameEngine.getCurrentState());
    
    // Try to load saved game state
    gameEngine.loadSavedState(selectedCharacter.id!).then(loaded => {
      if (loaded) {
        setGameState(gameEngine.getCurrentState());
      }
    });
  };

  const handleChoice = async (choiceId: number) => {
    try {
      await gameEngine.handleChoice(choiceId, {
        onXP: (xp, source) => {
          setXPNotification({ xp, source });
        },
        onAchievementUnlocked: (achievement) => {
          // Show achievement notification
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
          // Update the UI with the latest game state
          setGameState(gameEngine.getCurrentState());
        },
        onError: (error) => {
          console.error('Error in story generation:', error);
          // Show error to user
          setGameState(prev => ({
            ...prev,
            currentScene: {
              ...prev.currentScene,
              description: prev.currentScene.description + '\n\nError: Failed to generate the next scene. Please try again.'
            }
          }));
        }
      });
    } catch (error) {
      console.error('Error handling choice:', error);
      // Show error to user
      setGameState(prev => ({
        ...prev,
        currentScene: {
          ...prev.currentScene,
          description: prev.currentScene.description + '\n\nError: ' + (error instanceof Error ? error.message : 'An unknown error occurred')
        }
      }));
    }
  };

  const handleBack = () => {
    if (character) {
      setCharacter(null);
    } else if (genre) {
      setGenre(null);
    }
  };

  return (
    <div className="relative">
      {loading ? (
        <LoadingIndicator 
          fullScreen 
          message="Loading your adventure..." 
          size="lg" 
        />
      ) : !session ? (
        <Auth />
      ) : (
        <div>
          <Menu username={username} onNavigate={handleNavigate} />
          {currentPage === 'characters' ? (
            <CharacterList />
          ) : currentPage === 'achievements' ? (
            <AchievementsPage />
          ) : currentPage === 'profile' ? (
            <ProfileSettings />
          ) : currentPage === 'test' ? (
            <TestPanel />
          ) : !apiKeySet ? (
            <ApiKeySetup onComplete={() => setApiKeySet(true)} />
          ) : !genre ? (
            <GenreSelector onSelect={handleGenreSelect} />
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
                onCharacterUpdate={(updatedCharacter) => {
                  setCharacter(updatedCharacter);
                  gameEngine.updateCharacter(updatedCharacter);
                }}
                onCreateCheckpoint={() => gameEngine.createCheckpoint()}
                onRestoreCheckpoint={() => {
                  gameEngine.restoreCheckpoint();
                  setGameState(gameEngine.getCurrentState());
                }}
                hasCheckpoint={!!gameState.checkpoint}
                xpNotification={xpNotification}
                levelUpResult={levelUpResult}
              />
            </>
          )}
          <Footer username={username} />
        </div>
      )}
    </div>
  );
}

export default App;