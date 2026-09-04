import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type SkeletonShape = 'rect' | 'circle' | 'text';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  templateUrl: './loading-skeleton.html',
  styleUrl: './loading-skeleton.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingSkeleton {
  readonly width = input<string>('100%');
  readonly height = input<string>('16px');
  readonly shape = input<SkeletonShape>('text');

  readonly style = computed(() => ({
    width: this.width(),
    height: this.height(),
  }));
}
