import { TestBed } from '@angular/core/testing';
import { StatCard } from './stat-card';

describe('StatCard', () => {
  function create(inputs: { changeType?: 'positive' | 'negative' | 'neutral' } = {}) {
    const fixture = TestBed.createComponent(StatCard);
    fixture.componentRef.setInput('title', 'Total tasks');
    fixture.componentRef.setInput('value', 42);
    fixture.componentRef.setInput('icon', 'checklist');
    if (inputs.changeType) fixture.componentRef.setInput('changeType', inputs.changeType);
    fixture.detectChanges();
    return fixture;
  }

  it('creates with required inputs', () => {
    const fixture = create();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('defaults changeType to "neutral"', () => {
    const fixture = create();
    expect(fixture.componentInstance.changeClass()).toBe('stat-card__change--neutral');
  });

  it.each([['positive'], ['negative'], ['neutral']] as const)(
    'maps changeType "%s" to the matching css class',
    (changeType) => {
      const fixture = create({ changeType });
      expect(fixture.componentInstance.changeClass()).toBe(`stat-card__change--${changeType}`);
    },
  );
});
