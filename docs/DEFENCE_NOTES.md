# Reveil — Defence notes

This is a one-page reference for the project defence: what we built, why, and what we deliberately deferred.

## SRS coverage at a glance

Every functional requirement in [`Reveil SRS Report.pdf`](../Reveil%20SRS%20Report.pdf) is implemented. See [TRACEABILITY.md](TRACEABILITY.md) for the file-level mapping. Highlights:

- **REQ-1/2 (auth)** — Firebase Authentication on both ends. Mock guard remains as a clearly-labelled dev/test fallback so the project stays runnable without a Firebase project; production toggles via `FIREBASE_SERVICE_ACCOUNT` / `EXPO_PUBLIC_FIREBASE_*`.
- **REQ-3 (habits)** — Full CRUD with categories, weekly targets, pause/freeze, sort, search, and templates.
- **REQ-4 (tracking)** — Day-level upsert with mood and notes. "Freeze day" preserves streaks for sick/travel days.
- **REQ-5/6 (AI feedback)** — Backend forwards stats + tone + locale to the FastAPI engine; engine falls back to a deterministic rule-based generator and runs every output through a safety filter.
- **REQ-7/8 (visualization, weekly summary)** — Dashboard includes a 30-day consistency score, 7-day bar chart, GitHub-style 90-day heatmap, per-category rollup, badge strip, weekly digest endpoint + cron, and per-habit progress ring.

## Architecture decisions worth defending

| Decision | Why |
| --- | --- |
| **NestJS modular monolith** for the backend | The SDD calls for clear subsystem boundaries; Nest's modules give us that without splitting deployables. |
| **FastAPI as a separate AI engine service** | Keeps Python/LLM concerns out of the TypeScript path and lets us swap models without redeploying the API. |
| **Mock auth fallback alongside Firebase** | Lets reviewers run the full stack offline while still proving the production wiring is in place. |
| **SQLite by default with Postgres opt-in** (`DB_DRIVER=postgres`) | One-command demo on any laptop; `migration:run` against the bundled compose Postgres validates the production path. |
| **Rule-based AI fallback** | Privacy- and cost-friendly default; OpenAI only kicks in when a key is set. The safety filter sits *after* the LLM so both paths get the same guarantees. |
| **TypeORM `synchronize: true` in dev, migrations in prod** | Migrations live in `backend/src/migrations/` and run idempotently in CI's Postgres job. |
| **`@sentry/browser` instead of `@sentry/react-native` on mobile** | Captures uncaught JS errors without requiring an EAS managed-build with native pod linking. The native SDK is a follow-on flip that doesn't change call sites. |
| **`react-native-draggable-flatlist` deliberately skipped** | We ship a "Reorder mode" with up/down buttons. Drag-handle reorder needs Reanimated, which inflates the bundle for a UX cosmetic. Kept as documented future work. |

## Test inventory

- **backend unit:** 22 tests — `app.controller`, `stats.util`, `badges.util`, `level.util`, `notifications/quiet-hours`, `users/parse-csv`.
- **backend e2e:** 13 tests — full CRUD, tracking idempotency, dashboard aggregates, AI feedback fallback, habit update + ratings, data export, health/version.
- **AI engine:** 12 pytest tests — rule generator, safety filter (EN + TR), tone/category prompts, build_prompt invariants.
- **mobile:** 9 tests — i18n fallbacks, OnboardingScreen render, DashboardScreen render, HabitDetailScreen render, MoodInsight Pearson math.
- **CI:** GitHub Actions runs all four suites, plus a separate `postgres-e2e` job that boots a Postgres 15 service container, runs the migration twice (idempotency check), then re-runs the e2e suite against the live database.

## Likely jury questions and pre-baked answers

| Q | A |
| --- | --- |
| "How does the AI stay safe?" | Three layers: (1) data only (no chat history) is sent to the engine, (2) prompt template forbids relapse/self-blame language, (3) `safety_filter()` substitutes any disallowed phrase with a fixed safe message. See `ai_engine/feedback.py`. |
| "What happens without internet?" | Mobile shows an OfflineBanner; the consistency math is computed by the backend from log history (no streaming required). AI feedback falls back to rule-based output if the engine times out. |
| "Why TypeORM and not Prisma?" | TypeORM ships a migration runner that works against both SQLite and Postgres with the same model classes — important because we run dev on SQLite and CI on Postgres. |
| "Where's the personalisation?" | Per-user `quietHoursStart/End`, locale, density, digest opt-in, weekly target per habit, category-aware AI hints, and tone selector on the AI feedback screen. |
| "How do you protect privacy?" | `users/me/export` (JSON + CSV), `users/me/import`, `DELETE /users/me`. Export omits push-token values. AI engine receives anonymised stats, not personal identifiers. |
| "What's the role of the AI engine vs a backend AI module?" | Decoupling lets us iterate prompts independently of the API. The engine returns `{ feedbackText, source }`; the backend persists `FeedbackLog` regardless of source so user-visible behaviour is identical. |

## Future work (call out before they ask)

These were intentionally deferred — we have a clear path for each but didn't ship them:

1. **Apple/Google Sign-In** — Firebase credential bridge is wired (`SocialSignInButtons`). Needs OAuth client IDs in Apple Developer / Google Cloud + EAS managed build to ship to stores.
2. **Drag-handle reorder** — Add `react-native-draggable-flatlist` (which pulls Reanimated) and replace `ArrowButton` with `useSharedValue`-driven drag.
3. **OpenAI tool-calling** — engine could let the model call `get_recent_logs` itself rather than receiving pre-aggregated stats. Useful when prompts grow more conversational.
4. **OpenTelemetry tracing** — Sentry covers errors; OTel would add request tracing across the mobile→API→engine call path.
5. **Social leaderboard** — Privacy design needs a thorough review (anonymisation, opt-in) before shipping.
6. **Real native push token verification** in production — currently we accept any `ExpoPushToken[...]` shape; production should call Expo's `getReceiptsAsync` and prune broken tokens.
7. **Bitmap brand assets via Pencil** — `scripts/generate_brand_assets.py` produces functional placeholders; Pencil-authored exports would give us pixel-perfect store assets.
8. **Audio completion cue** — `expo-haptics` already provides Success/Selection/Warning vibration on Mark done / Skip / Freeze. Adding a layered audio chime would require `expo-av` plus a bundled `.wav`; we deferred this rather than ship a low-quality stock sound.

## Quick demo script

```bash
cd backend && npm run seed            # 1 user, 3 habits, 30d of logs
npm run start:dev                     # http://localhost:3000/api + /api/docs
cd ../ai_engine && uvicorn main:app   # http://localhost:8000
cd ../mobile && npm start             # press 'a' or 'i'
```

Demo flow: onboarding → sign in (mock) → dashboard (XP, streak, ring, sparkline) → tap a habit → mood + notes → "Mark done" (haptic) → "Generate AI feedback" with tone picker → "🖼️ Card" share → Profile → Compact mode toggle → Export JSON.
