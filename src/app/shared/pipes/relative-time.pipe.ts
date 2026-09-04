import { Pipe, PipeTransform } from '@angular/core';

const UNITS: readonly [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['week', 60 * 60 * 24 * 7],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
];

/** Formats an ISO date string as a relative time, e.g. "3 hours ago" / "in 2 days". */
@Pipe({
  name: 'relativeTime',
  standalone: true,
  pure: true,
})
export class RelativeTimePipe implements PipeTransform {
  private readonly formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  transform(value: string | Date | null | undefined): string {
    if (!value) {
      return '';
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const diffSeconds = (date.getTime() - Date.now()) / 1000;
    const absSeconds = Math.abs(diffSeconds);

    if (absSeconds < 60) {
      return this.formatter.format(Math.round(diffSeconds), 'second');
    }

    for (const [unit, secondsInUnit] of UNITS) {
      if (absSeconds >= secondsInUnit) {
        return this.formatter.format(Math.round(diffSeconds / secondsInUnit), unit);
      }
    }

    return this.formatter.format(Math.round(diffSeconds), 'minute');
  }
}
