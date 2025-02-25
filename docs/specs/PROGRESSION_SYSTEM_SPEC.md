# AdventureBuildr Progression System Specification

## Overview

The progression system in AdventureBuildr provides character advancement through experience points, levels, and achievements. This specification outlines the complete implementation while preserving existing functionality.

## Core Components

### 1. Experience System
- Dynamic XP awards based on player choices and actions
- Level-based progression with increasing XP requirements
- Attribute point allocation on level-up
- Achievement-based XP bonuses
- Auto-save integration for reliable progress tracking

### 2. UI Components

#### Progress Bar
```typescript
interface ProgressBarProps {
  currentXP: number;
  level: number;
  className?: string;
}
```
- Shows current level and XP
- Visual progress indicator
- Smooth animations
- Level-up feedback

#### XP Notification
```typescript
interface XPNotificationProps {
  xp: number;
  source: string;
  onComplete: () => void;
}
```
- Animated XP gain display
- Source indication
- Auto-dismiss
- Stacking notifications

#### Level Up Modal
```typescript
interface LevelUpModalProps {
  result: LevelUpResult;
  onClose: () => void;
  onAttributePointsAssigned: () => void;
  visible: boolean;
}
```
- Level-up announcement
- Attribute point distribution
- New feature unlocks
- Reward display

#### Attribute Points Modal
```typescript
interface AttributePointsModalProps {
  character: Character;
  onClose: () => void;
  onSave: (updatedCharacter: Character) => void;
  visible: boolean;
}
```
- Attribute point allocation
- Visual feedback
- Value constraints
- Auto-save integration

## Technical Architecture

### 1. Progression Service
```typescript
class ProgressionService {
  private static readonly BASE_XP_PER_LEVEL = 1000;
  private static readonly XP_MULTIPLIER = 1.5;
  
  private static readonly XP_AWARDS = {
    CHOICE_MADE: 50,
    STORY_MILESTONE: 200,
    ATTRIBUTE_CHECK_SUCCESS: 100,
    EQUIPMENT_USE: 75,
    STORY_COMPLETION: 500,
    ACHIEVEMENT_UNLOCKED: {
      DECISION_MAKER: 500,
      ATTRIBUTE_MASTER: 750,
      STORY_MASTER: 1000,
      GENRE_EXPLORER: 500,
      EQUIPMENT_COLLECTOR: 300
    }
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

  public async awardXP(
    character: Character,
    action: keyof typeof XP_AWARDS,
    context?: {
      multiplier?: number;
      achievementType?: string;
    }
  ): Promise<{
    xpAwarded: number;
    newTotal: number;
    levelUp: boolean;
  }>;

  private calculateLevel(xp: number): number;
  private getXPForLevel(level: number): number;
  private getAttributePointsForLevel(level: number): number;
  private getUnlockedFeatures(level: number): string[];
}
```

### 2. Game Engine Integration
```typescript
class GameEngine {
  private progressionService: ProgressionService;

  public async handleChoice(choiceId: number): Promise<void> {
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
}
```

### 3. Database Schema
```sql
-- Character progression fields
ALTER TABLE characters
ADD COLUMN IF NOT EXISTS experience_points integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS level integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS attribute_points integer DEFAULT 0;

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

### 1. StoryScene Component
```typescript
function StoryScene({ character, onCharacterUpdate, ...props }) {
  const handleXP = (amount: number, source: string) => {
    setXPNotification({ amount, source });
  };

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
      {/* Level up modal */}
      {levelUpResult && (
        <LevelUpModal
          result={levelUpResult}
          visible={showLevelUp}
          onClose={() => setShowLevelUp(false)}
          onAttributePointsAssigned={() => {
            setShowAttributePoints(true);
          }}
        />
      )}
      {/* Attribute points modal */}
      {showAttributePoints && (
        <AttributePointsModal
          character={character}
          visible={showAttributePoints}
          onClose={() => setShowAttributePoints(false)}
          onSave={handleCharacterUpdate}
        />
      )}
      {/* XP notification */}
      {xpNotification && (
        <XPNotification
          xp={xpNotification.amount}
          source={xpNotification.source}
          onComplete={() => setXPNotification(null)}
        />
      )}
    </>
  );
}
```

### 2. Character Component
```typescript
function CharacterSheet({ character }) {
  return (
    <div>
      <ProgressBar
        currentXP={character.experience_points}
        level={character.level}
        className="mb-4"
      />
      <div>
        <h3>Attributes</h3>
        {character.attributes.map(attr => (
          <AttributeDisplay
            key={attr.name}
            attribute={attr}
            canUpgrade={character.attribute_points > 0}
          />
        ))}
      </div>
    </div>
  );
}
```

## State Management

### 1. Auto-Save Integration
```typescript
private async saveProgressionState(character: Character): Promise<void> {
  await supabase
    .from('characters')
    .update({
      experience_points: character.experience_points,
      level: character.level,
      attribute_points: character.attribute_points,
      updated_at: new Date().toISOString()
    })
    .eq('id', character.id);
}
```

### 2. Progress Tracking
```typescript
private async trackProgress(
  character: Character,
  action: string,
  xp: number
): Promise<void> {
  await supabase
    .from('progression_history')
    .insert({
      character_id: character.id,
      action_type: action,
      xp_amount: xp,
      source: action,
      created_at: new Date().toISOString()
    });
}
```

## Testing Strategy

### 1. Unit Tests
```typescript
describe('ProgressionService', () => {
  it('calculates XP requirements correctly', () => {
    const service = new ProgressionService();
    expect(service.getXPForLevel(2)).toBe(1500);
  });

  it('awards XP with proper multipliers', async () => {
    const result = await service.awardXP(character, 'CHOICE_MADE', {
      multiplier: 1.5
    });
    expect(result.xpAwarded).toBe(75);
  });
});
```

### 2. Integration Tests
```typescript
describe('Progression Integration', () => {
  it('handles level ups properly', async () => {
    const engine = new GameEngine();
    await engine.initialize();
    
    // Make choice that triggers level up
    await engine.handleChoice(1);
    
    expect(engine.getCharacter().level).toBe(2);
  });
});
```

### 3. Component Tests
```typescript
describe('ProgressBar', () => {
  it('displays progress correctly', () => {
    render(
      <ProgressBar
        currentXP={750}
        level={1}
      />
    );
    expect(screen.getByText('75%')).toBeInTheDocument();
  });
});
```

## Error Handling

### 1. State Validation
```typescript
private validateProgressionState(state: any): boolean {
  if (typeof state.experience_points !== 'number') return false;
  if (typeof state.level !== 'number') return false;
  if (state.level < 1) return false;
  if (state.experience_points < 0) return false;
  return true;
}
```

### 2. Error Recovery
```typescript
try {
  await this.saveProgressionState(character);
} catch (error) {
  debugManager.log('Error saving progression', 'error', { error });
  // Retry with exponential backoff
  await this.retryOperation(() => this.saveProgressionState(character));
}
```

## Performance Considerations

### 1. State Updates
- Batch progression updates
- Optimize re-renders
- Cache calculations
- Debounce saves

### 2. UI Performance
- Smooth animations
- Efficient updates
- Proper cleanup
- Memory management

## Security

### 1. Data Validation
- Validate all XP awards
- Verify level calculations
- Check attribute points
- Sanitize inputs

### 2. Access Control
- Row Level Security
- User authentication
- Operation validation
- Audit logging

## Monitoring

### 1. Progress Metrics
- XP gain rates
- Level-up frequency
- Attribute distributions
- Achievement unlocks

### 2. Performance Metrics
- Update times
- Save latency
- UI responsiveness
- Error rates

## Documentation

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

## Version Control

```markdown
[2025-02-01] v1.0.0.48-alpha
- Added comprehensive progression system specification
- Type: Documentation
- Contributor: Bolt
```