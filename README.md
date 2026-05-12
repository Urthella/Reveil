# Reveil — AI-Powered Adaptive Habit Transformation

Graduation project (COMP4901, Konya Food and Agriculture University). Reveil is a mobile-first habit formation and addiction recovery app that combines behavioral science with adaptive, AI-generated feedback. The implementation tracks the project's [SRS](Reveil%20SRS%20Report.pdf) and [SDD](Reveil%20SDD%20Report.pdf).

| Layer | Stack | Path |
| --- | --- | --- |
| Mobile | Expo SDK 54, React Native 0.81, TypeScript, Firebase Auth | [`mobile/`](mobile/) |
| Backend | NestJS 11, TypeORM, SQLite (dev) / Postgres (prod), Firebase Admin | [`backend/`](backend/) |
| AI Engine | FastAPI, OpenAI (optional), rule-based fallback, safety filter | [`ai_engine/`](ai_engine/) |
| Infra | docker-compose (Postgres) | [`docker-compose.yml`](docker-compose.yml) |

## Architecture at a glance

```
┌────────────┐     HTTPS / JWT      ┌────────────┐     HTTP      ┌────────────┐
│ Mobile App │ ───────────────────► │  Backend   │ ────────────► │ AI Engine  │
│  (Expo)    │ ◄─────────────────── │  (NestJS)  │ ◄──────────── │ (FastAPI)  │
└─────┬──────┘                      └─────┬──────┘               └─────┬──────┘
      │                                   │                            │
      │ Firebase Auth                     │ TypeORM                    │ OpenAI (opt.)
      ▼                                   ▼                            ▼
   Firebase                            SQLite/Postgres                OpenAI API
```

See [`docs/architecture.md`](docs/architecture.md) for view-by-view diagrams, [`docs/TRACEABILITY.md`](docs/TRACEABILITY.md) for the SRS-to-code mapping, and [`docs/DEFENCE_NOTES.md`](docs/DEFENCE_NOTES.md) for the project-defence cheat sheet.

## Feature highlights

- **Habits** with categories, weekly targets (1–7×/week), pause-until auto-resume, freeze days that protect streaks, sort, search, and 8 quick-start templates.
- **Tracking** with mood (1–10) and notes; idempotent same-day upsert.
- **AI feedback** with locale (TR/EN), category-aware hints, and tone selector (`coach / gentle / firm / playful`). Provider chain: Claude (`ANTHROPIC_API_KEY`) → OpenAI (`OPENAI_API_KEY`) → deterministic rule-based. Override via `AI_PROVIDER`. All output passes a safety filter.
- **Dashboard** with consistency, streak, longest streak, weekly bar chart, GitHub-style 90-day heatmap, per-category rollup, badge strip with celebration toast, weekly insight card, mini per-habit sparklines, XP/level bar.
- **Reminders** (cron-driven push) with quiet hours and per-user opt-out for the weekly digest.
- **Notification feed** persisting every push the system sends.
- **Privacy** — JSON + CSV export, JSON + CSV import, account deletion, opt-out toggles.
- **Mobile polish** — onboarding, dark theme, compact density mode, TR/EN i18n, accessibility (roles, states, hints), offline banner, haptics on log, level-up + badge unlock toasts, share streak text + share progress card SVG.
- **Operability** — Sentry (no-op when DSN missing) on both ends, `/api/health` + `/api/version`, `@nestjs/throttler` rate limits with stricter cap on AI feedback, helmet headers, audit log of 5xx errors at `/api/admin/errors`, platform insights at `/api/admin/insights`.

## Quick start

Prerequisites: Node 20+, npm, Python 3.11+, Expo CLI (`npx expo`), optional Docker.

```bash
# 1. Backend (defaults to SQLite, mock auth)
cd backend
npm install
npm run start:dev

# 2. AI engine
cd ../ai_engine
python -m pip install -r requirements.txt
python -m uvicorn main:app --port 8000

# 3. Mobile
cd ../mobile
npm install
npm start          # press 'a' for Android, 'i' for iOS, 'w' for web
```

API is at `http://localhost:3000/api`, Swagger UI at `/api/docs`, OpenAPI JSON at `/api/docs-json`. AI engine listens on `http://localhost:8000`.

### Seed demo data

```bash
cd backend
npm run seed       # creates a demo user, 3 habits, 30 days of synthetic logs
```

## Configuration

Backend ([`.env.example`](backend/.env.example)):

| Variable | Purpose | Default |
| --- | --- | --- |
| `PORT` | HTTP port | `3000` |
| `AI_ENGINE_URL` | AI engine base URL | `http://127.0.0.1:8000` |
| `DB_DRIVER` | `sqlite` or `postgres` | `sqlite` |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | Postgres only | `localhost` / `5432` / `postgres` / `postgres` / `reveil` |
| `DB_PATH` | SQLite file path | `reveil.sqlite` |
| `DB_SYNC` | TypeORM auto-sync (dev only); set `false` and use `npm run migration:run` in prod | `true` |
| `FIREBASE_SERVICE_ACCOUNT` | Inline JSON for Firebase Admin SDK | empty → mock auth |
| `GOOGLE_APPLICATION_CREDENTIALS` | Alternative path-based credentials | empty |
| `FIREBASE_PROJECT_ID` | Project ID when using ADC | empty |
| `ADMIN_TOKEN` / `ADMIN_UID` | Gate `/api/admin/*` endpoints | empty |
| `DIGEST_CRON` | Set to `off` to disable the Sunday weekly-digest push | `on` |
| `RESEND_API_KEY` / `DIGEST_FROM_EMAIL` | Optional email digests via Resend | empty → push only |
| `SENTRY_DSN` / `SENTRY_TRACES_SAMPLE_RATE` | Optional error reporting | empty → no-op |

AI engine ([`.env.example`](ai_engine/.env.example)):

| Variable | Purpose |
| --- | --- |
| `AI_PROVIDER` | Force a single provider: `claude`, `openai`, or `rule`. Empty → auto (Claude → OpenAI → Rule) |
| `ANTHROPIC_API_KEY` | Enables Claude path |
| `ANTHROPIC_MODEL` | Claude model name (default `claude-haiku-4-5`) |
| `OPENAI_API_KEY` | Enables OpenAI path |
| `OPENAI_MODEL` | OpenAI model name (default `gpt-4o-mini`) |

Mobile (`EXPO_PUBLIC_*` env so the values reach JS at runtime):

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | Override backend URL (defaults to `http://10.0.2.2:3000/api` on Android, `http://localhost:3000/api` elsewhere) |
| `EXPO_PUBLIC_FIREBASE_API_KEY` / `_AUTH_DOMAIN` / `_PROJECT_ID` / `_APP_ID` | Firebase web config; absent → mock auth |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS` / `_ANDROID` / `_WEB` | Enable Google sign-in via expo-auth-session |
| `EXPO_PUBLIC_SENTRY_DSN` | Mobile error reporting (no-op when empty) |

Postgres via docker-compose:

```bash
docker compose up -d postgres
DB_DRIVER=postgres npm run start:dev      # in backend/
```

Production migrations:

```bash
DB_DRIVER=postgres DB_SYNC=false npm run migration:run
```

## Testing

```bash
# Backend unit + e2e
cd backend && npm test && npm run test:e2e

# AI engine
cd ai_engine && python -m pytest

# Mobile typecheck + jest
cd mobile && npx tsc --noEmit && npm test
```

GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs all four suites plus a Postgres-backed e2e job that verifies migrations idempotently.

## Project layout

```
backend/
  src/
    auth/                  Firebase guard + admin SDK wrapper
    users/                 Entity, preferences, JSON/CSV export & import
    habits/                CRUD, reorder, search, pause-until
    tracking/              Daily completion logs
    feedback/              AI feedback proxy + share-card SVG
    dashboard/             Aggregated metrics + category rollup + level
    notifications/         Push tokens, reminders, scheduler, feed, events
    digest/                Weekly digest service + Sunday cron + email
    insights/              Admin platform-wide stats
    audit/                 5xx error audit log + Sentry forwarder
    health/                /health and /version endpoints
    common/                Stats / badges / level helpers
    migrations/            Driver-aware initial schema
  test/                    Supertest e2e
ai_engine/
  main.py                  FastAPI app
  feedback.py              Prompt builder, safety filter, rule fallback
  test_feedback.py         pytest
mobile/
  src/
    components/            UI primitives + Heatmap, Sparkline, ProgressRing,
                           XpBar, BadgeStrip, BadgeUnlockToast, LevelUpToast,
                           CategoryBreakdown, MoodInsight, MoodPicker, Toggle
    navigation/            Stack navigator (with deep-link ref)
    screens/               Login, Onboarding, Dashboard, Habits, CreateHabit,
                           HabitDetail, Feedback, Reminders, Digest,
                           NotificationFeed, Profile
    services/              api, auth, firebase, social-auth, sentry,
                           notifications, share, haptics, density, i18n,
                           preferences
    theme/                 Dark theme tokens
docs/
  architecture.md          Mermaid diagrams of all five SDD viewpoints
  TRACEABILITY.md          SRS REQ-1..REQ-8 mapped to code
  DEFENCE_NOTES.md         One-page jury cheat sheet
scripts/
  generate_brand_assets.py Pillow-based icon/splash/SVG mark generator
```

## Authors

- Halil Utku DEMİRTAŞ (222010020054)
- Furkan Can KARAFİL (222010020013)

Supervisor: Prof. Dr. Meltem Huri BATURAY KHAN.
