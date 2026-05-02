# Bloom Learning App

A comprehensive gamified learning mobile app (Expo/React Native) for students up to Grade 12.

## Architecture

### Monorepo Structure
- `artifacts/bloom/` — Expo React Native mobile app (port 19129)
- `artifacts/api-server/` — Express API server (port 8080, mounted at `/api`)
- `lib/db/` — Drizzle ORM + PostgreSQL schemas
- `lib/api-spec/` — OpenAPI spec (openapi.yaml)
- `lib/api-client-react/` — Auto-generated React Query hooks (Orval)
- `lib/api-zod/` — Auto-generated Zod schemas
- `lib/integrations-openai-ai-server/` — OpenAI integration (server-side)
- `lib/integrations-openai-ai-react/` — OpenAI integration (React)

## Features

### Subjects
- **Math** — AI-generated problems at any grade level (1-12), multiple choice, fill-in-blank, word problems
- **Languages** — French, Spanish, Maltese, Italian: vocabulary, fill-in-blank, matching, writing, speaking, listening (TTS)
- **Grammar** — Spelling, punctuation, parts of speech, word definitions
- **History & Geography** — Story-style readings + comprehension questions

### Gamification
- Coins earned per lesson (10-50 based on score)
- Animal shop: 25 real animals, 5 rarity tiers (Common → Legendary), tiered costs (45–3500 coins)
- Leaderboard ranked by animal collection
- Daily streaks (check-in every day)
- Daily AI-generated challenge (+50 coins)
- Monthly free gift coins
- Starter coins: 100 on registration

### Avatar Builder
- Skin tone, hair color, eye color, expression, clothing customization
- Stored as JSON in `avatarData` field
- Displayed as a simple illustrated face

## Mobile Screens (Expo Router)
- `/` — Welcome/onboarding (redirects to tabs if logged in)
- `/login` — Login with username/password
- `/register` — Register (starter 100 coins)
- `/(tabs)/` — Home: greeting, streak, daily challenge card, subject grid
- `/(tabs)/learn` — Subject picker
- `/(tabs)/lesson-picker` — Exercise type + language/level picker
- `/(tabs)/lesson` — Active AI lesson screen (all question types)
- `/(tabs)/shop` — Animal shop with purchase flow
- `/(tabs)/leaderboard` — Community rankings
- `/(tabs)/profile` — Stats, avatar builder, progress, collection, logout
- `/daily-challenge` — Full-screen daily challenge quiz

## API Routes
- `POST /api/auth/register` — Register (returns JWT + user)
- `POST /api/auth/login` — Login (returns JWT + user)
- `GET /api/auth/me` — Get current user
- `PUT /api/users/me` — Update display name / avatar
- `POST /api/users/me/coins` — Earn coins
- `POST /api/users/me/streak` — Check-in streak
- `POST /api/users/me/claim-gift` — Monthly gift
- `GET /api/animals` — List all animals
- `GET /api/animals/owned` — User's owned animals
- `POST /api/animals/purchase` — Buy an animal
- `GET /api/leaderboard` — Top 50 users by animal count
- `POST /api/lessons/generate` — AI lesson generation (OpenAI GPT)
- `POST /api/lessons/tts` — Text-to-speech (base64 MP3)
- `POST /api/lessons/transcribe` — Speech-to-text
- `GET /api/daily-challenge` — Today's challenge (auto-generated)
- `POST /api/daily-challenge/complete` — Submit answers
- `GET /api/progress` — User's subject progress
- `POST /api/progress` — Save lesson progress

## Database (Drizzle + PostgreSQL)
Tables: `users`, `animals`, `user_animals`, `subject_progress`, `daily_challenges`, `challenge_completions`, `conversations`, `messages`

### Schema Notes
- `daily_challenges`: composite unique index on `(date, subject)` — allows one challenge per subject per day. Previously was unique on `date` alone which caused DB errors when multiple subjects tried to insert challenges for the same day.

## Auth
- JWT (30-day expiry), signed with `SESSION_SECRET`
- Token stored in AsyncStorage (`bloom_token`)
- `setAuthTokenGetter` used so all API hooks auto-send the token

## Design Tokens
- Primary: `#1B3A6B` (dark navy blue)
- Gold/Accent: `#F5C518`
- Correct: `#22C55E`
- Wrong: `#EF4444`
- Background: `#FFFFFF`
- Font: Inter (Regular, Medium, SemiBold, Bold)

## Key Dependencies
- `expo-av` — Audio playback (TTS) and recording (STT)
- `@tanstack/react-query` — Data fetching and caching
- `@react-native-async-storage/async-storage` — Token persistence
- `bcryptjs` + `jsonwebtoken` — Auth on API server
- `drizzle-orm` — Database ORM
- `@workspace/api-client-react` — All API hooks (auto-generated)

## Environment Variables
- `SESSION_SECRET` — JWT signing secret
- `DATABASE_URL` — PostgreSQL connection string
- `OPENAI_API_KEY` — via Replit OpenAI integration
- `EXPO_PUBLIC_DOMAIN` — used to call API from the app
