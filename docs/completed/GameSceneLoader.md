# GameSceneLoader Widget Documentation

## Overview

The GameSceneLoader is an administrative widget that provides a comprehensive interface for testing and debugging game state management, scene progression, and save/load functionality. It enables administrators to:

- Select game genres and characters
- Load and test game states
- Create and restore checkpoints
- Monitor scene progression
- Test choice handling
- Manage save points

## Features

### Core Functionality
- ✅ Genre selection interface
- ✅ Character loading and selection
- ✅ Game state initialization
- ✅ Scene progression testing
- ✅ Choice handling validation
- ✅ Checkpoint management
- ✅ Save point controls
- ✅ State preview system

### State Management
- ✅ Game session tracking
- ✅ State persistence
- ✅ Checkpoint system
- ✅ Save point system
- ✅ Error recovery

## Technical Implementation

### Component Structure
```typescript
interface GameSceneLoaderState {
  loading: boolean;
  error: string | null;
  genre: Genre | null;
  characters: Character[];
  selectedCharacter: Character | null;
  gameEngine: GameEngine | null;
  currentState: GameState | null;
}
```

### Database Integration
The widget interacts with the following tables:
- `game_sessions`: Active game sessions and state
- `characters`: Character data and metadata

### Key Operations

#### 1. Loading Game State
```typescript
const loadGameState = async (character: Character) => {
  // Initialize game engine
  const engine = new GameEngine();
  await engine.initialize();
  
  // Load or create session
  const session = await loadActiveSession(character.id);
  if (session) {
    await engine.loadSavedState(character.id);
  } else {
    await engine.initializeGame(character.genre, character);
  }
};
```

#### 2. Save Point Management
```typescript
const handleSave = async () => {
  // Update game session
  await supabase
    .from('game_sessions')
    .upsert({
      id: sessionId,
      character_id: characterId,
      current_scene: currentScene,
      game_state: gameState,
      checkpoint: {
        scene: currentScene,
        history: gameState.history,
        timestamp: new Date().toISOString()
      }
    });
};
```

#### 3. Choice Handling
```typescript
const handleChoice = async (choiceId: number) => {
  await gameEngine.handleChoice(choiceId, {
    onToken: updateScene,
    onComplete: finalizeChoice,
    onError: handleError
  });
};
```

## User Interface

### Main Views

1. **Genre Selection**
   - Grid layout of available genres
   - Visual icons for each genre
   - Hover effects and selection feedback

2. **Character Selection**
   - List of available characters for selected genre
   - Character details display
   - Loading states and error handling

3. **Game State Interface**
   - Current scene display
   - Choice options
   - Save/Load controls
   - Checkpoint browser
   - Error notifications

### Controls

1. **Save Point Controls**
   ```typescript
   <SavePointControls
     sessionId={currentState?.sessionId}
     characterId={selectedCharacter.id}
     currentScene={currentState?.currentScene}
     gameState={currentState}
     disabled={loading}
   />
   ```

2. **Checkpoint Browser**
   ```typescript
   <CheckpointBrowser
     sessionId={currentState?.sessionId}
     visible={showCheckpoints}
     onClose={() => setShowCheckpoints(false)}
     onCheckpointSelect={handleCheckpointSelect}
   />
   ```

## Error Handling

### Error Types
1. Database Errors
   - Connection issues
   - Query failures
   - Constraint violations

2. Game State Errors
   - Invalid state
   - Loading failures
   - Save failures

3. Engine Errors
   - Initialization failures
   - Choice handling errors
   - State update errors

### Error Recovery
```typescript
try {
  // Operation
  debugManager.log('Operation started', 'info');
} catch (err) {
  const message = err instanceof Error ? err.message : 'Operation failed';
  debugManager.log('Error occurred', 'error', { error: err });
  setError(message);
} finally {
  setLoading(false);
}
```

## Best Practices

### State Management
1. Keep state updates atomic
2. Use proper loading indicators
3. Handle all error cases
4. Clean up state on unmount

### Performance
1. Implement efficient loading states
2. Cache character data when possible
3. Optimize database queries
4. Minimize re-renders

### Error Handling
1. Log all errors with context
2. Provide user-friendly messages
3. Implement proper recovery
4. Maintain state consistency

## Usage Examples

### Basic Usage
```typescript
// Initialize widget
<GameSceneLoader />
```

### Loading Specific Character
```typescript
// Select genre and character
setGenre('Fantasy');
loadGameState(character);
```

### Creating Checkpoint
```typescript
// Save current state
await handleSave();
```

### Loading Checkpoint
```typescript
// Load selected checkpoint
await handleCheckpointSelect(checkpoint);
```

## Troubleshooting

### Common Issues

1. **State Loading Failures**
   - Check database connection
   - Verify character ID
   - Validate session state

2. **Save Failures**
   - Verify session ID
   - Check state validity
   - Confirm database permissions

3. **Choice Handling Errors**
   - Validate game engine state
   - Check choice validity
   - Verify scene consistency

### Debug Tools
- Use browser console for logs
- Check debug panel output
- Monitor network requests
- Inspect state changes

## Future Enhancements

### Planned Features
1. Enhanced state preview
2. Advanced filtering
3. Batch operations
4. Performance metrics

### Improvements
1. Better error recovery
2. Enhanced caching
3. Optimized queries
4. Improved UI feedback