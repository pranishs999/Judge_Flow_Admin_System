# API Specification Document

## Purpose
Document all API endpoints, RPC functions, request payloads, response bodies, auth requirements, validation rules, and error codes for the Project Judging & Event Evaluation Platform.

## Scope
Covers REST endpoints exposed by Next.js API Routes, Server Actions, and Supabase RPC functions used for event management, registration, judging, scoring, and administrative controls.

## Related Documents
- [architecture.md](architecture.md) — System boundaries and topological layout
- [database.md](database.md) — Relational schema definitions
- [security.md](security.md) — RLS policies and authentication context

---

## Authentication & Headers

All authenticated API routes require the client to supply the Supabase User JWT in the authorization header:
```http
Authorization: Bearer <JWT_TOKEN>
```
Anonymous API routes (public registrations) use the Supabase Anon Key in the headers, along with optional transaction-specific parameters:
```http
apikey: <SUPABASE_ANON_KEY>
```

---

## Error Response Format

All API errors return a standard JSON structure with appropriate HTTP status codes:
```json
{
  "error": "Error message description",
  "code": "ERROR_CODE_STRING",
  "details": {}
}
```

### Standard Error Codes

| HTTP Status | Error Code | Description |
| :--- | :--- | :--- |
| 400 | `BAD_REQUEST` | Validation failed or missing parameters |
| 401 | `UNAUTHORIZED` | Invalid or expired token |
| 403 | `FORBIDDEN` | Insufficient permissions or role restrictions |
| 404 | `NOT_FOUND` | Resource does not exist |
| 409 | `CONFLICT` | State conflict (e.g. duplicate scoring, edit locked form) |
| 422 | `UNPROCESSABLE_ENTITY` | Business logic rules validation failed |
| 500 | `INTERNAL_SERVER_ERROR` | Database or unexpected server error |

---

## API Endpoints

### 1. Registration Module (Public / Unauthenticated)

#### POST `/api/registrations/draft`
Initiates a new registration draft for an event.

- **Auth:** Anonymous (Public)
- **Request Body:**
  ```json
  {
    "event_id": "834c8928-86d7-4632-a521-789a2444c120",
    "recovery_email": "team-lead@example.com"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "registration_id": "a671b2d4-3bc1-443f-b0df-d0187498c199",
    "draft_id": "gK84mLz12pQW",
    "status": "DRAFT"
  }
  ```
- **Errors:**
  - 400 `BAD_REQUEST`: If `event_id` is missing or malformed.
  - 422 `UNPROCESSABLE_ENTITY`: If registration for the event is not open.

---

#### GET `/api/registrations/recover`
Sends a recovery email or retrieves draft metadata if the draft ID is directly supplied.

- **Auth:** Anonymous (Public)
- **Query Parameters:**
  - `email` (string, optional)
  - `draft_id` (string, optional)
- **Response (200 OK - If `draft_id` supplied):**
  ```json
  {
    "registration_id": "a671b2d4-3bc1-443f-b0df-d0187498c199",
    "draft_id": "gK84mLz12pQW",
    "team_name": "Tech Innovators",
    "status": "DRAFT",
    "responses": [
      {
        "field_id": "d044f128-44fa-4ce8-b611-a89e8122bb11",
        "value": "Smart Irrigation IoT System",
        "file_urls": []
      }
    ],
    "team_members": [
      {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "role_in_team": "Lead Developer"
      }
    ]
  }
  ```
- **Response (200 OK - If `email` supplied):**
  ```json
  {
    "message": "Recovery link sent to your registered email address."
  }
  ```
- **Errors:**
  - 404 `NOT_FOUND`: No matching email or draft ID found.

---

#### PUT `/api/registrations/save`
Saves draft responses. Can be called multiple times before final submission.

- **Auth:** Anonymous (Public)
- **Request Body:**
  ```json
  {
    "draft_id": "gK84mLz12pQW",
    "team_name": "Tech Innovators",
    "responses": [
      {
        "field_id": "d044f128-44fa-4ce8-b611-a89e8122bb11",
        "value": "Smart Irrigation IoT System"
      }
    ],
    "team_members": [
      {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "role_in_team": "Lead Developer"
      }
    ]
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "message": "Draft updated successfully",
    "updated_at": "2026-06-30T14:40:00Z"
  }
  ```
- **Errors:**
  - 409 `CONFLICT`: If the registration has already been submitted and is locked.
  - 422 `UNPROCESSABLE_ENTITY`: If team size rules are violated.

---

#### POST `/api/registrations/submit`
Performs final submission and validation, locking the registration.

- **Auth:** Anonymous (Public)
- **Request Body:**
  ```json
  {
    "draft_id": "gK84mLz12pQW"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "registration_id": "a671b2d4-3bc1-443f-b0df-d0187498c199",
    "project_number": 104,
    "status": "SUBMITTED",
    "submitted_at": "2026-06-30T14:41:00Z"
  }
  ```
- **Errors:**
  - 400 `BAD_REQUEST`: If draft validation fails (missing required form fields).
  - 409 `CONFLICT`: If registration is already locked.

---

### 2. Judging Module (Authenticated - Judge)

#### GET `/api/judging/projects`
Retrieves a list of anonymized projects for the judge's assigned event.

- **Auth:** Authenticated (Judge - Status: Approved)
- **Query Parameters:**
  - `event_id`: "834c8928-86d7-4632-a521-789a2444c120"
- **Response (200 OK):**
  ```json
  [
    {
      "project_id": "1198cb04-e3c1-4b11-a8de-d1988849aa11",
      "project_number": 101,
      "title": "Autonomous Drone Surveyor",
      "abstract": "A lightweight autonomous drone platform designed to map topography and identify crop anomalies.",
      "is_scored": false
    },
    {
      "project_id": "2291cd99-4c12-4211-bcf3-a189f812bb88",
      "project_number": 102,
      "title": "Smart Grid Energy Regulator",
      "abstract": "An AI-driven power distribution regulator designed to minimize localized grid overloads.",
      "is_scored": true
    }
  ]
  ```

---

#### POST `/api/scores/submit`
Submits a score for a single criterion. Enforces sequential scoring logic.

- **Auth:** Authenticated (Judge - Status: Approved)
- **Request Body:**
  ```json
  {
    "event_id": "834c8928-86d7-4632-a521-789a2444c120",
    "project_id": "1198cb04-e3c1-4b11-a8de-d1988849aa11",
    "criterion_id": "ff98d223-11ca-4ce3-a812-998fd1288cc1",
    "marks": 8.5
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "score_id": "771b04aa-c923-41bb-b0fe-d001287e0b55",
    "locked": true
  }
  ```
- **Errors:**
  - 400 `BAD_REQUEST`: If the marks exceed the criterion limit, or are outside allowed values.
  - 409 `CONFLICT`: If the project/criterion has already been scored by this judge, or sequential order was bypassed.

---

### 3. Administrative Control (Authenticated - Super Admin / Admin)

#### POST `/api/admin/events`
Creates an event draft.

- **Auth:** Authenticated (Admin / Super Admin)
- **Request Body:**
  ```json
  {
    "name": "National Innovation Hackathon 2026",
    "description": "Annual student-led innovation contest",
    "event_type": "HACKATHON",
    "min_team_size": 2,
    "max_team_size": 4,
    "scoring_precision": "DECIMAL",
    "registration_deadline": "2026-09-01T23:59:59Z"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "event_id": "834c8928-86d7-4632-a521-789a2444c120",
    "slug": "national-innovation-hackathon-2026",
    "status": "DRAFT"
  }
  ```

---

#### POST `/api/admin/events/transition`
Transitions an event to another status.

- **Auth:** Authenticated (Admin requires SA approval for open/judging transitions. SA has full bypass)
- **Request Body:**
  ```json
  {
    "event_id": "834c8928-86d7-4632-a521-789a2444c120",
    "target_status": "JUDGING"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "event_id": "834c8928-86d7-4632-a521-789a2444c120",
    "old_status": "REGISTRATION_CLOSED",
    "new_status": "JUDGING",
    "transitioned_at": "2026-06-30T14:45:00Z"
  }
  ```

---

#### POST `/api/admin/scores/void`
Voids all scores submitted by a specific judge for a specific project to allow re-evaluation.

- **Auth:** Authenticated (Super Admin only)
- **Request Body:**
  ```json
  {
    "event_id": "834c8928-86d7-4632-a521-789a2444c120",
    "project_id": "1198cb04-e3c1-4b11-a8de-d1988849aa11",
    "judge_id": "c044f128-44fa-4ce8-b611-a89e8122bb11",
    "reason": "Technical malfunction during physical demonstration evaluation"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "message": "Evaluation successfully voided.",
    "voided_scores_count": 5,
    "audit_log_id": "aa19cd90-1c09-411a-bf33-289e811f22cb"
  }
  ```
- **Errors:**
  - 403 `FORBIDDEN`: If the actor is not a Super Admin.

---

## Supabase RPC Functions

The following PostgreSQL stored procedures are executed via the Supabase RPC API:

### `compute_rankings`
Invoked when transition is made to `RESULTS_PROCESSING` or triggered manually by an Admin.
- **RPC Endpoint:** `/rest/v1/rpc/compute_rankings`
- **Method:** POST
- **Parameters:**
  ```json
  {
    "p_event_id": "834c8928-86d7-4632-a521-789a2444c120"
  }
  ```
- **Response:** Void. Computes rankings and updates the `rankings` table in the database.

---

### `get_judge_progress`
Returns active scoring progression metrics for an authenticated judge in an event.
- **RPC Endpoint:** `/rest/v1/rpc/get_judge_progress`
- **Method:** POST
- **Parameters:**
  ```json
  {
    "p_judge_id": "c044f128-44fa-4ce8-b611-a89e8122bb11",
    "p_event_id": "834c8928-86d7-4632-a521-789a2444c120"
  }
  ```
- **Response (200 OK):**
  ```json
  [
    {
      "project_id": "1198cb04-e3c1-4b11-a8de-d1988849aa11",
      "project_title": "Autonomous Drone Surveyor",
      "criteria_total": 5,
      "criteria_scored": 3,
      "is_complete": false
    }
  ]
  ```
