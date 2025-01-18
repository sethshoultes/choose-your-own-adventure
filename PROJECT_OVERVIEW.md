# AdventureBuildr Project Overview

## Project Status: In Development

AdventureBuildr is a text-based adventure game platform built with React, TypeScript, and Supabase. The application allows users to create characters across multiple genres and embark on dynamic, choice-driven adventures.

### Core Features

✅ **Authentication System**
- Email/password authentication via Supabase
- Secure session management
- Profile creation and management
- Role-based access control

✅ **Character System**
- Character creation across multiple genres
- Customizable attributes and equipment
- Character persistence in Supabase
- Character listing and management
- Character backstory support

✅ **Adventure System**
- Genre-specific storylines
- Dynamic choice-based progression
- Enhanced state management
- Scene rendering and choice handling
- Checkpoint system for save/restore
- Chat history with formatted messages
- Improved response parsing
- Reliable JSON handling

✅ **User Interface**
- Responsive design with Tailwind CSS
- Clean, modern aesthetic
- Intuitive navigation
- Loading states and error handling
- Debug panel for development
- Chat-like history view

✅ **Admin Interface**
- Test panel for OpenAI integration
- Real-time response streaming
- Raw response inspection
- Formatted response preview
- Debug logging system
- Role-based access control
- System monitoring capabilities

### Technical Architecture

#### Core Modules

```
src/
├── core/                    # Core game logic
│   ├── engine/             # Game engine components
│   │   ├── GameEngine.ts   # Main game logic handler
│   │   └── sceneManager.ts # Scene generation and management
│   ├── parser/            # Response parsing system
│   │   ├── responseParser.ts # Response parsing utilities
│   │   └── types.ts        # Parser type definitions
│   ├── services/          # Service layer
│   │   ├── openai/        # OpenAI integration
│   │   └── game/          # Game state management
│   ├── debug/             # Debug tools
│   │   ├── DebugManager.ts # Debug state management
│   │   └── DebugPanel.tsx  # Debug UI components
│   └── types/             # Core type definitions
│       ├── game.ts        # Game state and scene types
│       ├── genre.ts       # Genre definitions
│       └── character.ts   # Character types
├── components/            # React components
│   ├── admin/            # Admin interface components
│   ├── debug/            # Debug interface components
│   └── game/             # Game interface components
└── lib/                  # Utility libraries
    ├── supabase.ts       # Database client
    └── openai.ts         # OpenAI client
```

#### Frontend Stack
- React 18.3
- TypeScript
- Vite
- Tailwind CSS
- Lucide React (icons)
- Zustand (state management)

#### Backend Services
- Supabase (Database & Auth)
- OpenAI Integration
- Row Level Security
- Real-time updates

#### State Management
- Zustand for global state
- React hooks for local state
- Debug state management
- Game state persistence

### Database Schema

The application uses the following main tables:

- `profiles`: User profiles and preferences
- `characters`: Character data and attributes
- `game_sessions`: Active game sessions and state
- `game_history`: Historical game choices and outcomes
- `api_credentials`: OpenAI API key storage

### Current Status

The application has achieved:

✅ Core type definitions
✅ Basic game engine
✅ Scene management
✅ OpenAI integration
✅ Response parsing
✅ State persistence
✅ UI components
✅ Admin interface
✅ Debug system
✅ Checkpoint system

### Next Steps

1. Implement dynamic choice generation
2. Improve response reliability
3. Enhance character progression
4. Add achievement system
5. Expand admin capabilities
6. Add analytics and reporting
7. Optimize performance
8. Add social features

### Security

Security measures include:
- Row Level Security in Supabase
- Secure authentication flow
- Protected API endpoints
- Encrypted credentials
- XSS protection
- Role-based access control
- Audit logging
- Session management

### Admin Features

The admin interface provides:

1. **Testing Tools**
   - OpenAI integration testing
   - Response streaming
   - Real-time debugging
   - Error monitoring

2. **Debug System**
   - Real-time logging
   - State inspection
   - Error tracking
   - Performance monitoring

3. **Game Management**
   - Session monitoring
   - State inspection
   - Character management
   - Story progression tracking

4. **System Configuration**
   - Global settings
   - Feature toggles
   - Environment configuration
   - Performance tuning

5. **Analytics & Reporting**
   - Usage statistics
   - Performance metrics
   - Error reporting
   - User engagement data