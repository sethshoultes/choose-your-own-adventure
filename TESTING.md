# AdventureBuildr Testing Guide

## Overview

This document outlines the testing strategy for AdventureBuildr, covering unit tests, integration tests, and end-to-end testing.

## Testing Categories

### 1. Unit Tests

Use Vitest for unit testing individual components and services.

#### Core Services Tests

```typescript
// src/core/services/progression/__tests__/ProgressionService.test.ts
import { describe, it, expect } from 'vitest';
import { ProgressionService } from '../ProgressionService';

describe('ProgressionService', () => {
  describe('getXPForLevel', () => {
    it('should calculate correct XP for level 1', () => {
      expect(ProgressionService.getXPForLevel(1)).toBe(1000);
    });

    it('should calculate correct XP for higher levels', () => {
      expect(ProgressionService.getXPForLevel(2)).toBe(1500);
      expect(ProgressionService.getXPForLevel(3)).toBe(2250);
    });
  });

  describe('calculateLevel', () => {
    it('should return level 1 for 0 XP', () => {
      expect(ProgressionService.calculateLevel(0)).toBe(1);
    });

    it('should calculate correct level for given XP', () => {
      expect(ProgressionService.calculateLevel(1600)).toBe(2);
      expect(ProgressionService.calculateLevel(2300)).toBe(3);
    });
  });
});

// src/core/services/achievements/__tests__/AchievementService.test.ts
describe('AchievementService', () => {
  describe('checkAchievementRequirements', () => {
    it('should correctly validate STORY_MASTER achievement', async () => {
      const character = {
        id: '123',
        user_id: '456',
        name: 'Test Character',
        genre: 'Fantasy',
        attributes: [],
        equipment: [],
        backstory: ''
      };

      const result = await AchievementService.checkAchievementRequirements(
        AchievementService.ACHIEVEMENTS.STORY_MASTER,
        character,
        { storiesCompleted: 11 }
      );

      expect(result).toBe(true);
    });
  });
});
```

#### Component Tests

```typescript
// src/components/__tests__/ProgressBar.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from '../progression/ProgressBar';

describe('ProgressBar', () => {
  it('should render correct progress percentage', () => {
    render(<ProgressBar currentXP={1500} level={1} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should show correct XP values', () => {
    render(<ProgressBar currentXP={1500} level={1} />);
    expect(screen.getByText('500 XP')).toBeInTheDocument();
    expect(screen.getByText('1000 XP needed')).toBeInTheDocument();
  });
});

// src/components/__tests__/AchievementPopup.test.tsx
describe('AchievementPopup', () => {
  it('should display achievement details', () => {
    const achievement = {
      id: 'TEST_ACHIEVEMENT',
      title: 'Test Achievement',
      description: 'Test Description',
      xpReward: 100,
      icon: 'Trophy'
    };

    render(<AchievementPopup achievement={achievement} onClose={() => {}} />);
    
    expect(screen.getByText('Test Achievement')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('+100 XP')).toBeInTheDocument();
  });
});
```

### 2. Integration Tests

Test interactions between components and services.

```typescript
// src/tests/integration/GameEngine.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '../../core/engine/GameEngine';
import { supabase } from '../../lib/supabase';

describe('GameEngine Integration', () => {
  let gameEngine: GameEngine;
  let character;

  beforeEach(() => {
    gameEngine = new GameEngine();
    character = {
      id: '123',
      name: 'Test Character',
      genre: 'Fantasy',
      attributes: [],
      equipment: [],
      backstory: ''
    };
  });

  it('should handle choice and update game state', async () => {
    gameEngine.initializeGame('Fantasy', character);
    
    const callbacks = {
      onToken: vi.fn(),
      onComplete: vi.fn(),
      onError: vi.fn(),
      onLevelUp: vi.fn(),
      onAchievementUnlocked: vi.fn()
    };

    await gameEngine.handleChoice(1, callbacks);
    
    expect(callbacks.onComplete).toHaveBeenCalled();
    expect(gameEngine.getCurrentState().history.length).toBe(1);
  });
});

// src/tests/integration/Achievement.test.ts
describe('Achievement Integration', () => {
  it('should unlock achievement and award XP', async () => {
    const userId = 'test-user';
    const achievement = AchievementService.ACHIEVEMENTS.STORY_MASTER;
    
    // Create test character
    const { data: character } = await supabase
      .from('characters')
      .insert({
        user_id: userId,
        name: 'Test',
        genre: 'Fantasy',
        experience_points: 0
      })
      .select()
      .single();

    // Unlock achievement
    await AchievementService.unlockAchievement(userId, achievement);

    // Verify XP was awarded
    const { data: updatedCharacter } = await supabase
      .from('characters')
      .select('experience_points')
      .eq('id', character.id)
      .single();

    expect(updatedCharacter.experience_points).toBe(achievement.xpReward);
  });
});
```

### 3. End-to-End Tests

Use Playwright for end-to-end testing.

```typescript
// e2e/game-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Game Flow', () => {
  test('complete game session', async ({ page }) => {
    // Login
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password');
    await page.click('[data-testid="login-button"]');

    // Select genre
    await page.click('[data-testid="genre-fantasy"]');

    // Create character
    await page.fill('[data-testid="character-name"]', 'Test Character');
    await page.click('[data-testid="next-button"]');

    // Make choices
    await page.click('[data-testid="choice-1"]');
    await expect(page.locator('[data-testid="story-text"]')).toContainText('new scene');

    // Verify XP gain
    await expect(page.locator('[data-testid="xp-value"]')).toContainText('50 XP');
  });
});
```

### 4. Performance Tests

```typescript
// src/tests/performance/GameEngine.perf.ts
import { describe, it, expect } from 'vitest';
import { GameEngine } from '../../core/engine/GameEngine';

describe('GameEngine Performance', () => {
  it('should handle state updates within 100ms', async () => {
    const gameEngine = new GameEngine();
    const start = performance.now();
    
    await gameEngine.handleChoice(1, {
      onToken: () => {},
      onComplete: () => {},
      onError: () => {},
      onLevelUp: () => {}
    });
    
    const end = performance.now();
    expect(end - start).toBeLessThan(100);
  });
});
```

## Test Setup

1. Install dependencies:
```bash
npm install -D vitest @testing-library/react @testing-library/user-event @playwright/test
```

2. Add test scripts to package.json:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test"
  }
}
```

3. Create test configuration:
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/tests/setup.ts']
    }
  }
});

// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI
  }
});
```

## Test Guidelines

1. Unit Tests:
   - Test each service method in isolation
   - Mock external dependencies
   - Focus on edge cases and error handling
   - Aim for high coverage of core logic

2. Integration Tests:
   - Test component interactions
   - Verify state management
   - Test database operations
   - Validate achievement system

3. E2E Tests:
   - Cover critical user flows
   - Test authentication
   - Verify game progression
   - Check achievement unlocks

4. Performance Tests:
   - Measure response times
   - Test under load
   - Verify memory usage
   - Check animation performance

## Running Tests

1. Unit and Integration Tests:
```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

2. E2E Tests:
```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test game-flow.spec.ts

# Run in debug mode
npx playwright test --debug
```

## Continuous Integration

Configure GitHub Actions for automated testing:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:e2e
```

## Test Coverage Goals

- Unit Tests: 90% coverage
- Integration Tests: 80% coverage
- E2E Tests: Cover all critical user flows
- Performance Tests: Meet defined benchmarks