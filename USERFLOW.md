# User Flow Documentation

## Role Hierarchy

Super Admin
├── creates admins
├── creates judges
├── creates maintainers
└── creates events

Admin / Manager
├── configures event
├── defines rubrics
├── assigns judges
├── manages teams
└── locks event into judging phase

Judge
├── receives assigned submissions
├── evaluates sequential criteria
├── submits immutable scores
└── completes evaluation workflow

Maintainer
└── operates only in maintenance instance
    ├── system logs
    ├── infrastructure tools
    └── test environment setup

---

## Admin Workflow

1. Create event
2. Define criteria & tie-break rubric
3. Register teams/submissions
4. Assign judges
5. Lock event
6. Start judging
7. Monitor progress
8. Request judge lifecycle changes (via SA)
9. Wait for auto-finalization

---

## Judge Workflow

1. Login
2. View assigned projects (anonymized)
3. Open evaluation
4. Sequential scoring:
   - Criterion 1 → submit → lock
   - Criterion 2 → submit → lock
   - ...
5. Resume allowed if interrupted
6. Complete all criteria for validity

---

## Scoring Flow

Open project
→ sequential criteria input
→ immediate lock per criterion
→ immutable submission
→ stored in scoring ledger

---

## Inactivity Flow

No evaluation activity for X time
→ system flags judge inactive
→ admin requests SA action
→ SA may deactivate judge
→ judge excluded from final calculation

---

## Ranking Flow

1. Judge submissions processed in real time
2. Aggregated scores computed
3. Tie detected
4. Tie-break rubric executed
5. Snapshot leaderboard published

---

## Event Finalization Flow

All conditions met:
- All active judges complete evaluations
- Tie-break resolved
→ system auto-finalizes event
→ leaderboard locked
→ reports generated