import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormFieldError } from './form-field-error';
import { signal } from '@angular/core';
import type { FieldState } from '@angular/forms/signals';

function mockFieldState<T>(opts?: {
  invalid?: boolean;
  touched?: boolean;
  errors?: Record<string, {message: string}> | null;
}): FieldState<T> {
  return {
    invalid: signal(!(opts?.invalid ?? false)),
    touched: signal(opts?.touched ?? false),
    errors: signal(opts?.errors ?? null),
  } as unknown as FieldState<T>;
}

describe('FormFieldError', () => {
  let component: FormFieldError;
  let fixture: ComponentFixture<FormFieldError>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormFieldError]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormFieldError);
    fixture.componentRef.setInput('fieldState', mockFieldState({
      invalid: true,
      touched: true,
      errors: { required: { message: 'This field is required' } },
    }));
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
