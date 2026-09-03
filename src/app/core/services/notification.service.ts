import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

/** Thin wrapper around MatSnackBar for consistent toast styling/duration. */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  error(message: string): void {
    this.snackBar.open(message, 'Dismiss', { duration: 5000, panelClass: 'snackbar-error' });
  }

  success(message: string): void {
    this.snackBar.open(message, undefined, { duration: 3000, panelClass: 'snackbar-success' });
  }
}
