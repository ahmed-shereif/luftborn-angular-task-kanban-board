import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import type { ChangeType } from '../../../core/models';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCard {
  readonly title = input.required<string>();
  readonly value = input.required<number | string>();
  readonly icon = input.required<string>();
  readonly change = input<string>('');
  readonly changeLabel = input<string>('');
  readonly changeType = input<ChangeType>('neutral');

  /** Maps changeType to the design-token color class used for the change indicator. */
  readonly changeClass = computed(() => `stat-card__change--${this.changeType()}`);
}
