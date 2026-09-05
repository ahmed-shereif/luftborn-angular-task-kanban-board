import { FormControl, FormGroupDirective } from '@angular/forms';
import { ImmediateErrorStateMatcher } from './immediate-error-state-matcher';

describe('ImmediateErrorStateMatcher', () => {
  let matcher: ImmediateErrorStateMatcher;

  beforeEach(() => {
    matcher = new ImmediateErrorStateMatcher();
  });

  it('returns false for a null control', () => {
    expect(matcher.isErrorState(null, null)).toBe(false);
  });

  it('returns false for a valid, untouched control', () => {
    const control = new FormControl('ok');
    expect(matcher.isErrorState(control, null)).toBe(false);
  });

  it('returns false for an invalid but pristine/untouched control with no submitted form', () => {
    const control = new FormControl('', { validators: [(c) => (c.value ? null : { required: true })] });
    expect(control.invalid).toBe(true);
    expect(matcher.isErrorState(control, null)).toBe(false);
  });

  it('returns true for an invalid, dirty control', () => {
    const control = new FormControl('', { validators: [(c) => (c.value ? null : { required: true })] });
    control.markAsDirty();
    expect(matcher.isErrorState(control, null)).toBe(true);
  });

  it('returns true for an invalid, touched control', () => {
    const control = new FormControl('', { validators: [(c) => (c.value ? null : { required: true })] });
    control.markAsTouched();
    expect(matcher.isErrorState(control, null)).toBe(true);
  });

  it('returns true for an invalid control when the form was submitted', () => {
    const control = new FormControl('', { validators: [(c) => (c.value ? null : { required: true })] });
    const form = { submitted: true } as unknown as FormGroupDirective;
    expect(matcher.isErrorState(control, form)).toBe(true);
  });

  it('returns false for an invalid control when the form was not submitted and control untouched', () => {
    const control = new FormControl('', { validators: [(c) => (c.value ? null : { required: true })] });
    const form = { submitted: false } as unknown as FormGroupDirective;
    expect(matcher.isErrorState(control, form)).toBe(false);
  });
});
