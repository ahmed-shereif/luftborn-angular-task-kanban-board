import { TestBed } from '@angular/core/testing';
import { Toolbar } from './toolbar';
import { FilterStore } from '../../core/state';

describe('Toolbar', () => {
  let filterStore: FilterStore;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    filterStore = TestBed.inject(FilterStore);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function create() {
    const fixture = TestBed.createComponent(Toolbar);
    fixture.detectChanges();
    return fixture;
  }

  it('initializes the search control from the current FilterStore search term', () => {
    filterStore.setSearchTerm('existing');
    const fixture = create();
    expect(fixture.componentInstance.searchControl.value).toBe('existing');
  });

  it('debounces search input and forwards it to FilterStore after 280ms', () => {
    const fixture = create();
    fixture.componentInstance.searchControl.setValue('bug');

    vi.advanceTimersByTime(279);
    TestBed.tick();
    expect(filterStore.searchTerm()).toBe('');

    vi.advanceTimersByTime(1);
    TestBed.tick();
    expect(filterStore.searchTerm()).toBe('bug');
  });

  it('does not re-emit for consecutive identical values (distinctUntilChanged)', () => {
    const fixture = create();
    fixture.componentInstance.searchControl.setValue('bug');
    vi.advanceTimersByTime(280);
    TestBed.tick();
    expect(filterStore.searchTerm()).toBe('bug');

    filterStore.setSearchTerm('changed-externally');
    fixture.componentInstance.searchControl.setValue('bug');
    vi.advanceTimersByTime(280);
    TestBed.tick();
    // distinctUntilChanged compares against the previous *emitted* value ('bug'), so re-setting
    // the same value again does not push a new emission and FilterStore keeps the external value.
    expect(filterStore.searchTerm()).toBe('changed-externally');
  });

  it('emits menuToggle output', () => {
    const fixture = create();
    const spy = vi.fn();
    fixture.componentInstance.menuToggle.subscribe(spy);
    fixture.componentInstance.menuToggle.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('exposes a hardcoded currentUserInitials placeholder', () => {
    const fixture = create();
    expect(fixture.componentInstance.currentUserInitials).toBe('JD');
  });
});
