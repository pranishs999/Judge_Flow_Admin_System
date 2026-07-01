# Deployment Configuration Document

## Purpose
Specify hosting targets, environment configurations, CI/CD pipeline structures, database backup parameters, and monitoring platforms for the Project Judging & Event Evaluation Platform.

## Scope
Covers Vercel hosting parameters for Next.js, Supabase configurations, environment variables checklists, automated scaling rules, backup policies, and logs integration.

## Related Documents
- [architecture.md](architecture.md) — System boundaries and topologies
- [database.md](database.md) — Relational Postgres details
- [backend.md](backend.md) — Edge Function deployment details

---

## Deployment Architecture

The platform runs as a self-hosted modular monolith split across two managed platforms: Vercel (frontend and internal API proxy) and Supabase (database, auth, object storage, and edge functions).

```
                           +------------------------+
                           |  Vercel Edge Network   |
                           |  - Next.js Web App     |
                           |  - UI / Forms Routing  |
                           +-----------+------------+
                                       |
                                       | HTTPS / WSS
                                       v
+-----------------------------------------------------------------------+
|                           Supabase Platform                           |
|  +--------------------+  +--------------------+  +-----------------+  |
|  |    PostgreSQL      |  |   Supabase Auth    |  |  Edge Functions |  |
|  |  - RLS Policies    |  |  - Google OAuth    |  |  - PDF Render   |  |
|  |  - Audit Triggers  |  |  - Session Tokens  |  |  - Email Send   |  |
|  +--------------------+  +--------------------+  +-----------------+  |
|  +--------------------+  +--------------------+                       |
|  |  Storage Buckets   |  | Realtime Channels  |                       |
|  |  - Submissions     |  |  - Live Dashboard  |                       |
|  +--------------------+  +--------------------+                       |
+-----------------------------------------------------------------------+
```

---

## Target Host Configurations

### 1. Vercel (Frontend & Web UI Routing)
- **Deployment Type:** Serverless App Router.
- **Node.js Runtime Version:** Node.js 18.x or 20.x (LTS).
- **Regions:** Automatically deployed to Vercel's global Edge network. Server-side rendering (SSR) functions are pinned to regions geographically close to the Supabase database instance (e.g. `us-east-1` or `eu-central-1`) to minimize database connection latency.

### 2. Supabase Cloud (Backend Services)
- **Database Engine:** PostgreSQL 15+.
- **Connection Mode:** Session connection mode on port 5432 (for transactions) and Transaction mode via PgBouncer on port 6543 (for serverless APIs).
- **Edge Functions Runtime:** Deno.

---

## Build Pipelines & CI/CD Specification

The platform utilizes GitHub Actions for continuous integration and automated deployment.

### GitHub Actions Pipeline Workflow (`.github/workflows/deploy.yml`)
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run ESLint
        run: npm run lint
      - name: Run Tests
        run: npm run test

  deploy-supabase:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest
      - name: Deploy Migrations & Functions
        run: |
          supabase db push --db-url "${{ secrets.SUPABASE_PRODUCTION_DB_URL }}"
          supabase fn deploy --project-ref "${{ secrets.SUPABASE_PROJECT_ID }}"
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

  deploy-vercel:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## Environment Variables Checklist

The following variables must be defined in the respective hosting consoles.

### Vercel Deployment Panel

| Variable Name | Required | Description |
| :--- | :---: | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | HTTP endpoint of the Supabase instance. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anonymous key for database RLS requests. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Private server-side key bypassing RLS policies (Server-only). |
| `NEXT_PUBLIC_APP_URL` | Yes | Canonical web URL of the Next.js deployment. |
| `UPSTASH_REDIS_REST_URL` | No | REST URL for Upstash Redis (used for rate-limiting in middleware). |
| `UPSTASH_REDIS_REST_TOKEN` | No | REST Token for Upstash Redis. |
| `SENTRY_DSN` | No | DSN key for Sentry runtime error tracking. |
| `AI_ENABLED` | No | Toggle value (`true`/`false`) for Vercel AI features. |
| `AI_API_KEY` | No | API access key for target AI endpoint models (e.g. OpenAI/Anthropic). |

### Supabase Edge Functions Context (`supabase secrets set`)

| Secret Key | Required | Description |
| :--- | :---: | :--- |
| `RESEND_API_KEY` | Yes | API credentials for Resend email dispatch service. |
| `SYSTEM_SENDER_EMAIL` | Yes | Sender address for system transactional emails. |
| `DATABASE_URL` | Yes | Connection string for Edge Functions querying Postgres directly. |

---

## Backup & Recovery Plan

- **Automatic Backups:** Supabase Cloud executes database snapshot operations daily. Backups are encrypted at rest and held for 7 days (Free tier) or 30 days (Pro tier).
- **Manual Backups:** Administrators can download logical sql backups via the Supabase CLI tool:
  ```bash
  supabase db dump --db-url "$SUPABASE_DB_URL" -f local_backup.sql
  ```
- **Point-In-Time Recovery (PITR):** Available on Pro/Enterprise tiers. Allows recovery to any state down to the second, mitigating accidental schema or record loss.

---

## Monitoring & Logging Integration

- **Vercel Log Streams:** Next.js build errors and Serverless Function runtime exceptions are forwarded directly to Axiom or Datadog using Vercel Integrations.
- **Supabase Logs:** Database query logs and Edge Function invocation profiles are available within the Supabase Dashboard SQL editor.
- **Sentry Integration:** Client-side runtime crashes are caught using Sentry SDK initialized in `src/app/layout.tsx`.
