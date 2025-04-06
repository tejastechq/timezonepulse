# Comprehensive Project Audit Report

_A consolidated report combining all previous scout reports, recent codebase analysis, and lockfile review._

---

## 1. Overview

This report provides a thorough audit of the project, highlighting unused code, half-implemented or half-removed features, deprecated packages, inconsistencies, and recommendations for improvement.

---

## 2. TODOs, FIXMEs, and Known Incomplete Areas

- Numerous **TODO** comments scattered throughout the codebase, including:
  - `// TODO: figure out reasonable web equivalents for "resolve", "normalize", etc.` (in `node_modules/yargs-parser/browser.js`)
  - `// TODO: add a button, input, dialog, table, form, banner, card, or other React component` (in `app/page.tsx`, `components/clock/WorldClock.tsx`, `components/views/index.ts`)
  - `README.md` contains a TODO section.
  - Many other TODOs, FIXMEs, XXX, and HACK comments indicating unfinished implementations, workarounds, or technical debt.

- **Unfinished or placeholder files:**
  - `app/about/page.tsx` appears incomplete.
  - `components/dev/layout-customizer/` seems unfinished.
  - `tests/README.md` is a placeholder.

---

## 3. Unused, Half-Implemented, or Half-Removed Code

- **Unused files and directories:**
  - `ad/` directory with unused images.
  - `public/screenshots/` directory with unused screenshots.
  - `SECURITY/` directory with unused images.

- **Half-implemented features:**
  - `app/about/` with incomplete `page.tsx`.
  - `components/dev/layout-customizer/` appears unfinished.

- **Half-removed or deprecated features:**
  - `lib/utils/apiAuth.new.ts` seems redundant with `lib/utils/apiAuth.ts`.
  - `lib/utils/dateTimeFormatter.ts` contains unused functions and variables.
  - `lib/utils/timezone.ts` and `lib/utils/timezoneSearch.ts` may overlap.
  - `lib/utils/mars-timezone.ts` exists, but Mars timezone support has been removed.
  - `store/timezoneStore.ts`:
    - `viewMode` state and related actions (`setViewMode`) have been removed, but traces remain.
    - Mars timezone-related state/actions (`showMarsExplanation`, `marsExplanationPosition`, `lastAddedMarsTimezoneId`, `hideMarsExplanation`) have been removed or commented out.
    - Initial state no longer includes Mars/Jezero timezone, now includes Tokyo.
    - Some references or commented code remain.

- **Commented-out or dead code:**
  - Many files contain large commented-out blocks indicating abandoned or half-removed features.
  - Potentially outdated or unused components in `components/dev/`, `components/clock/`, and `components/views/`.

- **Multiple manifest/config files:**
  - Both `next.config.js` and `next.config.mjs`.
  - Both `.env.example` and `.env.production`.
  - Both `tsconfig.json` and `tsconfig.compiler.json`.
  - Potential for confusion or redundancy.

- **Legacy or placeholder files:**
  - `tests/README.md` is empty.
  - `docs/ss.md` is a placeholder.
  - `playwright-report/` contains generated reports, not source code.

---

## 4. Deprecated Packages and Dependency Issues

- **Multiple deprecated packages detected** in `pnpm-lock.yaml` and `package-lock.json`:
  - `react-remove-scroll` (versions 2.5.4, 2.6.3) — deprecated.
  - `@heroui/*` packages (accordion, alert, autocomplete, avatar, badge, breadcrumbs, button, calendar, card, checkbox, chip, code, date-input, date-picker, divider, drawer, dropdown, form, image, input, input-otp, kbd, link, listbox, menu, modal, navbar, pagination, popover, progress, radio, react, ripple, scroll-shadow, select, skeleton, slider, snippet, spacer, spinner, switch, table, tabs, tooltip, user) — deprecated.
  - `dompurify` and `react-native` type stubs — deprecated.
  - `critters` — deprecated version.
  - `eslint` — unsupported version.
  - `glob` versions prior to v9 — deprecated.
  - `coalesced-function` — deprecated.
  - `react-remove-scroll-bar` multiple versions (2.3.3, 2.3.7, 2.3.8) coexist, some deprecated.
  - `react-refresh` deprecated usage.
  - `tinyglobby` notes incomplete dependencies.

- **Zustand library:**
  - Usage of deprecated APIs and warnings in source and type definitions.
  - Deprecated default exports, context APIs, and middleware options.
  - Recommend upgrading zustand usage to latest patterns.

- **Multiple versions of dependencies installed simultaneously:**
  - `react-remove-scroll` and `react-remove-scroll-bar`.
  - Can cause bundle bloat and unexpected behavior.

---

## 5. Code Quality, Consistency, and Potential Issues

- **Inconsistent code styles:**
  - `components/clock/WorldClock.tsx` and `components/clock/TimezoneCard.tsx` differ in formatting and style.
  - `app/settings/page.tsx` has inconsistent naming conventions.
  - Mixed use of `.js`, `.ts`, `.mjs` files.
  - Mixed module formats.

- **Best practices not followed:**
  - Missing or incomplete JSDoc comments.
  - Unused imports and variables.
  - Commented-out code left in production files.
  - Potentially incomplete error boundaries or fallback UIs.

- **Console errors and thrown errors:**
  - Found in `public/total-cleanup.js`, `public/scripts/polyfills.js`, `pages/_document.js`, and various utilities.
  - Some legitimate, others may indicate unhandled edge cases or unfinished implementations.

- **Functions and components likely unused:**
  - Many utility functions in `lib/utils/` and `lib/hooks/`.
  - Components in `components/clock/`, `components/views/`, `components/dev/`, `components/layout/`, `components/ui/`.
  - Several files export functions/components never imported elsewhere (requires further analysis).

---

## 6. Summary of Recommendations

- **Remove unused files and directories.**
- **Complete half-implemented features.**
- **Remove commented-out or dead code.**
- **Address all TODOs, FIXMEs, and technical debt.**
- **Audit and remove unused components, hooks, and utilities.**
- **Consolidate redundant files (e.g., multiple configs, duplicate utils).**
- **Upgrade or replace deprecated packages.**
- **Resolve multiple versions of the same package.**
- **Update zustand usage to recommended patterns.**
- **Improve code formatting and follow best practices.**
- **Review error handling for completeness.**
- **Simplify project structure where possible.**
- **Document remaining known issues and create actionable tickets.**
- **Perform thorough testing to ensure application stability.**

---

_Audit complete. This report reflects the consolidated state of the project as of 4/5/2025._
