# Software Design Description (SDD)

## Reveil - AI-Powered Habit Tracking Application

**Document Version:** 1.0  
**Date:** January 12, 2026  
**Standard:** IEEE 1016-2009

---

## Document Information

| Field | Value |
|-------|-------|
| **Project Name** | Reveil |
| **Document Type** | Software Design Description (SDD) |
| **Version** | 1.0 |
| **Date** | January 12, 2026 |
| **Status** | Final |

### Authors

| Name | Student ID | Role |
|------|-----------|------|
| Halil Utku Demirtaş | 222010020054 | Frontend Developer |
| Furkan Can Karafil | 222010020013 | Backend Developer |

### Advisor

**Prof. Meltem Huri Baturay Khan**

---

## Table of Contents

1. [Introduction](#1-introduction)
   - 1.1 [Purpose](#11-purpose)
   - 1.2 [Scope](#12-scope)
   - 1.3 [Definitions, Acronyms, and Abbreviations](#13-definitions-acronyms-and-abbreviations)
   - 1.4 [References](#14-references)
   - 1.5 [Overview](#15-overview)
2. [System Overview](#2-system-overview)
   - 2.1 [System Context](#21-system-context)
   - 2.2 [Design Constraints](#22-design-constraints)
   - 2.3 [Assumptions and Dependencies](#23-assumptions-and-dependencies)
3. [Design Viewpoints](#3-design-viewpoints)
   - 3.1 [Context Viewpoint](#31-context-viewpoint)
   - 3.2 [Composition Viewpoint](#32-composition-viewpoint)
   - 3.3 [Logical Viewpoint](#33-logical-viewpoint)
   - 3.4 [Dependency Viewpoint](#34-dependency-viewpoint)
   - 3.5 [Interface Viewpoint](#35-interface-viewpoint)
   - 3.6 [Information Viewpoint](#36-information-viewpoint)
   - 3.7 [Interaction Viewpoint](#37-interaction-viewpoint)
4. [System Architecture](#4-system-architecture)
   - 4.1 [Architectural Overview](#41-architectural-overview)
   - 4.2 [Component Architecture](#42-component-architecture)
   - 4.3 [Technology Stack](#43-technology-stack)
5. [Detailed Design](#5-detailed-design)
   - 5.1 [Mobile Application (Frontend)](#51-mobile-application-frontend)
   - 5.2 [Backend API Service](#52-backend-api-service)
   - 5.3 [AI Engine](#53-ai-engine)
   - 5.4 [Database Design](#54-database-design)
6. [API Design](#6-api-design)
   - 6.1 [RESTful API Endpoints](#61-restful-api-endpoints)
   - 6.2 [Authentication Flow](#62-authentication-flow)
7. [Security Design](#7-security-design)
8. [Deployment Architecture](#8-deployment-architecture)
9. [Appendices](#9-appendices)

---

## 1. Introduction

### 1.1 Purpose

This Software Design Description (SDD) document provides a comprehensive architectural and detailed design description for the Reveil application. Reveil is an AI-powered habit tracking mobile application designed to help users build and maintain positive habits through intelligent reminders, progress tracking, and personalized insights.

This document is intended for:
- Software developers implementing the system
- Quality assurance engineers testing the system
- Project stakeholders evaluating the technical approach
- System administrators responsible for deployment and maintenance

### 1.2 Scope

Reveil is a cross-platform mobile application that enables users to:
- Create and manage personal habits
- Track daily habit completion with mood scoring
- Receive AI-powered insights and recommendations
- Visualize progress through analytics and statistics
- Authenticate securely using Firebase Authentication

The system consists of three main components:
1. **Mobile Application** - React Native cross-platform app (iOS/Android)
2. **Backend API** - NestJS RESTful API server
3. **AI Engine** - FastAPI Python service for intelligent recommendations

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|------|------------|
| **API** | Application Programming Interface |
| **AI** | Artificial Intelligence |
| **CORS** | Cross-Origin Resource Sharing |
| **CRUD** | Create, Read, Update, Delete |
| **DTO** | Data Transfer Object |
| **JWT** | JSON Web Token |
| **ORM** | Object-Relational Mapping |
| **REST** | Representational State Transfer |
| **SDD** | Software Design Description |
| **SDK** | Software Development Kit |
| **UID** | Unique Identifier |
| **UUID** | Universally Unique Identifier |

### 1.4 References

1. IEEE Std 1016-2009 - IEEE Standard for Information Technology—Systems Design—Software Design Descriptions
2. NestJS Documentation - https://docs.nestjs.com/
3. React Native Documentation - https://reactnative.dev/docs/
4. FastAPI Documentation - https://fastapi.tiangolo.com/
5. Firebase Documentation - https://firebase.google.com/docs
6. TypeORM Documentation - https://typeorm.io/

### 1.5 Overview

The remainder of this document is organized as follows:
- **Section 2** provides a system overview including context and constraints
- **Section 3** presents multiple design viewpoints per IEEE 1016-2009
- **Section 4** describes the system architecture
- **Section 5** provides detailed design for each component
- **Section 6** documents the API design
- **Section 7** covers security considerations
- **Section 8** describes the deployment architecture

---

## 2. System Overview

### 2.1 System Context

Reveil operates within a modern mobile-first ecosystem, integrating with external services while providing core habit tracking functionality.

```
┌─────────────────────────────────────────────────────────────────┐
│                      External Systems                           │
├─────────────────┬─────────────────┬─────────────────────────────┤
│  Firebase Auth  │  Push Services  │   Analytics (Future)        │
└────────┬────────┴────────┬────────┴──────────────┬──────────────┘
         │                 │                       │
         ▼                 ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Reveil System                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Mobile     │  │   Backend    │  │     AI Engine        │  │
│  │    App       │◄─┤    API       │◄─┤   (Recommendations)  │  │
│  │(React Native)│  │  (NestJS)    │  │     (FastAPI)        │  │
│  └──────────────┘  └──────┬───────┘  └──────────────────────┘  │
│                           │                                     │
│                    ┌──────▼───────┐                            │
│                    │   Database   │                            │
│                    │   (SQLite/   │                            │
│                    │  PostgreSQL) │                            │
│                    └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Design Constraints

| Constraint Type | Description |
|-----------------|-------------|
| **Platform** | iOS 13+ and Android 10+ support required |
| **Performance** | API response time < 500ms for standard operations |
| **Security** | All API communications must use HTTPS in production |
| **Authentication** | Firebase Authentication integration mandatory |
| **Data Storage** | SQLite for development, PostgreSQL for production |
| **Scalability** | System must support containerized deployment |

### 2.3 Assumptions and Dependencies

**Assumptions:**
- Users have stable internet connectivity for synchronization
- Users have a valid Firebase account or can create one
- Mobile devices meet minimum OS version requirements

**Dependencies:**
- Firebase Authentication service availability
- Node.js runtime (v18+) for backend
- Python runtime (v3.10+) for AI engine
- Docker for containerized deployment

---

## 3. Design Viewpoints

### 3.1 Context Viewpoint

The context viewpoint identifies the system's boundaries and external interfaces.

#### 3.1.1 System Actors

| Actor | Description | Interaction |
|-------|-------------|-------------|
| **End User** | Mobile app user tracking habits | CRUD operations on habits, logging completions |
| **Firebase Auth** | External authentication provider | Token validation, user management |
| **AI Engine** | Internal recommendation service | Habit suggestions, pattern analysis |

#### 3.1.2 External Interfaces

```
┌─────────────┐     HTTPS/REST      ┌─────────────┐
│  Mobile     │◄───────────────────►│   Backend   │
│  Client     │                     │    API      │
└─────────────┘                     └──────┬──────┘
       │                                   │
       │ Firebase SDK                      │ Internal HTTP
       ▼                                   ▼
┌─────────────┐                     ┌─────────────┐
│  Firebase   │                     │  AI Engine  │
│  Auth       │                     │  (FastAPI)  │
└─────────────┘                     └─────────────┘
```

### 3.2 Composition Viewpoint

The composition viewpoint shows how the system is decomposed into its constituent parts.

#### 3.2.1 System Components

```
Reveil System
├── Mobile Application
│   ├── Navigation Module
│   │   └── AppNavigator
│   ├── Screens Module
│   │   ├── LoginScreen
│   │   ├── DashboardScreen
│   │   └── HomeScreen
│   ├── Services Module
│   │   └── API Service
│   └── Theme Module
│       └── Style Definitions
│
├── Backend API
│   ├── Core Module
│   │   ├── AppController
│   │   └── AppService
│   ├── Auth Module
│   │   └── AuthGuard
│   ├── Users Module
│   │   ├── UsersController
│   │   ├── UsersService
│   │   └── User Entity
│   ├── Habits Module
│   │   ├── HabitsController
│   │   ├── HabitsService
│   │   └── Habit Entity
│   └── Tracking Module
│       ├── TrackingController
│       ├── TrackingService
│       └── HabitLog Entity
│
└── AI Engine
    └── Recommendation Service
```

### 3.3 Logical Viewpoint

The logical viewpoint describes the system's logical structure through classes and their relationships.

#### 3.3.1 Domain Model

```
┌──────────────────┐
│       User       │
├──────────────────┤
│ - id: string     │
│ - email: string  │
│ - displayName    │
│ - photoUrl       │
│ - createdAt      │
│ - updatedAt      │
└────────┬─────────┘
         │ 1
         │
         │ owns
         │
         ▼ *
┌──────────────────┐
│      Habit       │
├──────────────────┤
│ - id: UUID       │
│ - title: string  │
│ - description    │
│ - frequency      │
│ - targetCount    │
│ - timeOfDay      │
│ - userId: FK     │
│ - createdAt      │
│ - updatedAt      │
└────────┬─────────┘
         │ 1
         │
         │ has
         │
         ▼ *
┌──────────────────┐
│    HabitLog      │
├──────────────────┤
│ - id: UUID       │
│ - date: string   │
│ - completed: bool│
│ - moodScore: int │
│ - notes: string  │
│ - userId: FK     │
│ - habitId: FK    │
│ - createdAt      │
└──────────────────┘
```

#### 3.3.2 Class Responsibilities

| Class | Responsibility |
|-------|----------------|
| **User** | Represents authenticated user with profile information |
| **Habit** | Defines a trackable habit with frequency and targets |
| **HabitLog** | Records individual habit completion events with metadata |

### 3.4 Dependency Viewpoint

The dependency viewpoint illustrates the relationships and dependencies between system components.

#### 3.4.1 Module Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile Application                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Screens   │───►│  Services   │───►│   Axios     │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                                     │             │
│         ▼                                     │             │
│  ┌─────────────┐                              │             │
│  │ Navigation  │                              │             │
│  └─────────────┘                              │             │
└───────────────────────────────────────────────┼─────────────┘
                                                │
                                                ▼ HTTP
┌─────────────────────────────────────────────────────────────┐
│                      Backend API                             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ Controllers │───►│  Services   │───►│ Repositories│     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                                     │             │
│         ▼                                     │             │
│  ┌─────────────┐                              │             │
│  │  AuthGuard  │                              │             │
│  └─────────────┘                              │             │
└───────────────────────────────────────────────┼─────────────┘
                                                │
                                                ▼ TypeORM
┌─────────────────────────────────────────────────────────────┐
│                        Database                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   users     │  │   habits    │  │ habit_logs  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

#### 3.4.2 Package Dependencies

**Mobile Application:**
- `@react-navigation/native` - Navigation framework
- `@react-navigation/native-stack` - Stack navigation
- `axios` - HTTP client
- `react-native` - Mobile framework

**Backend API:**
- `@nestjs/common` - NestJS core
- `@nestjs/typeorm` - Database ORM integration
- `typeorm` - Object-Relational Mapper
- `sqlite3` / `pg` - Database drivers

**AI Engine:**
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `scikit-learn` - Machine learning
- `pandas` - Data manipulation
- `openai` - AI capabilities

### 3.5 Interface Viewpoint

The interface viewpoint defines the interfaces provided and required by system components.

#### 3.5.1 API Interface

**Base URL:** `http://localhost:3000` (Development)

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/users/sync` | POST | Sync user from Firebase | `CreateUserDto` | `User` |
| `/habits` | GET | Get all user habits | - | `Habit[]` |
| `/habits` | POST | Create new habit | `CreateHabitDto` | `Habit` |
| `/habits/:id` | GET | Get habit by ID | - | `Habit` |
| `/habits/:id` | DELETE | Delete habit | - | `void` |
| `/tracking/log` | POST | Log habit completion | `CreateLogDto` | `HabitLog` |
| `/tracking/history/:habitId` | GET | Get habit history | - | `HabitLog[]` |

#### 3.5.2 Data Transfer Objects (DTOs)

**CreateHabitDto:**
```typescript
{
  title: string;        // Required
  description?: string; // Optional
  frequency: string;    // 'daily' | 'weekly' | 'monthly'
  targetCount?: number; // Default: 1
  timeOfDay?: string;   // 'morning' | 'afternoon' | 'evening'
}
```

**CreateLogDto:**
```typescript
{
  habitId: string;      // Required - UUID
  date: string;         // Required - YYYY-MM-DD format
  completed: boolean;   // Default: true
  moodScore?: number;   // Optional - 1 to 10
  notes?: string;       // Optional
}
```

**CreateUserDto:**
```typescript
{
  id: string;           // Required - Firebase UID
  email: string;        // Required
  displayName?: string; // Optional
  photoUrl?: string;    // Optional
}
```

### 3.6 Information Viewpoint

The information viewpoint describes the data architecture and persistence strategy.

#### 3.6.1 Database Schema

```sql
-- Users Table
CREATE TABLE user (
    id VARCHAR PRIMARY KEY,      -- Firebase UID
    email VARCHAR UNIQUE NOT NULL,
    displayName VARCHAR,
    photoUrl VARCHAR,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Habits Table
CREATE TABLE habit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR NOT NULL,
    description VARCHAR,
    frequency VARCHAR NOT NULL,
    targetCount INTEGER DEFAULT 1,
    timeOfDay VARCHAR,
    userId VARCHAR NOT NULL REFERENCES user(id),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Habit Logs Table
CREATE TABLE habit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date VARCHAR NOT NULL,       -- YYYY-MM-DD
    completed BOOLEAN DEFAULT TRUE,
    moodScore INTEGER,           -- 1-10
    notes VARCHAR,
    userId VARCHAR NOT NULL REFERENCES user(id),
    habitId UUID NOT NULL REFERENCES habit(id),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3.6.2 Entity Relationships

| Relationship | Type | Description |
|--------------|------|-------------|
| User → Habit | One-to-Many | A user can have multiple habits |
| User → HabitLog | One-to-Many | A user can have multiple habit logs |
| Habit → HabitLog | One-to-Many | A habit can have multiple log entries |

### 3.7 Interaction Viewpoint

The interaction viewpoint describes how system components interact during runtime.

#### 3.7.1 User Login Sequence

```
┌────────┐     ┌──────────┐     ┌─────────┐     ┌──────────┐
│  User  │     │  Mobile  │     │ Backend │     │ Firebase │
└───┬────┘     └────┬─────┘     └────┬────┘     └────┬─────┘
    │               │                │               │
    │  Login Click  │                │               │
    │──────────────►│                │               │
    │               │                │               │
    │               │  Authenticate  │               │
    │               │───────────────────────────────►│
    │               │                │               │
    │               │           ID Token             │
    │               │◄───────────────────────────────│
    │               │                │               │
    │               │  POST /users/sync              │
    │               │  (Bearer Token)                │
    │               │───────────────►│               │
    │               │                │               │
    │               │                │ Verify Token  │
    │               │                │──────────────►│
    │               │                │               │
    │               │                │   Token Valid │
    │               │                │◄──────────────│
    │               │                │               │
    │               │   User Data    │               │
    │               │◄───────────────│               │
    │               │                │               │
    │  Dashboard    │                │               │
    │◄──────────────│                │               │
    │               │                │               │
```

#### 3.7.2 Habit Creation Sequence

```
┌────────┐     ┌──────────┐     ┌─────────┐     ┌──────────┐
│  User  │     │  Mobile  │     │ Backend │     │ Database │
└───┬────┘     └────┬─────┘     └────┬────┘     └────┬─────┘
    │               │                │               │
    │ Create Habit  │                │               │
    │──────────────►│                │               │
    │               │                │               │
    │               │  POST /habits  │               │
    │               │───────────────►│               │
    │               │                │               │
    │               │                │  AuthGuard    │
    │               │                │  Validation   │
    │               │                │               │
    │               │                │ INSERT habit  │
    │               │                │──────────────►│
    │               │                │               │
    │               │                │  Habit record │
    │               │                │◄──────────────│
    │               │                │               │
    │               │  Habit Object  │               │
    │               │◄───────────────│               │
    │               │                │               │
    │   Success     │                │               │
    │◄──────────────│                │               │
    │               │                │               │
```

#### 3.7.3 Habit Logging Sequence

```
┌────────┐     ┌──────────┐     ┌─────────┐     ┌──────────┐
│  User  │     │  Mobile  │     │ Backend │     │ Database │
└───┬────┘     └────┬─────┘     └────┬────┘     └────┬─────┘
    │               │                │               │
    │ Mark Complete │                │               │
    │──────────────►│                │               │
    │               │                │               │
    │               │POST /tracking/log              │
    │               │───────────────►│               │
    │               │                │               │
    │               │                │INSERT habit_log
    │               │                │──────────────►│
    │               │                │               │
    │               │                │   Log record  │
    │               │                │◄──────────────│
    │               │                │               │
    │               │  HabitLog      │               │
    │               │◄───────────────│               │
    │               │                │               │
    │ Confirmation  │                │               │
    │◄──────────────│                │               │
    │               │                │               │
```

---

## 4. System Architecture

### 4.1 Architectural Overview

Reveil follows a **three-tier architecture** pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION TIER                            │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              Mobile Application (React Native)             │ │
│  │  • User Interface Components                               │ │
│  │  • Navigation Management                                   │ │
│  │  • State Management                                        │ │
│  │  • API Communication Layer                                 │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ REST API (HTTP/HTTPS)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION TIER                           │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                Backend API (NestJS)                        │ │
│  │  • Request Handling                                        │ │
│  │  • Authentication & Authorization                          │ │
│  │  • Business Logic                                          │ │
│  │  • Data Validation                                         │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                 AI Engine (FastAPI)                        │ │
│  │  • Recommendation Algorithms                               │ │
│  │  • Pattern Recognition                                     │ │
│  │  • Predictive Analytics                                    │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ TypeORM / SQL
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA TIER                                │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              Database (SQLite / PostgreSQL)                │ │
│  │  • User Data                                               │ │
│  │  • Habits Storage                                          │ │
│  │  • Habit Logs / History                                    │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Component Architecture

#### 4.2.1 Mobile Application Components

| Component | Type | Responsibility |
|-----------|------|----------------|
| `AppNavigator` | Navigation | Manages screen navigation stack |
| `LoginScreen` | Screen | Handles user authentication UI |
| `DashboardScreen` | Screen | Displays habits and completion status |
| `HomeScreen` | Screen | Main landing page |
| `api.ts` | Service | HTTP communication with backend |

#### 4.2.2 Backend API Components

| Component | Type | Responsibility |
|-----------|------|----------------|
| `AppModule` | Module | Root module, configures database and imports |
| `AuthGuard` | Guard | JWT token validation and user extraction |
| `UsersModule` | Module | User management functionality |
| `HabitsModule` | Module | Habit CRUD operations |
| `TrackingModule` | Module | Habit completion logging |

#### 4.2.3 AI Engine Components

| Component | Type | Responsibility |
|-----------|------|----------------|
| `main.py` | Application | FastAPI application entry point |
| CORS Middleware | Middleware | Cross-origin request handling |

### 4.3 Technology Stack

#### 4.3.1 Frontend (Mobile)

| Technology | Version | Purpose |
|------------|---------|---------|
| React Native | Latest | Cross-platform mobile framework |
| TypeScript | 5.x | Type-safe JavaScript |
| React Navigation | 6.x | Navigation library |
| Axios | Latest | HTTP client |

#### 4.3.2 Backend API

| Technology | Version | Purpose |
|------------|---------|---------|
| NestJS | 10.x | Node.js framework |
| TypeScript | 5.x | Type-safe JavaScript |
| TypeORM | Latest | Database ORM |
| SQLite / PostgreSQL | 3.x / 15.x | Database |

#### 4.3.3 AI Engine

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.10+ | Programming language |
| FastAPI | Latest | Web framework |
| Uvicorn | Latest | ASGI server |
| scikit-learn | Latest | Machine learning |
| pandas | Latest | Data manipulation |
| OpenAI | Latest | AI capabilities |

#### 4.3.4 Infrastructure

| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Multi-container orchestration |
| Firebase | Authentication service |

---

## 5. Detailed Design

### 5.1 Mobile Application (Frontend)

#### 5.1.1 Navigation Structure

```typescript
// AppNavigator.tsx
const Stack = createNativeStackNavigator();

Navigation Flow:
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│   Login     │────►│    Dashboard    │────►│   Details   │
│   Screen    │     │     Screen      │     │   Screen    │
└─────────────┘     └─────────────────┘     └─────────────┘
```

#### 5.1.2 Screen Components

**LoginScreen:**
- Displays app branding
- Provides login button
- Handles authentication flow
- Navigates to Dashboard on success

**DashboardScreen:**
- Fetches habits from API on mount
- Displays habits in a FlatList
- Shows empty state when no habits exist
- Provides habit completion interface

#### 5.1.3 API Service Layer

```typescript
// api.ts Service Structure
const api = axios.create({
    baseURL: BASE_URL,
});

// Automatic token injection
api.interceptors.request.use((config) => {
    config.headers.Authorization = `Bearer ${TOKEN}`;
    return config;
});

// Service Methods
authService.syncUser()      // Sync user with backend
habitsService.getAll()      // Fetch all habits
habitsService.create()      // Create new habit
```

### 5.2 Backend API Service

#### 5.2.1 Module Structure

```
src/
├── main.ts                 # Application bootstrap
├── app.module.ts           # Root module
├── app.controller.ts       # Health check endpoint
├── app.service.ts          # Core service
├── auth/
│   ├── auth.module.ts      # Auth module definition
│   └── auth.guard.ts       # JWT validation guard
├── users/
│   ├── users.module.ts     # Users module definition
│   ├── users.controller.ts # Users endpoints
│   ├── users.service.ts    # Users business logic
│   ├── user.entity.ts      # User ORM entity
│   └── dto/
│       └── create-user.dto.ts
├── habits/
│   ├── habits.module.ts    # Habits module definition
│   ├── habits.controller.ts# Habits endpoints
│   ├── habits.service.ts   # Habits business logic
│   ├── habit.entity.ts     # Habit ORM entity
│   └── dto/
│       └── create-habit.dto.ts
└── tracking/
    ├── tracking.module.ts  # Tracking module definition
    ├── tracking.controller.ts
    ├── tracking.service.ts
    ├── habit-log.entity.ts # HabitLog ORM entity
    └── dto/
        └── create-log.dto.ts
```

#### 5.2.2 Authentication Guard

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException('No token provided');
        }

        // Token verification (Firebase Admin SDK in production)
        // Attach user to request object
        request['user'] = { uid, email, emailVerified };

        return true;
    }
}
```

#### 5.2.3 Service Layer Pattern

All services follow the Repository pattern:

```typescript
@Injectable()
export class HabitsService {
    constructor(
        @InjectRepository(Habit)
        private habitsRepository: Repository<Habit>,
    ) {}

    async create(dto: CreateHabitDto, userId: string): Promise<Habit> {
        const habit = this.habitsRepository.create({ ...dto, userId });
        return this.habitsRepository.save(habit);
    }

    async findAll(userId: string): Promise<Habit[]> {
        return this.habitsRepository.find({ where: { userId } });
    }
}
```

### 5.3 AI Engine

#### 5.3.1 Application Structure

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Reveil AI Engine", version="0.1.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"status": "active", "service": "Reveil AI Engine"}
```

#### 5.3.2 Future AI Capabilities (Planned)

| Feature | Description |
|---------|-------------|
| **Habit Recommendations** | Suggest habits based on user patterns |
| **Optimal Timing** | Recommend best time to perform habits |
| **Pattern Recognition** | Identify habit completion patterns |
| **Predictive Analytics** | Predict habit success probability |
| **Personalized Insights** | Generate user-specific insights |

### 5.4 Database Design

#### 5.4.1 Entity Definitions

**User Entity:**
```typescript
@Entity()
export class User {
    @PrimaryColumn()
    id: string;              // Firebase UID

    @Column({ unique: true })
    email: string;

    @Column({ nullable: true })
    displayName: string;

    @Column({ nullable: true })
    photoUrl: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
```

**Habit Entity:**
```typescript
@Entity()
export class Habit {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ nullable: true })
    description: string;

    @Column()
    frequency: string;       // 'daily', 'weekly', etc.

    @Column({ default: 1 })
    targetCount: number;

    @Column({ nullable: true })
    timeOfDay: string;       // 'morning', 'afternoon', 'evening'

    @ManyToOne(() => User, (user) => user.id)
    user: User;

    @Column()
    userId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
```

**HabitLog Entity:**
```typescript
@Entity()
export class HabitLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    date: string;            // YYYY-MM-DD

    @Column({ default: true })
    completed: boolean;

    @Column({ nullable: true })
    moodScore: number;       // 1-10

    @Column({ nullable: true })
    notes: string;

    @ManyToOne(() => User)
    user: User;

    @Column()
    userId: string;

    @ManyToOne(() => Habit)
    habit: Habit;

    @Column()
    habitId: string;

    @CreateDateColumn()
    createdAt: Date;
}
```

---

## 6. API Design

### 6.1 RESTful API Endpoints

#### 6.1.1 Users API

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/users/sync` | Sync user from Firebase | Yes |
| GET | `/users/:id` | Get user by ID | Yes |

**POST /users/sync**

Request:
```json
{
  "id": "firebase-uid-123",
  "email": "user@example.com",
  "displayName": "John Doe",
  "photoUrl": "https://..."
}
```

Response:
```json
{
  "id": "firebase-uid-123",
  "email": "user@example.com",
  "displayName": "John Doe",
  "photoUrl": "https://...",
  "createdAt": "2026-01-12T10:00:00Z",
  "updatedAt": "2026-01-12T10:00:00Z"
}
```

#### 6.1.2 Habits API

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/habits` | Get all habits | Yes |
| POST | `/habits` | Create habit | Yes |
| GET | `/habits/:id` | Get habit by ID | Yes |
| DELETE | `/habits/:id` | Delete habit | Yes |

**POST /habits**

Request:
```json
{
  "title": "Morning Meditation",
  "description": "10 minutes of mindfulness",
  "frequency": "daily",
  "targetCount": 1,
  "timeOfDay": "morning"
}
```

Response:
```json
{
  "id": "uuid-123-456",
  "title": "Morning Meditation",
  "description": "10 minutes of mindfulness",
  "frequency": "daily",
  "targetCount": 1,
  "timeOfDay": "morning",
  "userId": "firebase-uid-123",
  "createdAt": "2026-01-12T10:00:00Z",
  "updatedAt": "2026-01-12T10:00:00Z"
}
```

#### 6.1.3 Tracking API

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/tracking/log` | Log habit completion | Yes |
| GET | `/tracking/history/:habitId` | Get habit history | Yes |

**POST /tracking/log**

Request:
```json
{
  "habitId": "uuid-123-456",
  "date": "2026-01-12",
  "completed": true,
  "moodScore": 8,
  "notes": "Felt great today!"
}
```

Response:
```json
{
  "id": "log-uuid-789",
  "habitId": "uuid-123-456",
  "userId": "firebase-uid-123",
  "date": "2026-01-12",
  "completed": true,
  "moodScore": 8,
  "notes": "Felt great today!",
  "createdAt": "2026-01-12T10:00:00Z"
}
```

### 6.2 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Authentication Flow                          │
└─────────────────────────────────────────────────────────────────┘

1. User logs in via Firebase Authentication in mobile app
2. Mobile app receives Firebase ID Token
3. Mobile app includes token in Authorization header:
   Authorization: Bearer <firebase-id-token>
4. Backend AuthGuard extracts and validates token
5. User information is attached to request object
6. Protected routes access user via request.user
```

**Authorization Header Format:**
```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 7. Security Design

### 7.1 Authentication Security

| Aspect | Implementation |
|--------|----------------|
| **Token Type** | Firebase ID Token (JWT) |
| **Token Validation** | Firebase Admin SDK verification |
| **Token Expiry** | Handled by Firebase (1 hour default) |
| **Token Refresh** | Automatic via Firebase SDK |

### 7.2 Authorization Security

| Resource | Access Control |
|----------|----------------|
| Habits | User can only access own habits (userId filter) |
| HabitLogs | User can only access own logs (userId filter) |
| User Profile | User can only access own profile |

### 7.3 Data Security

| Aspect | Implementation |
|--------|----------------|
| **Transport** | HTTPS in production |
| **Password Storage** | Handled by Firebase (not stored locally) |
| **SQL Injection** | Prevented via TypeORM parameterized queries |
| **Input Validation** | DTOs with class-validator decorators |

### 7.4 Security Best Practices

- All API endpoints require authentication (except health check)
- CORS configured for specific origins in production
- Environment variables for sensitive configuration
- No sensitive data in client-side storage
- Regular dependency updates for security patches

---

## 8. Deployment Architecture

### 8.1 Development Environment

```
┌─────────────────────────────────────────────────────────────────┐
│                   Development Setup                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Mobile    │  │   Backend   │  │      AI Engine          │ │
│  │   Expo/RN   │  │   NestJS    │  │      FastAPI            │ │
│  │   Dev       │  │   Dev       │  │      Dev                │ │
│  │  (Metro)    │  │ (port 3000) │  │    (port 8000)          │ │
│  └─────────────┘  └──────┬──────┘  └─────────────────────────┘ │
│                          │                                      │
│                   ┌──────▼──────┐                               │
│                   │   SQLite    │                               │
│                   │   (Local)   │                               │
│                   └─────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Production Environment (Docker)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: reveil_db
    restart: always
    environment:
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
      POSTGRES_DB: ${DB_NAME:-reveil}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 8.3 Production Deployment (Planned)

```
┌─────────────────────────────────────────────────────────────────┐
│                   Production Architecture                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐                                               │
│  │   Mobile    │                                               │
│  │   App       │◄──────┐                                       │
│  │  (Stores)   │       │                                       │
│  └─────────────┘       │                                       │
│                        │ HTTPS                                 │
│                        ▼                                       │
│               ┌─────────────────┐                              │
│               │  Load Balancer  │                              │
│               └────────┬────────┘                              │
│                        │                                       │
│            ┌───────────┼───────────┐                           │
│            │           │           │                           │
│            ▼           ▼           ▼                           │
│      ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
│      │ Backend  │ │ Backend  │ │   AI     │                   │
│      │ Instance │ │ Instance │ │ Engine   │                   │
│      │    1     │ │    2     │ │          │                   │
│      └────┬─────┘ └────┬─────┘ └──────────┘                   │
│           │            │                                       │
│           └─────┬──────┘                                       │
│                 ▼                                              │
│         ┌─────────────┐                                        │
│         │  PostgreSQL │                                        │
│         │   (RDS)     │                                        │
│         └─────────────┘                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Appendices

### Appendix A: Project Structure

```
Reveil/
├── docker-compose.yml          # Docker configuration
├── ai_engine/
│   ├── main.py                 # FastAPI application
│   └── requirements.txt        # Python dependencies
├── backend/
│   ├── package.json            # Node.js dependencies
│   ├── tsconfig.json           # TypeScript configuration
│   ├── nest-cli.json           # NestJS CLI configuration
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── app.controller.ts
│       ├── app.service.ts
│       ├── auth/
│       ├── users/
│       ├── habits/
│       └── tracking/
└── mobile/
    ├── package.json            # React Native dependencies
    ├── App.tsx                 # Application entry point
    ├── app.json                # Expo configuration
    └── src/
        ├── navigation/
        ├── screens/
        ├── services/
        └── theme/
```

### Appendix B: Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_USER` | Database username | postgres |
| `DB_PASSWORD` | Database password | postgres |
| `DB_NAME` | Database name | reveil |
| `FIREBASE_PROJECT_ID` | Firebase project identifier | - |
| `FIREBASE_PRIVATE_KEY` | Firebase service account key | - |
| `AI_ENGINE_URL` | AI Engine service URL | http://localhost:8000 |

### Appendix C: Running the Application

**Backend:**
```bash
cd backend
npm install
npm run start:dev
```

**Mobile:**
```bash
cd mobile
npm install
npm start
```

**AI Engine:**
```bash
cd ai_engine
pip install -r requirements.txt
uvicorn main:app --reload
```

**Docker (Database):**
```bash
docker-compose up -d
```

---

## Document Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | January 12, 2026 | Halil Utku Demirtaş, Furkan Can Karafil | Initial release |

---

**End of Document**
