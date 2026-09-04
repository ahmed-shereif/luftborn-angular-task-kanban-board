import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface AvatarUser {
  name: string;
  avatar?: string;
}

export type AvatarSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-user-avatar',
  standalone: true,
  templateUrl: './user-avatar.html',
  styleUrl: './user-avatar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAvatar {
  readonly user = input.required<AvatarUser>();
  readonly size = input<AvatarSize>('md');

  /** First letter of each of the first two words in the user's name, e.g. "Jane Doe" -> "JD". */
  readonly initials = computed(() => {
    const parts = this.user().name.trim().split(/\s+/).filter(Boolean);
    return parts
      .slice(0, 2)
      .map((part) => part[0]!.toUpperCase())
      .join('');
  });
}
