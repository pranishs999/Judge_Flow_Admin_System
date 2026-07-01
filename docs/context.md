# Project Judging & Event Evaluation Platform (JFlow)

## Overview
**JFlow** is a comprehensive, self-hosted event evaluation system designed for structured judging of team-based projects. By default, the system is configured to target the **judgeflow.net** domain (which can be customized for local self-hosted configurations). It ensures fair scoring, strict role control, immutable evaluation records, and controlled result visibility.

The system supports:
- Google-based authentication
- public registration forms
- sequential judging workflow
- full audit export for transparency

---

## Vision
To build a controlled, auditable, and fair evaluation system for academic events, hackathons, and competitions where scoring integrity and role separation are strictly enforced.

---

## Core Principles
- Immutable scoring (no post-submit edits)
- Role-based access control (RBAC)
- Event-driven lifecycle phases
- Full audit transparency for Super Admin
- Controlled result visibility
- Simple monolithic architecture

---

## Roles

### Super Admin
- Full system control
- Can grant/revoke any access
- Can void evaluations and trigger re-evaluation
- Can extend deadlines (audit logged)
- Controls result visibility release

### Admin
- Creates and manages events (requires SA approval)
- Manages teams and judges (pre-event)
- Views registration data (Excel export)
- Cannot modify scores

### Judge
- Evaluates all projects
- Sees only title + abstract
- Sequential scoring per criteria
- One-time submission per criterion

### Maintainer
- System maintenance mode only
- No access to scoring or judging data

---

## Constraints
- One team = one project per event
- All judges evaluate all projects
- No score editing after submission
- Registration is public (no login required)
- Draft + final submission model for registration
- Form editable only within 1–2 days after publish
- Results hidden until SA explicitly releases them
