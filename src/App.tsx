import React, { useState, useEffect } from 'react';
import { GenreSelector } from './components/GenreSelector';
import { StoryScene } from './components/StoryScene';
import { Auth } from './components/Auth';
import { supabase } from './lib/supabase';
import type { Genre, GameState, Scene } from './types';
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
import { ProfileSettings } from './components/ProfileSettings';
import { TestPanel } from './components/admin/TestPanel';
import { GameEngine } from './core/engine/GameEngine';

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
  const [currentPage, setCurrentPage] = useState<'home' | 'characters' | 'profile' | 'test'>('home');
  const [existingCharacters, setExistingCharacters] = useState<Character[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(false);
  const [gameEngine] = useState(() => new GameEngine());

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

  const handleNavigate = (page: 'home' | 'characters') => {
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
        .from('api_credentials')
        .select('openai_key')
        .eq('user_id', userId)
        .maybeSingle();
    
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking API key:', error);
      }
      
      setApiKeySet(!!data?.openai_key);
    } catch (err) {
      console.error('Error checking API key:', err);
      setApiKeySet(false);
    }
  };

  const fetchUsername = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_profile', { user_id: userId })
        .maybeSingle();

      if (error) throw error;
      setUsername(data?.username || null);
    } catch (err) {
      console.error('Error in fetchUsername:', err);
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

  const handleCharacterCreation = (newCharacter) => {
    setCharacter(newCharacter);
    setGameState({
      currentScene: {
        id: 'scene-1',
        description: getInitialScene(genre!),
        choices: getInitialChoices(genre!),
      },
      history: [],
      gameOver: false,
    });
  };

  const handleCharacterSelect = (selectedCharacter: Character) => {
    setCharacter(selectedCharacter);
    gameEngine.initializeGame(selectedCharacter.genre, selectedCharacter);
    
    // Try to load saved game state
    gameEngine.loadSavedState(selectedCharacter.id!).then(loaded => {
      // Game state will be initialized by the engine
      setGameState(gameEngine.getCurrentState());
    });
  };

  const handleChoice = async (choiceId: number) => {
    try {
      await gameEngine.handleChoice(choiceId, {
        onToken: (token) => {
          setGameState(prev => ({
            ...prev,
            currentScene: {
              ...prev.currentScene,
              description: prev.currentScene.description + token
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
              <StoryScene scene={gameState.currentScene} onChoice={handleChoice} />
            </>
          )}
          <Footer username={username} />
        </div>
      )}
    </div>
  );
}

function getInitialScene(genre: Genre): string {
  switch (genre) {
    case 'Fantasy':
      return `In the ancient kingdom of Eldara, you find yourself standing before the towering gates of the Crystal Palace. The air shimpers with magical energy, and whispers of an impending doom echo through the streets.

The Royal Guard captain approaches you with urgency in his eyes. "Thank the gods you've arrived," he says. "We need your help. The Sacred Crystal has been stolen, and without it, our realm will fall into chaos."

Dark clouds gather overhead as you consider your next move.`;
    case 'Sci-Fi':
      return `Warning lights flash across the command console of your damaged starship. The emergency AI's voice crackles through the speakers: "Hull breach detected. Multiple systems failing. Emergency protocols initiated."

Through the viewport, you see the swirling anomaly that disabled your ship growing larger. The research station you were sent to investigate floats silently in the distance, its lights blinking in an odd pattern.

Time is running out, and you must make a decision.`;
    case 'Horror':
      return `The old mansion looms before you, its decrepit walls seeming to absorb what little moonlight filters through the clouds. The missing persons case that led you here suddenly feels much more sinister.

A crash echoes from inside, followed by an unnatural silence. Your flashlight flickers, and for a moment, you swear you see movement in one of the upper windows.

The wind carries what sounds like distant whispers.`;
    case 'Mystery':
      return `The detective's office is dimly lit, case files scattered across the desk. The photograph in your hand shows the victim, a prominent city councilor, found dead in mysterious circumstances.

Your phone buzzes - an anonymous tip about a warehouse at the edge of town. At the same time, the victim's daughter is waiting in the lobby, claiming to have vital information.

The clock strikes midnight.`;
    default:
      return 'Invalid genre selected.';
  }
}

function getInitialChoices(genre: Genre): Array<{ id: number; text: string }> {
  switch (genre) {
    case 'Fantasy':
      return [
        { id: 1, text: 'Offer to help track down the crystal thief immediately' },
        { id: 2, text: 'Question the captain about recent suspicious activities in the palace' },
        { id: 3, text: 'Investigate the crystal\'s chamber for clues first' },
      ];
    case 'Sci-Fi':
      return [
        { id: 1, text: 'Attempt emergency repairs on the hull breach' },
        { id: 2, text: 'Try to dock with the research station' },
        { id: 3, text: 'Launch an emergency probe to study the anomaly' },
      ];
    case 'Horror':
      return [
        { id: 1, text: 'Enter through the front door with caution' },
        { id: 2, text: 'Circle the mansion to find another way in' },
        { id: 3, text: 'Call for backup before proceeding' },
      ];
    case 'Mystery':
      return [
        { id: 1, text: 'Head to the warehouse immediately' },
        { id: 2, text: 'Interview the victim\'s daughter' },
        { id: 3, text: 'Review the case files more thoroughly' },
      ];
    default:
      return [];
  }
}

export default App;