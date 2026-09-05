import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-chart-card',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './chart-card.html',
  styleUrl: './chart-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartCard {
  readonly title = input.required<string>();
  readonly type = input.required<ChartType>();
  readonly data = input.required<ChartData>();
  readonly options = input<ChartConfiguration['options']>();
  /** Compact sizing for reuse as a dashboard mini chart. */
  readonly size = input<'sm' | 'md'>('md');

  /** Fills the fixed-height wrap instead of Chart.js's default fixed aspect ratio, which fights the CSS height. */
  readonly resolvedOptions = computed<ChartConfiguration['options']>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    ...this.options(),
  }));
}
