# UI/UX Specification Document

## Purpose
Define the visual design guidelines, page-by-page screen definitions, navigation flows, and interactive state patterns for the web application interface.

## Scope
Covers typography, responsive grid specifications, dark/light theme configurations, layout wireframe structures, and accessibility rules for all user roles.

## Related Documents
- [requirements.md](requirements.md) — Functional workflows and business rules
- [frontend.md](frontend.md) — Component setup and layout architectures

---

## Typography & Core Palette

The design system enforces a sleek, modern visual aesthetic.

### Theme & Colors
- **Main Administration (Super Admin / Admin / Maintainer):** Dark Mode (Indigo Slate) by default.
- **Judge Portal:** Responsive Dark Mode (Mobile-optimized High Contrast).
- **Public Registration:** Light/Dark responsive (follows system preferences).

```
# Primary Color: Indigo-500     (#6366f1) -- Action Buttons, Focus Rings
# Secondary Color: Violet-500   (#8b5cf6) -- Accents, Category Chips
# Background Color: Slate-950   (#020617) -- App container canvas
# Foreground Color: Slate-50    (#f8fafc) -- Primary body text
# Accent Color: Emerald-500     (#10b981) -- Completed states, scores
# Warning/Destructive: Rose-600 (#e11d48) -- Void actions, locks
```

### Typography
- **Primary Typeface:** `Inter` (sans-serif) for body copy, utility tables, and form labels.
- **Header Typeface:** `Outfit` (sans-serif) for dashboards, headings, and key UI markers.

---

## Navigation & Layout Hierarchies

### Desktop Layout (Admin / Super Admin)
Includes a persistent sidebar navigation system.

```
+--------------------------------------------------------------+
| [JFlow Logo]   | Header Area (Event Dropdown, Profile Menu)  |
+----------------+---------------------------------------------+
| (Sidebar)      | Main Content View Area                      |
| - Dashboard    |                                             |
| - Events       |                                             |
| - Registrations|                                             |
| - Judges       |                                             |
| - Leaderboard  |                                             |
| - Audit Logs   |                                             |
+----------------+---------------------------------------------+
```

### Mobile Layout (Judge Portal)
Uses a clean header and a persistent bottom navigation bar.

```
+--------------------------------------------------------------+
| [Back]         Project Evaluation (Project ID: 104)          |
+--------------------------------------------------------------+
|                                                              |
| Main evaluation card stack, swipeable criterion inputs       |
|                                                              |
+--------------------------------------------------------------+
| (Bottom Bar)   [Queue List]    [QR Scan]    [History]        |
+--------------------------------------------------------------+
```

---

## Pages and Screen Specifications

### 1. Dashboard Page (Admin Protected)

#### Components
- **Metrics Summary Row:** Cards displaying:
  - Total Registered Teams (with Excel export link).
  - Active Judging Progress (Judges completed vs Total).
  - Average Event Score & System Status.
- **Judge Progress Grid:** List of judges with real-time progress bars (e.g. "Judge Smith: 12/20 Projects scored").
- **Activity Log Ticker:** Live stream of recent audit events.

---

### 2. Public Registration Form (Dynamic Render Page)

#### Components
- **Event Header:** Displays name, description, and countdown timer to the registration deadline.
- **Recovery Banner:** Bar at the top: "Working on a draft? Enter Draft ID or Email to recover."
- **Dynamic Field Stack:** Renders input fields based on active event configuration.
  - Required fields are marked with red asterisks.
  - File upload fields render drag-and-drop dropzones with progress indicators.
- **Autosave Status Indicator:** Floating badge: "Draft saved at 14:32:01".
- **Final Submission Panel:** "Lock & Submit Registration" action button. Triggers a double-confirmation modal explaining that modifications are blocked after submission.

---

### 3. Judge Project Queue & Scanner Page (Mobile Portal)

#### Components
- **QR Scanner Viewport:** Full-screen camera scanner frame. Contains toggle flash button and manual ID entry button.
- **Manual Project ID Form:** Modal dialog containing a numeric keypad input for typing project numbers directly.
- **Project Progress List:** Card collection showing:
  - *Tab A (Pending):* List of unscored projects (Title + Abstract only).
  - *Tab B (Completed):* List of scored projects with green checkmarks.

---

### 4. Sequential Scoring Screen (Judge Portal)

#### Components
- **Anonymized Project Header:** Displays Project Number, Title, and Abstract.
- **Active Criterion Card:** Shows criterion name, description, and grading guide.
- **Numeric Scoring Input:**
  - Slider or large numeric input box matching precision rules (Integer vs Decimal).
  - Displays validation bounds (e.g. "Allowed score: 0 - 10").
- **Workflow Navigation:**
  - "Submit & Next" button (locks active score, scrolls view to reveal next criterion).
  - Previous criteria render in collapsed, read-only cards at the top.

---

### 5. Leaderboard & Results View (SA / Admin / Judge)

#### Components
- **Result Visibility Settings Panel (SA only):** Button toggle group selecting visibility mode: `HIDDEN`, `RANKING_ONLY`, `SELF_SCORE`, `FULL_LEADERBOARD`.
- **Leaderboard Table:**
  - Columns: Rank, Project Number, Title, Total Average Score, Tie Flag.
  - If `FULL_LEADERBOARD` is enabled, clicking a project row expands to show judge-by-judge score breakdowns.
- **Tie Resolution Dialog (SA only):** Triggers a "Void Evaluation" action card targeting tied projects.

---

## Screen Interactive States

### Loading State
Skeletons are used to represent structural elements of cards, lists, and tables while data loads.

```
+--------------------------------------------------+
|  [|||||| Skeleton Header |||||]                  |
+--------------------------------------------------+
|  [||| Skeleton Row 1 |||]                        |
|  [||| Skeleton Row 2 |||]                        |
+--------------------------------------------------+
```

### Error State
Full-page error view with a retry action button.
- **Header:** "Failed to load project details."
- **Message:** "The project ID may be invalid, or you are offline."
- **Actions:** "Scan Again" (primary button), "Go to Queue" (secondary link).

### Empty State
Clean empty-state page displaying contextual illustrations.
- **Event List Empty:** "No active events found. Create your first event draft to begin."
- **Queue Completed:** "All projects evaluated! Results will be released by the administration."
- **Search Empty:** "No registrations found matching search terms."

---

## Accessibility (A11y) Requirements

- **Contrast Ratios:** Minimum contrast ratio of 4.5:1 for body copy and UI elements (WCAG AA standard).
- **Keyboard Navigation:** All dashboard tables and admin forms must be fully navigatable using standard keyboard key events (`Tab`, `Space`, `Enter`, arrows).
- **Screen Reader Support:** All custom interactive elements must be annotated with semantic HTML5 elements and `aria-*` tags (e.g. `aria-expanded`, `aria-checked`).
- **Touch Targets (Mobile):** Interactive controls, sliders, and navigation bar tabs must have a minimum touch target size of 44x44 CSS pixels.
