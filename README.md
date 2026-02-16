# Talkivo

An AI-powered English language tutor built with Next.js. Practice speaking, debating, and roleplaying with **Talkivo** - your personal AI English tutor that provides real-time corrections, pronunciation feedback, and vocabulary tracking.

## Features

### 4 Learning Modes
- **Free Talk** - Open conversation on any topic with real-time grammar corrections
- **Role Play** - Practice real-world scenarios (restaurant, hotel, job interview, etc.)
- **Debate** - Argue for/against topics to build persuasive English skills
- **Grammar Fix** - Get instant corrections on every sentence you write

### Core Capabilities
- Real-time grammar, vocabulary, structure, and fluency corrections
- Voice input with pronunciation scoring (Web Speech API)
- Text-to-speech AI responses with adjustable speed per level
- Filler word detection (um, uh, like, etc.)
- Vocabulary tracking with mastery scoring
- Session scoring with weighted error analysis
- Progress dashboard with charts and error breakdown
- Session history with detailed reports

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| AI | Groq SDK (LLaMA models) |
| Database | SQLite via Prisma ORM |
| State | Zustand |
| Validation | Zod |
| Charts | Recharts |
| Voice | Web Speech API |

## Project Structure

```
src/
├── app/                    # Next.js pages + API routes
│   ├── api/                # REST API endpoints
│   │   ├── chat/           # AI chat endpoint
│   │   ├── messages/       # Message persistence
│   │   ├── sessions/       # Session CRUD + [id] route
│   │   ├── stats/          # Overview + progress stats
│   │   └── vocabulary/     # Vocabulary tracking
│   ├── dashboard/          # Progress dashboard page
│   ├── tutor/[mode]/       # Chat interface page
│   └── page.tsx            # Landing page
├── components/
│   ├── chat/               # ChatScreen, MessageBubble, VoiceInput
│   ├── dashboard/          # StatsOverview, ProgressChart, ErrorAnalysis
│   ├── feedback/           # Pronunciation, FillerWord components
│   ├── modes/              # ModeSelector, LevelSelector, TopicPicker
│   └── session/            # SessionReport
├── lib/
│   ├── schemas/            # Zod validation schemas + enum definitions
│   ├── config/             # App constants (modes, scenarios, topics)
│   ├── services/           # CorrectionParser, ScoreCalculator
│   ├── errors/             # ApiError, ValidationError classes
│   ├── prompts/            # System prompts for each learning mode
│   ├── types.ts            # All TypeScript domain types
│   ├── api-client.ts       # Frontend API client with error handling
│   ├── error-handler.ts    # API route error handling middleware
│   ├── db.ts               # Prisma client
│   ├── groq.ts             # Groq AI SDK wrapper
│   ├── speech.ts           # Text-to-speech utilities
│   └── filler-words.ts     # Filler word detection
├── stores/
│   ├── chatStore.ts        # Chat state (Zustand)
│   └── sessionStore.ts     # Session state (Zustand)
└── generated/prisma/       # Auto-generated Prisma client
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/Darkunquie/AI_Tutor.git
cd AI_Tutor

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your GROQ_API_KEY to .env

# Generate Prisma client and create database
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start practicing.

### Environment Variables

| Variable | Description |
|----------|------------|
| `GROQ_API_KEY` | API key from [Groq Console](https://console.groq.com) |
| `DATABASE_URL` | SQLite database path (default: `file:./dev.db`) |

## Database Schema

The app uses SQLite with Prisma ORM. Key models:

- **User** - Tracks learners with level progression
- **Session** - Practice sessions with mode, level, score, duration
- **Message** - Chat messages with corrections and pronunciation data
- **Error** - Grammar/vocabulary/structure/fluency errors per session
- **Vocabulary** - Words learned with mastery tracking
- **DailyStats** - Aggregated daily progress metrics

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send message to AI tutor |
| POST | `/api/sessions` | Create new practice session |
| GET | `/api/sessions` | List user sessions (paginated) |
| GET/PATCH | `/api/sessions/[id]` | Get/update specific session |
| POST/GET | `/api/messages` | Save/retrieve messages |
| GET | `/api/stats` | Overview statistics |
| GET | `/api/stats/progress` | Time-series progress data |
| POST/GET/PATCH | `/api/vocabulary` | Vocabulary CRUD |
