# Development Standards Document

## Purpose
Establish folder structures, coding standards, naming conventions, Git workflows, branch strategies, and review guidelines for the development team.

## Scope
Covers TypeScript guidelines, React rules, Git branching procedures, semantic versioning, and code verification routines.

## Related Documents
- [frontend.md](frontend.md) — Directory specifications
- [testing.md](testing.md) — Test suite setup

---

## Coding Standards

### TypeScript
- **Strict Mode:** Enabled in `tsconfig.json`. All type signatures must be explicitly defined. Avoid using `any` type tags; use `unknown` if types are deferred.
- **Null Safety:** Enable `strictNullChecks`. Handle optional parameters explicitly using optional chaining (`?.`) or nullish coalescing (`??`).

### React & Next.js
- **Component Definitions:** Use functional components with explicit TypeScript prop interfaces.
- **Server Actions:** Mark server actions explicitly using `'use server'` directives. Handle loading and exception states gracefully using React transitions (`useTransition`).
- **Client Components:** Mark client-only interactive files using `'use client'` tags. Keep client files leaf nodes of the component tree to maximize server rendering.

### CSS & Tailwind
- **Utility Order:** Keep Tailwind classes organized using the official `prettier-plugin-tailwindcss` sorting plugin.
- **Class Merging:** Use custom utility `cn()` (combining `clsx` and `tailwind-merge`) when writing dynamic, conditional style classes:
  ```typescript
  import { type ClassValue, clsx } from "clsx"
  import { twMerge } from "tailwind-merge"
  
  export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
  }
  ```

---

## Naming Conventions

### File System
- **Directories:** Use lowercase kebab-case (`components/form-fields/`).
- **Components:** Use PascalCase (`Button.tsx`, `FormFieldDropdown.tsx`).
- **Hooks & Utilities:** Use camelCase (`useLocalStorage.ts`, `formatDate.ts`).
- **Next.js Pages:** Follow framework conventions (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`).

### Code Identifiers
- **TypeScript Types & Interfaces:** PascalCase (`ProjectModel`, `EventConfig`).
- **Variables & Functions:** camelCase (`activeProjectId`, `fetchEventDetails`).
- **Constants:** UPPER_SNAKE_CASE (`MAX_FILE_SIZE_BYTES`, `DEFAULT_THEME`).
- **Database Schema:** snake_case (`event_judges`, `project_number`).

---

## Git Workflow & Branch Strategy

The project uses a structured Git Flow model to organize release candidates.

```
  main (production)     --------------------------------------- [Release v1.0.0]
                           ^
                           | Pull Request (Approval + Green CI)
  develop (staging)     ---+-----------------+-+---------------
                            ^               ^ ^
                            | branch        | | merge
  feature/*             ----+----[Feature]--+ |
                                              |
  hotfix/*              ----------------------+--[Hotfix]------
```

### Branch Types
- **`main`**: Production code only. Direct commits are blocked. Changes arrive exclusively via Pull Requests from `develop` or approved `hotfix/*` branches.
- **`develop`**: Integration sandbox. Contains code approved for the next release candidate.
- **`feature/`**: Individual functional updates (e.g. `feature/dynamic-form-builder`).
- **`hotfix/`**: Critical production fixes targeting the `main` branch.

### Commit Formatting Rules
Commit messages must follow the Conventional Commits specification:
`<type>(<scope>): <short summary>`

#### Allowed Types
- **`feat`**: A new user-facing feature.
- **`fix`**: A bug fix.
- **`docs`**: Documentation changes.
- **`style`**: Formatting adjustments (no code logic changes).
- **`refactor`**: Code changes that neither fix bugs nor add features.
- **`test`**: Adding or correcting tests.
- **`chore`**: Maintenance, package updates, or configuration tasks.

#### Examples
- `feat(auth): add google oauth flow for judge profiles`
- `fix(scoring): prevent division by zero in tie-breaker logic`

---

## Code Review Guidelines

All Pull Requests (PRs) require:
1. **Pass Verification:** GitHub Actions build check must return success (no lint errors, passes all unit tests).
2. **Reviewer Approvals:** Minimum 1 peer developer approval (or Super Admin approval for security changes).
3. **Database Guard:** Migrations must contain matching rollback scripts in version controls. No manual database configuration changes are permitted on staging or production.
4. **Coverage Maintenance:** PRs altering business math or RLS definitions must supply matching tests.
