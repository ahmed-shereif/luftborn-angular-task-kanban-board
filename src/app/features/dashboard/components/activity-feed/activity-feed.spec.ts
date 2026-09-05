import { TestBed } from '@angular/core/testing';
import { ActivityFeed } from './activity-feed';
import { ActivityStore } from '../../../../core/state';

describe('ActivityFeed', () => {
  let activityStore: ActivityStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    activityStore = TestBed.inject(ActivityStore);
  });

  function create() {
    const fixture = TestBed.createComponent(ActivityFeed);
    fixture.detectChanges();
    return fixture;
  }

  it('exposes the ActivityStore entries', () => {
    activityStore.record({ type: 'created', taskId: 't1', message: 'Created task "A"' });
    const fixture = create();
    expect(fixture.componentInstance.entries().length).toBe(1);
  });

  it.each([
    ['created', 'add_circle'],
    ['updated', 'edit'],
    ['deleted', 'delete'],
    ['moved', 'swap_horiz'],
  ] as const)('iconFor("%s") returns "%s"', (type, icon) => {
    const fixture = create();
    expect(fixture.componentInstance.iconFor(type)).toBe(icon);
  });
});
