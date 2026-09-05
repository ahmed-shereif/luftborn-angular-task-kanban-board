import { TestBed } from '@angular/core/testing';
import { SettingsPage } from './settings-page';

describe('SettingsPage', () => {
  it('creates', () => {
    const fixture = TestBed.createComponent(SettingsPage);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Settings');
  });
});
