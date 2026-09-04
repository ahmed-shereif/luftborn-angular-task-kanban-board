import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-analytics-page',
  standalone: true,
  template: `
    <h1>Analytics</h1>
    <p>Coming soon.</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsPage {}
