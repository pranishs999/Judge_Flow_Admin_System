# System Plan (Phase-Based Architecture)

## Architecture Style
Modular monolith with clear separation of concerns.

Frontend: Next.js  
Backend: Single API service (Node.js or FastAPI)  
Database: PostgreSQL (Supabase recommended)  
Auth: Google OAuth via Supabase

---

## PHASE 1: Event & Form Setup

### Super Admin
- Creates system users (Admin, Judges, Maintainers)
- Approves events created by Admin
- Creates registration forms (Google Form-like builder)
- Sets registration deadline

### Admin
- Creates event drafts
- Requests SA approval

### System Rules
- Form editable only within 1–2 days of publish
- After lock, only SA can extend deadline (audit logged)

---

## PHASE 2: Registration Phase

### Teams
- Access public registration link
- Create draft submission
- Edit using email recovery or draft ID
- Final submit locks entry

### Admin
- Views registrations
- Downloads Excel

---

## PHASE 3: Judge Onboarding

### Judges
- Login via Google OAuth
- Auto account creation on first login
- Requires Admin approval to activate

---

## PHASE 4: Judging Phase

### Flow
- Admin locks event into judging phase
- Judges evaluate ALL projects
- Only title + abstract visible
- Sequential scoring per criterion
- Scores become immutable after submission

---

## PHASE 5: Evaluation Integrity

- No score modification allowed
- SA can void evaluation and trigger re-evaluation
- Soft revoke of judge access applies after session completion

---

## PHASE 6: Result Processing

- System aggregates scores
- Rankings computed per event
- Tie-break rules applied if needed

---

## PHASE 7: Result Release (Controlled)

- Results remain hidden by default
- SA enables visibility per event
- Visibility modes:
  - ranking only
  - self score only
  - full leaderboard

---

## PHASE 8: Audit & Export

- SA can export full Excel:
  - all scores
  - judge-wise breakdown
  - event metadata
- Used for transparency and physical records
