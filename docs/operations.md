# Operations & Runbook Document

## Purpose
Specify system administration workflows, database restore procedures, incident management practices, status monitoring configurations, and scaling methods.

## Scope
Covers recovery runbooks, troubleshooting steps for common issues, system performance optimization, and server configuration settings.

## Related Documents
- [database.md](database.md) — SQL structural setup details
- [security.md](security.md) — Security policies and threat models
- [deployment.md](deployment.md) — Production host topologies

---

## Disaster Recovery Runbooks

### 1. Complete Database Recovery (Supabase Restore)
Executed when database corruption occurs, or critical information is accidentally altered.

#### Prerequisites
- Installed Supabase CLI configured locally.
- Target backup file (`backup.sql`) downloaded from encrypted storage.
- Project database credentials.

#### Recovery Procedure
1. Set active event status to maintenance to block concurrent incoming traffic:
   ```bash
   # Temporarily disable public traffic via Next.js Middleware env flag
   vercel env set MAINTENANCE_MODE "true"
   vercel deploy --prod
   ```
2. Navigate to the Supabase Database Console or run the CLI commands to apply SQL backup:
   ```bash
   # Execute db restore using pg_restore against raw postgres string
   psql -d "$PRODUCTION_DATABASE_URL" -f backup.sql
   ```
3. Run schema verification script:
   ```bash
   supabase db lint
   ```
4. Restore Vercel environment flag to activate system:
   ```bash
   vercel env set MAINTENANCE_MODE "false"
   vercel deploy --prod
   ```

---

### 2. Force Role Recovery (Super Admin Restoration)
In the event that all Super Admin accounts are accidentally locked out, deleted, or suspended.

#### Recovery Procedure
1. Access the Supabase SQL Editor console or run direct database commands.
2. Execute target role elevation SQL:
   ```sql
   -- Elevate specific profile to SUPER_ADMIN role and set APPROVED status
   UPDATE public.profiles
   SET role = 'SUPER_ADMIN', status = 'APPROVED'
   WHERE email = 'system-owner@example.com';
   ```
3. Verify changes by running lookup checks:
   ```sql
   SELECT email, role, status FROM public.profiles WHERE role = 'SUPER_ADMIN';
   ```

---

## Troubleshooting Guide

### 1. Judge Scoring Lock (Invalid Sequence Error)
- **Symptom:** Judge scans a QR code, but the mobile screen returns: "Error: Previous criterion must be scored first."
- **Root Cause:** A database record mismatch occurred, or the judge tried to score criterion $N$ before criterion $N-1$ was successfully saved.
- **Resolution:**
  1. Retrieve judge ID and project ID from the error detail panel.
  2. Execute query checking existing scores for the pair:
     ```sql
     SELECT s.id, c.name, c.sort_order, s.voided 
     FROM public.scores s
     JOIN public.criteria c ON c.id = s.criterion_id
     WHERE s.judge_id = 'c044f128-44fa-4ce8-b611-a89e8122bb11' 
       AND s.project_id = '1198cb04-e3c1-4b11-a8de-d1988849aa11';
     ```
  3. If a database synchronization gap is confirmed (e.g. a middle index is missing), the Super Admin should void the judge's scores for that project (using `/api/admin/scores/void` or direct RPC) to allow the judge to evaluate the project criteria in sequence from the beginning, preserving the scoring immutability guarantee. Instruct the judge to refresh the app to sync the local state.

---

### 2. Dynamic Form Edit Lock Mismatch
- **Symptom:** Admin attempts to alter dynamic registration fields, but updates are rejected with error: "Structure mutations locked."
- **Root Cause:** The event's form edit window has closed, or teams have already completed final submissions.
- **Resolution:**
  1. If structural changes are absolutely necessary (e.g. key validation fixes):
     - Super Admin must extend the edit window:
       ```sql
       UPDATE public.events
       SET form_edit_window_end = now() + INTERVAL '1 day'
       WHERE id = '834c8928-86d7-4632-a521-789a2444c120';
       ```
     - Make structural corrections to `form_fields`.
     - After corrections, lock the edit window immediately:
       ```sql
       UPDATE public.events
       SET form_edit_window_end = now()
       WHERE id = '834c8928-86d7-4632-a521-789a2444c120';
       ```
     - Document the action in the audit logs.

---

## System Scaling & Resource Tunings

### Database Connection Pool Management
Serverless functions on Vercel spawn concurrent runtime instances. Connection pooling is essential to prevent exhausting Postgres connection limits.
- **Rules:** Next.js Server Components and Server Actions connect via the transactional PgBouncer port (port `6543`) rather than direct connections (port `5432`).
- **DB Settings Tuning:**
  Database resource allocations like `max_connections` and `shared_buffers` are managed automatically by the Supabase Cloud platform depending on the database's project pricing and resource tiers. Users do not have superuser access to run `ALTER SYSTEM` directly.

### Storage Cleanups
Draft registrations that are not submitted within 7 days of the deadline are pruned.
- **Maintenance Cron Job (Supabase pg_cron):**
  ```sql
  SELECT cron.schedule(
    'prune-expired-drafts',
    '0 2 * * *', -- Daily at 2 AM
    $$ DELETE FROM public.registrations WHERE status = 'DRAFT' AND expires_at < now() $$
  );
  ```
