import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConfirmDialog, ConfirmDialogData } from './confirm-dialog';

describe('ConfirmDialog', () => {
  let closeSpy: ReturnType<typeof vi.fn>;

  function create(data: ConfirmDialogData) {
    closeSpy = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: MatDialogRef, useValue: { close: closeSpy } },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    });
    return TestBed.createComponent(ConfirmDialog).componentInstance;
  }

  it('uses provided confirm/cancel text', () => {
    const cmp = create({ title: 'Delete', message: 'Sure?', confirmText: 'Yes', cancelText: 'No' });
    expect(cmp.confirmText).toBe('Yes');
    expect(cmp.cancelText).toBe('No');
  });

  it('defaults confirm/cancel text when not provided', () => {
    const cmp = create({ title: 'Delete', message: 'Sure?' });
    expect(cmp.confirmText).toBe('Confirm');
    expect(cmp.cancelText).toBe('Cancel');
  });

  it('onCancel() closes the dialog with false', () => {
    const cmp = create({ title: 'Delete', message: 'Sure?' });
    cmp.onCancel();
    expect(closeSpy).toHaveBeenCalledWith(false);
  });

  it('onConfirm() closes the dialog with true', () => {
    const cmp = create({ title: 'Delete', message: 'Sure?' });
    cmp.onConfirm();
    expect(closeSpy).toHaveBeenCalledWith(true);
  });
});
