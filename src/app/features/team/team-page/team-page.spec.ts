import { TestBed } from '@angular/core/testing';
import { TeamPage } from './team-page';

describe('TeamPage', () => {
  it('creates', () => {
    const fixture = TestBed.createComponent(TeamPage);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Team');
  });
});
