import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivityStore, type ActivityType } from '../../../../core/state';
import { RelativeTimePipe } from '../../../../shared/pipes';
import { UserAvatar } from '../../../../shared/components';

const ICON_BY_TYPE: Record<ActivityType, string> = {
  created: 'add_circle',
  updated: 'edit',
  deleted: 'delete',
  moved: 'swap_horiz',
};

@Component({
  selector: 'app-activity-feed',
  standalone: true,
  imports: [MatIconModule, RelativeTimePipe, UserAvatar],
  templateUrl: './activity-feed.html',
  styleUrl: './activity-feed.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityFeed {
  private readonly activityStore = inject(ActivityStore);

  readonly entries = this.activityStore.entries;

  iconFor(type: ActivityType): string {
    return ICON_BY_TYPE[type];
  }
}
