import { ChangeDetectionStrategy, Component, effect, inject, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { FilterStore } from '../../core/state';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, ReactiveFormsModule],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Toolbar {
  private readonly filterStore = inject(FilterStore);

  readonly menuToggle = output<void>();

  readonly searchControl = new FormControl(this.filterStore.searchTerm(), { nonNullable: true });
  private readonly debouncedSearch = toSignal(
    this.searchControl.valueChanges.pipe(debounceTime(280), distinctUntilChanged()),
    { initialValue: this.filterStore.searchTerm() },
  );

  // Hardcoded placeholder since there's no auth/current-user service yet.
  readonly currentUserInitials = 'JD';

  constructor() {
    effect(() => this.filterStore.setSearchTerm(this.debouncedSearch()));
  }
}
