# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Robify is a collaborative music sharing app built with React Native and Expo. It's designed as a private platform for musician friends to share, discover, and collaborate on music tracks with advanced versioning and social features.

## Application Context & Vision
- **Private collaborative music platform** for musician friends
- **Invitation-only system** to maintain privacy within the friend circle
- **Multi-version track support** (Demo, Final, Remix, Acoustic, etc.)
- **Social collaboration features** with real-time feedback and comments
- **Professional music management** with advanced metadata and organization

## Comprehensive Application Structure

### 1. Authentication & User Management
- **Enhanced Profile System**:
  - Artist profiles with bio, social links, statistics
  - User roles: Artist, Listener, Admin
  - Friend/follower system with invitation codes
  - Profile customization with photos and branding

### 2. Music Upload & Versioning System
- **Advanced Upload Flow**:
  - Multi-version support per track (Demo, Final, Remix, Live, etc.)
  - Rich metadata: Genre, mood, instruments, collaborators, credits
  - Custom artwork per track/album
  - Batch upload capabilities
  - Audio format support: MP3, WAV, FLAC

- **Organization Features**:
  - Albums/EPs creation and management
  - Project workspaces for works-in-progress
  - Tag system for better discovery
  - Version comparison tools

### 3. Discovery & Navigation Structure
```
🏠 Home (Activity Feed)
├── Recent releases from friends
├── Personalized recommendations
├── Trending tracks within circle
└── Collaborative activity updates

🎵 Explore Music
├── Browse by Artist
├── Browse by Genre/Mood
├── Browse by Instrument/Tag
├── Albums & EPs
└── All Tracks (filterable)

📁 My Library
├── Favorites & Bookmarks
├── Personal Playlists
├── Collaborative Playlists
├── Downloaded for Offline
└── Recently Played

🔧 Creative Projects (for Artists)
├── Works in Progress
├── Collaborative Projects
├── Feedback & Comments Received
├── Version History
└── Project Chat/Communication

👤 Profile & Social
├── My Uploads & Discography
├── Listening Statistics
├── Friend Network
├── Settings & Preferences
└── Invite Management

⬆️ Upload Studio
├── New Track Upload
├── Create New Version
├── Collaborative Project Setup
└── Bulk Upload Tools
```

### 4. Advanced Music Player Features
- **Enhanced Playback**:
  - Background playback with rich notifications
  - Crossfade between tracks
  - Built-in equalizer with presets
  - Waveform visualization
  - Gapless playback for albums

- **Smart Features**:
  - Intelligent queue suggestions
  - Mood-based autoplay
  - Collaborative listening sessions
  - Timestamp-based comments during playback

### 5. Social & Collaboration Features
- **Real-time Collaboration**:
  - Multi-artist project invitations
  - Version comparison with A/B testing
  - Contextual feedback with audio timestamps
  - Project-based chat system
  - Notification system for updates

- **Social Interaction**:
  - Comments on tracks with timestamps
  - Reaction system (like, fire, custom emojis)
  - Collaborative playlist creation
  - Share links with temporary access
  - Activity feed for friend updates

### 6. Database Schema (Supabase)
- **Core Tables**:
  - `users` - User profiles and authentication
  - `tracks` - Individual music tracks
  - `track_versions` - Multiple versions of tracks
  - `albums` - Album/EP collections
  - `projects` - Collaborative workspaces
  - `playlists` - User-created playlists
  - `comments` - Track feedback with timestamps
  - `collaborations` - Multi-artist projects
  - `friendships` - User connections

## Development Commands

### Basic Commands
- `npm run dev` - Start Expo development server with cache cleared
- `npm run dev:android` - Start development server for Android
- `npm run dev:ios` - Start development server for iOS  
- `npm run dev:web` - Start development server for web
- `npm run clean` - Clean .expo and node_modules directories

### Build Commands
- No specific build commands configured - uses Expo's default build process
- Check EAS configuration in `eas.json` for build settings

## Architecture Overview

### Core Technologies
- **Framework**: React Native with Expo SDK 52
- **Navigation**: Expo Router (file-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: Zustand for global state
- **Audio**: react-native-track-player for music playback
- **Authentication**: Supabase
- **UI Components**: Custom components with rn-primitives

### Key Directory Structure
```
app/                    # File-based routing with Expo Router
├── (auth)/            # Authentication screens
├── (tabs)/            # Tab navigation screens  
├── (modals)/          # Modal screens
├── (onboarding)/      # Onboarding flow
components/            # Reusable components
├── ui/               # Base UI components
├── utils/            # Component utilities
store/                # Zustand stores
├── library.tsx       # Music library state
├── playerStore.tsx   # Player state
├── queue.tsx         # Queue management
hooks/                # Custom hooks
constants/            # App constants
lib/                  # Utilities and configurations
provider/             # React context providers
```

### Audio Architecture
- **Track Player**: Uses react-native-track-player with background playback support
- **Playback Service**: Registered in `index.js` using `service.js`
- **Audio Setup**: Configured in `hooks/useSetupTrackPlayer.tsx`
- **Player Components**: 
  - `FloatingPlayer` - Mini player overlay
  - `MusicPlayer` - Full-screen expandable player
  - `PlayerControls` - Playback control buttons

### State Management
- **Library Store** (`store/library.tsx`): Manages tracks, favorites, artists, and playlists
- **Player Store** (`store/playerStore.tsx`): Manages playback state and current track
- **Queue Store** (`store/queue.tsx`): Manages playback queue

### Authentication & Navigation
- **Auth Flow**: Supabase authentication with protected routes
- **Navigation**: Expo Router with tab navigation and modal screens
- **Protected Routes**: Authentication state managed in `app/_layout.tsx`

### Styling System
- **NativeWind v4**: Tailwind CSS classes for React Native
- **Theme Support**: Light/dark mode with persistent theme storage
- **Custom Fonts**: Satoshi font family loaded via Expo Font
- **Colors**: CSS variables system for consistent theming

## Development Guidelines

### File Organization
- Use TypeScript for all new files
- Follow the existing component structure in `components/`
- Place screen components in appropriate `app/` subdirectories
- Use Zustand stores for global state management

### Audio Development
- Track Player setup is handled in `hooks/useSetupTrackPlayer.tsx`
- Audio permissions are configured in `app.json`
- Background audio is enabled for iOS in `app.json`
- Support for multiple audio formats (MP3, WAV, FLAC)
- Implement crossfade and gapless playback features

### Styling Conventions
- Use NativeWind classes for styling
- Leverage custom font families: `font-sans`, `font-bold`, `font-medium`, etc.
- Follow the existing color scheme defined in `tailwind.config.js`
- Maintain consistent spacing and component patterns

### Authentication & Social Features
- Supabase client is configured in `lib/supabase.ts`
- Authentication state is managed via `provider/AuthProvider.tsx`
- Protected routes use authentication context
- Implement invitation system for private friend network
- Add user role management (Artist, Listener, Admin)

### Database Design Principles
- Design for multi-version track support
- Implement proper foreign key relationships
- Add soft deletion for user content
- Use row-level security for privacy
- Index frequently queried fields for performance

## Implementation Priority
1. **Phase 1**: Enhanced authentication and user profiles
2. **Phase 2**: Multi-version upload system and metadata management
3. **Phase 3**: Advanced music player with collaboration features
4. **Phase 4**: Social features and real-time collaboration
5. **Phase 5**: Advanced discovery and recommendation system

## Key Files to Understand
- `app/_layout.tsx` - Root layout with authentication flow
- `index.js` - App entry point with TrackPlayer registration
- `store/library.tsx` - Music library state management (needs restructuring)
- `hooks/useSetupTrackPlayer.tsx` - Audio player initialization
- `service.js` - Background audio service for TrackPlayer
- `app/(tabs)/upload.tsx` - Current upload implementation (needs enhancement)
- `app/(tabs)/profile.tsx` - Basic profile page (needs complete redesign)