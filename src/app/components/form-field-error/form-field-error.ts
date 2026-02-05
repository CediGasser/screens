import { Component, input } from '@angular/core';
import { FieldState } from '@angular/forms/signals';

@Component({
  selector: 'app-form-field-error',
  imports: [],
  template: `
  <div class="form-field-error">
    @if (fieldState().invalid() && fieldState().touched()) {
      <span class="error-message">{{ fieldState().errors()[0].message }}</span>
    }
  </div>`,
  styleUrl: './form-field-error.css',
})
export class FormFieldError {
  fieldState = input.required<FieldState<any>>();
}
