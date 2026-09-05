import { TestBed } from '@angular/core/testing';
import { ChartCard } from './chart-card';

describe('ChartCard', () => {
  function create(inputs: { options?: object; size?: 'sm' | 'md' } = {}) {
    const fixture = TestBed.createComponent(ChartCard);
    fixture.componentRef.setInput('title', 'Status');
    fixture.componentRef.setInput('type', 'bar');
    fixture.componentRef.setInput('data', { labels: [], datasets: [] });
    if (inputs.options) fixture.componentRef.setInput('options', inputs.options);
    if (inputs.size) fixture.componentRef.setInput('size', inputs.size);
    fixture.detectChanges();
    return fixture;
  }

  it('defaults size to "md"', () => {
    const fixture = create();
    expect(fixture.componentInstance.size()).toBe('md');
  });

  it('resolvedOptions forces responsive + non-aspect-ratio defaults', () => {
    const fixture = create();
    expect(fixture.componentInstance.resolvedOptions()).toEqual({
      responsive: true,
      maintainAspectRatio: false,
    });
  });

  it('resolvedOptions merges user-supplied options over the defaults', () => {
    const fixture = create({ options: { plugins: { legend: { display: false } } } });
    expect(fixture.componentInstance.resolvedOptions()).toEqual({
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
    });
  });
});
