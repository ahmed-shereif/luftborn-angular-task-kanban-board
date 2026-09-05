# LuftbornTask — Task Management Dashboard

A single-page Angular application for managing tasks on a drag-and-drop kanban board, with a
dashboard, analytics charts, a calendar view, and user/team directories. Built with Angular 21
(standalone components, Signals, `httpResource`), Angular Material, Angular CDK Drag & Drop, and
Chart.js (`ng2-charts`). Data is served by a lightweight mock API (`json-server`).

## Live deployment

Deployed on **Azure App Service**, running a Docker image built and pushed to **Azure Container
Registry (ACR)**:

🔗 [https://kanban-luftborn-b8grgmf5hthjfxgb.westus3-01.azurewebsites.net/analytics](https://kanban-luftborn-b8grgmf5hthjfxgb.westus3-01.azurewebsites.net/analytics)

## Table of contents

- [Live deployment](#live-deployment)
- [Setup and installation](#setup-and-installation)
- [Environment configuration](#environment-configuration)
- [Available scripts and commands](#available-scripts-and-commands)
- [Architecture decisions](#architecture-decisions)
- [Project structure](#project-structure)
- [State management and design patterns](#state-management-and-design-patterns)
- [Testing strategy](#testing-strategy)
- [Performance optimization techniques](#performance-optimization-techniques)
- [Known limitations and future improvements](#known-limitations-and-future-improvements)

## Setup and installation

Prerequisites: Node.js 22+ and npm.

```bash
npm install
```

Run the app and the mock API together (recommended):

```bash
npm run start:full
```

This starts the Angular dev server (`http://localhost:4200`) and `json-server`
(`http://localhost:3000`) concurrently. Alternatively, run them separately in two terminals:

```bash
npm run start:api   # json-server on :3000
npm start            # ng serve on :4200
```

### Docker

```bash
docker compose up --build
```

Builds the production bundle, serves it via nginx, and runs `json-server` inside the same
container (`nginx` proxies `/api` to the local `json-server` — see [nginx.conf](nginx.conf)).
The app is then available at `http://localhost:8080`.

## Environment configuration

Build-time configuration lives under [src/environments](src/environments):

| File                         | Used when                             | Key                                   |
| ---------------------------- | ------------------------------------- | ------------------------------------- |
| `environment.ts`             | `ng serve` / dev builds               | `apiBaseUrl: 'http://localhost:3000'` |
| `environment.development.ts` | explicit `development` configuration  | mirrors dev defaults                  |
| `environment.production.ts`  | `ng build --configuration production` | points at the production API base URL |

`apiBaseUrl` is the only environment-specific value the app currently needs; every `*-api.service.ts`
reads it to build its request URLs. Angular's file-replacement mechanism (configured in
[angular.json](angular.json)) swaps `environment.ts` for `environment.production.ts` on production
builds — there is no runtime config-fetch step, since the app ships with a bundled mock API rather
than a separately deployed backend.

## Available scripts and commands

| Script                  | Description                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------- |
| `npm start`             | `ng serve` — runs the dev server at `http://localhost:4200`                                 |
| `npm run build`         | Production build, output to `dist/luftborn-task`                                            |
| `npm run watch`         | Development-configuration build with `--watch`                                              |
| `npm test`              | Runs unit tests via Vitest (Angular CLI's `ng test`)                                        |
| `npm run lint`          | ESLint (`ng lint`) across the workspace                                                     |
| `npm run generate:data` | Regenerates `data-fetching/db.json` from [generate-data.js](data-fetching/generate-data.js) |
| `npm run start:api`     | Serves `data-fetching/db.json` via `json-server` on port 3000                               |
| `npm run start:full`    | Runs `start` and `start:api` concurrently (color-coded output)                              |

Additional useful invocations:

```bash
npx ng test --watch=false --coverage   # single run with a coverage report (coverage/luftborn-task)
npx ng generate component feature/components/my-component   # scaffold a new component
```

Husky + lint-staged run ESLint/Prettier on staged `.ts`/`.html`/`.scss`/`.json`/`.md` files on every
commit (see the `lint-staged` block in [package.json](package.json)), and `commitlint` enforces
Conventional Commits messages (see [commitlint.config.js](commitlint.config.js)).

## Architecture decisions

- **Angular 21, standalone-only.** No `NgModule`s. Every component, directive and pipe is
  standalone; routes and providers are wired via `provideRouter`/`provideHttpClient` in
  [src/app/app.config.ts](src/app/app.config.ts).
- **Signals over NgRx.** No state-management library is installed. Instead, each domain has a thin
  hand-rolled "signal store" (`@Injectable({ providedIn: 'root' })` service exposing `signal`/
  `computed` state and imperative mutation methods) applying the same discipline NgRx encourages —
  single source of truth, derived/selector-style `computed()`s, action-like public methods — without
  the boilerplate or the dependency. See [State management and design patterns](#state-management-and-design-patterns).
- **`httpResource` for reads, `HttpClient` for writes.** Angular's reactive `httpResource()` API
  drives all GET-based list data (tasks, users, statistics) so loading/error/value state is derived
  automatically and re-fetches whenever the signals it reads (filters, search term) change.
  Mutations (create/update/delete) go through plain `HttpClient` calls followed by an explicit
  `resource.reload()`, keeping writes imperative and predictable.
  See [docs/httpresource-flow.md](docs/httpresource-flow.md) for the full read/write data-flow diagram.
- **Smart/dumb component split.** `*-page` components (one per feature, e.g.
  [task-list-page](src/app/features/tasks)) are the only components that inject stores/services;
  everything under a feature's `components/` folder is a purely presentational component driven by
  `input()`/`output()` signals, making them trivial to unit test in isolation.
- **Angular Material + CDK Drag & Drop** for the UI kit and the kanban board's drag-and-drop
  interactions, rather than a bespoke DnD implementation.
- **Chart.js via `ng2-charts`** for the Analytics page and the Dashboard's mini chart, wrapped in a
  single reusable `chart-card` component.
- **Mock backend via `json-server`.** There's no real backend; [data-fetching/db.json](data-fetching/db.json)
  (seeded/regenerated by [data-fetching/generate-data.js](data-fetching/generate-data.js)) is served
  as a REST API, giving realistic filtering/sorting/query-param behavior without a custom server.
- **Functional HTTP interceptors for errors and retries.** `errorInterceptor`
  ([src/app/core/interceptors/error.interceptor.ts](src/app/core/interceptors/error.interceptor.ts))
  centralizes HTTP failure handling and surfaces user-facing notifications via `NotificationService`;
  `retryInterceptor` ([src/app/core/interceptors/retry.interceptor.ts](src/app/core/interceptors/retry.interceptor.ts))
  retries idempotent GET requests on transient failures (network errors, `408`/`429`/`502`/`503`/`504`)
  with exponential backoff and jitter before `errorInterceptor` ever sees a final failure. Both are
  registered through `provideHttpClient(withInterceptors([errorInterceptor, retryInterceptor]))`.
- **Containerized for parity.** A multi-stage [Dockerfile](Dockerfile) builds the Angular app with
  Node, then serves the compiled bundle from `nginx` while also running `json-server` inside the same
  container (via [docker/start.sh](docker/start.sh)) so the packaged image is self-contained and
  matches local dev behavior (see [nginx.conf](nginx.conf) for the `/api` proxy + SPA fallback rules).

## Project structure

```
src/app/
  core/
    interceptors/   # functional HTTP interceptors (error handling, GET retry with backoff)
    models/         # Task, User, Statistic types/enums/DTOs
    services/       # thin HTTP data-access layer (one *-api.service.ts per resource)
    state/          # signal stores: TaskStore, FilterStore, ActivityStore, UserStore
  layout/           # Shell, Sidenav, Toolbar (app chrome)
  shared/
    components/     # confirm-dialog, stat-card, user-avatar, loading-skeleton
    pipes/          # relative-time pipe
    utils/          # task-due-status util, immediate error-state matcher
    pages/          # not-found page
  features/
    dashboard/      # stat cards, recent activity feed, quick chart
    tasks/          # kanban board: task-list-page + task-card/task-column/task-form-dialog
    analytics/      # chart-card + analytics-page (status/priority/completion charts)
    users/          # user directory
    team/           # users grouped by department/role
    calendar/       # month view of tasks by due date
    settings/       # local preferences form (localStorage-backed)
```

Each feature exposes a `*.routes.ts` file and is lazy-loaded from
[src/app/app.routes.ts](src/app/app.routes.ts) via `loadChildren`/`loadComponent`, keeping the
initial bundle small.

## State management and design patterns

No NgRx (or any state library) is installed. State is managed with Angular Signals in a small set
of injectable "stores" under [src/app/core/state](src/app/core/state), each with a single
responsibility:

- **`TaskStore`** — the central task state. Wraps a filter-aware `httpResource` (re-fetches whenever
  `FilterStore`'s signals change), exposes `tasks`, `isLoading`, `error`, and derived `computed()`
  views (`tasksByStatus` for the three kanban columns, `liveStats` for dashboard-style counters).
  Mutation methods (`addTask`, `updateTask`, `deleteTask`, `moveTask`) call the API service, reload
  the resource on success, and record an entry in `ActivityStore`.
- **`FilterStore`** — pure UI filter state (`searchTerm`, `status`, `priority`, `assigneeId`)
  consumed by `TaskStore`'s resource request function; kept separate from `TaskStore` so filter UI
  can be tested/reset independently of task data.
- **`ActivityStore`** — a capped (50-entry) client-side log of task mutations, since no backend
  activity-feed endpoint exists; powers the Dashboard's "Recent Activity" panel.
- **`UserStore`** — thin wrapper around `UserApiService`'s `httpResource`, exposing `users`,
  `isLoading`, and a `Map`-based `getById` lookup used by the assignee dropdown, avatars, and the
  Users/Team pages.

Patterns applied throughout:

- **Single-responsibility separation**: `*-api.service.ts` = HTTP access only; `*-store.ts` = state +
  derived signals + mutation orchestration; components = rendering + event delegation.
- **Smart vs. presentational components**: `*-page` components inject stores/services and own
  routing; everything under a feature's `components/` folder takes `input()`s and emits `output()`s
  only — no DI of business services — which keeps them reusable and cheap to unit test.
  Reused presentational components (`stat-card`, `user-avatar`, `chart-card`, `confirm-dialog`,
  `loading-skeleton`) live in [src/app/shared/components](src/app/shared/components).
- **Open/closed filtering**: task filtering is composed of independent, small conditions (status,
  priority, assignee, free-text search) evaluated together rather than one large branching function,
  so a new filter can be added without editing existing filter logic.
- **`OnPush` change detection everywhere** paired with signal-based inputs, so components only
  re-render when an input/consumed signal actually changes.
- **Signals for state, RxJS at the edges** — RxJS is used only where Angular doesn't yet have a
  signal-native equivalent (HTTP interceptors, `MatDialog` close streams, form `valueChanges`), and is
  converted to signals (`toSignal`) or unsubscribed via `takeUntilDestroyed` rather than held open
  manually.
- **Reactive Forms** for the task create/edit dialog, with a custom `ErrorStateMatcher`
  ([immediate-error-state-matcher.ts](src/app/shared/utils/immediate-error-state-matcher.ts)) for
  consistent, immediate validation feedback.
- **Drag-and-drop ordering**: each `Task` carries an `order` field; `TaskStore.moveTask()` re-indexes
  `order` for every task shifted in the source and target kanban columns and persists the change via
  `PATCH` requests.

## Testing strategy

Tests run on [Vitest](https://vitest.dev/) through the Angular CLI's builder (`ng test`), with jsdom
as the DOM environment.

- **Co-located `*.spec.ts` files** next to the code they test (services, stores, interceptors, pipes,
  utils, and components), so coverage and intent stay close to the implementation.
- **Service tests** (`*-api.service.spec.ts`) use Angular's `HttpTestingController` /
  `provideHttpClientTesting()` to assert exact request URLs/methods/bodies without touching the
  network — important given the query-building logic in
  [task-api.service.ts](src/app/core/services/task-api.service.ts).
- **Store tests** (`task-store.spec.ts`, `filter-store.spec.ts`, `activity-store.spec.ts`,
  `user-store.spec.ts`) exercise mutation methods and assert on derived `computed()` signals
  (`tasksByStatus`, `liveStats`, filtered results) rather than internal implementation details.
- **Component tests** mock injected stores/services via TestBed providers, drive `fixture.detectChanges()`
  under `OnPush`, and assert on rendered output and emitted `output()` events for presentational
  components (inputs in, events out).
- **Interceptor tests** (`error.interceptor.spec.ts`, `retry.interceptor.spec.ts`) verify error
  handling and GET-retry/backoff behavior in isolation from any specific feature.
- Run once with a coverage report via:

  ```bash
  npx ng test --watch=false --coverage
  ```

  which writes an HTML/LCOV report to `coverage/luftborn-task`.

## Performance optimization techniques

- **`ChangeDetectionStrategy.OnPush`** on all components, combined with Signals so Angular can skip
  re-rendering subtrees whose inputs/consumed signals haven't changed.
- **Lazy-loaded feature routes** (`loadChildren`/`loadComponent` per feature in
  [app.routes.ts](src/app/app.routes.ts)) keep the initial JS payload limited to the shell, splitting
  Dashboard/Tasks/Analytics/Users/Calendar/Team/Settings into separate chunks fetched on navigation.
- **`httpResource`-driven fetching** avoids manual subscription bookkeeping and redundant requests:
  the resource only re-fetches when the signals its request function reads actually change (filters,
  search term), instead of on every change-detection cycle.
- **Narrow, targeted API queries**: [`TaskApiService.buildTasksUrl`](src/app/core/services/task-api.service.ts)
  pushes filtering/search down to `json-server` query params (`status`, `priority`, `assignee.id`,
  `_where`) so the client only ever receives the task set relevant to the active filters instead of
  filtering a full list in-memory.
- **`track` expressions on every `@for`** loop (task cards, kanban columns, activity entries, user
  lists) so Angular can efficiently diff and reorder DOM nodes on drag-and-drop or list updates
  instead of destroying/recreating rows.
- **Debounced search input**, converted to a signal via `toSignal`/`takeUntilDestroyed`, to avoid
  firing a network request on every keystroke.

## Known limitations and future improvements

- **No authentication/authorization.** There's no login, current-user concept, or route guards;
  "assignee" is just a selected user, not a signed-in identity.
- **Mock backend only.** `json-server` has no real persistence guarantees, transactions, or
  concurrency control — concurrent edits/drags from multiple clients can race and aren't reconciled
  (last write wins).
- **Client-side-only activity feed.** `ActivityStore` only reflects mutations made in the current
  browser session/tab; it is not persisted or shared across clients since no backend activity
  endpoint exists.
- **No HTTP response caching, and retry is GET-only.** `retryInterceptor` only retries idempotent
  GET requests on transient failures; writes (create/update/delete) are not auto-retried to avoid
  duplicate side effects, and no response caching layer exists yet.
