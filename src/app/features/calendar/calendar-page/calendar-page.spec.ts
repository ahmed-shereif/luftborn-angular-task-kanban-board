import { TestBed } from '@angular/core/testing';
import { CalendarPage } from './calendar-page';

describe('CalendarPage', () => {
  it('creates', () => {
    const fixture = TestBed.createComponent(CalendarPage);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Calendar');
  });
});
