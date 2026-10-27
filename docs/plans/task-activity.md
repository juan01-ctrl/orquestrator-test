# Task activity dashboard implementation plan

## Design

Add `/tasks` to the existing static Astro app. Keep the authentication pages and
their dark visual language; add a discoverable dashboard link. There is no task
API, so use a labeled, deterministic local fixture with at least 30 tasks, varied
statuses, long titles, and missing optional fields. No backend or external service.

Use a small client module and pure query helpers rather than adding a UI framework.
Search title and status together, sort by updated time, then paginate ten tasks at
a time. Persist search, status, sort, and page in URL parameters, restore on load
and browser history navigation, and reset the page when filters change. Preserve
unrelated URL parameters. Use a native modal dialog for task details with keyboard
focus restoration. Render data with DOM text nodes.

## Implementation

- [x] Write Node tests for combined filtering, chronological sorting, page bounds,
  invalid URL values, URL round trips, and resetting pagination on filter changes.
- [x] Implement query helpers in `src/features/tasks/state.js`; verify tests.
- [x] Add a local fixture and asynchronous loader, including failure coverage.
- [x] Add the responsive Astro page and client controller with loading, empty,
  retryable error, and missing-field states. Link from existing entry pages.
- [x] Run targeted tests and syntax checks, review accessibility and URL/history
  behavior, and document usage and manual checks. Full `npm run check` belongs to
  the executor; do not install dependencies, commit, publish, or deploy.

## Review focus

- Search and status must compose, including whitespace and case variations.
- Invalid or oversized page values must not produce a blank page.
- Back/forward and reload must restore both controls and results.
- Long unbroken titles and optional fields must fit narrow screens and dialogs.
- Loading failures must offer retry without losing URL state.

## Validation strategy

Use `node --test` without additional dependencies. Assert hand-derived results
against small explicit fixtures, with a separate check of production fixture
coverage. Test failure recovery at the loader boundary. Run syntax checks for
client modules and `git diff --check`. If Astro dependencies or browser runtime
are unavailable, report rendering and end-to-end checks as unverified.

## Execution notes

The user authorized routine design choices and single-agent implementation;
no approval or additional dependencies were needed. Source review covered
safe text rendering, native dialog keyboard behavior and focus restoration,
pagination bounds, URL synchronization, retry state, and narrow-screen wrapping.
Strict standalone TypeScript checks passed for all three JavaScript modules.
Astro dependencies are absent, so actual Astro rendering and browser interaction
verification remain for human/executor review. `npm run check` is explicitly
reserved for the executor.
