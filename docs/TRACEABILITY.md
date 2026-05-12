# Traceability Matrix

Maps every functional requirement in the Reveil SRS to the concrete code that satisfies it. Numbers refer to `Reveil SRS Report.pdf`.

## SRS §4 — Functional requirements

| ID | Requirement (abridged) | Implementation | Tests |
| --- | --- | --- | --- |
| **REQ-1** | Register users with email + password | [`mobile/src/screens/LoginScreen.tsx`](../mobile/src/screens/LoginScreen.tsx) (`signUp`), [`mobile/src/services/auth.tsx`](../mobile/src/services/auth.tsx), [`backend/src/auth/firebase-admin.service.ts`](../backend/src/auth/firebase-admin.service.ts) | Manual sign-up smoke-tested; mock-mode covered by guard contract |
| **REQ-2** | Authenticate users securely | [`backend/src/auth/auth.guard.ts`](../backend/src/auth/auth.guard.ts) (Bearer + Firebase verify), [`backend/src/auth/firebase-admin.service.ts`](../backend/src/auth/firebase-admin.service.ts) (`verifyIdToken`) | Guard rejection path verified via Postman / curl |
| **REQ-3** | Define habits or addiction goals | [`backend/src/habits/habits.controller.ts`](../backend/src/habits/habits.controller.ts), [`backend/src/habits/dto/create-habit.dto.ts`](../backend/src/habits/dto/create-habit.dto.ts), [`mobile/src/screens/CreateHabitScreen.tsx`](../mobile/src/screens/CreateHabitScreen.tsx) | e2e: `test/app.e2e-spec.ts` (POST /habits) |
| **REQ-4** | Record daily progress entries | [`backend/src/tracking/tracking.controller.ts`](../backend/src/tracking/tracking.controller.ts), upsert in [`tracking.service.ts`](../backend/src/tracking/tracking.service.ts), [`mobile/src/screens/HabitDetailScreen.tsx`](../mobile/src/screens/HabitDetailScreen.tsx) | e2e: log + history; unit: `stats.util.spec.ts` |
| **REQ-5** | Analyze user consistency with basic analytics | [`backend/src/common/stats.util.ts`](../backend/src/common/stats.util.ts) (`computeStats`), [`backend/src/dashboard/dashboard.service.ts`](../backend/src/dashboard/dashboard.service.ts) | unit: `stats.util.spec.ts` (5 cases) |
| **REQ-6** | Generate motivational feedback (rule-based + OpenAI) | [`backend/src/feedback/feedback.service.ts`](../backend/src/feedback/feedback.service.ts), [`ai_engine/main.py`](../ai_engine/main.py), [`ai_engine/feedback.py`](../ai_engine/feedback.py) | pytest: `ai_engine/test_feedback.py` (rule + safety filter) |
| **REQ-7** | Display progress charts | [`mobile/src/screens/DashboardScreen.tsx`](../mobile/src/screens/DashboardScreen.tsx) (weekly bar chart), [`mobile/src/components/ProgressBar.tsx`](../mobile/src/components/ProgressBar.tsx) | Visual smoke against seeded data |
| **REQ-8** | Summarize weekly performance | `weeklySummary` field in dashboard response ([`dashboard.service.ts`](../backend/src/dashboard/dashboard.service.ts)) | e2e: GET /dashboard |

## SRS §5 — Non-functional

| ID | Requirement | Implementation |
| --- | --- | --- |
| **5.1 Performance** | < 2s response under normal load | SQLite/Postgres + indexed `(habitId, date)`; AI calls have 8s timeout with fallback so the user-visible request returns quickly |
| **5.2 Safety** | Block harmful / relapse-encouraging content | [`ai_engine/feedback.py`](../ai_engine/feedback.py) `safety_filter()` |
| **5.3 Security** | TLS in transit, secure tokens | HTTPS-ready (CORS configured), Firebase ID tokens validated server-side, secrets via env vars |
| **5.4 Quality attributes** | Maintainability, modularity | Each domain in its own NestJS module; AI engine isolated as separate service |
| **5.5 Business rules** | One account per user | `@PrimaryColumn` on `User.id` (Firebase UID) + `@Column({ unique: true })` on email |

## SDD §7 — High-level traceability

| SRS Requirement | Design Component (SDD) | Module |
| --- | --- | --- |
| User Auth | Authentication Module | [`backend/src/auth/`](../backend/src/auth/) |
| Habit Tracking | Habit Management + Progress Tracking | [`backend/src/habits/`](../backend/src/habits/), [`backend/src/tracking/`](../backend/src/tracking/) |
| AI Feedback | AI Feedback Engine | [`backend/src/feedback/`](../backend/src/feedback/), [`ai_engine/`](../ai_engine/) |
| Progress Reports | Progress Tracking + Dashboard | [`backend/src/dashboard/`](../backend/src/dashboard/), [`mobile/src/screens/DashboardScreen.tsx`](../mobile/src/screens/DashboardScreen.tsx) |
| Reminders (SDD §3.2) | Notification Module | [`backend/src/notifications/`](../backend/src/notifications/), [`mobile/src/screens/RemindersScreen.tsx`](../mobile/src/screens/RemindersScreen.tsx) |
