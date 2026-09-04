import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-team-page',
  standalone: true,
  template: `
    <h1>Team</h1>
    <p>Coming soon.</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamPage {}
