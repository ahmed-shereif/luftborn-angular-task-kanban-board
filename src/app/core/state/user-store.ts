import { computed, inject, Injectable } from '@angular/core';
import { User } from '../models';
import { UserApiService } from '../services';

/** Read-only user state used by Users/Team pages and the task-assignee form control. */
@Injectable({ providedIn: 'root' })
export class UserStore {
  private readonly userApi = inject(UserApiService);

  private readonly resource = this.userApi.usersResource;

  readonly users = computed(() => this.resource.value() ?? []);
  readonly isLoading = computed(() => this.resource.isLoading());
  readonly error = computed(() => this.resource.error());

  private readonly usersById = computed(() => new Map(this.users().map((user) => [user.id, user])));

  getById(id: string): User | undefined {
    return this.usersById().get(id);
  }

  reload() {
    this.resource.reload();
  }
}
