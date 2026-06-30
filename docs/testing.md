# Testing Strategy Document

## Purpose
Define the verification framework, test levels, automation tooling, CI integration, and test cases to validate functional capabilities and safety rules for the Project Judging & Event Evaluation Platform.

## Scope
Covers unit, integration, database RLS, and end-to-end (E2E) UI testing. Focuses on score immutability, role separation, and offline capabilities.

## Related Documents
- [requirements.md](requirements.md) — Functional and non-functional requirements
- [security.md](security.md) — Security policies and RLS rules
- [deployment.md](deployment.md) — CI/CD integration

---

## Testing Framework & Tooling

The application implements a multi-tier testing strategy using modern verification runtimes.

| Tier | Tools | Purpose | Target |
| :--- | :--- | :--- | :--- |
| **Unit Testing** | Jest + TS-Jest | Utility functions, calculations, dynamic form logic | Next.js API/helpers |
| **Component Testing** | React Testing Library | UI component renders, loading/error states, form validations | React Components |
| **Database Security** | pgTAP + dbdev | SQL unit tests, trigger validation, RLS verification | PostgreSQL |
| **E2E Testing** | Playwright | Full user journey flows, role transitions, offline emulation | Complete Platform |

---

## Database RLS & Trigger Testing (pgTAP)

Database security is verified at the schema level using pgTAP tests, assuring RLS works even if client libraries bypass validation checks.

### pgTAP Test File Example (`supabase/tests/rls_security_test.sql`)
```sql
BEGIN;
SELECT plan(4);

-- Test 1: Verify RLS is enabled on scores table
SELECT relation_has_rls('public', 'scores', 'RLS should be enabled on the scores table');

-- Test 2: Anonymous user cannot insert scores
SET local role anonymous;
SELECT throws_ok(
  $$ INSERT INTO public.scores (judge_id, project_id, criterion_id, event_id, marks) VALUES (gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 10) $$,
  'new row violates row-level security policy for table "scores"',
  'Anonymous user must be blocked from inserting scores'
);

-- Test 3: Approved judge can insert score for assigned event
SET local role authenticated;
-- Inject session mock data simulating approved judge
SET local request.jwt.claims = '{"sub": "c044f128-44fa-4ce8-b611-a89e8122bb11", "email": "judge@example.com"}';
-- (Mock records for event_judges and events status = 'JUDGING' created in setup)
SELECT lives_ok(
  $$ INSERT INTO public.scores (judge_id, project_id, criterion_id, event_id, marks) 
     VALUES ('c044f128-44fa-4ce8-b611-a89e8122bb11', '1198cb04-e3c1-4b11-a8de-d1988849aa11', 'ff98d223-11ca-4ce3-a812-998fd1288cc1', '834c8928-86d7-4632-a521-789a2444c120', 8) $$,
  'Approved judge should be able to submit valid score'
);

-- Test 4: Verify scores cannot be updated (Immutability check)
SELECT throws_ok(
  $$ UPDATE public.scores SET marks = 10 WHERE judge_id = 'c044f128-44fa-4ce8-b611-a89e8122bb11' $$,
  'new row violates row-level security policy for table "scores"',
  'Submitted marks must be immutable'
);

SELECT * FROM finish();
ROLLBACK;
```

---

## Playwright E2E Test Suite (E2E Journeys)

Playwright validates correct UI rendering, session synchronization, routing, and offline queue submission.

### E2E Test Scenarios

#### Scenario 1: Super Admin Void Score Journey
1. Log in as Super Admin (`superadmin@example.com`).
2. Navigate to the Event list page and select the active event.
3. Locate Project 101's scoring breakdown matrix.
4. Select Judge A's submission details card.
5. Click "Void Score", enter reason "Visual presentation error", and click confirm.
6. Verify status updates to "Voided" and evaluation is cleared.
7. Log in as Judge A, navigate to Project 101, and verify the sequential evaluation flow is unlocked for re-entry.

#### Scenario 2: Sequential Evaluation Locking Journey
1. Log in as Judge A (`judgea@example.com`).
2. Open assigned Project 101 evaluation screen.
3. Verify Criterion 1 ("Presentation") input field is focused and editable.
4. Verify Criterion 2 ("Innovation") input field is disabled.
5. Input score "8" for Criterion 1, and click "Submit & Next".
6. Verify Criterion 1 becomes read-only and Criterion 2 becomes active.

---

## Test Verification Matrices

### Critical Validation Matrix

| Test ID | Test Category | Target Feature | Validation Action | Expected Outcome |
| :--- | :--- | :--- | :--- | :--- |
| **VAL-001** | Security | Role Escalation | Request `/api/admin/events` using Judge session JWT. | API returns HTTP 403 Forbidden. |
| **VAL-002** | Integrity | Score Mutability | POST UPDATE request to `/api/scores/submit` targeting active score ID. | Database trigger blocks operation, returns exception. |
| **VAL-003** | Validation | Score Bound Check | Submit marks value `-1.0` or `11.0` (where range is `0.0` - `10.0`). | API returns HTTP 400 Bad Request, value rejected. |
| **VAL-004** | Lifecycle | Event Lock | Request registration form update after event transitions to `REGISTRATION_CLOSED`. | API returns HTTP 409 Conflict. |
| **VAL-005** | Offline | Cache Sync | Disable network, evaluate Project 102, store locally. Re-enable network. | Outbox worker fires, API receives score, queue empty. |

---

## Offline Emulation & Mock Setup

To verify the robust behavior of the mobile judging client when internet connectivity drops:
1. Playwright tests execute network throttling commands:
   ```typescript
   await context.setOffline(true);
   ```
2. The UI is inspected to verify that:
   - A yellow status indicator shows "Offline Mode".
   - Scoring inputs are active, and submissions write to the outbox queue in IndexedDB.
3. The emulation script triggers reconnect:
   - Network state changes back to online:
     ```typescript
     await context.setOffline(false);
     ```
   - The UI updates the status indicator to "Syncing".
   - The sync pipeline executes, and values are verified in the Postgres database.
