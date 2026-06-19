# Project Judging & Event Evaluation Platform

## Overview
A self-hosted, open-source judging system designed for structured evaluation of projects in controlled event environments. It supports sequential judging, immutable scoring, multi-round evaluation, tie-break handling, and strict role-based governance.

The system is deployed per organization as an isolated instance with tightly controlled event lifecycle rules and no post-submission score mutation.

---

## Vision
To ensure fair, deterministic, and auditable evaluation of projects through a strictly controlled scoring pipeline that eliminates post-submission manipulation and enforces structured judging workflows.

---

## Scope
### Included
- Event lifecycle management
- Team and submission handling
- Multi-round judging system
- Sequential criterion-based scoring
- Immutable scoring ledger
- Real-time internal ranking engine
- Snapshot-based public leaderboard
- Tie-break rubric system
- Offline/queued submissions
- Audit logging

### Excluded
- Cross-organization SaaS tenancy
- Post-submission score edits
- Public participation systems
- Flexible ad-hoc scoring updates

---

## Stakeholders

### Super Admin
- Creates events, users, roles
- Full system control
- Cannot modify submitted scores

### Admin / Manager
- Event configuration authority
- Manages teams, judges, rubrics (pre-start)
- Post-start: request-only control for judge lifecycle changes

### Judge
- Evaluates submissions
- Sequential scoring per criterion
- Immutable submissions

### Maintainer
- Technical operations role
- Works only in isolated maintenance instance
- No access to scoring or marks data

---

## Constraints
- One submission per team per event
- Sequential criterion-based scoring
- Immutable score entries (append-only model)
- No score updates or deletions
- Event-driven lifecycle locking
- Judge inactivity monitoring
- Auto-finalization on completion
- Hybrid ranking system (real-time + snapshot)

---

## Key Terminology
- **Criterion**: Individual scoring parameter
- **Submission**: Project entry
- **Evaluation**: Judge scoring process
- **Round**: Stage of judging
- **Tie-break Rubric**: Secondary scoring mechanism for resolving ties
- **Snapshot Ranking**: Frozen leaderboard state
- **Active Judge**: Judge participating in evaluation
- **Inactive Judge**: Judge excluded due to inactivity

---

## Business Rules
- All scores are immutable once submitted
- Judges must complete all criteria for valid evaluation
- Only evaluation actions reset inactivity timer
- Admin cannot modify scoring outcomes
- Super Admin cannot modify scores
- Event auto-finalizes only when all conditions are met
- Tie-break uses separate rubric evaluated by same judges