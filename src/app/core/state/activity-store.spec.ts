import { TestBed } from '@angular/core/testing';
import { ActivityStore } from './activity-store';

describe('ActivityStore', () => {
  let store: ActivityStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(ActivityStore);
  });

  it('starts empty', () => {
    expect(store.entries()).toEqual([]);
  });

  it('record() prepends a new entry with a generated id and timestamp', () => {
    store.record({ type: 'created', taskId: 't1', message: 'Created task "A"' });

    const [entry] = store.entries();
    expect(entry.id).toBeTruthy();
    expect(entry.timestamp).toBeTruthy();
    expect(entry.type).toBe('created');
    expect(entry.taskId).toBe('t1');
    expect(entry.message).toBe('Created task "A"');
  });

  it('newest entries appear first', () => {
    store.record({ type: 'created', taskId: 't1', message: 'first' });
    store.record({ type: 'updated', taskId: 't2', message: 'second' });

    const entries = store.entries();
    expect(entries[0].message).toBe('second');
    expect(entries[1].message).toBe('first');
  });

  it('caps the log at 50 entries (FIFO eviction of the oldest)', () => {
    for (let i = 0; i < 55; i++) {
      store.record({ type: 'updated', taskId: `t${i}`, message: `msg-${i}` });
    }

    const entries = store.entries();
    expect(entries.length).toBe(50);
    expect(entries[0].message).toBe('msg-54');
    expect(entries[entries.length - 1].message).toBe('msg-5');
  });

  it('clear() empties the log', () => {
    store.record({ type: 'created', taskId: 't1', message: 'first' });
    store.clear();
    expect(store.entries()).toEqual([]);
  });
});
