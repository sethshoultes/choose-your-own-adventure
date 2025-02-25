# Project Reorganization Specification

## Overview

This specification outlines the reorganization of the AdventureBuildr project's component structure and the implementation of the progression system. The goal is to improve code organization while maintaining existing functionality.

## Component Directory Structure

### New Structure

```
src/
├── components/
│   ├── admin/              # Admin-specific components
│   │   ├── ResponseViews/  # Response visualization
│   │   └── widgets/        # Admin tools and widgets
│   ├── auth/               # Authentication components
│   │   ├── Auth.tsx
│   │   ├── ApiKeySetup.tsx
│   │   └── LogoutButton.tsx
│   ├── character/          # Character-related components
│   │   ├── CharacterCreation.tsx
│   │   ├── CharacterList.tsx
│   │   └── CharacterSelector.tsx
│   ├── common/             # Shared components
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   ├── LoadingIndicator.tsx
│   │   └── Menu.tsx
│   ├── debug/              # Debugging components
│   │   ├── DebugPanel.tsx
│   │   └── DebugToggle.tsx
│   ├── game/               # Core game components
│   │   ├── StoryScene.tsx
│   │   └── ChatHistory.tsx
│   └── progression/        # Progression system
       ├── AttributePointsModal.tsx
       ├── LevelUpModal.tsx
       ├── ProgressBar.tsx
       └── XPNotification.tsx

## File Dependencies

### Component Dependencies

1. **Admin Components**
   ```
   TestPanel.tsx
   ├── ResponseViews/
   │   ├── RawResponseView.tsx
   │   └── FormattedResponseView.tsx
   └── widgets/
       └── OpenAITester.tsx
   ```

2. **Auth Components**
   ```
   Auth.tsx
   ├── supabase.ts
   └── LoadingIndicator.tsx

   ApiKeySetup.tsx
   ├── supabase.ts
   ├── LoadingIndicator.tsx
   └── types.ts
   ```

3. **Character Components**
   ```
   CharacterCreation.tsx
   ├── supabase.ts
   ├── types.ts
   ├── LoadingIndicator.tsx
   ├── useNavigate.ts
   └── core/
       ├── engine/sceneManager.ts
       └── debug/DebugManager.ts

   CharacterList.tsx
   ├── supabase.ts
   ├── types.ts
   ├── LoadingIndicator.tsx
   ├── useNavigate.ts
   └── core/engine/sceneManager.ts

   CharacterSelector.tsx
   ├── types.ts
   ├── LoadingIndicator.tsx
   └── useNavigate.ts
   ```

4. **Game Components**
   ```
   StoryScene.tsx
   ├── types.ts
   ├── LoadingIndicator.tsx
   ├── useNavigate.ts
   └── core/
       └── debug/DebugManager.ts

   ChatHistory.tsx
   └── types.ts
   ```

5. **Progression Components**
   ```
   AttributePointsModal.tsx
   ├── types.ts
   ├── supabase.ts
   ├── LoadingIndicator.tsx
   └── core/debug/DebugManager.ts

   LevelUpModal.tsx
   ├── types.ts
   └── LoadingIndicator.tsx

   ProgressBar.tsx
   ├── core/
   │   ├── services/ServiceRegistry.ts
   │   ├── services/progression/ProgressionService.ts
   │   └── debug/DebugManager.ts
   └── types.ts

   XPNotification.tsx
   └── types.ts
   ```

### Service Dependencies

1. **Core Services**
   ```
   GameEngine.ts
   ├── types.ts
   ├── sceneManager.ts
   ├── supabase.ts
   ├── ResponseParserService.ts
   └── debug/DebugManager.ts

   ProgressionService.ts
   ├── ServiceRegistry.ts
   ├── ValidationService.ts
   ├── DatabaseService.ts
   ├── ErrorService.ts
   └── debug/DebugManager.ts

   OpenAIService.ts
   ├── config.ts
   ├── OpenAIClient.ts
   ├── ResponseParser.ts
   ├── RateLimiter.ts
   └── types.ts
   ```

2. **Utility Services**
   ```
   ServiceRegistry.ts
   └── debug/DebugManager.ts

   ValidationService.ts
   ├── debug/DebugManager.ts
   └── types.ts

   DatabaseService.ts
   ├── supabase.ts
   └── debug/DebugManager.ts
   ```

### Hook Dependencies

```
useAdminStatus.ts
├── supabase.ts
└── debug/DebugManager.ts

useLocation.ts
└── react

useNavigate.ts
└── react

useResponseParser.ts
├── debug/DebugManager.ts
└── utils/responseParser.ts
```

### Type Dependencies

```
types/
├── character.ts
├── game.ts
├── genre.ts
└── index.ts (exports all types)
```

## Migration Strategy

1. **Phase 1: Directory Structure**
   - Create new directories
   - Move files to new locations
   - Update import paths
   - Verify build

2. **Phase 2: Import Updates**
   - Update all import statements
   - Fix any broken references
   - Test component rendering
   - Verify functionality

3. **Phase 3: Dependency Cleanup**
   - Remove unused imports
   - Clean up circular dependencies
   - Optimize import chains
   - Test performance

## Rollback Plan

1. **Component Structure**
   - Keep backup of original structure
   - Document all moved files
   - Maintain import maps

2. **Import Paths**
   - Version control checkpoints
   - Staged commits
   - Automated tests
   - Manual verification

## Success Criteria

1. **Build Success**
   - Clean build output
   - No console errors
   - All tests passing
   - Type checking success

2. **Runtime Verification**
   - All features working
   - No broken links
   - Proper state management
   - Error handling intact

3. **Performance**
   - No degradation
   - Clean dependency tree
   - Optimized imports
   - Fast load times

## Version Update

```markdown
[2025-02-01] v1.0.0.43-alpha
- Added comprehensive file dependency documentation
- Type: Documentation
- Contributor: Bolt
```
