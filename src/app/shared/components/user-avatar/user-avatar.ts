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

  /** The data's `avatar` field is an image URL only when it looks like one (db.json ships plain initials like "JD"). */
  readonly imageUrl = computed(() => {
    const avatar = this.user().avatar;
    return avatar && /^(https?:)?\/\//.test(avatar) ? avatar : undefined;
  });

  /** Uses the provided avatar text verbatim if it's not a URL, else derives initials from the name. */
  readonly initials = computed(() => {
    const avatar = this.user().avatar;
    if (avatar && !this.imageUrl()) {
      return avatar.toUpperCase();
    }
    const parts = this.user().name.trim().split(/\s+/).filter(Boolean);
    return parts
      .slice(0, 2)
      .map((part) => part[0]!.toUpperCase())
      .join('');
  });
}
