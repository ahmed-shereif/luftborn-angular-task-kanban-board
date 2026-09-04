import { FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';

/** Shows validation errors as soon as a control is touched or dirty, without waiting for submit. */
export class ImmediateErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const invalid = !!control?.invalid;
    const interacted = !!(control?.dirty || control?.touched || form?.submitted);
    return invalid && interacted;
  }
}
