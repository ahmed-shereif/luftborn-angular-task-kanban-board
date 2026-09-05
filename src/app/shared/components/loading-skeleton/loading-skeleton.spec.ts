import { TestBed } from '@angular/core/testing';
import { LoadingSkeleton } from './loading-skeleton';

describe('LoadingSkeleton', () => {
  it('defaults width/height/shape', () => {
    const fixture = TestBed.createComponent(LoadingSkeleton);
    fixture.detectChanges();
    const cmp = fixture.componentInstance;
    expect(cmp.width()).toBe('100%');
    expect(cmp.height()).toBe('16px');
    expect(cmp.shape()).toBe('text');
    expect(cmp.style()).toEqual({ width: '100%', height: '16px' });
  });

  it('reflects custom width/height inputs in the computed style', () => {
    const fixture = TestBed.createComponent(LoadingSkeleton);
    fixture.componentRef.setInput('width', '40px');
    fixture.componentRef.setInput('height', '40px');
    fixture.componentRef.setInput('shape', 'circle');
    fixture.detectChanges();
    const cmp = fixture.componentInstance;
    expect(cmp.style()).toEqual({ width: '40px', height: '40px' });
    expect(cmp.shape()).toBe('circle');
  });
});
