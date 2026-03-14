# FitAI — AI-Powered Fitness Tracker

> A comprehensive, intelligent fitness platform featuring advanced workout tracking, hierarchical exercise libraries, AI coaching, personal records (PRs), a gamified ranking system, and real-time analytics. Functions as a **Progressive Web App (PWA)** and is natively compiled for Android (`.aab`) via **Capacitor**.

🌐 **Live App:** [fitai-olive.vercel.app](https://fitai-olive.vercel.app)  
📦 **Backend API:** [fitai-vjzh.onrender.com](https://fitai-vjzh.onrender.com)  
📁 **Source:** [github.com/icarus1328/fitai](https://github.com/icarus1328/fitai)

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Database Schema](#database-schema)
4. [API Reference](#api-reference)
5. [Core Feature Workflows](#core-feature-workflows)
6. [Ranking & Scoring System](#ranking--scoring-system)
7. [AI Coach Engine](#ai-coach-engine)
8. [PWA & Android Build](#pwa--android-build)
9. [Local Development Setup](#local-development-setup)
10. [Production Deployment](#production-deployment)
11. [Troubleshooting](#troubleshooting)
12. [Roadmap](#roadmap)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                             │
│  ┌──────────────────────┐   ┌─────────────────────────┐    │
│  │  Next.js PWA (Vercel)│   │  Native Android (.aab)  │    │
│  │  fitai-olive.vercel  │   │  Capacitor Wrapper       │    │
│  └──────────┬───────────┘   └────────────┬────────────┘    │
└─────────────┼────────────────────────────┼─────────────────┘
              │ HTTPS / REST API            │ HTTPS
              ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API LAYER (Render)                        │
│  Express.js + TypeScript + Prisma ORM                       │
│  fitai-vjzh.onrender.com/api                                │
│                                                             │
│  /auth  /exercises  /workouts  /ai  /ranking                │
│  /attendance  /analytics                                     │
└──────────────────────────┬──────────────────────────────────┘
                           │ TCP / PostgreSQL Protocol
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              DATABASE LAYER (Supabase)                       │
│  PostgreSQL 15 — Connection Pooler (Session Mode, Port 5432)│
│  db.jtehtvzbyllgrikpxlty.supabase.co                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 16** (App Router) | Core web framework |
| **TypeScript** | Type-safe React components |
| **TailwindCSS** | Utility-first styling |
| **Recharts** | Interactive SVG data charts |
| **Lucide React** | Icon library |
| **Axios + js-cookie** | HTTP client & JWT cookie management |
| **@ducanh2912/next-pwa** | Service worker generation & offline caching |
| **@capacitor/android** | Native Android wrapper |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express 5** | HTTP server |
| **TypeScript** | Type-safe server logic |
| **Prisma ORM** | Database client & migrations |
| **PostgreSQL** | Relational database |
| **bcrypt** | Password hashing |
| **jsonwebtoken (JWT)** | Stateless authentication |

### Infrastructure
| Service | Role |
|---|---|
| **Vercel** | Frontend hosting (HTTPS, Edge CDN) |
| **Render** | Backend Node.js hosting (always-on free tier) |
| **Supabase** | Managed PostgreSQL database |
| **ExerciseDB (RapidAPI)** | Exercise data source (1,300+ exercises) |

---

## Database Schema

The full schema lives in `backend/prisma/schema.prisma`.

### Entity Relationship Diagram

```
BodyRegion (1) ──── (N) MuscleGroup (1) ──── (N) Exercise
                                                    │
                                            (N) ExerciseSecondaryMuscle
                                                    
User (1) ──── (N) Workout (1) ──── (N) WorkoutSet (N) ──── (1) Exercise
User (1) ──── (N) PersonalRecord (N) ──── (1) Exercise
User (1) ──── (N) AttendanceLog
User (1) ──── (N) UserBadge
User (1) ──── (N) WeeklyReport
User (1) ──── (N) UserWeakMuscle (N) ──── (1) MuscleGroup
```

### Model Reference

#### `User`
| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `email` | String (unique) | Login identifier |
| `passwordHash` | String | bcrypt-hashed password |
| `name` | String? | Display name |
| `currentWeight` | Float? | Current body weight (kg) |
| `targetWeight` | Float? | Goal weight (kg) |
| `height` | Float? | Height (cm) |
| `age` | Int? | Age in years |
| `gender` | String? | `male` / `female` |
| `activityLevel` | String? | `sedentary` → `extra_active` |
| `fitnessScore` | Float | Composite rank score |
| `strengthScore` | Float | Sum of max lifts per exercise |
| `volumeScore` | Float | Volume (sets×reps×weight) in 30 days |
| `consistencyScore` | Float | Sessions × 10 in 30 days |
| `rankTier` | String | `Beginner` / `Intermediate` / `Advanced` / `Elite` |

#### `Exercise` (Hierarchical)
| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `externalId` | String (unique) | ExerciseDB source ID (dedup guard) |
| `name` | String (unique) | Exercise name (title-cased) |
| `primaryMuscleId` | String | FK → `MuscleGroup` |
| `equipment` | String? | e.g. `Barbell`, `Dumbbell`, `Body weight` |
| `difficulty` | String? | `Beginner` / `Intermediate` / `Advanced` |
| `instructions` | String? | Step-by-step description |
| `mediaUrl` | String? | Animated GIF from ExerciseDB |

#### `MuscleGroup`
Each muscle group is linked to a broad `BodyRegion`:
- **Upper Body** → Chest, Triceps, Biceps, Shoulders, Traps, Lats, etc.
- **Lower Body** → Quads, Hamstrings, Glutes, Calves, etc.
- **Core** → Abs, Obliques, Lower Back
- **Cardio** → Cardiovascular system
- **Full Body** → Compound multi-region movements

#### `Workout` & `WorkoutSet`
| Field | Type | Description |
|---|---|---|
| `Workout.date` | DateTime | When the session was performed |
| `Workout.notes` | String? | Optional session notes |
| `WorkoutSet.weight` | Float | Weight lifted (kg) |
| `WorkoutSet.reps` | Int | Number of repetitions |
| `WorkoutSet.setNumber` | Int | Set ordering within exercise |
| `WorkoutSet.isWarmup` | Boolean | Excluded from PR calculations |

#### `PersonalRecord`
Tracks the absolute lifetime best per `(userId, exerciseId)`:
| Field | Description |
|---|---|
| `maxWeight` | Highest single-rep weight ever logged |
| `maxReps` | Highest rep count at any weight |
| `maxVolume` | Highest single-session volume (weight × reps) |

#### `AttendanceLog`
| Field | Description |
|---|---|
| `date` | UTC-truncated date of the visit |
| `source` | `workout` (auto-logged) or `manual` (user check-in) |

---

## API Reference

All endpoints are prefixed with `/api`. JWT is required for all non-auth routes via the `Authorization: Bearer <token>` header.

### Authentication — `/api/auth`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Create new user account |
| `POST` | `/auth/login` | Login & receive JWT |
| `GET` | `/auth/me` | Get current user profile |

**Register Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "currentWeight": 80.5,
  "targetWeight": 75,
  "height": 180,
  "age": 25,
  "gender": "male",
  "activityLevel": "moderately_active"
}
```

**Login Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5...",
  "user": { "id": "uuid", "email": "john@example.com", "name": "John Doe" }
}
```

---

### Exercises — `/api/exercises`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/exercises` | Get all exercises (with filter support) |
| `GET` | `/exercises/regions` | Get all BodyRegions with MuscleGroups |
| `GET` | `/exercises/:id` | Get a single exercise with workout history |

**Query Parameters:**
- `?muscleGroupId=uuid` — Filter by primary or secondary muscle
- `?regionId=uuid` — Filter by body region
- `?q=bench` — Full-text name search

---

### Workouts — `/api/workouts`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/workouts` | Log a new workout session |
| `GET` | `/workouts` | Get full workout history |
| `GET` | `/workouts/:id` | Get a single workout with all sets |
| `DELETE` | `/workouts/:id` | Delete a workout |

**Log Workout Body:**
```json
{
  "date": "2026-03-15T00:00:00Z",
  "notes": "Push day — felt strong",
  "sets": [
    { "exerciseId": "uuid", "setNumber": 1, "weight": 100, "reps": 8, "isWarmup": false },
    { "exerciseId": "uuid", "setNumber": 2, "weight": 100, "reps": 7, "isWarmup": false }
  ]
}
```

**Log Workout Response:**
```json
{
  "workout": { "id": "uuid", "date": "...", "sets": [...] },
  "prNotifications": ["🏆 [Bench Press] New Max Weight: 102.5kg (was 100kg)!"]
}
```

---

### AI Coach — `/api/ai`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/ai/recommendations` | Personalized AI coaching insights |

**Response includes:**
- `progressionSuggestions` — Per-exercise next session targets (progressive overload or deload)
- `volumeWarnings` — Muscles under/over-trained vs. hypertrophy targets (10–20 sets/week)
- `recoveryWarnings` — Muscles trained in the last 48 hours
- `caloriePlan` — TDEE, target calories, bulk/cut goal, estimated days to target weight

---

### Analytics — `/api/analytics`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/analytics/dashboard` | Dashboard data (volume trends + muscle distribution) |

**Dashboard Response:**
```json
{
  "volumeTrend": [
    { "date": "Mar 10", "volume": 12450 },
    { "date": "Mar 12", "volume": 15200 }
  ],
  "muscleDistribution": [
    { "name": "Chest", "value": 38 },
    { "name": "Triceps", "value": 22 }
  ]
}
```

---

### Attendance — `/api/attendance`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/attendance` | Get logs, current streak, weekly/monthly stats |
| `POST` | `/attendance` | Manually check-in for today |

**GET Response:**
```json
{
  "currentStreak": 5,
  "weeklyVisits": 3,
  "monthlyVisits": 12,
  "logs": [{ "id": "uuid", "date": "2026-03-15T00:00:00Z", "source": "workout" }]
}
```

---

### Ranking — `/api/ranking`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/ranking/me` | Get requesting user's rank scores |
| `GET` | `/ranking/leaderboard` | Get top-ranked users globally |

---

## Core Feature Workflows

### 1. Registration & Onboarding
```
User fills Register form (name, email, password, body stats)
        ↓
POST /api/auth/register
        ↓
Backend: hash password → create User row → sign JWT (7-day expiry)
        ↓
Frontend: stores token in cookie → stores user in localStorage
        ↓
Router pushes to Dashboard "/"
```

### 2. Exercise Discovery (Hierarchical Filter)
```
User opens Exercises tab
        ↓
GET /api/exercises/regions → renders BodyRegion pills
        ↓
User taps "Upper Body" → MuscleGroup tags animate in ("Chest", "Biceps"...)
        ↓
User taps "Chest" → GET /api/exercises?muscleGroupId=...
        ↓
Backend: WHERE primaryMuscleId = id OR secondaryMuscles CONTAINS id
        ↓
Exercise cards render with difficulty badge + GIF preview
```

### 3. Workout Logging & PR Detection
```
User taps "New Workout" → sees previous session data per exercise
        ↓
User selects exercises from search modal, logs sets (weight + reps)
        ↓
Taps "Finish" → POST /api/workouts with all sets
        ↓
Backend atomic transaction:
  1. Creates Workout row
  2. Creates all WorkoutSet rows
  3. UPSERTS AttendanceLog for today (auto check-in)
  4. Scans each exercise against PersonalRecord table:
      - If weight/reps/volume exceeds all-time best → UPDATE PersonalRecord
      - Appends to prNotifications[]
  5. Fires background computeUserScore() to refresh rank
        ↓
Response returns prNotifications → Frontend shows 🏆 toast
```

### 4. Dashboard Analytics
```
User visits Home "/"
        ↓
GET /api/analytics/dashboard
        ↓
Backend:
  - Queries WorkoutSets in last 30 days grouped by date → Volume Trend
  - Queries WorkoutSets grouped by Exercise.primaryMuscle.name → Distribution
        ↓
Frontend renders:
  - Recharts AreaChart: Training Volume over 30 days
  - Recharts BarChart: Muscle Group Distribution
  - Recharts LineChart: Weekly Workout Frequency
  - Streak counter, Total Volume, PRs this month
```

### 5. Attendance Tracking
```
Auto-logging: Every POST /workouts automatically upserts today's AttendanceLog
        ↓
Manual logging: User visits Profile → Attendance Log → taps "Check In"
                → POST /api/attendance
        ↓
GET /api/attendance computes:
  - currentStreak: consecutive days with a log ending today
  - weeklyVisits: logs in past 7 days
  - monthlyVisits: logs in this calendar month
        ↓
Calendar UI highlights attended days in green
```

---

## Ranking & Scoring System

The fitness score is a composite metric updated after every workout:

```
Fitness Score = (0.5 × StrengthScore) + (0.3 × VolumeScore/100) + (0.2 × ConsistencyScore)
```

| Component | Calculation | Weight |
|---|---|---|
| **Strength Score** | Sum of your max weight per unique exercise (all-time) | 50% |
| **Volume Score** | Total (sets × reps × weight) in the last 30 days | 30% |
| **Consistency Score** | Number of unique training days in past 30 days × 10 | 20% |

### Rank Tiers
| Tier | Score Range | Icon |
|---|---|---|
| 🌱 Beginner | 0 – 199 | Starting point |
| ⚡ Intermediate | 200 – 399 | Regular training |
| 🔥 Advanced | 400 – 699 | High performance |
| 👑 Elite | 700+ | Top tier athletes |

---

## AI Coach Engine

Located in `backend/src/services/aiCoach.service.ts`. The AI Coach generates personalized insights on every `/ai/recommendations` request:

### Progressive Overload Suggestions
- Groups all WorkoutSets by exercise name
- Uses the **Epley Formula** to estimate One-Rep Max: `weight × (1 + reps/30)`
- Detects **plateaus**: if the last 4 sessions show <2% improvement in estimated 1RM
- If plateau: suggests a **deload** (5% weight reduction, +2 reps)
- If progressing: suggests **+2.5 kg** for next session

### Volume Warnings
- Counts weekly sets per muscle group (last 7 days)
- Flags muscles with **< 10 sets/week** (under-trained for hypertrophy)
- Flags muscles with **> 22 sets/week** (overtraining risk)

### Recovery Warnings
- Scans WorkoutSets from last 48 hours
- Returns all muscle groups trained — warns to allow recovery time

### Calorie & Weight Plan
Uses the **Mifflin-St Jeor TDEE formula**:
```
Male BMR:   10×weight + 6.25×height − 5×age + 5
Female BMR: 10×weight + 6.25×height − 5×age − 161
TDEE = BMR × Activity Multiplier
```
Then:
- **Bulk:** TDEE + 300 kcal/day → ~0.3 kg/week gain
- **Cut:** TDEE − 500 kcal/day → ~0.5 kg/week loss
- Estimates days to reach target weight

---

## PWA & Android Build

### PWA (Progressive Web App)
The app is fully installable on Android and iOS directly from the browser.

1. `npm run build` triggers `@ducanh2912/next-pwa` to:
   - Generate a **Service Worker** for offline asset caching
   - Embed the `/public/manifest.json` with app name, colors, and icons
2. Users visiting the HTTPS Vercel URL are automatically prompted to **"Add to Home Screen"**
3. Once installed, the app runs in standalone mode (no browser chrome)

**Manifest Configuration (`public/manifest.json`):**
```json
{
  "name": "FitAI - Fitness Tracker",
  "short_name": "FitAI",
  "display": "standalone",
  "background_color": "#030712",
  "theme_color": "#2563eb",
  "start_url": "/",
  "icons": [
    { "src": "/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512x512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Android Native Build (Capacitor)
1. `cd frontend && npm run build` → Generates `/out` static export
2. `npx cap sync` → Copies `/out` into `android/app/src/main/assets/public/`
3. `npx cap open android` → Opens Android Studio
4. In Android Studio: **Build → Generate Signed App Bundle** → `.aab` for Google Play

---

## Local Development Setup

### Prerequisites
- Node.js ≥ 18
- PostgreSQL (running locally, or use Supabase free tier)
- RapidAPI account with **ExerciseDB** subscription

### Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env:
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fitai"
# JWT_SECRET="your_secret_key"
# PORT=5001
# RAPIDAPI_KEY="your_rapidapi_key"

# Create database tables
npx prisma db push

# Seed exercise library (~1,300 exercises from ExerciseDB)
npm run seed:exercises

# Start development server (auto-restarts on save)
npm run dev
# Server runs at: http://localhost:5001
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Configure environment
echo 'NEXT_PUBLIC_API_URL=http://localhost:5001/api' > .env.local

# Start development server
npm run dev
# UI runs at: http://localhost:3000
```

### Testing on Physical Android Device (Local Network)
1. Make sure your phone is on the same Wi-Fi as your Mac
2. Find your Mac's local IP: `ipconfig getifaddr en0`
3. Open `http://192.168.x.x:3000` on your phone
4. Backend API is resolved automatically from the local IP

**To enable PWA install prompt on local HTTP:**
1. Open `chrome://flags/#unsafely-treat-insecure-origin-as-secure` on your phone
2. Enter `http://192.168.x.x:3000` → Set to **Enabled** → Relaunch

---

## Production Deployment

### Database (Supabase)
1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **Connect** → **ORMs** → Copy the **Transaction connection string** (port `5432`, session mode)
3. Replace `[YOUR-PASSWORD]` with your actual database password

**Push schema from your local machine** (use session mode port `5432`):
```bash
DATABASE_URL="postgresql://postgres.xxx:YourPassword@aws-x-region.pooler.supabase.com:5432/postgres" npx prisma db push
```

**Seed exercises into cloud database:**
```bash
DATABASE_URL="postgresql://..." RAPIDAPI_KEY="your_key" npm run seed:exercises
```

### Backend (Render)
1. Create a new **Web Service** at [render.com](https://render.com)
2. Connect your GitHub repository
3. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npx prisma generate && npm run build && npx prisma db push`
   - **Start Command:** `npm start`
4. Add **Environment Variables:**
   | Key | Value |
   |---|---|
   | `DATABASE_URL` | Your Supabase `pgbouncer=true` Transaction Pool URL (port `6543`) |
   | `JWT_SECRET` | Any long random string |
   | `RAPIDAPI_KEY` | Your ExerciseDB API key |
   | `PORT` | `5001` |

> **Note:** Use port `6543` (Transaction pooler) for Render's runtime connections, and port `5432` (Session mode) for schema migrations like `db push`.

### Frontend (Vercel)
1. Create a project at [vercel.com](https://vercel.com)
2. Connect your GitHub repository
3. Configure:
   - **Root Directory:** `frontend`
4. Add **Environment Variables:**
   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://your-backend.onrender.com/api` |
5. Deploy and **Redeploy** after adding environment variables to bake them into the production build

---

## Troubleshooting

### "Failed to Register" on Live App
1. Check that `NEXT_PUBLIC_API_URL` is set correctly in **Vercel Environment Variables**
2. Ensure you've **Redeployed** AFTER adding the variable (Vercel bakes env vars at build time)
3. Check Render Logs for the exact Prisma error

### "P1001: Can't reach database" on Render
- Your `DATABASE_URL` has an incorrect password (check for special characters — encode `#` as `%23`)
- You're using the Direct URL (port `5432`) instead of the Transaction Pool URL (port `6543`) for runtime

### "P2021: Table does not exist" on Render
- The `npx prisma db push` in your Render build command failed silently
- Run `db push` manually from your local machine using the session mode URL (port `5432`)

### Render Build Fails
- Ensure `typescript` is in `dependencies` (not `devDependencies`) — Render strips dev deps in production
- Check your Build Command has `&&` separators, not missing spaces

### PWA Install Prompt Not Appearing
- PWA install requires HTTPS — use the live Vercel URL
- For local testing: enable `chrome://flags/#unsafely-treat-insecure-origin-as-secure`

### Workout Logging Shows "Objects are not valid as React child"
- `exercise.primaryMuscle` is an object — always access `.name` property: `exercise.primaryMuscle?.name`

---

## Roadmap

| Phase | Feature | Status |
|---|---|---|
| ✅ Phase 1 | User Auth, Exercise Library, Workout Logging | **Complete** |
| ✅ Phase 2 | PR Tracking, AI Coach, Rank System, Analytics | **Complete** |
| ✅ Phase 3 | PWA, Capacitor Android, Attendance, Cloud Deploy | **Complete** |
| 🔄 Phase 4 | Auto Workout Program Generator | In progress |
| 🔄 Phase 4 | Strength Progress Prediction (plateau forecasting) | In progress |
| 📋 Phase 5 | Offline Sync (Capacitor Storage + queue) | Planned |
| 📋 Phase 5 | Firebase Push Notifications | Planned |
| 📋 Phase 6 | Social Features (friends, challenges) | Planned |
| 📋 Phase 6 | Google Play Store Submission | Planned |
