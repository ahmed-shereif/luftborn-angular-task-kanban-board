import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-user-list-page',
  standalone: true,
  template: `<h1>Users</h1>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListPage {}
