# Progression System Specification

## Overview

This specification outlines the implementation of a comprehensive progression system for AdventureBuildr while maintaining existing functionality. The system will handle character advancement, experience points, level-ups, and achievements.

## Core Features

### 1. Experience System
- Dynamic XP awards for actions
- Level-based progression
- Attribute point allocation
- Achievement integration
- Auto-save integration

### 2. UI Components
- Progress bar display
- Level-up notifications
- XP gain indicators
- Attribute point modal
- Achievement notifications

### 3. State Management
- Automatic state persistence
- Progress tracking
- Achievement validation
- Error recovery
- Real-time updates

## Technical Architecture

### Component Structure

```typescript
// Progress Bar Component
interface ProgressBarProps {
  currentXP: number;
  level: number;
  className?: string;
}

// Level Up Modal
interface LevelUpModalProps {
  result: LevelUpResult;
  onClose: () => void;
  onAttributePointsAssigned: () => void;
  visible: boolean;
}

// XP Notification
interface XPNotificationProps {
  xp: number;
  source: string;
  onComplete: () => void;
}

// Attribute Points Modal
interface AttributePointsModalProps {
  character: Character;
  onClose: () => void;
  onSave: (updatedCharacter: Character) => void;
  visible: boolean;
}
```

### Service Structure

```typescript
// Progression Service
class ProgressionService {
  private static readonly BASE_XP_PER_LEVEL = 1000;
  private static readonly XP_MULTIPLIER = 1.5;
  
  private static readonly XP_AWARDS = {
    CHOICE_MADE: 50,
    STORY_MILESTONE: 200,
    ATTRIBUTE_CHECK_SUCCESS: 100,
    EQUIPMENT_USE: 75,
    STORY_COMPLETION: 500
  };

  public async handleChoiceMade(params: {
    character: Character;
    choice: string;
    history: GameHistoryEntry[];
    callbacks: {
      onXP?: (amount: number, source: string) => void;
      onLevelUp?: (result: LevelUpResult) => void;
      onAchievementUnlocked?: (achievement: Achievement) => void;
    };
  }): Promise<void>;
}
```

### Database Schema

```sql

-- Progress tracking
CREATE TABLE IF NOT EXISTS progression_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid REFERENCES characters(id),
  action_type text NOT NULL,
  xp_amount integer NOT NULL,
  source text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

## Integration Points

### 1. Game Engine Integration

```typescript
// In GameEngine
private async handleChoice(choiceId: number): Promise<void> {
  const choice = this.state.currentScene.choices
    .find(c => c.id === choiceId);
    
  await this.progressionService.handleChoiceMade({
    character: this.character,
    choice: choice.text,
    history: this.state.history,
    callbacks: {
      onXP: this.handleXP,
      onLevelUp: this.handleLevelUp,
      onAchievementUnlocked: this.handleAchievement
    }
  });
}
```

### 2. UI Component Integration

```typescript
// In StoryScene
function StoryScene({ character, onCharacterUpdate, ...props }) {
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpResult, setLevelUpResult] = useState<LevelUpResult | null>(null);
  
  const handleLevelUp = (result: LevelUpResult) => {
    setLevelUpResult(result);
    setShowLevelUp(true);
  };
  
  return (
    <>
      <ProgressBar
        currentXP={character.experience_points}
        level={character.level}
      />
      {levelUpResult && (
        <LevelUpModal
          result={levelUpResult}
          visible={showLevelUp}
          onClose={() => setShowLevelUp(false)}
          onAttributePointsAssigned={() => {
            // Handle attribute point allocation
          }}
        />
      )}
    </>
  );
}
```

### 3. State Management Integration

```typescript
// In StateManager
public async saveProgressionState(
  character: Character,
  progressionUpdate: ProgressionUpdate
): Promise<void> {
  await this.database.operation(
    `progression:${character.id}`,
    async () => {
      const { error } = await supabase
        .from('characters')
        .update({
          experience_points: character.experience_points,
          level: character.level,
          attribute_points: character.attribute_points,
          updated_at: new Date().toISOString()
        })
        .eq('id', character.id);

      if (error) throw error;
    }
  );
}
```

## Implementation Phases

### Phase 1: Core System
1. Implement ProgressionService
2. Add database schema updates
3. Create progression types
4. Add service registration

### Phase 2: UI Components
1. Create ProgressBar component
2. Implement LevelUpModal
3. Add XPNotification
4. Create AttributePointsModal

### Phase 3: Integration
1. Connect to GameEngine
2. Add state persistence
3. Implement error handling
4. Add achievement checks

### Phase 4: Testing
1. Unit test components
2. Integration tests
3. Performance testing
4. UI/UX validation

## Success Criteria

### 1. Functionality
- Accurate XP tracking
- Reliable level-ups
- Proper state persistence
- Error-free progression

### 2. Performance
- < 100ms state updates
- Smooth animations
- No UI freezes
- Efficient saves

### 3. User Experience
- Clear feedback
- Intuitive controls
- Proper notifications
- Consistent behavior

## Version Control

```markdown
[2025-02-01] v1.0.0.45-alpha
- Added progression system specification
- Type: Documentation
- Contributor: Bolt
```

## Testing Requirements

### 1. Unit Tests
- XP calculation
- Level-up logic
- State persistence
- UI components

### 2. Integration Tests
- Game engine integration
- Database operations
- State management
- Error handling

### 3. Performance Tests
- State update speed
- Animation smoothness
- Memory usage
- Load times

## Documentation Requirements

### 1. Code Documentation
- JSDoc comments
- Type definitions
- Usage examples
- Integration notes

### 2. User Documentation
- Feature overview
- Usage instructions
- Best practices
- Troubleshooting

## Monitoring

### 1. Performance Metrics
- XP award timing
- State update speed
- UI responsiveness
- Save operation timing

### 2. Error Tracking
- Failed operations
- State inconsistencies
- Database errors
- UI glitches

## Rollback Plan

### 1. Database
- Schema version control
- Data migration scripts
- Backup procedures
- Recovery process

### 2. Code
- Feature flags
- Version control
- State validation
- Error recovery

## Security Considerations

### 1. Data Integrity
- Validate all updates
- Prevent XP exploitation
- Secure state changes
- Audit logging

### 2. Access Control
- Role-based access
- Operation validation
- Input sanitization
- Error handling

## Maintenance

### 1. Regular Tasks
- Performance monitoring
- Error log review
- State validation
- Cache cleanup

### 2. Updates
- Schema migrations
- Service updates
- UI improvements
- Documentation updates