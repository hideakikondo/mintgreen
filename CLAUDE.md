# CLAUDE.md

必ず日本語で回答してください。
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development
- `npm run dev` - Start development server (runs on http://localhost:5174)
- `npm run build` - Build for production (TypeScript compilation + Vite build)
- `npm run preview` - Preview production build

### Code Quality
- `npm run lint` - Run Biome linter checks
- `npm run format` - Format code with Biome
- `npm test` - Run tests with Vitest

## Architecture Overview

### Project Structure
This is a React 19 + TypeScript voting application using Vite as the build tool and Supabase as the backend.

**Key directories:**
- `src/app/` - Page components organized by feature (admin, vote)
- `src/components/` - Reusable components (admin, common subdirectories)
- `src/lib/` - Utilities and external service clients
- `src/types/` - TypeScript type definitions

### Database Schema
The application uses Supabase with four main tables:
- `voters` - Voter registration and eligibility
- `elections` - Election metadata and timing
- `candidates` - Candidate information per election
- `votes` - Vote records linking voters, elections, and candidates

### Routing Architecture
Uses React Router with nested routes:
- Public routes: `/`, `/issues`, `/issue-vote`
- Admin routes: `/admin/*` with nested subroutes for election management

### State Management
- No global state management library used
- Local component state with React hooks
- Supabase client for data fetching and real-time updates

### Key Files
- `src/lib/supabaseClient.ts` - Database client configuration
- `src/types/supabase.ts` - Auto-generated database types
- `src/App.tsx` - Main routing configuration

## Environment Setup
Requires `.env` file with:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

## Code Style
- Uses Biome for linting and formatting
- 4-space indentation
- Double quotes for strings
- TypeScript strict mode enabled
