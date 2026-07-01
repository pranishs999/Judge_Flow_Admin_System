# JFlow — Project Judging & Event Evaluation Platform

A self-hosted, full-stack platform for structured judging of team-based projects. Built with **Next.js 14**, **Supabase**, and **TypeScript**.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL via Supabase
- **Auth:** Supabase Auth with Google OAuth
- **ORM:** Supabase JS Client + Raw SQL migrations
- **Styling:** Tailwind CSS + shadcn/ui
- **Language:** TypeScript

## Getting Started

### Prerequisites

- Node.js 20+
- A Supabase project (`jhhohbdhuxsuhrppeixh`)

### Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `NEXT_PUBLIC_APP_URL` | App base URL (default: `http://localhost:3000`) |

### Install & Run

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

### Database Migrations

```bash
supabase db push
```

Migrations are in `supabase/migrations/`:

- `20260630000000_init.sql` — schema, tables, enums, functions
- `20260630000001_scoring_logic.sql` — RPCs, triggers, audit
- `20260630000002_rls_policies.sql` — RLS policies
- `20260701000000_fix_rls_recursion.sql` — fix infinite recursion in profiles RLS

### Auth Hook

Enable the Customize Access Token (JWT) hook in Supabase Dashboard → Authentication → Settings → Auth Hooks:

- **Type:** Postgres
- **Schema:** `public`
- **Function:** `custom_access_token_hook`

This syncs `profiles.role` into the JWT's `app_metadata.role`.

## Roles & Access

| Role | Permissions |
|---|---|
| **SUPER_ADMIN** | Full system access — manage users, events, audit log |
| **ADMIN** | Event management — create/edit events, manage judges |
| **JUDGE** | Score assigned projects |
| **MAINTAINER** | (Reserved) |

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login & callback
│   ├── api/              # API routes (admin, judging, scores, registrations)
│   ├── dashboard/        # Role-based dashboards
│   ├── eval/             # Judge scoring interface
│   └── register/         # Team registration
├── components/
│   ├── ui/               # shadcn primitives
│   ├── dashboard-sidebar.tsx
├── lib/
│   ├── supabase/         # Client, server, admin helpers
│   ├── api-errors.ts     # Error response helpers
│   └── utils.ts          # cn(), formatDate(), slugify()
supabase/
├── migrations/           # SQL migrations
└── config.toml
```

## API Endpoints

| Route | Auth | Description |
|---|---|---|
| `POST /api/admin/events` | ADMIN/SUPER_ADMIN | Create event |
| `POST /api/admin/events/transition` | ADMIN/SUPER_ADMIN | Change event status |
| `GET /api/admin/users` | SUPER_ADMIN | List all users |
| `POST /api/admin/users` | SUPER_ADMIN | Approve/reject/change-role/change-status |
| `POST /api/admin/scores/void` | SUPER_ADMIN | Void judge scores |
| `GET /api/judging/projects` | JUDGE | List projects for an event |
| `POST /api/scores/submit` | JUDGE | Submit score |
