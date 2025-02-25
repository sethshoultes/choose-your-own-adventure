# Game State Management

## Overview

The game state management system in AdventureBuildr provides a robust, reliable way to handle game progression, save/load functionality, and state persistence. The system uses a combination of in-memory state management through the GameEngine class and persistent storage via Supabase.

## Architecture

### Core Components

1. **GameEngine**
   - Central state management
   - Scene generation and progression
   - Choice handling
   - Checkpoint management
   - State persistence

2. **Database Layer**
   - Game sessions
   - Checkpoint history
   - Game history
   - State versioning

3. **State Validation**
   - Input validation
   - State integrity checks
   - Error recovery

### File Structure

```
src/
├── core/
│   ├── engine/
│   │   ├── GameEngine.ts       # Core state management
│   │   ├── StateManager.ts     # State operations
│   │   ├── StateValidator.ts   # Validation logic
│   │   ├── StateVersioner.ts   # Version control
│   │   └── CheckpointManager.ts # Checkpoint handling
│   └── services/
│       └── game/
│           └── GameStateService.ts # Database operations
```

## State Structure

### Game State Interface
```typescript
interface GameState {
  sessionId?: string;
  currentScene: Scene;
  history: GameHistoryEntry[];
  gameOver: boolean;
  checkpoint?: {
    scene: Scene;
    history: GameHistoryEntry[];
    timestamp: string;
  };
}

interface Scene {
  id: string;
  description: string;
  choices: Choice[];
}

interface GameHistoryEntry {
  sceneId: string;
  choice: string;
  sceneDescription?: string;
  timestamp?: string;
}
```

## Database Schema

### Tables

1. **game_sessions**
```sql
CREATE TABLE game_sessions (
  id uuid PRIMARY KEY,
  character_id uuid NOT NULL,
  current_scene jsonb NOT NULL,
  game_state jsonb NOT NULL,
  status session_status NOT NULL,
  checkpoint jsonb,
  created_at timestamptz,
  updated_at timestamptz
);
```

2. **checkpoint_history**
```sql
CREATE TABLE checkpoint_history (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL,
  character_id uuid NOT NULL,
  scene jsonb NOT NULL,
  history jsonb NOT NULL,
  created_at timestamptz,
  metadata jsonb
);
```

## Core Operations

### 1. State Initialization
```typescript
public async initializeGame(genre: Genre, character: Character): Promise<void> {
  // Get active session specifically for this character
  const { data: sessions } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('character_id', character.id)
    .eq('status', 'active');

  // If there's an existing session, load it
  const existingSession = sessions?.[0];
  if (existingSession && existingSession.game_state) {
    this.state = {
      sessionId: existingSession.id,
      currentScene: existingSession.current_scene,
      history: existingSession.game_state.history || [],
      gameOver: false
    };
    return;
  }

  // Create new session
  const { data: sessionData } = await supabase.rpc('safe_handle_game_session', {
    p_character_id: character.id,
    p_current_scene: initialScene,
    p_game_state: initialState,
    p_metadata: { genre, initialized_at: new Date().toISOString() }
  });

  this.state = initialState;
  this.state.sessionId = sessionData.session_id;
}
```

### 2. Auto-Save State

The game state is automatically saved after each choice and scene update:


```typescript
// Auto-save state after scene update
if (this.character.id && this.state.sessionId) {
  try {
    const { error: saveError } = await supabase
      .from('game_sessions')
      .upsert({
        id: this.state.sessionId,
        character_id: this.character.id,
        current_scene: this.state.currentScene,
        game_state: this.state,
        status: 'active',
        updated_at: new Date().toISOString()
      });

    if (saveError) {
      debugManager.log('Error auto-saving state', 'error', { error: saveError });
    } else {
      debugManager.log('Game state auto-saved', 'success', {
        sessionId: this.state.sessionId,
        sceneId: this.state.currentScene.id
      });
    }
  } catch (saveError) {
    debugManager.log('Error auto-saving state', 'error', { error: saveError });
  }
}
```

### 3. State Updates

```typescript
public async handleChoice(choiceId: number, callbacks: Callbacks): Promise<void> {
  // Update history
  this.state.history.push({
    sceneId: this.state.currentScene.id,
    choice: currentChoice.text,
    timestamp: new Date().toISOString()
  });

  // Generate next scene
  const nextScene = await this.generateScene();
  this.state.currentScene = nextScene;
  
  // State is auto-saved after scene update
}
```

### 4. Checkpoint Management

```typescript
public async createCheckpoint(): Promise<void> {
  const checkpoint = {
    scene: this.state.currentScene,
    history: this.state.history,
    timestamp: new Date().toISOString()
  };

  await this.saveCheckpoint(checkpoint);
}
```

## State Persistence

### 1. Save Operations

```typescript
private async saveState(): Promise<void> {
  await supabase
    .from('game_sessions')
    .upsert({
      id: this.state.sessionId,
      character_id: this.character.id,
      current_scene: this.state.currentScene,
      game_state: this.state,
      status: 'active',
      updated_at: new Date().toISOString()
    });
}
```

### 2. Load Operations

```typescript
private async loadState(sessionId: string): Promise<GameState> {
  const { data } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  return data.game_state;
}
```

## Error Handling

### 1. State Validation

```typescript
public validateState(state: GameState): boolean {
  if (!state.currentScene) return false;
  if (!Array.isArray(state.history)) return false;
  if (typeof state.gameOver !== 'boolean') return false;
  
  return true;
}
```

### 2. Error Recovery

```typescript
private async recoverState(): Promise<GameState | null> {
  // Try checkpoint first
  const checkpoint = await this.loadLatestCheckpoint();
  if (checkpoint) return checkpoint;

  // Reconstruct from history
  return this.reconstructFromHistory();
}
```

## Best Practices

### 1. Automatic State Persistence
- State is automatically saved after each choice
- No manual save operations needed
- Consistent state persistence
- Reliable recovery options

### 2. State Updates
- Always validate state changes
- Use atomic operations
- Maintain state consistency
- Handle all error cases

### 3. Persistence
- Regular auto-saves
- Validate before saving
- Handle network errors
- Maintain data integrity

### 4. Performance
- Optimize state updates
- Cache frequently used data
- Minimize database calls
- Batch operations when possible

## Common Pitfalls

1. **State Inconsistency**
   - Always validate state before updates
   - Use proper error boundaries
   - Implement recovery mechanisms

2. **Data Loss**
   - Regular auto-saves
   - Multiple save points
   - Proper error handling

3. **Performance Issues**
   - Optimize state updates
   - Implement proper caching
   - Minimize unnecessary saves

## Usage Examples

### 1. Basic Game Flow

```typescript
const engine = new GameEngine();
await engine.initialize();
await engine.initializeGame(genre, character);

// Handle player choice
await engine.handleChoice(choiceId, {
  onToken: updateUI,
  onComplete: finishTurn,
  onError: handleError
});
```

### 2. Save/Load Operations

```typescript
// Create checkpoint
await engine.createCheckpoint();

// Restore checkpoint
await engine.restoreCheckpoint();
```

### 3. State Recovery

```typescript
try {
  await engine.loadState(sessionId);
} catch (error) {
  const recoveredState = await engine.recoverState();
  if (recoveredState) {
    engine.setState(recoveredState);
  }
}
```

## Security Considerations

1. **Data Access**
   - Row Level Security
   - User authentication
   - Session validation

2. **State Validation**
   - Input sanitization
   - State integrity checks
   - Error boundaries

3. **Error Handling**
   - Secure error messages
   - Proper logging
   - Recovery mechanisms

## Performance Optimization

1. **State Updates**
   - Batch operations
   - Optimize re-renders
   - Use efficient data structures

2. **Database Operations**
   - Connection pooling
   - Query optimization
   - Proper indexing

3. **Caching**
   - State caching
   - Scene caching
   - History caching

## Future Enhancements

1. **State Features**
   - Enhanced versioning
   - State branching
   - Undo/redo support

2. **Performance**
   - Advanced caching
   - State compression
   - Optimized persistence

3. **User Experience**
   - Auto-save indicators
   - Save previews
   - State comparison tools