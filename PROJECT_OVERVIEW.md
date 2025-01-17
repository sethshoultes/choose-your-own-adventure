# AdventureBuildr Project Overview

## Project Status: In Development

AdventureBuildr is a text-based adventure game platform built with React, TypeScript, and Supabase. The application allows users to create characters across multiple genres and embark on dynamic, choice-driven adventures.

### Core Features

✅ **Authentication System**
- Email/password authentication via Supabase
- Secure session management
- Profile creation and management

✅ **Character System**
- Character creation across multiple genres
- Customizable attributes and equipment
- Character persistence in Supabase
- Character listing and management

🚧 **Adventure System**
- Genre-specific storylines
- Dynamic choice-based progression
- State management with Zustand
- Scene rendering and choice handling

✅ **User Interface**
- Responsive design with Tailwind CSS
- Clean, modern aesthetic
- Intuitive navigation
- Loading states and error handling

🚧 **Admin Interface**
- API key management
- User management and roles
- Game state monitoring
- Data cleanup and maintenance
- Analytics and reporting
- System configuration

### Technical Architecture

#### Core Modules

```
src/
├── core/                    # Core game logic
│   ├── engine/             # Game engine components
│   │   ├── GameEngine.ts   # Main game logic handler
│   │   └── sceneManager.ts # Scene generation and management
│   └── types/              # Core type definitions
│       ├── game.ts         # Game state and scene types
│       ├── genre.ts        # Genre definitions
│       └── character.ts    # Character types
├── interface/              # UI components
│   ├── components/         # React components
│   ├── hooks/             # React hooks
│   ├── styles/            # UI styling
│   └── admin/             # Admin interface
└── data/                  # Data layer
    ├── repositories/      # Data access
    ├── models/           # Data models
    └── services/         # Business logic
```

#### Frontend Stack
- React 18.3
- TypeScript
- Vite
- Tailwind CSS
- Lucide React (icons)

#### Backend Services
- Supabase (Database & Auth)
- OpenAI Integration (planned)

#### State Management
- Zustand for global state
- React hooks for local state
- Custom navigation system

### Database Schema

The application uses the following main tables:

- `profiles`: User profiles and preferences
- `characters`: Character data and attributes
- `game_sessions`: Active game sessions and state
- `game_history`: Historical game choices and outcomes
- `api_credentials`: OpenAI API key storage

### Current Status

The application is being modularized with:

✅ Core type definitions
✅ Basic game engine
✅ Scene management
✅ OpenAI integration
🚧 State persistence
✅ UI components
🚧 Admin interface

### Next Steps

1. Develop admin interface for system management
2. Implement game state persistence
3. Add character progression system
4. Create achievement system
5. Add social features
6. Add analytics and reporting

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

The admin interface will provide the following capabilities:

1. **User Management**
   - User listing and search
   - Role assignment
   - Account status management
   - Activity monitoring

2. **API Management**
   - API key management
   - Usage monitoring
   - Rate limit configuration
   - Integration settings

3. **Game Management**
   - Active session monitoring
   - Game state inspection
   - Character management
   - Story progression tracking

4. **Data Management**
   - Data cleanup tools
   - Backup management
   - Archive functionality
   - Data export tools

5. **System Configuration**
   - Global settings management
   - Feature toggles
   - Environment configuration
   - Performance tuning

6. **Analytics & Reporting**
   - Usage statistics
   - Performance metrics
   - User engagement data
   - Error reporting