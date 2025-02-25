# AdventureBuildr Developer Documentation

## Project Overview

AdventureBuildr is a React-based text adventure game engine built with TypeScript, leveraging OpenAI's API for dynamic story generation. This document provides technical details for developers.

## Tech Stack

### Frontend
- React 18.3
- TypeScript
- Vite
- Tailwind CSS
- Zustand (State Management)
- Lucide React (Icons)

### Backend
- Supabase (Database & Auth)
- OpenAI API Integration
- Row Level Security
- Real-time Updates

## Project Structure

```
src/
├── core/                    # Core game logic
│   ├── engine/             # Game engine components
│   ├── services/           # Service layer
│   ├── types/              # Type definitions
│   └── debug/              # Debug tools
├── components/             # React components
├── hooks/                  # Custom React hooks
├── lib/                    # Utility libraries
└── store/                 # State management
```

## Key Features

### Game Engine
- Dynamic scene generation via OpenAI
- State management and persistence
- Automatic state persistence
- Checkpoint system for manual saves
- Character progression
- Achievement tracking

### State Management
- Zustand for global state
- React hooks for local state
- Automatic state persistence after each choice
- Reliable state recovery
- State versioning and migration
- Conflict resolution

### Database Schema
- Profiles
- Characters
- Game Sessions
- Game History
- Achievements
- API Credentials

## Development Setup

1. **Environment Setup**
   ```bash
   npm install
   ```

2. **Environment Variables**
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

## Core Systems

### Story Generation
- OpenAI integration with streaming responses
- Dynamic choice generation
- Context-aware scene creation
- Response parsing and validation
- Automatic state persistence

### State Persistence
```typescript
// State is automatically saved after each choice
if (character.id && state.sessionId) {
  await supabase
    .from('game_sessions')
    .upsert({
      id: state.sessionId,
      character_id: character.id,
      current_scene: currentScene,
      game_state: state,
      status: 'active'
    });
}
```

### State Management
```typescript
interface GameState {
  currentScene: Scene;
  history: GameHistoryEntry[];
  gameOver: boolean;
  checkpoint?: {
    scene: Scene;
    history: GameHistoryEntry[];
    timestamp: string;
  };
}
```

### Character System
```typescript
interface Character {
  id?: string;
  name: string;
  genre: Genre;
  attributes: CharacterAttribute[];
  equipment: CharacterEquipment[];
  backstory: string;
}
```

## Security

- Row Level Security in Supabase
- Secure API key storage
- Protected endpoints
- Input validation
- Response sanitization

## Testing

- Unit tests with Vitest
- Component testing
- Integration testing
- E2E testing (planned)

## Deployment

- Vite build system
- Static asset optimization
- Environment configuration
- Performance monitoring

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Best Practices

### Code Style
- Use TypeScript strictly
- Follow ESLint configuration
- Use functional components
- Implement proper error boundaries
- Ensure proper state persistence

### State Management
- Rely on automatic state persistence
- Use Zustand for global state
- React hooks for local state
- Implement proper loading states
- Handle errors gracefully
- Validate state before updates

### Performance
- Implement proper memoization
- Optimize re-renders
- Lazy load components
- Use proper TypeScript types
- Efficient state persistence

## Roadmap

1. Social Features
   - User profiles
   - Character sharing
   - Story sharing
   - Community features

2. Enhanced AI
   - Multi-model support
   - Advanced prompting
   - Context awareness
   - Memory systems

3. Mobile Support
   - React Native app
   - Cross-platform sync
   - Offline mode

4. Marketplace
   - Custom stories
   - Character templates
   - Equipment packs