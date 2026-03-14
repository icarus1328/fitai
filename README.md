# AI Fitness Tracker Platform

A comprehensive, intelligent fitness platform featuring advanced workout tracking, hierarchical exercise libraries, AI coaching, personal records (PRs), and real-time analytics dashboards. Built for massive scalability, the application functions as a **Progressive Web App (PWA)** and is natively compiled for Android (`.aab`) via **Capacitor**.

## 🏗️ Architecture Stack

The platform is split into a robust modular monolith architecture:

### Frontend (Mobile-Optimized PWA)
- **Framework:** Next.js 14+ (App Router) exported as a Static App
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **State Management:** React Hooks & js-cookie (for Auth Tokens)
- **Data Visualization:** Recharts (Area, Bar, and Pie Charts)
- **Icons:** Lucide React
- **Mobile Engine:** Capacitor (`@capacitor/android`)
- **PWA Integration:** `@ducanh2912/next-pwa` (Service Worker Caching & Offline manifest)

### Backend
- **Core:** Node.js, Express
- **Language:** TypeScript
- **Database ORM:** Prisma
- **Database Engine:** PostgreSQL
- **Authentication:** JWT (JSON Web Tokens) & bcryptjs

---

## 🗄️ Database Schema & Data Models

The database is built on PostgreSQL via Prisma, focusing on deep relational analytics rather than flat document structures. You can find the entire source in `backend/prisma/schema.prisma`.

### User & Authentication
- `User`: Handles core profile data, encrypted passwords, ranking metrics (`fitnessScore`, `strengthScore`, `volumeScore`, `consistencyScore`), and targets.
- `UserWeakMuscle`: Junction table mapping weak points.

### Biological Hierarchy Engine (Exercises)
The entire exercise library (seeded via ExerciseDB) is structured hierarchically.
1. **`BodyRegion`:** The absolute top-level anatomical sector (e.g., *Upper Body*, *Lower Body*).
2. **`MuscleGroup`:** The specific target (e.g., *Pectorals*, *Triceps*). Links to exactly one `BodyRegion`.
3. **`Exercise`:** The actual movement.
    - Each `Exercise` is heavily categorized with `difficulty`, `instructions`, and a `mediaUrl` (GIF).
    - It maintains **One** `primaryMuscle` relation.
    - `ExerciseSecondaryMuscle` is a join-table to cleanly link to *multiple* other localized `MuscleGroup` entities.

### Workouts & Performance Tracking
- `Workout`: The foundational shell for a training session, attached to a specific date.
- `WorkoutSet`: Represents every specific set (Weight & Reps) attached to a Workout and an Exercise. Includes tracking for Warmup sets.
- `PersonalRecord`: Tracks the absolute maximum historical performance (Max Weight, Max Reps, Max Volume) specifically isolated by `userId` and `exerciseId`.

### Analytics & Gamification
- `AttendanceLog`: Automatically tracks date attendance triggers (from workouts) combined with manual logic.
- `WeeklyReport`: AI-generated historical digest predicting metrics based on current trajectory.
- `UserBadge`: Earnable achievements tracking.

---

## ⚙️ Core System Workflows

### 1. Hierarchical Exercise Explorer Flow
Instead of flat string searches, the UI restricts users structurally:
1. Client fetches all `BodyRegion` + nested `MuscleGroup` tags.
2. User taps *Upper Body* -> UX smoothly updates horizontally to show localized targets (e.g. *Chest*).
3. Client dispatches `GET /api/exercises?regionId=...&muscleGroupId=...`.
4. API hits PostgreSQL with complex `AND/OR` queries scanning `primaryMuscleId` *and* cross-referencing `ExerciseSecondaryMuscle` bridges via joins. 

### 2. Workout Logging & PR Engine Flow
1. User creates a Workout session, dynamically fetching previous historical performance for reference.
2. Payload sent to `POST /api/workouts`.
3. Server executes atomic inserts for `ts` (Workout) and maps `sets`.
4. **Attendance Auto-Log:** Backend upserts the current date into `AttendanceLog`.
5. **PR Check Algorithm:** 
   - Backend scans all completed sets against the `PersonalRecord` table.
   - If `weight > PR`, `reps > PR`, or `volume > PR`, the record is instantly overwritten.
   - Triggers `prNotifications` array pushing celebratory payloads back to the client.
6. A background job re-calculates the user's global `Fitness Rank Score`.

### 3. Dashboard Analytics Flow
1. User logs in and visits `/`.
2. Client queries `GET /api/analytics/dashboard`.
3. Back-end fetches data mapping the last 30 days of workouts.
    - Calculates absolute **Training Volume** trend per-day.
    - Pulls **Muscle Group Distribution** by scanning all `WorkoutSet` entries across `primaryMuscle` IDs mapping to an aggregate counter.
4. Next.js natively renders the data stream into beautiful gradient `Recharts` SVG components.

### 4. PWA & Capacitor Native Build Flow
1. **PWA Generation:** Upon running `npm run build` in the frontend, `next-pwa` extracts static web-assets into service workers configured for offline caching and generates a mobile installable `manifest.json`.
2. **Capacitor Extraction:** Next.js uses standard static export `output: 'export'`. Capacitor copies this output from `/out` directly into the `android/app/src/main/assets/public/` Java container.
3. This creates a fully functioning native Android App (`.aab`/`.apk`) completely mirroring the web experience.

---

## 🚀 Environment Setup & Deployment

### Backend
1. `cd backend`
2. Configure `.env`:
    ```
    PORT=5001
    DATABASE_URL="postgresql://user:pass@localhost:5432/fitness_tracker"
    JWT_SECRET="your_secret"
    RAPIDAPI_KEY="your_api_key_for_exercisedb"
    ```
3. Run `npx prisma db push` to synchronize local database schema.
4. Run `npm run seed:exercises` to download and structure the 1,303 exercises locally.
5. Run `npm run dev` to start server (http://localhost:5001).

### Frontend (Web / PWA)
1. `cd frontend`
2. Provide configurations if utilizing specific `NEXT_PUBLIC_` env vars.
3. Run `npm run dev` to start UI (http://localhost:3000). To test the PWA, visit the local network IP (or Vercel HTTPS Deployment) and accept the "Install App" prompt.

### Frontend (Android Studio)
1. Run `npm run build` inside `frontend/` to generate the strict static `/out` directory.
2. Run `npx cap sync` to synchronize Next.js HTML/JS with the Java container.
3. Run `npx cap open android` (or organically open `frontend/android` in Android Studio).
4. Run *Build -> Generate Signed App Bundle* inside Android Studio!

---

## 📅 Roadmap (Next Phases)
- **Auto Workout Program Generator:** Algorithmic routines factoring in target goals, weak groups, and frequency.
- **Strength Progress Prediction:** Extrapolating forward data to warn users of plateaus based on algorithmic trajectory.
- **Offline Push Synchronization:** Creating offline SQL queues mapped via Capacitor storage protocols intercepting HTTP logic when network fails.
