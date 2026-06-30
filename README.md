# Project Judging & Event Evaluation Platform

A comprehensive, self-hosted event evaluation system designed for structured judging of team-based projects at academic events, hackathons, and competitions. Built with Next.js, Supabase, and Tailwind CSS.

## 🌟 Key Features

*   **Role-Based Access Control (RBAC):** Strict separation of concerns between Super Admins, Admins, Judges, and Maintainers.
*   **Immutable Scoring:** Enforced at the database level to ensure evaluation integrity; scores cannot be modified post-submission.
*   **Sequential Evaluation:** Guides judges through a structured rubric, ensuring no criteria are skipped.
*   **Dynamic Registration Forms:** Google Forms-style builder for collecting team and project submissions.
*   **Anonymous Judging:** Judges only see the project title and abstract to eliminate bias.
*   **QR-Based Project Access:** Fast and error-free project identification on mobile devices for live events.
*   **Automated Rankings & Tie Resolution:** Built-in aggregation engine with Super Admin override capabilities.
*   **Comprehensive Audit Logging:** Every sensitive action is logged for transparency and physical record-keeping.

## 📚 Documentation Suite

This project is built using a **documentation-first** approach. The complete technical specification and architecture are available in the `docs/` directory.

### Core Architecture & Requirements
*   [Vision & Context](docs/context.md) — Core principles and role definitions.
*   [Phase-Based Plan](docs/plan.md) — The lifecycle of an event from setup to results.
*   [User Flows](docs/userflow.md) — Detailed interaction flows for all roles.
*   [System Architecture](docs/architecture.md) — Topology, module boundaries, and data flow.
*   [Requirements](docs/requirements.md) — Exhaustive functional and non-functional specifications.

### Technical Specifications
*   [Database Schema](docs/database.md) — ERD, tables, constraints, triggers, and SQL RPCs.
*   [Security & Auth](docs/security.md) — RLS policies, RBAC, OAuth, and threat mitigation.
*   [API Contracts](docs/api.md) — Endpoints, server actions, and payload structures.
*   [Frontend Design](docs/frontend.md) — Next.js App Router structure, state management, and performance.
*   [Backend Services](docs/backend.md) — Supabase Edge Functions, storage, and notifications.
*   [UI/UX Specification](docs/ui-spec.md) — Typography, palettes, and screen-by-screen layouts.

### Implementation Logic
*   [Registration Engine](docs/registration.md) — Dynamic forms, draft persistence, and uploads.
*   [Judging Engine](docs/judging.md) — QR workflows, anonymity rules, and offline caching.
*   [Reporting & Analytics](docs/reports.md) — Mathematical ranking models, tie-breaking, and Excel exports.

### DevOps & Development
*   [Development Standards](docs/development.md) — Git workflow, coding rules, and naming conventions.
*   [Testing Strategy](docs/testing.md) — pgTAP RLS tests and Playwright E2E scenarios.
*   [Deployment Setup](docs/deployment.md) — Vercel and Supabase CI/CD pipelines.
*   [Operations & Runbooks](docs/operations.md) — Disaster recovery and system administration.

## 🛠 Tech Stack

*   **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui.
*   **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions).
*   **Hosting:** Vercel (Web App) + Supabase Cloud (Data & Services).

## 🚀 Getting Started

Please refer to the [Development Standards](docs/development.md) and [Deployment Configuration](docs/deployment.md) documents for instructions on setting up the local environment and CI/CD pipelines.
