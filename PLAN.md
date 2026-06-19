# System Architecture Plan

## Architecture Style
Modular monolithic or service-oriented architecture with strict domain separation.

---

## Core Modules

### 1. Authentication & RBAC
- Role management
- Session control
- Permission enforcement

### 2. Event Management
- Event creation
- Configuration
- Lifecycle transitions

### 3. Submission Management
- Team/project uploads
- QR-based identification
- Submission locking

### 4. Judging Engine
- Sequential criterion evaluation
- Per-criterion immutable scoring
- Resume support

### 5. Scoring Ledger (Immutable)
- Append-only storage
- No updates/deletes allowed
- Event-sourced scoring model

### 6. Ranking Engine
- Real-time internal computation
- Snapshot-based public leaderboard

### 7. Tie-Break Engine
- Executes dedicated tie-break rubric
- Uses same judge set
- Secondary ranking key

### 8. Notification System
- In-app notifications only
- Event-driven alerts

### 9. Audit System
- Full action logging
- Immutable event history

### 10. Maintenance Mode System
- Isolated environment
- No production data access
- Technical operations only

---

## Data Model Principles
- Append-only scoring system
- Immutable evaluation records
- Event-based partitioning
- Snapshot-based leaderboard versioning

---

## RBAC Model

### Super Admin
- Full system control (except score mutation)

### Admin
- Event configuration authority
- Post-start request-only judge lifecycle control

### Judge
- Sequential scoring interface
- One-time per criterion submission

### Maintainer
- Maintenance instance only
- No scoring access

---

## Judging Flow

1. Project assignment
2. Anonymous evaluation access
3. Sequential criteria scoring
4. Immediate lock per criterion
5. Completion validation

---

## Ranking Flow

- Internal real-time aggregation
- Tie detection triggers tie-break rubric
- Snapshot published on admin request

---

## Inactivity System

- Event-configurable threshold
- Activity = evaluation actions only
- Auto flag inactive judges
- Admin escalates to Super Admin

---

## Event Finalization

Event auto-finalizes when:
- All active judges complete evaluations
- All tie-breaks resolved
- No pending evaluation state exists