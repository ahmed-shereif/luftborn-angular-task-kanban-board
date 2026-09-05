import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let openSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    openSpy = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: MatSnackBar, useValue: { open: openSpy } }],
    });
    service = TestBed.inject(NotificationService);
  });

  it('error() opens a 5s error-styled toast with a Dismiss action', () => {
    service.error('Something broke');
    expect(openSpy).toHaveBeenCalledWith('Something broke', 'Dismiss', {
      duration: 5000,
      panelClass: 'snackbar-error',
    });
  });

  it('success() opens a 3s success-styled toast with no action', () => {
    service.success('Saved!');
    expect(openSpy).toHaveBeenCalledWith('Saved!', undefined, {
      duration: 3000,
      panelClass: 'snackbar-success',
    });
  });
});
