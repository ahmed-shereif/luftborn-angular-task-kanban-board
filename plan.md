# Plan: Task Management Dashboard — Full Feature Build-out

Repo: `luftborn-task/` (Angular 21, standalone components, Signals + `httpResource`, Angular Material, Vitest).
No NgRx package — keep and extend the existing hand-rolled Signal store pattern (`TaskStore`/`FilterStore`), applying NgRx-style discipline (single source of truth, computed selectors, action-like methods) without the dependency. Chart.js via `ng2-charts`. CDK DragDrop for kanban. New `UsersApiService` + `db.json` `/users` endpoint.

## Cross-cutting engineering rules (apply to every phase, don't restate per step)

- Standalone components only, `changeDetection: ChangeDetectionStrategy.OnPush` everywhere, `input()`/`output()` signal APIs (not `@Input`/`@Output` decorators) for new presentational components.
- Smart/dumb split: `*-page` components are smart (inject stores/services, own routing), everything under a `components/` subfolder per feature is presentational (signal `input`/`output` only, no service injection).
- SOLID: API service = data access only (SRP); Store = state + derived signals + mutation methods (SRP, single source of truth); components = rendering + event delegation only. Filtering logic in `FilterStore`/`TaskStore` composed as an array of small predicate functions (`(task, filters) => boolean`) combined with `.every()` — open for extension (OCP) without editing `filteredTasks()` each time a new filter is added. Depend on injected services/tokens, not concrete URLs, in components (DIP).
- Signals for all local/shared state; RxJS only at the edges (HTTP interceptors, CDK events, form `valueChanges`) — always pipe through `takeUntilDestroyed()` when manually subscribing to avoid leaks. Prefer `toSignal()` over manual subscribe.
- `track` function on every `@for`.
- All new routes lazy-loaded via `loadComponent`/`loadChildren` (already the pattern in `app.routes.ts`).
- Every new public method/complex computed signal gets a one-line JSDoc only where intent isn't obvious from code.

## Phase 0 — Shared data layer additions (foundation, blocks Users/Team/Tasks-assignee-dropdown)

1. Add `users` array to `luftborn-task/data-fetching/db.json` (unique assignees already used across tasks, extend with role/department field for Team page) and update `luftborn-task/data-fetching/generate-data.js` to (re)generate it deterministically alongside tasks/statistics.
2. Add `User` model to `luftborn-task/src/app/core/models/index.ts` (new `user.model.ts`): `{ id, name, email, avatar, role, department }`.
3. Add `luftborn-task/src/app/core/services/user-api.service.ts` — `httpResource<User[]>(() => baseUrl, { defaultValue: [] })`, mirrors `statistics-api.service.ts` shape.
4. Add `luftborn-task/src/app/core/state/user-store.ts` — thin signal store wrapping `UserApiService` (`users()`, `isLoading()`, `error()`, `getById(id)` computed lookup `Map`), used by Users page, Team page, and the task-assignee form control.
5. Add `luftborn-task/src/app/core/state/activity-store.ts` — in-memory capped log (e.g. last 50 entries) of task mutations `{ id, message, taskId, timestamp, type: 'created'|'updated'|'deleted'|'moved' }`; `TaskStore` mutation methods (`addTask`, `updateTask`, `deleteTask`, `moveTask`) push an entry after each successful mutation. Backs the Dashboard "Recent Activity Feed" (no backend endpoint needed/available).

## Phase 1 — Shared presentational components (blocks Phases 2–5, parallel with Phase 0)

1. `luftborn-task/src/app/shared/components/confirm-dialog/` — generic Material dialog (`MatDialog`), signal inputs for title/message/confirmText, used by task delete.
2. `luftborn-task/src/app/shared/components/stat-card/` — presentational card for dashboard statistics (title, value, icon, change, changeType → color), `input()` based.
3. `luftborn-task/src/app/shared/components/user-avatar/` — small reusable avatar/initials chip, takes a `User`-shaped input, used in task cards, activity feed, users/team lists.
4. `luftborn-task/src/app/shared/components/loading-skeleton/` — generic skeleton block (width/height/shape inputs) for loading states across pages, replacing plain spinners.
5. `luftborn-task/src/app/shared/pipes` (if needed) — e.g. `relativeTime` pipe (pure, standalone) for activity feed timestamps and due dates.

## Phase 2 — Tasks feature (core of the assignment) — _depends on Phase 0 (User for assignee), Phase 1 (confirm-dialog, user-avatar)_

1. `luftborn-task/src/app/features/tasks/task-list-page/task-list-page.ts` (smart): inject `TaskStore`, `FilterStore`, `UserStore`; render toolbar (search input bound via signal + debounced `valueChanges` piped through `takeUntilDestroyed`), filter selects (status/priority/assignee), and a kanban board of 3 columns (todo/in_progress/done) built from `taskStore.tasksByStatus()`.
2. `features/tasks/components/task-card/` (dumb): renders one task (title, priority chip, due date w/ overdue styling, assignee avatar, tags); emits `edit`/`delete`/`statusChange` outputs.
3. `features/tasks/components/task-column/` (dumb): CDK `cdkDropList` wrapper around a status column, emits `drop` event with previous/new index + status.
4. `features/tasks/components/task-form-dialog/` (smart-ish, opened via `MatDialog`): Reactive Form — controls: title (required, minLength 3), description (maxLength), priority (required, enum), status, dueDate (custom validator: not in the past for new tasks), assignee (required, `select` populated from `UserStore.users()`), tags (`FormArray` of strings, dynamic add/remove chip inputs). Central `errorStateMatcher`/helper for consistent error display.
5. Add `order: number` field to `Task` model + `db.json` seed data to persist column ordering; `TaskStore.moveTask(task, newStatus, newIndex)` recalculates `order` for affected tasks and calls `TaskApiService.update()` per moved/shifted task.
6. Wire CDK DragDrop (`cdkDropListConnectedTo` across the 3 columns) in `task-list-page` to call `taskStore.moveTask(...)` on `cdkDropListDropped`.
7. Delete flow opens `ConfirmDialog` (Phase 1) before calling `taskStore.deleteTask(id)`; success/error surfaced via existing `NotificationService`.
8. Real-time search: debounce 250-300ms using `toSignal(searchControl.valueChanges.pipe(debounceTime(...), distinctUntilChanged()))`, wired into `FilterStore.setSearchTerm()`.

## Phase 3 — Dashboard feature — _depends on Phase 0 (activity-store), Phase 1 (stat-card), Phase 2 (task-store already has liveStats)_

1. `dashboard-page.ts` (smart): render 4 `StatCard`s from `taskStore.liveStats()` (or `StatisticsApiService` for the API-driven cards — clarify: use API `statisticsResource` for the 4 top cards as literally specified, and keep `liveStats()` internally available for cross-checking/derived widgets), plus a "Recent Activity" list panel fed by `ActivityStore.entries()` (use `relativeTime` pipe from Phase 1), and quick task-distribution mini chart reusing the Analytics chart component (Phase 4) with `size="sm"` input.

## Phase 4 — Analytics feature — _depends on Phase 2 (TaskStore data)_

1. Install `chart.js` + `ng2-charts`.
2. `features/analytics/components/chart-card/` (dumb, wraps `<canvas baseChart>` from ng2-charts, `input()` for `type`/`data`/`options`/title) — reused by Dashboard mini chart.
3. `analytics-page.ts` (smart): computed signals from `TaskStore` — tasks-by-status distribution (doughnut), tasks-by-priority distribution (bar), completion trend if `completedAt` present (line, grouped by day/week).

## Phase 5 — Users & Team features — _depends on Phase 0, Phase 1 (user-avatar)_

1. `user-list-page.ts` (smart): Material table/grid of `UserStore.users()` with search-by-name filter (local signal), shows task count per user (computed by cross-referencing `TaskStore.tasks()`).
2. `team-page.ts` (smart): grid/card view of the same `UserStore.users()` grouped by `department`/`role` (distinguishes it from the flat Users list) — reuse `user-avatar`.

## Phase 6 — Calendar & Settings (lighter scope, keep functional not fancy) — _parallel with Phases 3–5_

1. `calendar-page.ts`: month-grid view (native date math, no extra date lib) plotting tasks by `dueDate`, click a day to see tasks due (reuses `task-card` in read-only mode).
2. `settings-page.ts`: simple reactive form for user preferences stored in `localStorage` via a small `SettingsService` (e.g. default view density, theme — no real backend), demonstrates dynamic/reactive forms once more without duplicating Task form complexity.

## Phase 7 — HTTP cross-cutting: caching + retry — _independent, can run anytime after Phase 0_

1. `core/interceptors/cache.interceptor.ts` — functional interceptor, in-memory `Map<url, {response, expiry}>` TTL cache for GET requests only (statistics, users — data that changes rarely), bypassed by a `X-Skip-Cache` context token for forced reloads (`taskStore.reload()`/`userStore.reload()` style forcing).
2. `core/interceptors/retry.interceptor.ts` — functional interceptor, `retry({ count: 2, delay: 500 })` for GET requests, composed before the existing `errorInterceptor` in `app.config.ts`'s `withInterceptors([...])` array (order: retry → cache → error).
3. Update `core/interceptors/index.ts` barrel and `app.config.ts` provider array.

## Phase 8 — Testing (target ≥80% coverage) — _last, depends on all features existing_

1. Configure Vitest coverage (`vitest.config` / angular.json unit-test options `codeCoverage: true`, thresholds 80%) and add `npm run test:coverage` script.
2. Service tests: `task-api.service.spec.ts`, `user-api.service.spec.ts`, `statistics-api.service.spec.ts` using `provideHttpClientTesting()` + `HttpTestingController`.
3. Store tests: `task-store.spec.ts` (mutation methods + computed signals incl. `tasksByStatus`, `filteredTasks`, `liveStats`), `filter-store.spec.ts`, `activity-store.spec.ts`, `user-store.spec.ts`.
4. Component tests per feature: smart pages (mock stores/services via `TestBed.overrideProvider` or DI mocks) and dumb components (input/output contracts, template rendering, OnPush change detection via `fixture.detectChanges()`); interceptor tests (`cache`, `retry`, `error`) using `HttpTestingController` + `withInterceptors` test harness.
5. Form validator tests for `task-form-dialog` custom validators (due-date-not-in-past, required assignee, tags array min/max).

## Phase 9 — Documentation

1. Update `luftborn-task/README.md`: architecture decisions (Signal store over NgRx, `httpResource`, SOLID application, caching/retry strategy), setup/scripts, testing strategy, known limitations (no auth, mocked users, client-side activity log, drag-drop order not conflict-resolved across concurrent clients).

**Relevant files** (new, grouped by phase — see steps above for full detail)

- `luftborn-task/data-fetching/db.json`, `generate-data.js` — Phase 0
- `luftborn-task/src/app/core/models/user.model.ts`, `services/user-api.service.ts`, `state/user-store.ts`, `state/activity-store.ts` — Phase 0
- `luftborn-task/src/app/shared/components/{confirm-dialog,stat-card,user-avatar,loading-skeleton}/`, `shared/pipes/relative-time.pipe.ts` — Phase 1
- `luftborn-task/src/app/features/tasks/**` (task-list-page + new `components/task-card`, `components/task-column`, `components/task-form-dialog`) — Phase 2
- `luftborn-task/src/app/features/dashboard/dashboard-page/dashboard-page.ts` — Phase 3
- `luftborn-task/src/app/features/analytics/**` (analytics-page + `components/chart-card`) — Phase 4
- `luftborn-task/src/app/features/users/user-list-page/user-list-page.ts`, `features/team/team-page/team-page.ts` — Phase 5
- `luftborn-task/src/app/features/calendar/calendar-page/calendar-page.ts`, `features/settings/settings-page/settings-page.ts`, new `core/services/settings.service.ts` — Phase 6
- `luftborn-task/src/app/core/interceptors/{cache,retry}.interceptor.ts`, `index.ts`, `app.config.ts` — Phase 7
- `**/*.spec.ts` across all above — Phase 8
- `luftborn-task/README.md` — Phase 9

**Verification**

1. `npm run lint` and `npm run format:check` (or equivalent Prettier check script) pass with zero errors.
2. `npm test -- --coverage` (Vitest) ≥80% lines/branches on `core/` and `features/`.
3. `npm start` + `npm run mock-api`/`json-server` (existing scripts) manual smoke test: create/edit/delete task, drag between columns, filter+search, dashboard stats match task-store, analytics charts render, users/team list populated, calendar shows due tasks.
4. Lighthouse run (bonus) only if time remains — not a blocking gate.
5. `npx husky` pre-commit hook still runs lint-staged cleanly on a sample commit touching new files.

**Decisions**

- No NgRx package added; existing Signal + `httpResource` store pattern is retained and extended (user confirmed).
- Angular Material stays the UI library for all new components/dialogs/tables.
- Drag-and-drop included via Angular CDK.
- Chart.js (`ng2-charts` wrapper) for Analytics + Dashboard mini chart.
- New `/users` endpoint added to `db.json` + `generate-data.js` (not derived from task assignees only), backing Users/Team/assignee-select.
- Docker/CI/CD/i18n left as-is (already scaffolded in repo) — out of scope for this plan.
- Recent Activity Feed is client-side derived (log of store mutations), since no backend activity endpoint exists.
