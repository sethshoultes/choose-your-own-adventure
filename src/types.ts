import React, { useState, useEffect } from 'react';
import { GenreSelector } from './components/GenreSelector';
import { StoryScene } from './components/StoryScene';
import { Auth } from './components/Auth';
import { supabase } from './lib/supabase';
import type { Genre, GameState, Scene } from './types';
import { LogoutButton } from './components/LogoutButton';
import { AuthStatus } from './components/AuthStatus';

export type Genre = 'Fantasy' | 'Sci-Fi' | 'Horror' | 'Mystery';

export type CharacterAttribute = {
  name: string;
  value: number;
  description: string;
};

export type CharacterEquipment = {
  name: string;
  type: 'weapon' | 'armor' | 'tool' | 'special';
  description: string;
};

export type Character = {
  id?: string;
  name: string;
  genre: Genre;
  attributes: CharacterAttribute[];
  equipment: CharacterEquipment[];
  backstory: string;
};

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session?.user) {
        checkApiKey(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
      if (session?.user) {
        checkApiKey(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkApiKey = async (userId: string) => {
    const { data } = await supabase
      .from('api_credentials')
      .select('openai_key')
      .eq('user_id', userId)
      .single();
    
    setApiKeySet(!!data?.openai_key);
  };

  const handleGenreSelect = (selectedGenre: Genre) => {
    setGenre(selectedGenre);
    // Here we would initialize the first scene based on the genre
    setGameState({
      currentScene: {
        id: 'scene-1',
        description: getInitialScene(selectedGenre),
        choices: getInitialChoices(selectedGenre),
      },
      history: [],
      gameOver: false,
    });
  };

  const handleChoice = (choiceId: number) => {
    // Here we would handle the player's choice and update the game state
    // This is where you'd implement your story logic
    console.log(`Selected choice: ${choiceId}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <AuthStatus session={session} />
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : !session ? (
        <Auth />
      ) : (
        <div>
        !apiKeySet ? (
          <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Set up OpenAI API Key</h2>
            <p className="text-gray-600 mb-4">
              Please set up your OpenAI API key in the Supabase SQL editor using the following command:
            </p>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm mb-4">
              {`INSERT INTO api_credentials (user_id, openai_key)\nVALUES ('${session.user.id}', 'your-api-key-here');`}
            </pre>
            <button
              onClick={() => checkApiKey(session.user.id)}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Check API Key Status
            </button>
          </div>
        ) : !genre ? (
          <GenreSelector onSelect={handleGenreSelect} />
        ) : (
          <StoryScene scene={gameState.currentScene} onChoice={handleChoice} />
        )
        <div className="fixed bottom-0 right-0 p-4">
          <LogoutButton />
        </div>
        </div>
        )
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