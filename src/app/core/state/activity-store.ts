import { computed, Injectable, signal } from '@angular/core';

export type ActivityType = 'created' | 'updated' | 'deleted' | 'moved';

export interface ActivityEntry {
  id: string;
  message: string;
  taskId: string;
  timestamp: string;
  type: ActivityType;
  /** The assignee of the affected task at the time of the change; there's no auth/current-user concept in this app. */
  userId?: string;
  userName?: string;
  userAvatar?: string;
}

const MAX_ENTRIES = 50;

/** Client-side log of task mutations; backs the Dashboard "Recent Activity" feed (no backend endpoint exists). */
@Injectable({ providedIn: 'root' })
export class ActivityStore {
  private readonly log = signal<ActivityEntry[]>([]);

  readonly entries = computed(() => this.log());

  record(entry: Omit<ActivityEntry, 'id' | 'timestamp'>): void {
    const newEntry: ActivityEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    this.log.update((entries) => [newEntry, ...entries].slice(0, MAX_ENTRIES));
  }

  clear(): void {
    this.log.set([]);
  }
}
