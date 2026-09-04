import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  template: `
    <h1>Calendar</h1>
    <p>Coming soon.</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarPage {}
