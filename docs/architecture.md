# Reveil — Architecture Diagrams

This file expands on the SDD viewpoints with renderable Mermaid diagrams. GitHub renders Mermaid natively in Markdown.

## 1. Context (SDD §3.1)

```mermaid
flowchart LR
    user(["End User"])
    mobile["Mobile App<br/>(Expo / React Native)"]
    backend["Backend<br/>(NestJS)"]
    engine["AI Engine<br/>(FastAPI)"]
    auth[("Firebase Auth")]
    db[("SQLite / Postgres")]
    openai[("OpenAI API")]
    expo[("Expo Push Service")]

    user --> mobile
    mobile -- "JWT" --> auth
    mobile -- "REST + Bearer" --> backend
    backend -- "verifyIdToken" --> auth
    backend -- "TypeORM" --> db
    backend -- "POST /feedback" --> engine
    backend -- "Push" --> expo
    engine -- "Optional" --> openai
    expo -- "Notification" --> mobile
```

## 2. Composition (SDD §3.2)

```mermaid
flowchart TB
    subgraph Mobile["Mobile Client"]
        ui["Screens · Components · Theme"]
        api_client["api.ts · auth.tsx · notifications.ts"]
    end

    subgraph Backend["Backend (NestJS)"]
        auth_mod["AuthModule<br/>(FirebaseAdminService + AuthGuard)"]
        users_mod["UsersModule"]
        habits_mod["HabitsModule"]
        track_mod["TrackingModule"]
        feedback_mod["FeedbackModule"]
        dash_mod["DashboardModule"]
        notif_mod["NotificationsModule<br/>(Service · Scheduler · ExpoPushClient)"]
        common["common/stats.util"]
    end

    subgraph Engine["AI Engine (FastAPI)"]
        api_engine["main.py · /feedback"]
        prompt["feedback.py<br/>(prompt builder · safety filter · rule fallback)"]
    end

    ui --> api_client --> Backend
    Backend --> auth_mod
    feedback_mod --> Engine
    dash_mod --> common
    feedback_mod --> common
    notif_mod -. cron .-> notif_mod
```

## 3. Logical / Class (SDD §3.3)

```mermaid
classDiagram
    class User {
      +string id
      +string email
      +string displayName
      +string photoUrl
      +Date createdAt
    }
    class Habit {
      +uuid id
      +string title
      +string description
      +string frequency
      +int targetCount
      +string timeOfDay
      +string userId
    }
    class HabitLog {
      +uuid id
      +string date
      +bool completed
      +int moodScore
      +string notes
      +string habitId
    }
    class FeedbackLog {
      +uuid id
      +string feedbackText
      +string source
      +int consistencyScore
      +int streak
    }
    class Reminder {
      +uuid id
      +string time
      +string weekdays
      +bool enabled
      +string message
    }
    class PushToken {
      +uuid id
      +string token
      +string platform
    }

    User "1" --> "*" Habit
    Habit "1" --> "*" HabitLog
    User "1" --> "*" FeedbackLog
    User "1" --> "*" PushToken
    User "1" --> "*" Reminder
    Habit "0..1" --> "*" Reminder
```

## 4. Information / Data (SDD §3.4)

| Entity | Indexes | Key constraints |
| --- | --- | --- |
| User | PK `id` (Firebase UID), unique `email` | — |
| Habit | PK `id` (uuid), FK `userId` | cascade delete via app logic |
| HabitLog | PK `id`, indexes on `date`, `habitId`, **unique `(habitId, date)`** | upsert on duplicate |
| FeedbackLog | PK `id`, FK `userId`, FK `habitId` (nullable) | `habitId` → SET NULL on habit delete |
| Reminder | PK `id`, FK `habitId` (nullable, cascade on delete) | weekdays stored as ISO `1..7` CSV |
| PushToken | PK `id`, unique `(userId, token)` | platform ∈ {expo, fcm, apns} |

## 5. Process (SDD §3.5)

### Habit-tracking and feedback flow

```mermaid
sequenceDiagram
    actor User
    participant App as Mobile App
    participant API as Backend
    participant DB as Database
    participant AI as AI Engine
    participant LLM as OpenAI

    User->>App: Mark habit done
    App->>API: POST /api/tracking/log
    API->>DB: upsert HabitLog
    API-->>App: 200 OK
    App->>API: POST /api/ai/feedback {habitId}
    API->>DB: load 30d logs
    API->>AI: POST /feedback {stats}
    alt OpenAI configured
        AI->>LLM: chat.completions
        LLM-->>AI: text
    else fallback
        AI-->>AI: rule_based_feedback()
    end
    AI->>AI: safety_filter()
    AI-->>API: {feedbackText, source}
    API->>DB: persist FeedbackLog
    API-->>App: FeedbackLog
    App-->>User: motivational message
```

### Reminder scheduling

```mermaid
sequenceDiagram
    participant Cron as ReminderScheduler<br/>(every 1 min)
    participant DB as Database
    participant Expo as Expo Push
    participant App as Mobile

    Cron->>DB: SELECT enabled reminders WHERE time=now AND weekday matches
    DB-->>Cron: matches
    loop each reminder
        Cron->>DB: load PushTokens for userId
        Cron->>Expo: send batch push
        Expo-->>App: notification
    end
```
