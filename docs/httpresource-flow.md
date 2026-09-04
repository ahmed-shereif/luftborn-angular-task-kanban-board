# How `httpResource` + Signals drive the task list

This walks through the exact flow in [`task-store.ts`](../src/app/core/state/task-store.ts) for
someone who hasn't used Angular's `httpResource` before.

## 1. What `httpResource` actually is

```ts
private readonly resource = httpResource<Task[]>(
  () =>
    this.taskApi.buildTasksUrl({
      status: this.filterStore.status(),
      priority: this.filterStore.priority(),
      assigneeId: this.filterStore.assigneeId(),
      searchTerm: this.filterStore.searchTerm(),
    }),
  { defaultValue: [] },
);
```

`httpResource(requestFn, options)` is a signal-based wrapper around `HttpClient`. Think of it as
two things glued together:

1. **A reactive "what should I fetch" function** — the first argument (`requestFn`). Angular runs
   this function inside a reactive (`computed`-like) context. Any *signal* you read inside it
   (`.status()`, `.priority()`, `.assigneeId()`, `.searchTerm()`) gets tracked as a dependency —
   exactly like reading a signal inside `computed()`.
2. **An internal resource object** that owns the actual HTTP call, its loading state, its result,
   and its error — exposed as signals: `resource.value()`, `resource.isLoading()`,
   `resource.error()`.

Angular re-runs `requestFn` **automatically** whenever any signal it read last time changes value.
If the returned URL string is different from last time, `httpResource` fires a new `GET` request to
that URL and updates `.value()` when the response arrives. If the function returns the *same*
string as before, nothing happens (no wasted request).

So `httpResource` is essentially: `computed()` for the request URL + auto re-fetch when that
computed URL changes + loading/error/value signals for the response.

## 2. Where the dependency signals come from

`FilterStore` ([`filter-store.ts`](../src/app/core/state/filter-store.ts)) holds four plain
writable signals:

```ts
readonly searchTerm = signal('');
readonly status = signal<'all' | TaskStatus>('all');
readonly priority = signal<'all' | TaskPriority>('all');
readonly assigneeId = signal<'all' | string>('all');
```

Nothing fetches data here — this store is just state. `TaskStore.resource`'s `requestFn` reads all
four of these signals to build the URL via `TaskApiService.buildTasksUrl(...)`.

## 3. Full scenario, step by step

### Step 0 — App boot, `TaskStore` is created

`TaskStore` is `providedIn: 'root'`, so it's instantiated once, the first time anything injects it
(here: `task-list-page.ts`'s constructor via `inject(TaskStore)`).

The moment `resource = httpResource(...)` is constructed, Angular runs `requestFn` once to get the
initial URL:

- `filterStore.status()` → `'all'`
- `filterStore.priority()` → `'all'`
- `filterStore.assigneeId()` → `'all'`
- `filterStore.searchTerm()` → `''`

`buildTasksUrl` sees an empty search term and empty filters, so it returns just `baseUrl`
(`/tasks`, no query string) — i.e. "give me everything". `httpResource` fires
`GET /tasks` immediately, sets `resource.isLoading()` to `true`, and `resource.value()` stays
`[]` (the `defaultValue`) until the response lands.

### Step 1 — Response arrives

`resource.value()` signal updates to the array of tasks from the API. `resource.isLoading()` flips
to `false`.

This is where the *second* layer of signals kicks in — the `computed()`s built on top:

```ts
readonly tasks = computed(() => this.resource.value() ?? []);
readonly tasksByStatus = computed(() => { ... groups this.tasks() by status ... });
readonly liveStats = computed(() => { ... counts from this.tasks() ... });
```

Because `tasks()` reads `resource.value()`, and `tasksByStatus()`/`liveStats()` read `tasks()`,
Angular's signal graph knows: `resource.value` changed → `tasks` is stale → recompute it →
`tasksByStatus`/`liveStats` are stale → recompute them. Any component template reading
`taskStore.tasksByStatus()` (like the Kanban board) re-renders with the new grouped tasks.

No manual subscription or `ngOnChanges` needed — this cascades purely from signal reads.

### Step 2 — User types in the toolbar search box

In [`toolbar.ts`](../src/app/layout/toolbar/toolbar.ts):

```ts
readonly searchControl = new FormControl('', { nonNullable: true });
private readonly debouncedSearch = toSignal(
  this.searchControl.valueChanges.pipe(debounceTime(280), distinctUntilChanged()),
  { initialValue: '' },
);

constructor() {
  effect(() => this.filterStore.setSearchTerm(this.debouncedSearch()));
}
```

- Typing pushes values through the reactive form's `valueChanges` Observable (RxJS world, not
  signals yet).
- `debounceTime(280)` waits until the user pauses typing for 280ms, `distinctUntilChanged()` skips
  re-firing for the same value.
- `toSignal(...)` bridges that Observable into a signal (`debouncedSearch`), so the RxJS stream can
  be read by other signals/effects.
- The `effect()` re-runs every time `debouncedSearch()` changes, and calls
  `filterStore.setSearchTerm(value)`.

### Step 3 — `FilterStore.searchTerm` signal changes

`setSearchTerm` does `this.searchTerm.set(value)`. This is a plain signal write — it doesn't know
or care that `TaskStore` exists. It just marks every consumer that previously *read*
`filterStore.searchTerm()` as dirty.

### Step 4 — `httpResource`'s `requestFn` re-runs automatically

`TaskStore.resource`'s `requestFn` had read `filterStore.searchTerm()` back in Step 0, so it's
registered as a dependent. Angular re-invokes `requestFn`:

- `searchTerm()` is now `"login bug"` (for example) instead of `''`.
- `buildTasksUrl` now takes the "has search term" branch and returns
  `/tasks?_where=%7B...contains "login bug"...%7D`.

Because this URL string differs from the previous one, `httpResource` fires a brand-new
`GET` request to that filtered URL, sets `isLoading()` true again, and — once the response
arrives — updates `resource.value()` with the filtered array.

### Step 5 — Cascade repeats

Exactly like Step 1: `tasks()` → `tasksByStatus()` / `liveStats()` recompute → templates
re-render — but now showing only the tasks matching the search term. The board and stats
naturally reflect the *current filter*, because there is only one `resource`/`tasks()` — there's
no separate "unfiltered" copy to keep in sync.

### Step 6 — User creates/edits/deletes/moves a task

`addTask`, `updateTask`, `deleteTask`, `moveTask` all call the imperative `TaskApiService` methods
(`create`/`update`/`delete`, plain `HttpClient` calls, not resources) and, on success, call
`this.resource.reload()`.

`reload()` tells `httpResource` "re-run the request you last made, ignore whether the URL
signal-dependencies changed." It re-fetches the *same* URL (whatever the current filters are) so
the freshly created/updated/deleted task shows up, still respecting whatever filter is active.

## 4. Mental model summary

```mermaid
flowchart TD
    A["User types in toolbar search input"] --> B["FormControl valueChanges (RxJS)"]
    B -->|debounceTime + distinctUntilChanged| C["toSignal(...) -> debouncedSearch signal"]
    C -->|effect()| D["filterStore.setSearchTerm(value)"]
    D --> E["FilterStore.searchTerm signal updates"]
    E --> F["httpResource requestFn re-runs (reads searchTerm/status/priority/assigneeId)"]
    F --> G["New URL != old URL -> GET /tasks?... fires"]
    G --> H["resource.value() signal updates when response arrives"]
    H --> I["tasks() computed recomputes"]
    I --> J["tasksByStatus() / liveStats() computed recompute"]
    J --> K["Templates reading these signals re-render"]

    L["addTask / updateTask / deleteTask / moveTask succeed"] --> M["resource.reload()"]
    M --> G
```

Key takeaways:

- **`httpResource`'s request function is reactive** — any signal read inside it becomes a
  dependency, just like `computed()`. Change the signal → the function re-runs → if the result
  (URL) differs, a new HTTP call fires automatically.
- **`resource.value()` / `.isLoading()` / `.error()` are themselves signals** — everything
  downstream (`tasks`, `tasksByStatus`, `liveStats`) is plain `computed()` layered on top, so
  updates propagate without any manual subscription/unsubscription or `ChangeDetectorRef` calls.
- **RxJS and signals meet at `toSignal`** — the search input's debounce logic stays in RxJS (where
  operators like `debounceTime` belong), then gets converted into a signal so it can participate in
  the same reactive graph as everything else.
- **`reload()` is the escape hatch for mutations** — creates/updates/deletes don't change any
  filter signal, so `httpResource` won't refetch on its own; `reload()` explicitly re-runs the last
  request.
